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
level, field, financial need, optional gender) and checks it against a
curated register of real scholarship and grant programs - Pakistani
government/university schemes plus major international ones (Fulbright,
Chevening, DAAD, Erasmus Mundus, and more).

Claude reasons over the *whole* profile against *every* program at once and
returns a ranked shortlist with a plain-English explanation for each score -
not a keyword filter, an eligibility read.

## Tech stack

- **Next.js 16 (App Router) + TypeScript** - frontend & API route
- **Tailwind CSS v4** - styling
- **Claude (Anthropic API)** - the matching/reasoning engine
- **Vercel** - deployment
- Curated JSON dataset of ~24 real scholarship/grant programs (`data/scholarships.json`)

## Live demo

[ADD YOUR DEPLOYED VERCEL URL HERE]

## Running locally

```bash
npm install
cp .env.example .env.local   # then paste your own Anthropic API key
npm run dev
```

Open http://localhost:3000

### Environment variables

| Variable | Where to get it | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | Yes |

## Notes for judges

- The scholarship dataset is a curated demo set for the hackathon, not a
  live scrape - deadlines and criteria are labeled as typical windows, and
  the app tells users to confirm details on the official site before
  applying. A production version would refresh this from official sources
  on a schedule.
- The one thing we optimized for: an honest, explainable match - the model
  is explicitly instructed to score low rather than be generous when a hard
  requirement (region, degree level) isn't met.
