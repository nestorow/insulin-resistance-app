import {
  getSymptomLogs,
  addSymptomLog,
  getMarkerLogs,
  addMarkerLog,
} from "@/lib/tracking-storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("symptom log", () => {
  it("starts empty", () => {
    expect(getSymptomLogs()).toEqual([]);
  });

  it("addSymptomLog appends and persists", () => {
    addSymptomLog(
      { date: "2026-01-15", energy: 7, brainFog: 3 },
      { skipServer: true }
    );
    const logs = getSymptomLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ date: "2026-01-15", energy: 7 });
  });

  it("upserts by date — same date overwrites, not appended", () => {
    addSymptomLog(
      { date: "2026-01-15", energy: 5, brainFog: 5 },
      { skipServer: true }
    );
    addSymptomLog(
      { date: "2026-01-15", energy: 8, brainFog: 2 },
      { skipServer: true }
    );
    const logs = getSymptomLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].energy).toBe(8);
    expect(logs[0].brainFog).toBe(2);
  });

  it("keeps logs sorted ascending by date", () => {
    addSymptomLog(
      { date: "2026-01-20", energy: 5, brainFog: 5 },
      { skipServer: true }
    );
    addSymptomLog(
      { date: "2026-01-15", energy: 5, brainFog: 5 },
      { skipServer: true }
    );
    addSymptomLog(
      { date: "2026-01-17", energy: 5, brainFog: 5 },
      { skipServer: true }
    );
    expect(getSymptomLogs().map((l) => l.date)).toEqual([
      "2026-01-15",
      "2026-01-17",
      "2026-01-20",
    ]);
  });

  it("preserves the notes field", () => {
    addSymptomLog(
      { date: "2026-01-15", energy: 5, brainFog: 5, notes: "късна вечеря" },
      { skipServer: true }
    );
    expect(getSymptomLogs()[0].notes).toBe("късна вечеря");
  });
});

describe("marker log", () => {
  it("starts empty", () => {
    expect(getMarkerLogs()).toEqual([]);
  });

  it("upserts marker entries by date", () => {
    addMarkerLog(
      { date: "2026-01-15", homaIr: 4.2, hba1c: 5.7 },
      { skipServer: true }
    );
    addMarkerLog(
      { date: "2026-01-15", homaIr: 3.8, hba1c: 5.5 },
      { skipServer: true }
    );
    const logs = getMarkerLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].homaIr).toBe(3.8);
  });

  it("isolates symptom + marker logs (different keys)", () => {
    addSymptomLog(
      { date: "2026-01-15", energy: 7, brainFog: 3 },
      { skipServer: true }
    );
    addMarkerLog(
      { date: "2026-01-15", homaIr: 4.2 },
      { skipServer: true }
    );
    expect(getSymptomLogs()).toHaveLength(1);
    expect(getMarkerLogs()).toHaveLength(1);
  });
});
