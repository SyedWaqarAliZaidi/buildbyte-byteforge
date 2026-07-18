import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import scholarships from "@/data/scholarships.json";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY on the server." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const system = `You are a careful scholarship-eligibility analyst. You are given a student profile and a JSON list of scholarships. For each scholarship, decide whether the student is a plausible fit, and produce a match score from 0-100.

Rules:
- Only use the scholarships provided. Never invent a scholarship that isn't in the list.
- Weigh: region/nationality fit, degree level fit, field of study fit, and financial-need fit most heavily.
- Be honest: if a student clearly doesn't meet a hard requirement (e.g. wrong region, wrong degree level), score it low (below 30) rather than being generous.
- Return ONLY valid JSON, no markdown fences, no commentary, matching this exact shape:
{
  "matches": [
    {
      "id": "scholarship-id-from-list",
      "score": 0-100,
      "reason": "One or two plain-English sentences on why this student fits or doesn't, referencing specifics from their profile."
    }
  ]
}
Include every scholarship from the list, sorted by score descending.`;

    const userMessage = `Student profile:\n${JSON.stringify(profile, null, 2)}\n\nScholarship list:\n${JSON.stringify(scholarships, null, 2)}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: { matches: { id: string; score: number; reason: string }[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Could not parse model response." },
        { status: 502 }
      );
    }

    const byId = new Map(scholarships.map((s) => [s.id, s]));
    const enriched = parsed.matches
      .map((m) => {
        const scholarship = byId.get(m.id);
        if (!scholarship) return null;
        return { ...scholarship, score: m.score, reason: m.reason };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json({ matches: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
