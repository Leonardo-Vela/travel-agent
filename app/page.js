"use client";

import { useEffect, useMemo, useState } from "react";

const TOOL_ACTIONS = {
  calculator: "Doing the math",
  get_weather: "Checking current weather",
  get_climate_average: "Checking historical climate",
  get_flight: "Looking up a round-trip flight",
  get_flight_schedule: "Checking flight times",
  list_hotels: "Listing hotels",
  get_hotel: "Looking up a hotel",
  find_hotels_in_budget: "Filtering hotels by budget",
  get_activity_price: "Looking up an activity price",
  list_activities: "Listing activities",
  get_checkin_rule: "Checking the check-in rule",
};

function toolLabel(name) {
  if (!name) return "Tool call";
  return TOOL_ACTIONS[name] ?? name.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

function renderAssistantContent(content) {
  const parts = String(content || "").split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`assistant-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`assistant-text-${index}`}>{part}</span>;
  });
}

const TOOL_CONFIG_KEY = "travel-agent-tool-config-v6";

const TOOL_GROUPS = ["Directory", "Weather", "Flights", "Hotels", "Activities", "Cost"];

export default function HomePage() {
  const [tools, setTools] = useState([]);
  const [enabled, setEnabled] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [editingToolId, setEditingToolId] = useState(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toolLoadError, setToolLoadError] = useState("");
  const [activeRibbon, setActiveRibbon] = useState("tools");
  const [dataTables, setDataTables] = useState({});

  const toolGroups = useMemo(() => {
    return TOOL_GROUPS.map((group) => ({
      group,
      items: tools.filter((t) => t.group === group)
    }));
  }, [tools]);

  const activeTool = useMemo(() => {
    return tools.find((tool) => tool.id === editingToolId) || null;
  }, [tools, editingToolId]);

  useEffect(() => {
    let cancelled = false;

    async function loadTools() {
      try {
        const [toolsResponse, dataResponse] = await Promise.all([
          fetch("/api/tools"),
          fetch("/api/data")
        ]);

        if (!toolsResponse.ok) {
          throw new Error(`Could not load tools (${toolsResponse.status})`);
        }
        if (!dataResponse.ok) {
          throw new Error(`Could not load data (${dataResponse.status})`);
        }

        const data = await toolsResponse.json();
        const loadedTools = Array.isArray(data.tools) ? data.tools : [];
        const defaultEnabledIds = new Set(Array.isArray(data.default_enabled) ? data.default_enabled : []);
        const dataPayload = await dataResponse.json();
        const loadedTables = dataPayload?.tables || {};

        const baseEnabled = {};
        const baseDescriptions = {};

        for (const tool of loadedTools) {
          baseEnabled[tool.id] = defaultEnabledIds.has(tool.id);
          baseDescriptions[tool.id] = tool.description || "";
        }

        let savedEnabled = {};
        let savedDescriptions = {};
        try {
          const raw = localStorage.getItem(TOOL_CONFIG_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            savedEnabled = parsed?.enabled || {};
            savedDescriptions = parsed?.descriptions || {};
          }
        } catch {
          // Ignore invalid local storage state.
        }

        for (const tool of loadedTools) {
          if (typeof savedEnabled[tool.id] === "boolean") {
            baseEnabled[tool.id] = savedEnabled[tool.id];
          }
          if (typeof savedDescriptions[tool.id] === "string") {
            baseDescriptions[tool.id] = savedDescriptions[tool.id];
          }
        }

        if (!cancelled) {
          setTools(loadedTools);
          setEnabled(baseEnabled);
          setDescriptions(baseDescriptions);
          setDataTables(loadedTables);
        }
      } catch (err) {
        if (!cancelled) {
          setToolLoadError(err instanceof Error ? err.message : "Could not load tools.");
        }
      }
    }

    loadTools();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tools.length) return;
    localStorage.setItem(
      TOOL_CONFIG_KEY,
      JSON.stringify({
        enabled,
        descriptions
      })
    );
  }, [enabled, descriptions, tools.length]);

  function openToolEditor(tool) {
    setEditingToolId(tool.id);
    setDraftDescription(descriptions[tool.id] ?? tool.description ?? "");
  }

  function saveToolDescription() {
    if (!activeTool) return;
    setDescriptions((prev) => ({
      ...prev,
      [activeTool.id]: draftDescription
    }));
    setEditingToolId(null);
  }

  async function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const nextUserMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, nextUserMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const enabledIds = Object.entries(enabled)
        .filter(([, value]) => value)
        .map(([key]) => key);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          enabled_tools: enabledIds,
          tool_descriptions: descriptions
        })
      });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
          const payload = await response.json();
          if (payload?.error) {
            message = String(payload.error);
          }
        } catch {
          // Keep the generic message if the error body is not JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      const toolTrace = Array.isArray(data.trace)
        ? data.trace.filter((item) => item?.type === "tool")
        : [];

      const assistantMessage = {
        role: "assistant",
        content: data.answer || "No answer returned.",
        trace: toolTrace
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitQuestion();
  }

  async function handleComposerKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    await submitQuestion();
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>
            <strong className="header-title-main">PO Offsite 2026:</strong>
            <span className="header-title-sub"> Agentic vacation planning</span>
          </h1>
        </div>
      </header>

      <div className="workspace">
        <section className="panel chat-panel">
          <div className="chat-scroll">
            {messages.length === 0 ? (
              <div className="empty-state">
                Type a travel question below. The agent will use whatever tools are enabled on the right.
              </div>
            ) : null}

            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
                <div className="bubble">
                  {msg.role === "assistant" ? renderAssistantContent(msg.content) : msg.content}
                  {msg.role === "assistant" && msg.trace && msg.trace.length > 0 ? (
                    <details className="reasoning-trace" open={false}>
                      <summary>
                        <span className="reasoning-icon">*</span>
                        <span>Agent Trace</span>
                        <span className="reasoning-count">
                          {msg.trace.length} tool call{msg.trace.length === 1 ? "" : "s"}
                        </span>
                      </summary>
                      <div className="trace-body">
                        {msg.trace.map((item, traceIndex) => (
                          <details key={`${item.type}-${traceIndex}`} className="trace-tool">
                            <summary>
                              <span className="trace-order">{item.order ?? traceIndex + 1}</span>
                              <span className="trace-tool-name">
                                {toolLabel(item.name)} <code>{item.name}</code>
                              </span>
                            </summary>
                            <div className="trace-tool-body">
                              {item.args && Object.keys(item.args).length > 0 ? (
                                <div className="trace-args">
                                  {Object.entries(item.args).map(([key, value]) => (
                                    <div key={`${item.name}-${key}`} className="trace-arg">
                                      <span className="trace-arg-k">{key}</span>
                                      <span className="trace-arg-v">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              {item.result ? (
                                <pre className="trace-result">{String(item.result)}</pre>
                              ) : null}
                              {!item.result && (!item.args || Object.keys(item.args).length === 0) ? (
                                <em>No details.</em>
                              ) : null}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="message assistant">
                <div className="bubble working-bubble">
                  <span className="thinking-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                  <span>The agent is working...</span>
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="compose">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask your own travel question..."
            />
            <button className="primary-button" type="submit" disabled={loading || !question.trim()}>
              {loading ? (
                "..."
              ) : (
                <span className="send-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 11.5L21 3L12.5 21L11 13L3 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <span className="sr-only">Send message</span>
            </button>
          </form>

          {error ? <div className="error-banner">{error}</div> : null}
        </section>

        <aside className="panel tool-panel">
          {toolLoadError ? <div className="error-banner">{toolLoadError}</div> : null}
          <div className="ribbon-tabs" role="tablist" aria-label="Tool and data ribbons">
            <button
              type="button"
              role="tab"
              aria-selected={activeRibbon === "tools"}
              className={`ribbon-tab ${activeRibbon === "tools" ? "active" : ""}`}
              onClick={() => setActiveRibbon("tools")}
            >
              Tools
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeRibbon === "data"}
              className={`ribbon-tab ${activeRibbon === "data" ? "active" : ""}`}
              onClick={() => setActiveRibbon("data")}
            >
              Data
            </button>
          </div>

          {activeRibbon === "tools" ? (
            <div className="ribbon-body">
              {toolGroups.map(({ group, items }) => (
                <div key={group} className="tool-group">
                  <div className="group-label">{group}</div>
                  <div className="tool-list">
                    {items.map((tool) => (
                      <div key={tool.id} className="tool-card">
                        <input
                          type="checkbox"
                          checked={Boolean(enabled[tool.id])}
                          onChange={() =>
                            setEnabled((prev) => ({
                              ...prev,
                              [tool.id]: !prev[tool.id]
                            }))
                          }
                        />
                        <div className="tool-card-content">
                          <button
                            type="button"
                            className="tool-edit-button"
                            onClick={() => openToolEditor(tool)}
                          >
                            <span className="tool-edit-icon" aria-hidden="true">Edit</span>
                            <span className="tool-edit-label">{tool.name}</span>
                          </button>
                          <div className="tool-description">
                            {descriptions[tool.id] || tool.description}
                          </div>
                          {tool.details ? <div className="tool-description">Details: {tool.details}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ribbon-body">
              {dataTables.map((table) => {
                const { name, label, description, rows = [] } = table;
                const columns = rows.length ? Object.keys(rows[0]) : [];
                return (
                  <div key={name} className="data-table-wrap">
                    <div className="group-label">{name}</div>
                    <div className="tool-description">{label}: {description}</div>
                    {rows.length === 0 ? (
                      <div className="tool-description">No rows.</div>
                    ) : (
                      <div className="data-scroll">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {columns.map((column) => (
                                <th key={`${name}-${column}`}>{column}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, rowIndex) => (
                              <tr key={`${name}-row-${rowIndex}`}>
                                {columns.map((column) => (
                                  <td key={`${name}-${rowIndex}-${column}`}>{String(row[column] ?? "")}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {activeTool ? (
        <div className="tool-editor-backdrop" role="presentation" onClick={() => setEditingToolId(null)}>
          <div className="tool-editor" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Edit tool</h3>
            <div className="tool-editor-title">{activeTool.name} - {activeTool.group}</div>
            <label className="tool-editor-label" htmlFor="tool-description-input">
              Description the agent sees
            </label>
            <textarea
              id="tool-description-input"
              className="tool-editor-textarea"
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
            {activeTool.example ? (
              <>
                <div className="tool-editor-label">Example output</div>
                <pre className="tool-example">{activeTool.example}</pre>
              </>
            ) : null}
            <div className="tool-editor-note">
              This example is appended automatically - you only edit the description above.
            </div>
            <div className="tool-editor-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingToolId(null)}>
                Cancel
              </button>
              <button type="button" className="primary-save-button" onClick={saveToolDescription}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
