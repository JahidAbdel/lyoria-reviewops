"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { parseCsvReviews, parseDatedPastedReviews, parseReviewImport } from "@/lib/reviews/import";
import { AnalysisPanel, type AnalysisView } from "./analysis-panel";
import styles from "./workspace.module.css";

type ImportRow = { id: string; label: string; source: string; period_start: string; period_end: string; created_at: string; reviews: { count: number }[] };
type Restaurant = { name: string; facts: string; reply_tone: string } | null;
const example = "2026-10-01 | 5 | Warm welcome and delicious food.\n2026-10-03 | 2 | The service was too slow that evening.";

export function Workspace({ email, restaurant, initialImports }: { email: string; restaurant: Restaurant; initialImports: ImportRow[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(restaurant?.name ?? ""), [facts, setFacts] = useState(restaurant?.facts ?? ""), [tone, setTone] = useState(restaurant?.reply_tone ?? "warm");
  const [label, setLabel] = useState(""), [source, setSource] = useState<"paste" | "csv" | "example">("paste"), [content, setContent] = useState("");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null), [selectedImport, setSelectedImport] = useState("");
  async function loadAnalysis(id: string, reveal = true) {
    setBusy(true); setMessage("Loading saved analysis…");
    const response = await fetch(`/api/imports/${id}/analysis`), result = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(result.error || "Result unavailable."); return; }
    setSelectedImport(id); setAnalysis(result); setMessage("");
    if (reveal) requestAnimationFrame(() => document.getElementById("saved-analysis")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const reviews = source === "csv" ? parseCsvReviews(content) : parseDatedPastedReviews(content);
      const input = parseReviewImport({ restaurant: { name, facts, replyTone: tone }, label, source, reviews });
      const response = await fetch("/api/imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not import reviews.");
      setLabel(""); setContent(""); if (fileInput.current) fileInput.current.value = ""; setMessage("Import saved."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import reviews."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/imports/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Import deleted." : "Could not delete import.");
    setBusy(false); if (response.ok) { if (selectedImport === id) { setAnalysis(null); setSelectedImport(""); } router.refresh(); }
  }
  async function analyze(id: string) {
    setBusy(true); setMessage("NVIDIA analysis in progress…");
    const response = await fetch(`/api/imports/${id}/analyze`, { method: "POST" });
    const result = await response.json();
    setMessage(response.ok ? `Analysis saved with ${result.model}.` : result.error || "Analysis unavailable.");
    setBusy(false); if (response.ok) { router.refresh(); await loadAnalysis(id); }
  }
  async function signOut() { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }
  return <main className={styles.shell}>
    <header className={styles.header}><div><p className={styles.eyebrow}>LYORIA REVIEWOPS</p><h1>Review imports</h1><small>{email}</small></div><div className={styles.actions}><Link href="/">Public demo</Link><button className={styles.quiet} onClick={signOut}>Sign out</button></div></header>
    <div className={styles.columns}>
      <section className={styles.card}><h2>New import</h2><p>Add a date, rating, and text for each review.</p>
        <form onSubmit={submit} className={styles.form}>
          <label>Restaurant<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
          <label>Verified business facts<textarea rows={3} maxLength={6000} value={facts} onChange={event => setFacts(event.target.value)} /></label>
          <label>Reply tone<select value={tone} onChange={event => setTone(event.target.value)}><option value="warm">Warm</option><option value="formal">Formal</option><option value="concise">Concise</option></select></label>
          <label>Import name<input required maxLength={120} placeholder="October reviews" value={label} onChange={event => setLabel(event.target.value)} /></label>
          <label>Format<select value={source} onChange={event => setSource(event.target.value as typeof source)}><option value="paste">Pasted text</option><option value="csv">CSV file</option><option value="example">Fictional example</option></select></label>
          {source === "csv" && <label>CSV file<input ref={fileInput} required type="file" accept=".csv,text/csv" onChange={async event => setContent(await event.target.files?.[0]?.text() ?? "")} /></label>}
          {source !== "csv" && <label>Reviews<textarea required rows={7} value={content} onChange={event => setContent(event.target.value)} placeholder="2026-10-01 | 4 | Review text" /></label>}
          {source === "example" && <button type="button" className={styles.quiet} onClick={() => { setContent(example); setLabel("October example"); }}>Load example</button>}
          <small>Maximum 15 reviews and 500 KB. CSV columns: date, rating, text; id and language are optional.</small>
          <button disabled={busy}>{busy ? "Saving…" : "Save import"}</button>
        </form><p role="status">{message}</p>
      </section>
      <section className={styles.card}><h2>Saved imports</h2>
        {initialImports.length === 0 ? <p>No saved imports yet.</p> : <ul className={styles.list}>{initialImports.map(item => <li key={item.id}><div><strong>{item.label}</strong><span>{item.period_start} → {item.period_end} · {item.reviews[0]?.count ?? 0} reviews · {item.source}</span></div><span className={styles.rowActions}><button disabled={busy} onClick={() => analyze(item.id)}>Analyze</button><button disabled={busy} className={styles.quiet} onClick={() => loadAnalysis(item.id)}>View</button><button disabled={busy} className={styles.danger} onClick={() => remove(item.id)}>Delete</button></span></li>)}</ul>}
      </section>
    </div>
    {analysis && <AnalysisPanel data={analysis} reload={() => loadAnalysis(selectedImport, false)} />}
  </main>;
}
