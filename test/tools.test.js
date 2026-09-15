import test from "node:test";
import assert from "node:assert/strict";
import { buildToolbox, CATALOG_BY_ID, REFERENCE_ENABLED } from "../src/tools.js";

test("reference tools include schedule and time math", () => {
  assert.equal(REFERENCE_ENABLED.has("get_flight_schedule"), true);
  assert.equal(REFERENCE_ENABLED.has("time_math"), true);
  assert.equal(REFERENCE_ENABLED.has("get_airport_transfer_time"), true);
});

test("time_math compare does not require minutes", () => {
  const { tools } = buildToolbox(["time_math"]);
  const timeTool = tools.find((t) => t.id === "time_math");
  assert.ok(timeTool);
  const required = timeTool.parameters.required;
  assert.deepEqual(required, ["operation", "time"]);
  const out = timeTool.impl({ operation: "compare", time: "13:10", other_time: "13:15" });
  assert.equal(out, "13:10 is before 13:15");
});

test("district bridge and transfer split", () => {
  const district = CATALOG_BY_ID.get_district.impl({ district: "South Kensington" });
  const transfer = CATALOG_BY_ID.get_airport_transfer_time.impl({ district: "South Kensington" });
  assert.equal(district, "South Kensington is in London");
  assert.equal(transfer, "Airport to South Kensington in London: 50 min [AIRPORT_TO_DISTRICT_MIN=50]");
});

test("schedule and time tools support arrival deadlines", () => {
  const schedule = CATALOG_BY_ID.get_flight_schedule.impl({ airport: "LHR" }).toLowerCase();
  const cutoff = CATALOG_BY_ID.time_math.impl({ operation: "subtract_minutes", time: "14:00", minutes: "50" });
  const cmp = CATALOG_BY_ID.time_math.impl({ operation: "compare", time: "11:30", other_time: "13:10" });

  assert.ok(schedule.includes("[depart=09:40]"));
  assert.ok(schedule.includes("[arrive=11:30]"));
  assert.equal(cutoff, "14:00 - 50 min = 13:10");
  assert.equal(cmp, "11:30 is before 13:10");
});
