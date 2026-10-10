// BM25 retrieval over the Q&A knowledge base (shared by Worker and site).
const STOP = new Set("a an the is are am do does did i my me we our you your it its to of in on at for with and or but how what why when where which who can should would will be been this that these those there have has had get got not no yes any some from up down out as by if then than so just keep keeps mean means meaning tell explain about ok okay thanks please hi hello".split(" "));
const SYN = { maize:"corn", inches:"inh2o", inch:"inh2o", water:"inh2o", h2o:"inh2o", vac:"vacuum", doubles:"multiples", double:"multiples", multiple:"multiples", skip:"skips", skipping:"skips",
  firmware:"software", updating:"update", winter:"storage", store:"storage", storing:"storage", bean:"soybean", beans:"soybean", soybeans:"soybean", soy:"soybean",
  rx:"prescription", vrt:"prescription", prescriptions:"prescription", error:"alarm", errors:"alarm", code:"alarm", codes:"alarm", alarms:"alarm", blinking:"blink", flashing:"blink",
  calibrate:"calibration", calibrating:"calibration", cal:"calibration", setting:"set", settings:"set", setup:"set" };
Object.assign(SYN, { faster:"speed", fast:"speed", quick:"speed", quicker:"speed", speeds:"speed", mph:"speed",
  missing:"skips", miss:"skips", misses:"skips", gap:"skips", gaps:"skips", doubling:"multiples", screen:"2020", monitor:"2020", display:"2020" });
const PHRASE = [[/\bhigh(er)?[ -]speeds?\b/g, "speed"], [/\b(two|2) seeds\b/g, "multiples"], [/\bpressure\b/g, "downforce vacuum"]];
export function tok(s) {
  s = String(s).toLowerCase(); for (const [r, w] of PHRASE) s = s.replace(r, w);
  return (String(s).toLowerCase().replace(/20\|20/g, "2020").match(/[a-z0-9]+/g) || [])
    .filter(w => !STOP.has(w)).map(w => SYN[w] || w).map(w => /^\d/.test(w) ? w : (w.replace(/(ing|es|s)$/, "").replace(/^(.{3,})e$/, "$1") || w));
}
export function buildIndex(kb) {
  const docs = kb.qa.map(x => { const t = tok([x.q, x.q, x.q, x.tags, x.tags, x.section, x.a].join(" "));
    const tf = {}; for (const w of t) tf[w] = (tf[w] || 0) + 1; return { x, tf, len: t.length }; });
  const df = {}; for (const d of docs) for (const w in d.tf) df[w] = (df[w] || 0) + 1;
  const avg = docs.reduce((a, d) => a + d.len, 0) / docs.length, N = docs.length;
  return function search(query, k = 5) {
    const qt = [...new Set(tok(query))]; if (!qt.length) return [];
    const known = qt.filter(w => df[w]).length;
    return docs.map(d => { let s = 0, hit = 0;
      for (const w of qt) { const f = d.tf[w]; if (!f) continue; hit++;
        s += Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5)) * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * d.len / avg)); }
      return { x: d.x, score: s, coverage: known ? hit / known : 0 }; })
      .filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
  };
}
