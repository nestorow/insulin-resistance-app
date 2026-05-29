import {
  detectFormat,
  parseCgm,
  parseDexcomClarity,
  parseLibreView,
} from "@/lib/cgm-parser";

// Format fixtures below mirror real exports from LibreView (FreeStyle
// Libre 2) and Dexcom Clarity (G6/G7). Header rows and column orders
// are reproduced verbatim; values are synthetic but in-range.

const LIBRE_EU = `Patient report,Glucose data,FreeStyle LibreLink
Generated on,21-05-2026 09:12

Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mg/dL,Scan Glucose mg/dL,Notes
FreeStyle Libre 2,1A2B3C,20-05-2026 08:00,0,92,,
FreeStyle Libre 2,1A2B3C,20-05-2026 08:15,0,118,,
FreeStyle Libre 2,1A2B3C,20-05-2026 08:30,1,,155,after breakfast
FreeStyle Libre 2,1A2B3C,20-05-2026 08:45,0,142,,
FreeStyle Libre 2,1A2B3C,20-05-2026 09:00,4,,,insulin row to ignore
FreeStyle Libre 2,1A2B3C,20-05-2026 09:15,0,700,,out of range
FreeStyle Libre 2,1A2B3C,20-05-2026 09:30,0,,,empty value
`;

const LIBRE_MMOL = `Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mmol/L,Scan Glucose mmol/L
FreeStyle Libre 3,XYZ,20-05-2026 08:00,0,5.0,
FreeStyle Libre 3,XYZ,20-05-2026 08:15,0,7.8,
`;

const DEXCOM = `Index,Timestamp (YYYY-MM-DDThh:mm:ss),Event Type,Event Subtype,Patient Info,Device Info,Source Device ID,Glucose Value (mg/dL),Insulin Value (u),Carb Value (grams),Duration (hh:mm:ss),Glucose Rate of Change (mg/dL/min),Transmitter Time (Long Integer),Transmitter ID
1,2026-05-20T08:00:00,EGV,,,Dexcom G7,DG7,95,,,,,,
2,2026-05-20T08:05:00,EGV,,,Dexcom G7,DG7,High,,,,,,
3,2026-05-20T08:10:00,EGV,,,Dexcom G7,DG7,142,,,,,,
4,2026-05-20T08:15:00,Calibration,,,Dexcom G7,DG7,100,,,,,,
5,2026-05-20T08:20:00,EGV,,,Dexcom G7,DG7,128,,,,,,
`;

describe("detectFormat", () => {
  it("sniffs LibreView", () => {
    expect(detectFormat(LIBRE_EU)).toBe("libre");
  });
  it("sniffs Dexcom Clarity", () => {
    expect(detectFormat(DEXCOM)).toBe("dexcom");
  });
  it("returns unknown for garbage", () => {
    expect(detectFormat("name,age\nAlice,30")).toBe("unknown");
  });
});

describe("parseLibreView", () => {
  it("keeps historic + scan rows, drops insulin/empty/out-of-range", () => {
    const r = parseLibreView(LIBRE_EU);
    // 4 keepers: 08:00, 08:15, 08:30 (scan), 08:45
    expect(r).toHaveLength(4);
    expect(r.map((x) => x.mgdl)).toEqual([92, 118, 155, 142]);
    expect(r.every((x) => x.source === "libre")).toBe(true);
  });

  it("converts mmol/L → mg/dL", () => {
    const r = parseLibreView(LIBRE_MMOL);
    expect(r).toHaveLength(2);
    // 5.0 mmol/L → 90.1, 7.8 mmol/L → 140.5
    expect(r[0].mgdl).toBeCloseTo(90.1, 1);
    expect(r[1].mgdl).toBeCloseTo(140.5, 1);
  });

  it("parses DD-MM-YYYY HH:mm timestamps as UTC ISO", () => {
    const r = parseLibreView(LIBRE_EU);
    expect(r[0].ts).toBe("2026-05-20T08:00:00.000Z");
    expect(r[3].ts).toBe("2026-05-20T08:45:00.000Z");
  });

  it("returns [] when header is missing", () => {
    expect(parseLibreView("not a libre csv")).toEqual([]);
  });
});

describe("parseDexcomClarity", () => {
  it("keeps only EGV rows", () => {
    const r = parseDexcomClarity(DEXCOM);
    // Of 5 lines: row 2 is "High" (dropped), row 4 is Calibration (dropped).
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.mgdl)).toEqual([95, 142, 128]);
    expect(r.every((x) => x.source === "dexcom")).toBe(true);
  });

  it("normalizes timestamps to UTC ISO", () => {
    const r = parseDexcomClarity(DEXCOM);
    expect(r[0].ts).toBe("2026-05-20T08:00:00.000Z");
  });

  it("drops 'High' and 'Low' literals", () => {
    const r = parseDexcomClarity(DEXCOM);
    expect(r.every((x) => x.mgdl >= 30 && x.mgdl <= 600)).toBe(true);
  });
});

describe("parseCgm (dispatcher)", () => {
  it("routes to the right parser by sniff", () => {
    const a = parseCgm(LIBRE_EU);
    expect(a.format).toBe("libre");
    expect(a.readings.length).toBeGreaterThan(0);

    const b = parseCgm(DEXCOM);
    expect(b.format).toBe("dexcom");
    expect(b.readings.length).toBeGreaterThan(0);

    const c = parseCgm("totally unrelated");
    expect(c.format).toBe("unknown");
    expect(c.readings).toEqual([]);
  });

  it("dedupes by exact timestamp (later row wins)", () => {
    // Two rows for the same ts — historic 100, then scan 145 should win.
    const dup = `Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mg/dL,Scan Glucose mg/dL
FreeStyle Libre 2,X,20-05-2026 08:00,0,100,
FreeStyle Libre 2,X,20-05-2026 08:00,1,,145
`;
    const r = parseLibreView(dup);
    expect(r).toHaveLength(1);
    expect(r[0].mgdl).toBe(145);
  });
});
