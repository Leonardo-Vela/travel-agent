export const CITIES = ["Barcelona", "Prague", "London", "Zurich", "Istanbul", "Budapest"];

export const CITY_INFO = {
  barcelona: { airport: "BCN", country: "Spain", currency: "EUR" },
  prague: { airport: "PRG", country: "Czechia", currency: "CZK" },
  london: { airport: "LHR", country: "United Kingdom", currency: "GBP" },
  zurich: { airport: "ZRH", country: "Switzerland", currency: "CHF" },
  istanbul: { airport: "IST", country: "Turkey", currency: "TRY" },
  budapest: { airport: "BUD", country: "Hungary", currency: "HUF" }
};

export const EXCHANGE_PER_EUR = {
  EUR: 1.0,
  CZK: 25.0,
  GBP: 0.85,
  CHF: 0.95,
  TRY: 35.0,
  HUF: 390.0
};

export const WEATHER = {
  barcelona: 26,
  prague: 20,
  london: 16,
  zurich: 18,
  istanbul: 28,
  budapest: 22
};

export const CLIMATE_AVG = {
  barcelona: 28,
  prague: 22,
  london: 18,
  zurich: 20,
  istanbul: 30,
  budapest: 24
};

export const CONDITIONS = {
  barcelona: { rain: 10, sunrise: "07:05", sunset: "20:30" },
  prague: { rain: 55, sunrise: "06:00", sunset: "19:40" },
  london: { rain: 70, sunrise: "06:20", sunset: "19:30" },
  zurich: { rain: 35, sunrise: "06:40", sunset: "20:10" },
  istanbul: { rain: 15, sunrise: "06:30", sunset: "19:20" },
  budapest: { rain: 45, sunrise: "05:50", sunset: "19:35" }
};

export const AIRPORTS = {
  BCN: { oneway: 90, duration: "2h20" },
  PRG: { oneway: 45, duration: "1h10" },
  LHR: { oneway: 70, duration: "1h50" },
  ZRH: { oneway: 55, duration: "1h20" },
  IST: { oneway: 130, duration: "3h00" },
  BUD: { oneway: 60, duration: "1h40" }
};

const legKey = (a, b) => [a.trim().toUpperCase(), b.trim().toUpperCase()].sort().join("|");

export const LEGS = {
  [legKey("HOME", "BCN")]: [90, "2h20"],
  [legKey("HOME", "PRG")]: [45, "1h10"],
  [legKey("HOME", "LHR")]: [70, "1h50"],
  [legKey("HOME", "ZRH")]: [55, "1h20"],
  [legKey("HOME", "IST")]: [130, "3h00"],
  [legKey("HOME", "BUD")]: [60, "1h40"],
  [legKey("BCN", "LHR")]: [85, "2h00"],
  [legKey("BCN", "ZRH")]: [75, "1h40"],
  [legKey("BCN", "IST")]: [140, "3h10"],
  [legKey("LHR", "ZRH")]: [90, "1h30"],
  [legKey("LHR", "BUD")]: [100, "2h20"],
  [legKey("ZRH", "PRG")]: [80, "1h20"],
  [legKey("ZRH", "BUD")]: [85, "1h30"],
  [legKey("PRG", "BUD")]: [55, "1h05"],
  [legKey("PRG", "IST")]: [120, "2h40"],
  [legKey("BUD", "IST")]: [95, "1h50"]
};

export const SCHEDULE = {
  BCN: [
    ["CB201", "06:30", "08:50", "2h20"],
    ["CB203", "08:00", "10:20", "2h20"],
    ["CB207", "11:15", "13:35", "2h20"],
    ["CB211", "14:30", "16:50", "2h20"],
    ["CB215", "17:05", "19:25", "2h20"],
    ["CB219", "19:10", "21:30", "2h20"]
  ],
  PRG: [
    ["CB301", "07:25", "08:35", "1h10"],
    ["CB305", "10:05", "11:15", "1h10"],
    ["CB309", "12:40", "13:50", "1h10"],
    ["CB313", "15:30", "16:40", "1h10"],
    ["CB317", "17:45", "18:55", "1h10"],
    ["CB321", "20:30", "21:40", "1h10"]
  ],
  LHR: [
    ["CB401", "07:10", "09:00", "1h50"],
    ["CB405", "09:40", "11:30", "1h50"],
    ["CB409", "13:15", "15:05", "1h50"],
    ["CB413", "16:50", "18:40", "1h50"],
    ["CB417", "19:30", "21:20", "1h50"]
  ],
  ZRH: [
    ["CB501", "06:45", "08:05", "1h20"],
    ["CB505", "09:00", "10:20", "1h20"],
    ["CB509", "12:30", "13:50", "1h20"],
    ["CB513", "15:10", "16:30", "1h20"],
    ["CB517", "18:00", "19:20", "1h20"],
    ["CB521", "20:40", "22:00", "1h20"]
  ],
  IST: [
    ["CB601", "07:00", "10:00", "3h00"],
    ["CB605", "10:30", "13:30", "3h00"],
    ["CB609", "14:00", "17:00", "3h00"],
    ["CB613", "18:20", "21:20", "3h00"]
  ],
  BUD: [
    ["CB701", "06:55", "08:35", "1h40"],
    ["CB705", "09:20", "11:00", "1h40"],
    ["CB709", "12:10", "13:50", "1h40"],
    ["CB713", "15:40", "17:20", "1h40"],
    ["CB717", "18:30", "20:10", "1h40"],
    ["CB721", "21:00", "22:40", "1h40"]
  ]
};

export const DISTRICTS = {
  "eixample": { city: "barcelona", airportMin: 40 },
  "gothic quarter": { city: "barcelona", airportMin: 30 },
  "barceloneta": { city: "barcelona", airportMin: 55 },
  "old town": { city: "prague", airportMin: 35 },
  "mala strana": { city: "prague", airportMin: 25 },
  "south kensington": { city: "london", airportMin: 50 },
  "soho": { city: "london", airportMin: 45 },
  "altstadt": { city: "zurich", airportMin: 15 },
  "enge": { city: "zurich", airportMin: 20 },
  "sultanahmet": { city: "istanbul", airportMin: 55 },
  "beyoglu": { city: "istanbul", airportMin: 45 },
  "district v": { city: "budapest", airportMin: 30 },
  "buda castle": { city: "budapest", airportMin: 35 }
};

export const HOTELS = {
  "eixample": [["Hotel Sol", 140, 4.5]],
  "gothic quarter": [["Rambla Rooms", 95, 4.1]],
  "barceloneta": [["Beachside Inn", 120, 4.3]],
  "old town": [["Old Town Inn", 1875, 4.3], ["Old Town Courtyard", 2240, 4.6]],
  "mala strana": [["Riverside Prague", 3250, 4.7]],
  "south kensington": [["The Kensington", 210, 4.6], ["Museum Court Hotel", 165, 4.1]],
  "soho": [["Soho Central", 175, 4.2]],
  "altstadt": [["Altstadt Boutique", 260, 4.7]],
  "enge": [["Lake Enge Hotel", 190, 4.3]],
  "sultanahmet": [["Palace View", 2800, 4.4]],
  "beyoglu": [["Taksim Suites", 1950, 4.1]],
  "district v": [["Danube Grand", 48000, 4.5]],
  "buda castle": [["Castle Hill Inn", 32000, 4.2]]
};

export const ACTIVITIES = {
  "eixample": [["Sagrada Familia tour", 30]],
  "barceloneta": [["Beach day", 0]],
  "gothic quarter": [["Tapas tour", 45]],
  "old town": [["River cruise", 550], ["Beer tasting", 450]],
  "mala strana": [["Castle tour", 375]],
  "south kensington": [["Museum pass", 25]],
  "soho": [["West End show", 90]],
  "altstadt": [["Old town walk", 20], ["Chocolate tasting", 45]],
  "enge": [["Lake cruise", 35]],
  "sultanahmet": [["Hagia Sophia tour", 600]],
  "beyoglu": [["Bosphorus cruise", 850]],
  "district v": [["Parliament tour", 12000]],
  "buda castle": [["Thermal bath", 9000]]
};

export const CHECKIN_MINUTES = 90;

export { legKey };
