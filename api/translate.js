export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { hebrewText, ref, style, annotation } = req.body;
  if (!hebrewText || !ref) return res.status(400).json({ error: "Missing hebrewText or ref" });

  const STYLES = {
    literal:    "as literal and faithful to the original as possible, preserving word order and terminology",
    readable:   "in clear, readable modern English that flows naturally while remaining accurate",
    scholarly:  "in a scholarly register, preserving key Hebrew/Aramaic terms transliterated where important",
    accessible: "in simple accessible English for beginners, explaining concepts in plain language",
  };
  const ANNOTS = {
    none:  "Provide only the translation, nothing else.",
    brief: "After the translation, add a 'Notes' section with 2-3 bullet points on key terms.",
    full:  "After the translation, add a 'Commentary' section on meaning, context, and major interpretations.",
  };

  const prompt = `You are an expert translator of classical Jewish texts with deep knowledge of Hebrew, Aramaic, Bible, Talmud, and rabbinic literature.

Translate the following text (reference: ${ref}) ${STYLES[style] || STYLES.readable}.

${ANNOTS[annotation] || ANNOTS.none}

Text:
${hebrewText}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured." });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "Gemini error" });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) return res.status(500).json({ error: "Empty response from Gemini." });

    const notesMatch = text.match(/\n\n(Notes?|Commentary):?\n([\s\S]+)$/i);
    const translation = notesMatch ? text.slice(0, text.indexOf(notesMatch[0])).trim() : text.trim();
    const notes = notesMatch ? notesMatch[0].trim() : "";

    res.status(200).json({ translation, notes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
