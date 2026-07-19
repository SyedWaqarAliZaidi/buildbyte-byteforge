# ScholarFind

**Team:** ByteForge
**Members:** Syed Waqar Ali Zaidi (solo)

Built for **BuildByte** (IEEE SB NED), 18-19 July 2026.

## The problem

Scholarship and grant listings are scattered across dozens of government,
university, and foundation websites, each with different eligibility rules.
Students don't have a bad problem set - they have a bad *search* problem.
Most give up after checking two or three sites and miss funding they
actually qualify for.

## What it does

ScholarFind takes a short profile (citizenship, study destination, degree
level, field, financial need, optional gender) and finds scholarship and
grant programs it plausibly qualifies for.

It tries two paths, in order:

1. **Live search** - Gemini's Google Search grounding tool searches the web
   in real time and returns currently-active programs it found evidence
   for, with a ranked score and plain-English reasoning per program.
2. **Curated fallback** - if live search isn't available on the API key's
   tier (or fails for any reason), the app instead scores the profile
   against a curated local list of ~24 real Pakistani and international
   scholarship programs (`data/scholarships.json`).

Every result on screen is labeled **Live** or **Curated** so it's always
clear which path produced it.

## Tech stack

- **Next.js 16 (App Router) + TypeScript** - frontend & API route
- **Tailwind CSS v4** - styling
- **Gemini API (`gemini-2.5-flash`, with Google Search grounding)** - the matching/reasoning engine
- **Vercel** - deployment
- Curated JSON dataset of ~24 real scholarship/grant programs as fallback (`data/scholarships.json`)

## Live demo

[ADD YOUR DEPLOYED VERCEL URL HERE]

## Running locally

```bash
npm install
cp .env.example .env.local   # then paste your own free Gemini API key
npm run dev
```

Open http://localhost:3000

### Environment variables

| Variable | Where to get it | Required |
|---|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey (free, no card) | Yes |

## Notes for judges

- No paid API key is required to run or judge this project - Gemini's free
  tier covers `gemini-2.5-flash`.
- Live web search grounding may fall back to the curated list depending on
  the key's tier/quota; the UI always discloses which path served each
  result, so nothing is presented as more current than it is.
- The one thing we optimized for: an honest, explainable match - the model
  is explicitly instructed to score low rather than be generous when a hard
  requirement (region, degree level) isn't met.
