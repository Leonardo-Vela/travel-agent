import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { REFERENCE_ENABLED } from "../../../src/tools.js";
import { runTravelAgent } from "../../../src/agent.js";

export const runtime = "nodejs";

function readKeyFromDotEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key !== "OPENAI_API_KEY") continue;
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  } catch {
    // Ignore missing .env or parse/read failures and keep normal env lookup.
  }
  return "";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { status: "error", error: "question must not be empty" },
        { status: 400 }
      );
    }

    const enabled = Array.isArray(body?.enabled_tools) && body.enabled_tools.length
      ? body.enabled_tools
      : Array.from(REFERENCE_ENABLED);

    const apiKey = process.env.OPENAI_API_KEY || readKeyFromDotEnv();

    const result = await runTravelAgent({
      question,
      enabledTools: enabled,
      toolDescriptions: body?.tool_descriptions || null,
      apiKey
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
