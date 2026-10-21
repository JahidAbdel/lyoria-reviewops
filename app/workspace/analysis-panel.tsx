"use client";

import { useState } from "react";
import styles from "./workspace.module.css";

type Action = { id: string; title: string; status: string; target_description: string; baseline_value: number | null; target_value: number | null; starts_on: string | null };
type Impact = { ready: boolean; message?: string; movement?: "improving" | "stable" | "worsening"; baseline?: { count: number; sample: number; periodStart: string; periodEnd: string }; after?: { label: string; count: number; sample: number; periodStart: string; periodEnd: string }; baselineRate?: number; afterRate?: number; deltaPercentagePoints?: number; matchedTheme?: string | null; matchConfidence?: number; sampleWarning?: string; caveat?: string };
type Theme = { id: string; title: string; kind: string; suggested_action: string; evidence: unknown; frequency_count: number; severity: number; confidence: number; priority_score: number; actions: Action[] };
type Reply = { id: string; content: string; verification_question: string; status: string; reviews: { external_id: string; rating: number; text: string } | null };
export type AnalysisView = { run: { model: string | null; duration_ms: number | null }; themes: Theme[]; replies: Reply[] };

export function AnalysisPanel({ data, reload }: { data: AnalysisView; reload: () => Promise<void> }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({}), [confirmed, setConfirmed] = useState<string[]>([]);
  const [impacts, setImpacts] = useState<Record<string, Impact>>({});
  async function createAction(theme: Theme) {
    setBusy(true); const target = Math.max(0, Math.floor(theme.frequency_count * .75));
    const response = await fetch(`/api/themes/${theme.id}/actions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: theme.suggested_action, targetDescription: "Reduce this theme frequency by at least 25% in the next import.", baselineValue: theme.frequency_count, targetValue: target }) });
    setMessage(response.ok ? "Action created." : "Could not create action."); setBusy(false); if (response.ok) await reload();
  }
  async function updateAction(id: string, status: string) {
    setBusy(true); const response = await fetch(`/api/actions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setMessage(response.ok ? "Action updated." : "Could not update action."); setBusy(false); if (response.ok) await reload();
  }
  async function compare(id: string) {
    setBusy(true); const response = await fetch(`/api/actions/${id}/impact`), result = await response.json();
    setBusy(false); if (response.ok) setImpacts({ ...impacts, [id]: result }); else setMessage(result.error || "Could not compare periods.");
  }
  async function approve(reply: Reply) {
    setBusy(true); const response = await fetch(`/api/replies/${reply.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: drafts[reply.id] ?? reply.content, confirmed: confirmed.includes(reply.id) }) });
    const result = await response.json(); setMessage(response.ok ? "Reply approved." : result.error || "Could not approve reply."); setBusy(false); if (response.ok) await reload();
  }
  async function copy(value: string) { await navigator.clipboard.writeText(value); setMessage("Reply copied. Nothing was published."); }
  const contentTheme = data.themes.find(theme => theme.kind === "strength");
  return <section id="saved-analysis" className={`${styles.card} ${styles.analysis}`} aria-busy={busy}><div className={styles.analysisHeader}><div><p className={styles.eyebrow}>EVIDENCE MAP</p><h2>Saved analysis</h2></div><small>Grounding validated · {data.run.model} · {((data.run.duration_ms ?? 0) / 1000).toFixed(1)} s</small></div>
    <p className={styles.formula}>Priority: 50% frequency, 35% severity, and 15% recency. It helps rank findings; it does not replace judgment.</p>
    <p role="status">{message}</p>
    <div className={styles.themeGrid}>{data.themes.map(theme => <article className={styles.theme} key={theme.id}><div className={styles.score}>{theme.priority_score}</div><div><span className={styles.tag}>{theme.kind === "issue" ? "Needs attention" : "Strength"}</span><h3>{theme.title}</h3><p>{theme.suggested_action}</p><small>{theme.frequency_count} evidence item(s) · severity {theme.severity}/5 · confidence {Math.round(theme.confidence * 100)} %</small>
      <details><summary>View exact quotes</summary><ul>{Array.isArray(theme.evidence) && theme.evidence.map((evidence, index) => { const item = evidence as { reviewId?: string; quote?: string }; return <li key={index}><strong>{item.reviewId}</strong> — “{item.quote}”</li>; })}</ul></details>
      {theme.actions.length === 0 ? theme.kind === "issue" && <button disabled={busy} onClick={() => createAction(theme)}>Create measurable action</button> : theme.actions.map(action => <div className={styles.actionCard} key={action.id}><strong>{action.title}</strong><span>{action.target_description} ({action.baseline_value} → {action.target_value})</span><select disabled={busy} value={action.status} onChange={event => updateAction(action.id, event.target.value)}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="dismissed">Dismissed</option></select><small><strong>Next step:</strong> import and analyze reviews from a later period, then check whether this issue appears less often.</small><button disabled={busy} onClick={() => compare(action.id)}>Check progress with later reviews</button>{impacts[action.id] && <ImpactResult impact={impacts[action.id]} />}</div>)}</div></article>)}</div>
    {contentTheme && <div className={styles.contentIdea}><p className={styles.eyebrow}>CONTENT IDEA</p><h2>Highlight “{contentTheme.title}”</h2><p>Prepare a post from this strength mentioned in {contentTheme.frequency_count} reviews. Verify context and facts before publishing.</p></div>}
    <h2>Replies to approve</h2><div className={styles.replyList}>{data.replies.map(reply => <article className={styles.theme} key={reply.id}><strong>Review {reply.reviews?.external_id} · {reply.reviews?.rating}/5</strong><blockquote>{reply.reviews?.text}</blockquote><textarea disabled={reply.status === "approved"} rows={4} value={drafts[reply.id] ?? reply.content} onChange={event => setDrafts({ ...drafts, [reply.id]: event.target.value })} />{reply.verification_question && reply.status !== "approved" && <label className={styles.confirm}><input type="checkbox" checked={confirmed.includes(reply.id)} onChange={event => setConfirmed(event.target.checked ? [...confirmed, reply.id] : confirmed.filter(id => id !== reply.id))} />I verified: {reply.verification_question}</label>}<button disabled={busy || reply.status === "approved"} onClick={() => approve(reply)}>{reply.status === "approved" ? "Approved" : "Approve after review"}</button>{reply.status === "approved" && <button className={styles.quiet} onClick={() => copy(reply.content)}>Copy</button>}</article>)}</div>
  </section>;
}

function ImpactResult({ impact }: { impact: Impact }) {
  if (!impact.ready) return <div className={styles.impact}><strong>Comparison not ready</strong><span>{impact.message}</span><small>The later import must start after this analysis period and must be analyzed first.</small></div>;
  const labels = { improving: "Observed improvement", stable: "Stable", worsening: "Observed decline" };
  const change = impact.deltaPercentagePoints === 0 ? "No percentage-point change" : `${Math.abs(impact.deltaPercentagePoints!)} percentage points ${impact.deltaPercentagePoints! < 0 ? "fewer" : "more"}`;
  return <div className={styles.impact}><strong>{labels[impact.movement!]}</strong><span><b>Before:</b> {impact.baseline!.count} of {impact.baseline!.sample} reviews ({Math.round(impact.baselineRate! * 100)}%) · {impact.baseline!.periodStart} → {impact.baseline!.periodEnd}</span><span><b>After:</b> {impact.after!.count} of {impact.after!.sample} reviews ({Math.round(impact.afterRate! * 100)}%) · {impact.after!.periodStart} → {impact.after!.periodEnd}</span><span><b>Change:</b> {change}</span>{impact.matchedTheme && <small>Matched finding: {impact.matchedTheme} · {Math.round((impact.matchConfidence ?? 0) * 100)}% similarity</small>}<small>{impact.sampleWarning}</small><small>{impact.caveat}</small></div>;
}
