import { NextResponse } from "next/server";
import { REFERENCE_ENABLED } from "../../../src/tools.js";
import { runTravelAgent } from "../../../src/agent.js";

export const runtime = "nodejs";

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

    const result = await runTravelAgent({
      question,
      enabledTools: enabled,
      toolDescriptions: body?.tool_descriptions || null
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
