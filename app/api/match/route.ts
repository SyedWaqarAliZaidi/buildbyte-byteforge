import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import scholarships from "@/data/scholarships.json";

export const runtime = "nodejs";

type RawMatch = {
  id?: string;
  name: string;
  provider: string;
  region: string;
  fundingType: string;
  deadlineWindow: string;
  officialUrl: string;
  description: string;
  score: number;
  reason: string;
};

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Path A: real-time results via Gemini's Google Search grounding tool.
// Only succeeds if the API key's tier has grounding enabled.
async function tryLiveSearch(ai: GoogleGenAI, profile: any): Promise<RawMatch[]> {
  const prompt = `You are a scholarship research assistant with live Google Search access.

Student profile:
${JSON.stringify(profile, null, 2)}

Search the web right now and find up to 8 real, currently-active scholarship or grant
programs this student plausibly qualifies for. Only include programs you found actual
evidence for through search - never invent one. Weigh nationality/region fit, degree
level fit, field of study fit, and financial-need fit most heavily. Score honestly:
below 30 if a hard requirement (region, degree level) clearly isn't met.

Respond with ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{
  "matches": [
    {
      "name": "Program name",
      "provider": "Who runs it",
      "region": "Region/nationality scope",
      "fundingType": "e.g. Full tuition + stipend",
      "deadlineWindow": "Typical application window",
      "officialUrl": "official domain, e.g. hec.gov.pk",
      "description": "One sentence on what it covers",
      "score": 0-100,
      "reason": "One or two sentences on why this student fits or doesn't"
    }
  ]
}
Sort by score descending.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = response.text ?? "";
  const parsed = parseJson(text);
  if (!parsed?.matches || !Array.isArray(parsed.matches) || parsed.matches.length === 0) {
    throw new Error("No live matches returned");
  }
  return parsed.matches;
}

// Path B: fallback - match against our curated local dataset, no live search needed.
// Runs whenever live search fails (quota, billing tier, network, bad parse, etc).
async function curatedMatch(ai: GoogleGenAI, profile: any): Promise<RawMatch[]> {
  const system = `You are a careful scholarship-eligibility analyst. You are given a
student profile and a JSON list of scholarships. Score each 0-100 on fit. Weigh
region/nationality, degree level, field of study, and financial need most heavily.
Be honest - score below 30 if a hard requirement clearly isn't met. Respond with ONLY
valid JSON, no markdown fences:
{ "matches": [ { "id": "scholarship-id-from-list", "score": 0-100, "reason": "one or two sentences" } ] }
Include every scholarship from the list, sorted by score descending.`;

  const prompt = `${system}\n\nStudent profile:\n${JSON.stringify(profile, null, 2)}\n\nScholarship list:\n${JSON.stringify(scholarships, null, 2)}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text ?? "{}";
  const parsed = parseJson(text);
  const byId = new Map(scholarships.map((s) => [s.id, s]));

  return parsed.matches
    .map((m: { id: string; score: number; reason: string }) => {
      const s = byId.get(m.id);
      if (!s) return null;
      return {
        name: s.name,
        provider: s.provider,
        region: s.region,
        fundingType: s.fundingType,
        deadlineWindow: s.deadlineWindow,
        officialUrl: s.officialUrl,
        description: s.description,
        score: m.score,
        reason: m.reason,
      } as RawMatch;
    })
    .filter((m: RawMatch | null): m is RawMatch => m !== null)
    .sort((a: RawMatch, b: RawMatch) => b.score - a.score);
}

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let raw: RawMatch[];
    let mode: "live" | "curated";
    try {
      raw = await tryLiveSearch(ai, profile);
      mode = "live";
    } catch {
      raw = await curatedMatch(ai, profile);
      mode = "curated";
    }

    const matches = raw.map((m) => ({
      id: m.id ?? slugify(m.name),
      ...m,
      source: mode,
    }));

    return NextResponse.json({ matches, mode });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
