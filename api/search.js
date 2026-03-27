export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured." });

  // Ask Gemini to convert the fuzzy query into a valid Sefaria reference
  const prompt = `You are an expert in classical Jewish texts and the Sefaria library's reference system.

Convert the following user query into a valid Sefaria API reference string.

Sefaria reference rules:
- Torah: "Genesis 1:1", "Exodus 3:14"
- Talmud Bavli: "Berakhot 2a", "Shabbat 31a"
- Mishnah: "Mishnah Berakhot 1:1", "Pirkei Avot 1:1"
- Rashi: "Rashi on Genesis 1:1", "Rashi on Berakhot 2a"
- Tosafot: "Tosafot on Berakhot 2a"
- Rambam: "Mishneh Torah, Laws of Repentance 1:1"
- Bekhor Shor: "Bekhor Shor, Genesis 1:1" (commentaries use comma format)
- Ramban: "Ramban on Genesis 1:1"
- Ibn Ezra: "Ibn Ezra on Genesis 1:1"
- Kuzari: "Kuzari 1:1"
- Sefer HaChinuch: "Sefer HaChinuch 1"

User query: "${query}"

Respond ONLY with a JSON object, no markdown:
{"ref": "the exact Sefaria reference string", "display": "human-friendly name for this text"}

If the query is too vague to resolve, return: {"ref": "", "display": "", "error": "Could not resolve to a specific text. Please be more specific."}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.1 },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Gemini error" });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "Could not parse response." });

    const parsed = JSON.parse(match[0]);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
