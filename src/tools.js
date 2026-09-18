import {
  ACTIVITIES,
  AIRPORTS,
  CHECKIN_MINUTES,
  CITY_INFO,
  CLIMATE_AVG,
  CONDITIONS,
  CITIES,
  DISTRICTS,
  EXCHANGE_PER_EUR,
  HOTELS,
  LEGS,
  SCHEDULE,
  WEATHER,
  legKey
} from "./data.js";

const norm = (s) => String(s || "").trim().toLowerCase();
const err = (msg) => `ERROR: ${msg}`;
const cityList = () => Object.keys(CITY_INFO).map((c) => title(c)).join(", ");
const codesList = () => Object.keys(AIRPORTS).join(", ");
const districtList = () => Object.keys(DISTRICTS).map((d) => title(d)).join(", ");
const title = (text) => text.split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1) : "").join(" ");

const resolveCity = (value) => {
  const v = norm(value);
  if (!v) return null;
  if (CITY_INFO[v]) return v;
  for (const city of Object.keys(CITY_INFO)) {
    if (city.includes(v) || v.includes(city)) return city;
  }
  return null;
};

const resolveAirport = (value) => {
  const v = String(value || "").trim().toUpperCase();
  return AIRPORTS[v] ? v : null;
};

const resolveDistrict = (value) => {
  const v = norm(value);
  if (!v) return null;
  if (DISTRICTS[v]) return v;
  for (const d of Object.keys(DISTRICTS)) {
    if (d.includes(v) || v.includes(d)) return d;
  }
  return null;
};

const districtsOf = (cityKey) => Object.entries(DISTRICTS)
  .filter(([, info]) => info.city === cityKey)
  .map(([d]) => d);

const currencyOfCity = (cityKey) => CITY_INFO[cityKey].currency;
const currencyOfDistrict = (districtKey) => currencyOfCity(DISTRICTS[districtKey].city);
const money = (amount, currency) => currency === "EUR" ? `€${amount}` : `${amount} ${currency}`;

const parseHhmm = (value) => {
  const text = String(value || "").trim();
  const [h, m] = text.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error("time must be HH:MM");
  }
  return h * 60 + m;
};

const fmtHhmm = (totalMinutes) => {
  const day = 24 * 60;
  const n = ((totalMinutes % day) + day) % day;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

function getAirportCode({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no airport for '${city}'. Covered cities: ${cityList()}. Do not guess.`);
  const info = CITY_INFO[key];
  return `${title(key)} (${info.country}) uses airport ${info.airport}`;
}

function listDistricts({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no districts for '${city}'. Cities: ${cityList()}.`);
  return `${title(key)} districts: ${districtsOf(key).map(title).join(", ")}`;
}

function getDistrict({ district } = {}) {
  const d = resolveDistrict(district);
  if (!d) return err(`'${district}' is not a known district. Known districts: ${districtList()}.`);
  return `${title(d)} is in ${title(DISTRICTS[d].city)}`;
}

function getAirportTransferTime({ district } = {}) {
  const d = resolveDistrict(district);
  if (!d) return err(`'${district}' is not a known district. Known districts: ${districtList()}.`);
  const info = DISTRICTS[d];
  return `Airport to ${title(d)} in ${title(info.city)}: ${info.airportMin} min [AIRPORT_TO_DISTRICT_MIN=${info.airportMin}]`;
}

function getCurrency({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no currency for '${city}'. Cities: ${cityList()}.`);
  const cur = CITY_INFO[key].currency;
  const note = cur === "EUR" ? "same as home" : "NOT euros - convert to EUR before comparing or summing";
  return `${title(key)} (${CITY_INFO[key].country}) prices local hotels and activities in ${cur} (${note})`;
}

function getExchangeRate({ from_currency, to_currency } = {}) {
  const a = String(from_currency || "").trim().toUpperCase();
  const b = String(to_currency || "").trim().toUpperCase();
  if (!EXCHANGE_PER_EUR[a] || !EXCHANGE_PER_EUR[b]) {
    return err(`unknown currency. Known currencies: ${Object.keys(EXCHANGE_PER_EUR).join(", ")}.`);
  }
  const rate = Number((EXCHANGE_PER_EUR[b] / EXCHANGE_PER_EUR[a]).toFixed(4));
  return `Current mock exchange rate: 1 ${a} = ${rate} ${b}.`;
}

function getWeather({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no current weather for '${city}'. Covered cities: ${cityList()}. Do not guess.`);
  return `${WEATHER[key]}°C right now in ${title(key)}`;
}

function getConditions({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no conditions for '${city}'. Covered cities: ${cityList()}. Do not guess.`);
  const c = CONDITIONS[key];
  return `${title(key)} today: ${c.rain}% chance of rain, sunrise ${c.sunrise}, sunset ${c.sunset} (does NOT include temperature - use get_weather for that)`;
}

function getClimateAverage({ city, month } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no climate data for '${city}'. Covered cities: ${cityList()}.`);
  const m = month ? title(String(month).trim()) : "the year";
  return `Historical average for ${title(key)} in ${m}: ${CLIMATE_AVG[key]}°C (long-term average, NOT today's weather)`;
}

function getFlight({ airport } = {}) {
  const code = resolveAirport(airport);
  if (!code) {
    return err(`'${airport}' is not an airport code. Flights are keyed by code (${codesList()}), not city names - use get_airport_code(city) to translate a city first.`);
  }
  const info = AIRPORTS[code];
  return `Round-trip Home↔${code}: €${info.oneway * 2} per person, ${info.duration} each way. IMPORTANT: flight is per person and must NOT be multiplied by nights. [FLIGHT_ROUNDTRIP_PER_PERSON_EUR=${info.oneway * 2}]`;
}

function getOneWayFare({ airport } = {}) {
  const code = resolveAirport(airport);
  if (!code) return err(`'${airport}' is not an airport code. Fares are keyed by code (${codesList()}) - use get_airport_code(city) first.`);
  return `One-way Home→${code}: €${AIRPORTS[code].oneway} (single ticket, no return leg)`;
}

function getFlightLeg({ origin, destination } = {}) {
  const a = norm(origin);
  const b = norm(destination);
  if (!a || !b) return err("provide both 'origin' and 'destination' as airport codes or Home.");
  const ra = a === "home" ? "HOME" : resolveAirport(origin);
  const rb = b === "home" ? "HOME" : resolveAirport(destination);
  if (!ra || !rb) return err(`legs are keyed by airport code. Points: Home, ${codesList()}. Use get_airport_code(city) to translate a city name.`);
  const leg = LEGS[legKey(ra, rb)];
  if (!leg) return err(`no direct flight between ${ra} and ${rb}.`);
  return `${ra}→${rb}: €${leg[0]}, ${leg[1]}`;
}

function getFlightSchedule({ airport } = {}) {
  const code = resolveAirport(airport);
  if (!code) return err(`'${airport}' is not an airport code. Schedules are keyed by code (${codesList()}) - use get_airport_code(city) first.`);
  const deps = SCHEDULE[code].map(([flightNo, dep, arr, dur]) => `${flightNo} ${dep}→${arr} (${dur}) [FLIGHT=${flightNo}] [DEPART=${dep}] [ARRIVE=${arr}] [DURATION=${dur}]`).join(" | ");
  return `Departures Home→${code}: ${deps}. Use these clock times with a time tool when the question asks for latest, earliest, before, after, arrival-by, or departure-by constraints.`;
}

function listHotels({ district } = {}) {
  const d = resolveDistrict(district);
  if (!d) return err(`'${district}' is not a known district. Hotels are listed by district, not city - use list_districts(city) first. Districts: ${districtList()}.`);
  const cur = currencyOfDistrict(d);
  const rows = HOTELS[d].map(([name, price, rating]) => `${name} ${money(price, cur)}/night per person, ${rating}★ [HOTEL_NIGHTLY_PER_PERSON=${price} ${cur}]`).join(" | ");
  return `${title(d)} hotels: ${rows}. Important: these are nightly prices PER PERSON, not a total trip price. Only hotel prices get multiplied by nights.`;
}

function getHotel({ hotel } = {}) {
  const want = norm(hotel);
  if (!want) return err("provide a hotel name, e.g. 'Soho Central'.");
  for (const [d, rows] of Object.entries(HOTELS)) {
    for (const [name, price, rating] of rows) {
      if (name.toLowerCase().includes(want) || want.includes(name.toLowerCase())) {
        const city = DISTRICTS[d].city;
        return `${name} (${title(d)}, ${title(city)}): ${money(price, currencyOfDistrict(d))}/night per person, rated ${rating}/5`;
      }
    }
  }
  const names = Object.values(HOTELS).flat().map(([n]) => n).join(", ");
  return err(`no hotel matching '${hotel}'. Hotels: ${names}.`);
}

function listActivities({ district } = {}) {
  const d = resolveDistrict(district);
  if (!d) return err(`'${district}' is not a known district. Activities are listed by district, not city - use list_districts(city) first. Districts: ${districtList()}.`);
  const rows = ACTIVITIES[d] || [];
  if (!rows.length) return `${title(d)} has no listed activities.`;
  const cur = currencyOfDistrict(d);
  return `${title(d)} activities: ${rows.map(([name, price]) => `${name} ${money(price, cur)}`).join(", ")}`;
}

function getActivityPrice({ activity } = {}) {
  const want = norm(activity);
  if (!want) return err("provide an activity name, e.g. 'Castle tour'.");
  for (const [d, rows] of Object.entries(ACTIVITIES)) {
    for (const [name, price] of rows) {
      const lname = name.toLowerCase();
      if (lname.includes(want) || want.includes(lname)) {
        return `${name} (${title(d)}) costs ${money(price, currencyOfDistrict(d))}`;
      }
    }
  }
  return err(`no activity matching '${activity}'. Try list_activities for a district.`);
}

function calculator({ expression } = {}) {
  if (!String(expression || "").trim()) {
    return err("no expression. Pass something like '180 + 4*140 + 30'.");
  }
  const input = String(expression);
  if (!/^[0-9+\-*/%().\s*]+$/.test(input)) {
    return err(`'${expression}' is not valid. Use numbers and + - * / ** % and parentheses.`);
  }
  try {
    const value = Function(`"use strict"; return (${input});`)();
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("invalid");
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  } catch {
    return err(`'${expression}' is not valid. Use numbers and + - * / ** % and parentheses.`);
  }
}

function timeMath({ operation, time, minutes, other_time } = {}) {
  const opName = norm(operation);
  if (!["add_minutes", "subtract_minutes", "minutes_between", "compare"].includes(opName)) {
    return err("operation must be one of add_minutes, subtract_minutes, minutes_between, compare.");
  }

  let base;
  try {
    base = parseHhmm(time);
  } catch {
    return err("provide 'time' in HH:MM format, e.g. '14:00'.");
  }

  if (opName === "add_minutes" || opName === "subtract_minutes") {
    const delta = Number(minutes);
    if (!Number.isFinite(delta)) return err("provide numeric 'minutes', e.g. 45.");
    const out = opName === "add_minutes" ? fmtHhmm(base + delta) : fmtHhmm(base - delta);
    return `${time} ${opName === "add_minutes" ? "+" : "-"} ${delta} min = ${out}`;
  }

  let cmp;
  try {
    cmp = parseHhmm(other_time);
  } catch {
    return err("provide 'other_time' in HH:MM format, e.g. '09:35'.");
  }

  if (opName === "minutes_between") {
    return `${time} to ${other_time} = ${cmp - base} min`;
  }

  const relation = base < cmp ? "before" : base > cmp ? "after" : "equal";
  return `${time} is ${relation} ${other_time}`;
}

function getCheckinRule() {
  return `Be at the airport ${CHECKIN_MINUTES} minutes before departure for these routes.`;
}

function getTripCost({ city, nights } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no trip data for '${city}'. Cities: ${cityList()}.`);
  const n = Number(nights);
  if (!Number.isFinite(n)) return err("provide a numeric number of 'nights', e.g. 4.");
  const code = CITY_INFO[key].airport;
  const flight = AIRPORTS[code].oneway * 2;
  const firstDistrict = districtsOf(key)[0];
  const [hotelName, hotelPrice] = HOTELS[firstDistrict][0];
  const cur = currencyOfCity(key);
  const total = flight + hotelPrice * Math.trunc(n);
  return `${title(key)} ${Math.trunc(n)} nights: €${total} (round-trip flight + ${hotelName} at ${money(hotelPrice, cur)}/night; currencies not converted; activities not included)`;
}

function planVacation({ city } = {}) {
  const key = resolveCity(city);
  if (!key) return err(`no data for '${city}'. Cities: ${cityList()}.`);
  const weather = WEATHER[key];
  const code = CITY_INFO[key].airport;
  const flight = AIRPORTS[code].oneway * 2;
  const dur = AIRPORTS[code].duration;
  const dists = districtsOf(key);
  const cur = currencyOfCity(key);
  const hotels = dists.flatMap((d) => (HOTELS[d] || []).map(([n, p, r]) => `${n} ${money(p, cur)} ${r}★`)).join(", ");
  const acts = dists.flatMap((d) => (ACTIVITIES[d] || []).map(([n, p]) => `${n} ${money(p, cur)}`)).join(", ");
  return `${title(key)}: ${weather}°C; flight round-trip €${flight}/${dur}; hotels: ${hotels}; activities: ${acts} (hotel/activity prices in ${cur}, flight in EUR)`;
}

export const CATALOG = [
  {
    id: "get_airport_code",
    name: "get_airport_code",
    group: "Directory",
    description: "Translate a city name into its airport CODE and country. Example: get_airport_code('Barcelona') -> 'Barcelona (Spain) uses airport BCN'.",
    parameters: {
      type: "object",
      properties: { city: { type: "string", description: "A single city, e.g. Barcelona." } },
      required: ["city"],
      additionalProperties: false
    },
    impl: getAirportCode
  },
  {
    id: "list_districts",
    name: "list_districts",
    group: "Directory",
    description: "List districts of one city. Required bridge before listing hotels by city: call this with the city, then call list_hotels once for each returned district. Example: list_districts('London').",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false
    },
    impl: listDistricts
  },
  {
    id: "get_district",
    name: "get_district",
    group: "Directory",
    description: "Map a district to its city. Example: get_district('Soho').",
    parameters: {
      type: "object",
      properties: { district: { type: "string" } },
      required: ["district"],
      additionalProperties: false
    },
    impl: getDistrict
  },
  {
    id: "get_airport_transfer_time",
    name: "get_airport_transfer_time",
    group: "Directory",
    description: "Airport-to-district transfer minutes. Use for deadline feasibility.",
    parameters: {
      type: "object",
      properties: { district: { type: "string" } },
      required: ["district"],
      additionalProperties: false
    },
    impl: getAirportTransferTime
  },
  {
    id: "get_currency",
    name: "get_currency",
    group: "Directory",
    description: "Return city currency for hotel/activity cost interpretation.",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false
    },
    impl: getCurrency
  },
  {
    id: "get_weather",
    name: "get_weather",
    group: "Weather",
    description: "Current city temperature.",
    parameters: { type: "object", properties: { city: { type: "string" } }, required: ["city"], additionalProperties: false },
    impl: getWeather
  },
  {
    id: "get_climate_average",
    name: "get_climate_average",
    group: "Weather",
    description: "Historical monthly average temperature (decoy).",
    parameters: { type: "object", properties: { city: { type: "string" }, month: { type: "string" } }, required: ["city"], additionalProperties: false },
    impl: getClimateAverage
  },
  {
    id: "get_flight",
    name: "get_flight",
    group: "Flights",
    description: "Round-trip flight price by airport code.",
    parameters: { type: "object", properties: { airport: { type: "string" } }, required: ["airport"], additionalProperties: false },
    impl: getFlight
  },
  {
    id: "get_one_way_fare",
    name: "get_one_way_fare",
    group: "Flights",
    description: "One-way fare by airport code.",
    parameters: { type: "object", properties: { airport: { type: "string" } }, required: ["airport"], additionalProperties: false },
    impl: getOneWayFare
  },
  {
    id: "get_flight_leg",
    name: "get_flight_leg",
    group: "Flights",
    description: "Direct leg fare/time between HOME or airport codes.",
    parameters: {
      type: "object",
      properties: { origin: { type: "string" }, destination: { type: "string" } },
      required: ["origin", "destination"],
      additionalProperties: false
    },
    impl: getFlightLeg
  },
  {
    id: "get_flight_schedule",
    name: "get_flight_schedule",
    group: "Flights",
    description: "Departure/arrival schedule for Home->airport route.",
    parameters: { type: "object", properties: { airport: { type: "string" } }, required: ["airport"], additionalProperties: false },
    impl: getFlightSchedule
  },
  {
    id: "list_hotels",
    name: "list_hotels",
    group: "Hotels",
    description: "List hotels in one district with nightly per-person rates. Input must be a district, never a city; to find a city's cheapest hotel, call list_districts(city), list_hotels for every returned district, then compare nightly prices.",
    parameters: { type: "object", properties: { district: { type: "string" } }, required: ["district"], additionalProperties: false },
    impl: listHotels
  },
  {
    id: "get_hotel",
    name: "get_hotel",
    group: "Hotels",
    description: "Find one hotel by name.",
    parameters: { type: "object", properties: { hotel: { type: "string" } }, required: ["hotel"], additionalProperties: false },
    impl: getHotel
  },
  {
    id: "list_activities",
    name: "list_activities",
    group: "Activities",
    description: "List district activities and prices.",
    parameters: { type: "object", properties: { district: { type: "string" } }, required: ["district"], additionalProperties: false },
    impl: listActivities
  },
  {
    id: "get_activity_price",
    name: "get_activity_price",
    group: "Activities",
    description: "Find one activity price by name.",
    parameters: { type: "object", properties: { activity: { type: "string" } }, required: ["activity"], additionalProperties: false },
    impl: getActivityPrice
  },
  {
    id: "get_exchange_rate",
    name: "get_exchange_rate",
    group: "Cost",
    description: "Return the current mock conversion rate between two ISO currency codes. The result is expressed as the amount of to_currency for 1 unit of from_currency. Use it to convert amounts at the current rate or to compare a target rate against the current rate.",
    parameters: {
      type: "object",
      properties: { from_currency: { type: "string" }, to_currency: { type: "string" } },
      required: ["from_currency", "to_currency"],
      additionalProperties: false
    },
    impl: getExchangeRate
  },
  {
    id: "time_math",
    name: "time_math",
    group: "Cost",
    description: "Clock-time arithmetic for schedule/deadline questions.",
    parameters: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["add_minutes", "subtract_minutes", "minutes_between", "compare"] },
        time: { type: "string" },
        minutes: { type: "string" },
        other_time: { type: "string" }
      },
      required: ["operation", "time"],
      additionalProperties: false
    },
    impl: timeMath
  },
  {
    id: "calculator",
    name: "calculator",
    group: "Cost",
    description: "Evaluate arithmetic needed to combine or compare verified travel facts.",
    parameters: { type: "object", properties: { expression: { type: "string" } }, required: ["expression"], additionalProperties: false },
    impl: calculator
  },
  {
    id: "get_trip_cost",
    name: "get_trip_cost",
    group: "Cost",
    description: "Bundled decoy trip cost estimate.",
    parameters: { type: "object", properties: { city: { type: "string" }, nights: { type: "string" } }, required: ["city", "nights"], additionalProperties: false },
    impl: getTripCost
  },
  {
    id: "plan_vacation",
    name: "plan_vacation",
    group: "Cost",
    description: "God tool summary for a city.",
    parameters: { type: "object", properties: { city: { type: "string" } }, required: ["city"], additionalProperties: false },
    impl: planVacation
  },
  {
    id: "get_checkin_rule",
    name: "get_checkin_rule",
    group: "Cost",
    description: "Airport check-in buffer rule.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    impl: getCheckinRule
  }
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((s) => [s.id, s]));
export const TOOL_DETAILS = {
  get_airport_code: "Reads table:cities. Use it to translate a city into the airport code required by flight tools.",
  list_districts: "Reads table:districts. Use it before comparing hotels or activities across a city.",
  get_district: "Reads table:districts. Use it to identify the city for a known district.",
  get_airport_transfer_time: "Reads table:districts. Use it with schedules and time_math to check arrival deadlines.",
  get_currency: "Reads table:cities. Use it to interpret local hotel and activity prices before comparing costs.",
  get_weather: "Reads table:weather. Use it for the current temperature in a city.",
  get_climate_average: "Reads table:climate. Use it only for historical seasonal averages, not current conditions.",
  get_flight: "Reads table:flights. Use it for the round-trip price and travel time for an airport.",
  get_one_way_fare: "Reads table:flights. Use it when the question specifically needs a one-way ticket.",
  get_flight_leg: "Reads table:flight_legs. Use it for a direct route between HOME and airport codes.",
  get_flight_schedule: "Reads table:departures. Use it with time_math for departure or arrival constraints.",
  list_hotels: "Reads table:hotels. Accepts one district and returns nightly per-person prices for comparisons.",
  get_hotel: "Reads table:hotels. Use it to retrieve the price and rating of a named hotel.",
  list_activities: "Reads table:activities. Use it to list local activities and their prices for one district.",
  get_activity_price: "Reads table:activities. Use it to retrieve the price of one named activity.",
  get_exchange_rate: "Reads table:exchange_rates. Use it for the current mock conversion rate between two currencies.",
  time_math: "Uses verified clock times. Use it for time addition, subtraction, differences, and deadline comparisons.",
  calculator: "Uses verified numeric values only. Provide a bare arithmetic expression; use the result for totals, rates, or comparisons.",
  get_trip_cost: "Reads table:flights and table:hotels. This is a simplified estimate and omits currency conversion and activities.",
  plan_vacation: "Reads several travel tables. This broad summary is less precise than selecting the focused tools needed for a question.",
  get_checkin_rule: "Reads the airport check-in policy. Use it with schedules and time_math to determine airport arrival time."
};
export const BROKEN_ENABLED = new Set(["get_exchange_rate"]);
export const REFERENCE_ENABLED = new Set([
  "get_airport_code",
  "list_districts",
  "get_district",
  "get_airport_transfer_time",
  "get_currency",
  "get_weather",
  "get_flight",
  "get_flight_schedule",
  "list_hotels",
  "list_activities",
  "get_exchange_rate",
  "time_math",
  "calculator"
]);

export function buildToolbox(enabledIds, descriptions = {}) {
  const enabled = new Set(enabledIds);
  const selected = CATALOG.filter((tool) => enabled.has(tool.id)).map((tool) => ({
    ...tool,
    overview: String(descriptions[tool.id] || "").trim() || tool.description,
    details: TOOL_DETAILS[tool.name] || "Use this tool only when its result is needed to answer the question.",
    effectiveDescription: `${String(descriptions[tool.id] || "").trim() || tool.description}\n\nDetails: ${TOOL_DETAILS[tool.name] || "Use this tool only when its result is needed to answer the question."}`
  }));
  const meta = Object.fromEntries(selected.map((tool) => [tool.name, tool.group]));
  return { tools: selected, meta };
}

export function datasetTables() {
  const cities = Object.entries(CITY_INFO).map(([city, info]) => ({
    City: title(city),
    Country: info.country,
    Airport: info.airport,
    Currency: info.currency
  }));

  const temperature = Object.keys(WEATHER).map((city) => ({
    City: title(city),
    "Now (°C)": WEATHER[city],
    "Avg (°C)": CLIMATE_AVG[city]
  }));

  const conditions = Object.keys(CONDITIONS).map((city) => ({
    City: title(city),
    "Rain (%)": CONDITIONS[city].rain,
    Sunrise: CONDITIONS[city].sunrise,
    Sunset: CONDITIONS[city].sunset
  }));

  const flights = Object.entries(AIRPORTS).map(([code, info]) => ({
    Airport: code,
    "Round-trip €": info.oneway * 2,
    "One-way €": info.oneway,
    "Flight time": info.duration,
    "Flights/day": SCHEDULE[code].length
  }));

  const points = ["HOME", ...Object.keys(AIRPORTS)];
  const seen = new Set();
  const legs = [];
  for (const a of points) {
    for (const b of points) {
      if (a === b) continue;
      const key = legKey(a, b);
      if (seen.has(key) || !LEGS[key]) continue;
      seen.add(key);
      const [price, dur] = LEGS[key];
      legs.push({ From: a, To: b, "€": price, Time: dur });
    }
  }

  const schedule = Object.entries(SCHEDULE).flatMap(([code, deps]) => deps.map(([flight, dep, arr, dur]) => ({
    Airport: code,
    Route: `Home→${code}`,
    Flight: flight,
    Departs: dep,
    Arrives: arr,
    Time: dur
  })));

  const districts = Object.entries(DISTRICTS).map(([district, info]) => ({
    District: title(district),
    City: title(info.city),
    "Airport→district (min)": info.airportMin
  }));

  const hotels = Object.entries(HOTELS).flatMap(([district, rows]) => rows.map(([name, price, rating]) => ({
    District: title(district),
    Hotel: name,
    "Price/night": price,
    Currency: currencyOfDistrict(district),
    Rating: rating
  })));

  const activities = Object.entries(ACTIVITIES).flatMap(([district, rows]) => rows.map(([name, price]) => ({
    District: title(district),
    Activity: name,
    Price: price,
    Currency: currencyOfDistrict(district)
  })));

  const exchange = Object.entries(EXCHANGE_PER_EUR).map(([cur, per]) => ({
    Currency: cur,
    "Per 1 EUR": per,
    "1 unit in EUR": Number((1 / per).toFixed(4))
  }));

  return [
    { name: "table:cities", label: "Cities", description: "City, country, airport code, and local currency.", rows: cities },
    { name: "table:weather", label: "Weather", description: "Current and historical city temperatures.", rows: temperature },
    { name: "table:conditions", label: "Conditions", description: "Daily rain chance, sunrise, and sunset.", rows: conditions },
    { name: "table:flights", label: "Flights", description: "Airport-based one-way and round-trip fares.", rows: flights },
    { name: "table:flight_legs", label: "Flight legs", description: "Direct route fares and durations.", rows: legs },
    { name: "table:departures", label: "Departures", description: "Scheduled Home-to-airport departure and arrival times.", rows: schedule },
    { name: "table:districts", label: "Districts", description: "District-to-city mapping and airport transfer time.", rows: districts },
    { name: "table:hotels", label: "Hotels", description: "District-level nightly hotel prices and ratings.", rows: hotels },
    { name: "table:activities", label: "Activities", description: "District-level activity prices.", rows: activities },
    { name: "table:exchange_rates", label: "Exchange rates", description: "Mock currency baselines relative to EUR.", rows: exchange }
  ];
}

export function splitDescription(desc) {
  const idx = String(desc || "").indexOf("Example:");
  if (idx === -1) return [String(desc || "").trim(), ""];
  return [String(desc || "").slice(0, idx).trim(), String(desc || "").slice(idx).trim()];
}
