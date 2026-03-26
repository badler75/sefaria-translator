# ✡ Sefaria AI Translator

Translate any Jewish text from Sefaria.org into English using Claude AI.

## Deploy to Vercel in 5 minutes

### Step 1 — Put the code on GitHub
1. Go to [github.com](https://github.com) and create a free account if you don't have one
2. Click **New repository**, name it `sefaria-translator`, click **Create**
3. Upload all the files from this zip into the repo

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New → Project** and select your `sefaria-translator` repo
3. Click **Deploy** — Vercel auto-detects everything, no config needed

### Step 3 — Add your Gemini API key (free, no credit card needed)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account
2. Click **Create API key** — takes 30 seconds, no credit card required
3. In your Vercel project → **Settings → Environment Variables**
4. Add variable: `GEMINI_API_KEY` = your key
5. Go to **Deployments** → click **Redeploy**

Your app is now live at a public URL. Share it with anyone!

---

## How it works

```
Browser → /api/sefaria   → sefaria.org   (fetches Hebrew/Aramaic text)
Browser → /api/translate → Gemini API    (translates with Gemini 2.5 Flash, free tier)
```

The `/api/` folder contains two Vercel serverless functions that run server-side,
avoiding browser CORS restrictions entirely.

## Reference format examples

| Text       | Reference                                  |
|------------|--------------------------------------------|
| Talmud     | `Berakhot 2a`, `Shabbat 31a`               |
| Torah      | `Genesis 1:1`, `Deuteronomy 6:4`           |
| Mishnah    | `Pirkei Avot 1:1`                          |
| Rashi      | `Rashi on Genesis 1:1`                     |
| Rambam     | `Mishneh Torah, Laws of Teshuvah 1:1`      |
| Other      | `Kuzari 1:1`                               |

## Running locally

```bash
npm install -g vercel
vercel dev
# Set GEMINI_API_KEY in a .env.local file
```
