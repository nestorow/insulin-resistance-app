import { computeInsights } from "@/lib/trend-insights";
import type { TrendDay } from "@/lib/trends";

// Helper to build a synthetic 90-day axis with overrides per index.
function axis(overrides: Partial<TrendDay>[] = []): TrendDay[] {
  const out: TrendDay[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(Date.UTC(2026, 0, 1));
    d.setUTCDate(d.getUTCDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      ...(overrides[i] ?? {}),
    });
  }
  return out;
}

describe("computeInsights — HOMA-IR trend", () => {
  it("flags improvement when HOMA-IR drops ≥10%", () => {
    const days = axis();
    days[0].homaIr = 4.0;
    days[30].homaIr = 3.5;
    days[60].homaIr = 3.2; // -20% from 4.0
    const ins = computeInsights(days);
    const hi = ins.find((x) => x.id === "homair-improving");
    expect(hi).toBeDefined();
    expect(hi?.kind).toBe("improvement");
    expect(hi?.title_bg).toMatch(/HOMA-IR падна/);
  });

  it("flags concern when HOMA-IR rises ≥10%", () => {
    const days = axis();
    days[0].homaIr = 3.0;
    days[60].homaIr = 3.5; // +16.7%
    const ins = computeInsights(days);
    const hi = ins.find((x) => x.id === "homair-rising");
    expect(hi?.kind).toBe("concern");
  });

  it("ignores HOMA-IR change below 10%", () => {
    const days = axis();
    days[0].homaIr = 4.0;
    days[60].homaIr = 3.7; // -7.5%
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id?.startsWith("homair-"))).toBeUndefined();
  });

  it("ignores single-point HOMA-IR", () => {
    const days = axis();
    days[30].homaIr = 4.0;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id?.startsWith("homair-"))).toBeUndefined();
  });
});

describe("computeInsights — weight trend", () => {
  it("flags weight loss ≥1 kg with ≥5 readings", () => {
    const days = axis();
    days[0].weight = 85;
    days[15].weight = 84;
    days[30].weight = 83;
    days[45].weight = 82;
    days[60].weight = 81;
    const ins = computeInsights(days);
    const w = ins.find((x) => x.id === "weight-down");
    expect(w).toBeDefined();
    expect(w?.title_bg).toMatch(/4 kg по-малко/);
  });

  it("flags weight gain as observation (no shaming)", () => {
    const days = axis();
    days[0].weight = 70;
    for (let i = 15; i <= 60; i += 15) days[i].weight = 70 + i / 30;
    const ins = computeInsights(days);
    const w = ins.find((x) => x.id === "weight-up");
    expect(w?.kind).toBe("observation");
  });

  it("requires ≥5 readings", () => {
    const days = axis();
    days[0].weight = 85;
    days[60].weight = 80;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id?.startsWith("weight-"))).toBeUndefined();
  });
});

describe("computeInsights — CGM TIR rule", () => {
  it("flags ≥70% TIR average as improvement", () => {
    const days = axis();
    for (let i = 0; i < 14; i++) days[i].cgmTir = 75;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id === "tir-on-target")?.kind).toBe(
      "improvement"
    );
  });

  it("flags <50% TIR as concern", () => {
    const days = axis();
    for (let i = 0; i < 14; i++) days[i].cgmTir = 40;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id === "tir-low")?.kind).toBe("concern");
  });

  it("flags 50-69% TIR as observation", () => {
    const days = axis();
    for (let i = 0; i < 14; i++) days[i].cgmTir = 60;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id === "tir-mid")?.kind).toBe("observation");
  });

  it("requires ≥7 CGM days", () => {
    const days = axis();
    for (let i = 0; i < 6; i++) days[i].cgmTir = 80;
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id?.startsWith("tir-"))).toBeUndefined();
  });
});

describe("computeInsights — TIR ↔ brain fog correlation", () => {
  it("surfaces when heavy-fog days have ≥10pp lower TIR", () => {
    const days = axis();
    // 5 heavy-fog days with TIR ~50, 5 light-fog days with TIR ~80
    for (let i = 0; i < 5; i++) {
      days[i].cgmTir = 50;
      days[i].brainFog = 8;
    }
    for (let i = 10; i < 15; i++) {
      days[i].cgmTir = 80;
      days[i].brainFog = 2;
    }
    const ins = computeInsights(days);
    const c = ins.find((x) => x.id === "tir-vs-fog");
    expect(c?.kind).toBe("correlation");
    expect(c?.title_bg).toMatch(/30 пр.п. по-нисък/);
  });

  it("ignores when the gap is <10pp", () => {
    const days = axis();
    for (let i = 0; i < 5; i++) {
      days[i].cgmTir = 70;
      days[i].brainFog = 8;
    }
    for (let i = 10; i < 15; i++) {
      days[i].cgmTir = 75;
      days[i].brainFog = 2;
    }
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id === "tir-vs-fog")).toBeUndefined();
  });

  it("requires ≥10 paired days", () => {
    const days = axis();
    for (let i = 0; i < 4; i++) {
      days[i].cgmTir = 50;
      days[i].brainFog = 8;
    }
    for (let i = 4; i < 8; i++) {
      days[i].cgmTir = 80;
      days[i].brainFog = 2;
    }
    const ins = computeInsights(days);
    expect(ins.find((x) => x.id === "tir-vs-fog")).toBeUndefined();
  });
});

describe("computeInsights — plan ↔ energy correlation", () => {
  it("surfaces when high-plan days have ≥1 point more energy", () => {
    const days = axis();
    // 5 days at 90% plan / energy 8
    for (let i = 0; i < 5; i++) {
      days[i].planCompletePct = 90;
      days[i].energy = 8;
    }
    // 5 days at 40% plan / energy 5
    for (let i = 5; i < 10; i++) {
      days[i].planCompletePct = 40;
      days[i].energy = 5;
    }
    const ins = computeInsights(days);
    const c = ins.find((x) => x.id === "plan-vs-energy");
    expect(c?.kind).toBe("correlation");
    expect(c?.title_bg).toMatch(/\+3/);
  });
});

describe("computeInsights — activity coverage", () => {
  it("reports active-day coverage when ≥1 active day", () => {
    const days = axis();
    days[0].energy = 7;
    days[5].weight = 80;
    const ins = computeInsights(days);
    const cov = ins.find((x) => x.id === "coverage");
    expect(cov?.kind).toBe("observation");
    expect(cov?.title_bg).toMatch(/Записани данни в 2 от 90/);
  });

  it("returns no insights at all for an empty axis", () => {
    expect(computeInsights(axis())).toEqual([]);
  });
});
