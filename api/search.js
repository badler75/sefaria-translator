export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  // ── Parse Sefaria URLs directly, no AI needed ────────────────────────────
  // Handles: https://www.sefaria.org/Bekhor_Shor%2C_Leviticus.6.3?lang=bi
  const urlMatch = query.match(/sefaria\.org\/([^?#\s]+)/i);
  if (urlMatch) {
    try {
      let raw = decodeURIComponent(urlMatch[1]);
      raw = raw.replace(/_/g, ' ');
      const parts = raw.split('.');
      let ref;
      if (parts.length === 1) {
        ref = parts[0];
      } else if (parts.length === 2) {
        ref = parts[0] + ' ' + parts[1];
      } else {
        const book = parts.slice(0, -2).join(' ');
        const chapter = parts[parts.length - 2];
        const verse = parts[parts.length - 1];
        ref = `${book} ${chapter}:${verse}`;
      }
      ref = ref.trim();
      return res.status(200).json({ ref, display: ref });
    } catch (e) {
      // fall through to Gemini
    }
  }

  // ── Use Gemini 1.5 Flash to resolve fuzzy natural language queries ────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured." });

  const prompt = `You are an expert in classical Jewish texts and the Sefaria library reference system.

Convert this user query into a valid Sefaria API reference string.

Format rules:
- Torah: "Genesis 1:1", "Leviticus 6:3"
- Talmud: "Berakhot 2a", "Shabbat 31a"
- Mishnah: "Pirkei Avot 1:1", "Mishnah Berakhot 1:1"
- Rashi: "Rashi on Genesis 1:1"
- Ramban/Nachmanides: "Ramban on Genesis 1:1"
- Bekhor Shor: "Bekhor Shor, Leviticus 6:3"
- Ibn Ezra: "Ibn Ezra on Genesis 1:1"
- Rambam: "Mishneh Torah, Laws of Repentance 1:1"
- Kuzari: "Kuzari 1:1"

User query: "${query}"

Respond ONLY with valid JSON, no markdown:
{"ref":"exact Sefaria reference","display":"human-friendly label"}

If too vague: {"ref":"","display":"","error":"Please include a chapter and verse."}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 128, temperature: 0.1 },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Gemini error" });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Could not parse response." });

    res.status(200).json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
