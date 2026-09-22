import test from "node:test";
import assert from "node:assert/strict";
import { buildToolbox, CATALOG_BY_ID, REFERENCE_ENABLED } from "../src/tools.js";
import { verifiedTargetRate } from "../src/agent.js";

test("no tools are enabled by default", () => {
  assert.deepEqual([...REFERENCE_ENABLED], []);
  assert.equal(CATALOG_BY_ID.get_one_way_fare, undefined);
  assert.equal(CATALOG_BY_ID.get_flight_leg, undefined);
  assert.equal(CATALOG_BY_ID.get_trip_cost, undefined);
  assert.equal(CATALOG_BY_ID.plan_vacation, undefined);
});

test("conditions tool returns a city's sunset", () => {
  const out = CATALOG_BY_ID.get_conditions.impl({ city: "Barcelona" });
  assert.ok(out.includes("sunset 20:30"));
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

test("exchange rate returns the requested current conversion rate", () => {
  const out = CATALOG_BY_ID.get_exchange_rate.impl({
    from_currency: "GBP",
    to_currency: "EUR"
  });

  assert.equal(out, "Current mock exchange rate: 1 GBP = 1.1765 EUR.");
});

test("target-rate answers use the verified calculator result in the requested direction", () => {
  const targetRate = verifiedTargetRate(
    "I have a budget of 300 EUR. How much should 1 EUR be worth in CHF?",
    [
      { type: "tool", name: "calculator", args: { expression: "3 * 190" }, result: "570" },
      { type: "tool", name: "calculator", args: { expression: "570 / 300" }, result: "1.9" }
    ]
  );

  assert.deepEqual(targetRate, { from: "EUR", to: "CHF", rate: 1.9 });
});

test("target-rate answers correct an inverse calculator call", () => {
  const targetRate = verifiedTargetRate(
    "I have a budget of 300 EUR. How much should 1 EUR be worth in CHF?",
    [{ type: "tool", name: "calculator", args: { expression: "300 / 570" }, result: "0.53" }]
  );

  assert.deepEqual(targetRate, { from: "EUR", to: "CHF", rate: 1.9 });
});
