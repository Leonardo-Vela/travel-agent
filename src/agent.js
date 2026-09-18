import OpenAI from "openai";
import { AGENT_PROMPT } from "./prompt.js";
import { buildToolbox, REFERENCE_ENABLED } from "./tools.js";

const TIME_TOKEN_RE = /\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*(?:am|pm)\b|\b(?:[01]\d|2[0-3]):[0-5]\d\b/i;

function isComplexQuestion(question) {
  const q = String(question || "").toLowerCase();
  if (!q.trim()) return false;
  let score = 0;
  if (["latest", "earliest", "before", "after", "by ", "deadline", "arrive", "departure"].some((x) => q.includes(x))) score += 1;
  if (["cheapest", "best", "compare", "vs", "including", "within", "budget", "total"].some((x) => q.includes(x))) score += 1;
  if (TIME_TOKEN_RE.test(q)) score += 1;
  if ([" and ", " if ", " while ", " then ", ","].some((x) => q.includes(x))) score += 1;
  return score >= 2;
}

function hasBriefDerivation(text) {
  const t = String(text || "").toLowerCase();
  const markers = ["because", "therefore", "so ", "based on", "using", "from", "latest", "cheapest"];
  return markers.some((m) => t.includes(m)) && t.split(/\s+/).length >= 18;
}

function toOpenAITools(selectedTools) {
  return selectedTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.effectiveDescription,
      parameters: tool.parameters
    }
  }));
}

const PLANNING_PROMPT = `Create a concise execution plan before answering the user's travel question.

State the facts that must be found, the tool sequence, and any required calculation. Do not answer the question yet, do not invent facts, and do not call tools in this planning step. Keep the plan to at most four short bullet points.`;

const FINAL_RESPONSE_PROMPT = `Write the final user-facing answer using only the execution plan and verified tool results in this conversation.

Keep it concise, preserve all units and calculation directions, and include a brief derivation for multi-constraint questions. Do not call tools, do not add facts, and do not mention internal planning or model selection.`;

export async function runTravelAgent({
  question,
  enabledTools,
  toolDescriptions,
  model = process.env.BACKEND_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
  reasoningModel = process.env.OPENAI_REASONING_MODEL || model,
  fastModel = process.env.OPENAI_FAST_MODEL || model,
  apiKey = process.env.OPENAI_API_KEY,
  maxSteps = 12
}) {
  const inputQuestion = String(question || "").trim();
  if (!inputQuestion) {
    throw new Error("question must not be empty");
  }
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const enabled = enabledTools && enabledTools.length ? enabledTools : Array.from(REFERENCE_ENABLED);
  const { tools: selectedTools, meta } = buildToolbox(enabled, toolDescriptions || {});
  const openaiTools = toOpenAITools(selectedTools);
  const implByName = Object.fromEntries(selectedTools.map((t) => [t.name, t.impl]));

  const client = new OpenAI({ apiKey });
  const messages = [
    { role: "system", content: AGENT_PROMPT },
    { role: "user", content: inputQuestion }
  ];

  let answer = "";
  let plan = "";
  const trace = [];
  let toolCalls = 0;
  let errorCalls = 0;
  const complex = isComplexQuestion(inputQuestion);

  const planningCompletion = await client.chat.completions.create({
    model: reasoningModel,
    messages: [
      ...messages,
      { role: "system", content: PLANNING_PROMPT }
    ],
    temperature: 0
  });

  plan = String(planningCompletion.choices?.[0]?.message?.content || "").trim();
  if (plan) {
    trace.push({ type: "plan", content: plan });
    messages.push({ role: "assistant", content: `Execution plan:\n${plan}` });
  }

  for (let step = 0; step < maxSteps; step += 1) {
    const completion = await client.chat.completions.create({
      model: reasoningModel,
      messages,
      tools: openaiTools,
      tool_choice: "auto",
      temperature: 0
    });

    const msg = completion.choices?.[0]?.message;
    if (!msg) break;

    if (msg.tool_calls?.length) {
      messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        toolCalls += 1;
        const name = tc.function.name;
        const impl = implByName[name];
        let args = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = {};
        }
        let result;
        if (!impl) {
          result = `ERROR: unknown tool '${name}'`;
        } else {
          try {
            result = String(impl(args));
          } catch (e) {
            result = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
          }
        }
        if (result.toUpperCase().startsWith("ERROR")) errorCalls += 1;

        trace.push({
          type: "tool",
          order: toolCalls,
          name,
          capability: meta[name] || "unknown",
          args,
          result,
          is_error: result.toUpperCase().startsWith("ERROR")
        });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result
        });
      }
      continue;
    }

    const content = String(msg.content || "").trim();
    if (content) {
      if (complex && !hasBriefDerivation(content)) {
        messages.push({ role: "assistant", content });
        messages.push({
          role: "system",
          content: "For this complex multi-constraint request, provide a concise derivation (key facts, one short calculation/comparison step, then final answer)."
        });
        continue;
      }
      const finalCompletion = await client.chat.completions.create({
        model: fastModel,
        messages: [
          ...messages,
          { role: "assistant", content },
          { role: "system", content: FINAL_RESPONSE_PROMPT }
        ],
        temperature: 0
      });
      answer = String(finalCompletion.choices?.[0]?.message?.content || content).trim() || content;
      break;
    }
  }

  if (!answer) {
    answer = "I could not produce a final answer with the current tool calls. Please retry or rephrase the request.";
  }

  return {
    status: "ok",
    answer,
    plan,
    reasoning_model: reasoningModel,
    fast_model: fastModel,
    trace,
    tool_calls: toolCalls,
    error_calls: errorCalls
  };
}
