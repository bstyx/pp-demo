// BM25 retrieval over the Q&A knowledge base. Works in browser and Node.
(function (root) {
  const STOP = new Set("a an the is are am do does did i my me we our you your it its to of in on at for with and or but how what why when where which who can should would will be been this that these those there have has had get got not no yes any some from up down out as by if then than so just keep keeps mean means meaning tell explain about".split(" "));
  const SYN = { maize: "corn", corn: "corn", inches: "inh2o", inch: "inh2o", water: "inh2o", h2o: "inh2o", vac: "vacuum",
    doubles: "multiples", double: "multiples", multiple: "multiples", skip: "skips", skipping: "skips",
    downforce: "downforce", "down-force": "downforce", load: "load", firmware: "software", update: "update", updating: "update",
    winter: "storage", store: "storage", storing: "storage", offseason: "storage", bean: "soybean", beans: "soybean", soybeans: "soybean", soy: "soybean",
    rx: "prescription", vrt: "prescription", prescriptions: "prescription", error: "alarm", errors: "alarm", code: "alarm", codes: "alarm", alarms: "alarm",
    led: "led", blinking: "blink", flashing: "blink", seeds: "seed", rows: "row", meters: "meter", sensors: "sensor", sensor: "sensor",
    calibrate: "calibration", calibrating: "calibration", cal: "calibration", setting: "set", settings: "set", setup: "set", "set-up": "set" };
  function tok(s) {
    return (s.toLowerCase().replace(/20\|20/g, "2020").match(/[a-z0-9]+/g) || [])
      .filter(w => !STOP.has(w)).map(w => SYN[w] || w.replace(/(ing|es|s)$/,"").replace(/^(.{3,})e$/,"$1") || w);
  }
  function build(kb) {
    const docs = kb.qa.map(x => {
      const t = tok(x.q + " " + x.q + " " + x.q + " " + x.tags + " " + x.tags + " " + x.section + " " + x.a);
      const tf = {}; t.forEach(w => tf[w] = (tf[w] || 0) + 1); return { x, tf, len: t.length };
    });
    const df = {}; docs.forEach(d => Object.keys(d.tf).forEach(w => df[w] = (df[w] || 0) + 1));
    const avg = docs.reduce((a, d) => a + d.len, 0) / docs.length, N = docs.length;
    return function search(query, k = 3) {
      const qt = [...new Set(tok(query))];
      if (!qt.length) return [];
      const known = qt.filter(w => df[w]);
      const res = docs.map(d => {
        let s = 0, hit = 0;
        for (const w of qt) { const f = d.tf[w]; if (!f) continue; hit++;
          const idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
          s += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * d.len / avg)); }
        return { x: d.x, score: s, coverage: known.length ? hit / known.length : 0, known: known.length, qlen: qt.length };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
      return res.slice(0, k);
    };
  }
  // Decide whether to answer or refer to dealer.
  const OUT = /\b(price|prices|cost|costs|how much|buy|order|ordering|quote|warranty|stock|deliver|delivery)\b/i;
  function answer(kb, search, query) {
    const r = search(query, 3);
    if (OUT.test(query)) return { confident: false, top: r[0], alts: r.slice(1), reason: "out_of_scope" };
    const top = r[0];
    const confident = top && top.score >= 6 && top.coverage >= 0.5 && top.known / top.qlen >= 0.5;
    return { confident: !!confident, top, alts: r.slice(1) };
  }
  const api = { tok, build, answer };
  if (typeof module !== "undefined") module.exports = api; else root.PPRetriever = api;
})(this);
