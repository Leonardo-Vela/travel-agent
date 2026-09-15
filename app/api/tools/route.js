import { NextResponse } from "next/server";
import { CATALOG, REFERENCE_ENABLED, splitDescription } from "../../../src/tools.js";

export async function GET() {
  const tools = CATALOG.map((spec) => {
    const [description, example] = splitDescription(spec.description);
    return {
      id: spec.id,
      name: spec.name,
      group: spec.group,
      description,
      example
    };
  });

  return NextResponse.json({
    tools,
    default_enabled: Array.from(REFERENCE_ENABLED)
  });
}
