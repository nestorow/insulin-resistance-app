// Every route owns its own canonical + robots policy. Regression guard for the
// bug where the root layout declared `alternates.canonical: "/"`, which Next
// inherits into every nested page — so all 17 pages told Google they were
// duplicates of the homepage.

// layout.tsx pulls SyncOnLogin → server actions → next-auth (ESM jose). We
// only inspect metadata exports, so stub the auth chain like the other suites.
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn(async () => null) }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
// uuid v14 is ESM-only; SyncOnLogin fans out to every server action.
jest.mock("uuid", () => ({ v4: () => "test-uuid" }));
jest.mock("@/components/SyncOnLogin", () => () => null);

import type { Metadata } from "next";
import { metadata as layoutMetadata } from "@/app/layout";
import { metadata as home } from "@/app/page";
import { metadata as education } from "@/app/education/page";
import { metadata as foods } from "@/app/foods/page";
import { metadata as exercise } from "@/app/exercise/page";
import { metadata as fasting } from "@/app/fasting/page";
import { metadata as supplements } from "@/app/supplements/page";
import { metadata as cgm } from "@/app/cgm/page";
import { metadata as privacy } from "@/app/privacy/page";
import { metadata as terms } from "@/app/terms/page";
import { metadata as plan } from "@/app/plan/page";
import { metadata as journal } from "@/app/journal/page";
import { metadata as markers } from "@/app/markers/page";
import { metadata as trends } from "@/app/trends/page";
import { metadata as settings } from "@/app/settings/page";
import { metadata as onboarding } from "@/app/onboarding/page";
import { metadata as trendsPrint } from "@/app/trends/print/page";

const PUBLIC: [string, Metadata][] = [
  ["/", home],
  ["/education", education],
  ["/foods", foods],
  ["/exercise", exercise],
  ["/fasting", fasting],
  ["/supplements", supplements],
  ["/cgm", cgm],
  ["/privacy", privacy],
  ["/terms", terms],
];

const PRIVATE: [string, Metadata][] = [
  ["/plan", plan],
  ["/journal", journal],
  ["/markers", markers],
  ["/trends", trends],
  ["/settings", settings],
  ["/onboarding", onboarding],
  ["/trends/print", trendsPrint],
];

describe("root layout", () => {
  it("does not declare a canonical (each page owns its own)", () => {
    expect(layoutMetadata.alternates?.canonical).toBeUndefined();
  });

  it("uses a title template so pages get the brand suffix once", () => {
    expect(layoutMetadata.title).toMatchObject({ template: "%s — InsulinReset" });
  });

  it("does not pin og:title / og:url to the homepage", () => {
    const og = (layoutMetadata.openGraph ?? {}) as { title?: unknown; url?: unknown };
    expect(og.title).toBeUndefined();
    expect(og.url).toBeUndefined();
  });
});

describe("public pages", () => {
  it.each(PUBLIC)("%s canonicalizes to itself and is indexable", (path, meta) => {
    expect(meta.alternates?.canonical).toBe(path);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it.each(PUBLIC)("%s has a description", (_path, meta) => {
    expect(typeof meta.description).toBe("string");
    expect((meta.description as string).length).toBeGreaterThan(40);
  });

  it("does not repeat the brand suffix inside page titles (the template adds it)", () => {
    for (const [path, meta] of PUBLIC) {
      if (path === "/") continue;
      expect(String(meta.title)).not.toContain("InsulinReset");
    }
  });
});

describe("user-data and funnel pages", () => {
  it.each(PRIVATE)("%s is noindex,follow", (_path, meta) => {
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
