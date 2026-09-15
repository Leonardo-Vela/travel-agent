import { NextResponse } from "next/server";
import { datasetTables } from "../../../src/tools.js";

export async function GET() {
  return NextResponse.json({ tables: datasetTables() });
}
