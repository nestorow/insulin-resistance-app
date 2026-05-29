// Runs the same matching logic the live /education page runs in the
// browser, against the same static data, to demonstrate end-to-end
// search behavior on identical inputs.

import { diseases } from "../src/data/diseases.ts";
import { chapters } from "../src/data/knowledge.ts";
import {
  buildSearchBlob,
  matchesQuery,
} from "../src/lib/education-search.ts";

const diseaseBlobs = diseases.map((d) =>
  buildSearchBlob([d.name_bg, d.name_en, d.description_bg, ...d.keyStats])
);
const chapterBlobs = chapters.map((c) =>
  buildSearchBlob([c.title_bg, c.funFact ?? "", ...c.takeaways])
);

function search(q) {
  const ds = diseases.filter((_, i) => matchesQuery(diseaseBlobs[i], q));
  const cs = chapters.filter((_, i) => matchesQuery(chapterBlobs[i], q));
  return { ds, cs };
}

const queries = [
  "PCOS",
  "мозък",
  "гладуване",
  "ALZHEIMER",
  "homa",
  "хипертония",
  "нищонеработи",
  "parkinson",
  "cancer",
  "GERD",
  "fatty liver",
  "Psoriasis",
];

for (const q of queries) {
  const { ds, cs } = search(q);
  console.log(`\n— "${q}" → ${ds.length} болести, ${cs.length} глави`);
  for (const d of ds.slice(0, 3)) console.log(`   D · ${d.name_bg}`);
  if (ds.length > 3) console.log(`   D · …+${ds.length - 3}`);
  for (const c of cs.slice(0, 3)) console.log(`   C · ${c.number}. ${c.title_bg}`);
  if (cs.length > 3) console.log(`   C · …+${cs.length - 3}`);
}
