import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  BROKEN_ENABLED,
  CATALOG,
  REFERENCE_ENABLED,
  datasetTables,
  splitDescription
} from "./tools.js";
import { runTravelAgent } from "./agent.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tools", (_req, res) => {
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

  res.json({
    tools,
    default_enabled: Array.from(BROKEN_ENABLED)
  });
});

app.get("/api/data", (_req, res) => {
  res.json({ tables: datasetTables() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question) {
      return res.status(400).json({ status: "error", error: "question must not be empty" });
    }

    const enabled = Array.isArray(req.body?.enabled_tools) && req.body.enabled_tools.length
      ? req.body.enabled_tools
      : Array.from(REFERENCE_ENABLED);

    const result = await runTravelAgent({
      question,
      enabledTools: enabled,
      toolDescriptions: req.body?.tool_descriptions || null
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ status: "error", error: message });
  }
});

const port = Number(process.env.PORT || 8000);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Travel Agent JS API listening on http://127.0.0.1:${port}`);
  });
}

export default app;
