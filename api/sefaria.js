export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const ref = req.query.ref;
  if (!ref) return res.status(400).json({ error: "Missing ref" });

  try {
    const url = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
