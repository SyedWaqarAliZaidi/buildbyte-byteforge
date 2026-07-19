"use client";

import { useState } from "react";

type Match = {
  id: string;
  name: string;
  provider: string;
  region: string;
  fundingType: string;
  deadlineWindow: string;
  officialUrl: string;
  description: string;
  score: number;
  reason: string;
  source: "live" | "curated";
};

const LEVELS = ["Intermediate", "Undergraduate", "Graduate", "PhD"];
const NEED = ["Significant financial need", "Some financial need", "No financial need"];
const GENDER = ["Prefer not to say", "Woman", "Man", "Other"];

export default function Home() {
  const [form, setForm] = useState({
    region: "",
    nationality: "",
    level: "Undergraduate",
    field: "",
    need: NEED[0],
    gender: GENDER[0],
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [matches, setMatches] = useState<Match[]>([]);
  const [mode, setMode] = useState<"live" | "curated" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong.");
        return;
      }
      setMatches(data.matches);
      setMode(data.mode);
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Network error.");
    }
  }

  return (
    <main className="flex-1 bg-paper text-slate">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-data text-xs tracking-[0.2em] text-gold-dim uppercase mb-4">
          A shortlist, not a search engine
        </p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] text-ink mb-5">
          Find funding that already wants you.
        </h1>
        <p className="text-slate/80 text-lg max-w-xl mb-10">
          Fill in your file below. We&apos;ll weigh it against a curated register of
          scholarship and grant programs and hand back a ranked shortlist, with
          the reasoning shown &mdash; not just a match score.
        </p>

        <div className="ledger-rule mb-10" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Country / region of citizenship">
              <input
                required
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                placeholder="e.g. Pakistan"
                className="input"
              />
            </Field>
            <Field label="Where you intend to study">
              <input
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Pakistan, UK, anywhere"
                className="input"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Degree level">
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="input"
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Field of study">
              <input
                required
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                placeholder="e.g. Computer Science"
                className="input"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Financial need">
              <select
                value={form.need}
                onChange={(e) => setForm({ ...form, need: e.target.value })}
                className="input"
              >
                {NEED.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Gender (optional — only used to check gender-specific programs)">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                {GENDER.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Anything else worth knowing (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. first-generation student, work experience, GPA, specific interests..."
              rows={3}
              className="input resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={status === "loading"}
            className="font-data text-sm tracking-wide uppercase bg-ink text-paper px-6 py-3 rounded-sm hover:bg-ink/90 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Cross-referencing your file…" : "Find my matches"}
          </button>

          {status === "error" && (
            <p className="text-sm text-red-700">{errorMsg}</p>
          )}
        </form>

        {status === "done" && (
          <section className="mt-16">
            <div className="ledger-rule mb-8" />
            <h2 className="font-display text-2xl text-ink mb-1">Your shortlist</h2>
            <p className="text-sm text-slate/70 mb-1">
              {matches.length} matching programs, ranked by fit.
            </p>
            <p className="font-data text-xs text-slate/60 mb-8">
              {mode === "live"
                ? "Found via live web search just now."
                : "Curated demo list — live search wasn't available this run."}
            </p>

            <div className="space-y-5">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>

            <p className="font-data text-xs text-slate/60 mt-10 leading-relaxed">
              Demo dataset for BuildByte — deadlines and criteria shift year to
              year. Always confirm current details on each program&apos;s official
              site before applying.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-data uppercase tracking-wide text-slate/60 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function MatchCard({ match }: { match: Match }) {
  const scoreColor =
    match.score >= 70 ? "var(--success)" : match.score >= 40 ? "var(--gold)" : "var(--slate)";

  return (
    <article className="border border-rule bg-white/40 rounded-sm p-6 flex gap-6">
      <div
        className="shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center serif-num font-display text-xl"
        style={{ borderColor: scoreColor, color: scoreColor }}
        aria-label={`Match score ${match.score} out of 100`}
      >
        {match.score}
      </div>
        <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl text-ink">{match.name}</h3>
          <span
            className="font-data text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              color: match.source === "live" ? "var(--success)" : "var(--gold-dim)",
              border: `1px solid ${match.source === "live" ? "var(--success)" : "var(--gold-dim)"}`,
            }}
          >
            {match.source === "live" ? "Live" : "Curated"}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mt-1">
          <p className="text-sm text-slate/70">
            {match.provider} &middot; {match.region} &middot; {match.fundingType}
          </p>
          <span className="font-data text-xs text-slate/60">{match.officialUrl}</span>
        </div>
        <p className="text-sm leading-relaxed mb-3">{match.reason}</p>
        <p className="font-data text-xs text-slate/60">
          Typical window: {match.deadlineWindow}
        </p>
      </div>
    </article>
  );
}
