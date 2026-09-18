import { NextResponse } from "next/server";
import { CATALOG, REFERENCE_ENABLED, TOOL_DETAILS, splitDescription } from "../../../src/tools.js";

export const runtime = "nodejs";

export async function GET() {
  const tools = CATALOG.map((spec) => {
    const [description, example] = splitDescription(spec.description);
    return {
      id: spec.id,
      name: spec.name,
      group: spec.group,
      description,
      details: TOOL_DETAILS[spec.name] || "Use this tool only when its result is needed to answer the question.",
      example
    };
  });

  return NextResponse.json({
    tools,
    default_enabled: Array.from(REFERENCE_ENABLED)
  });
}
