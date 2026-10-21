"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, Check, CheckCheck, ClipboardList, Copy, FileText, Leaf, MessageSquare, ShieldCheck, Sparkles, Star, Store, Target, TrendingDown, TriangleAlert } from "lucide-react";
import { LyoriaLogo } from "./lyoria-logo";
import { parseAnalysis, parseInput, parsePastedReviews, type Analysis, type Review } from "@/lib/ai/analysis";
import { exampleInput, exampleAnalysis, exampleImpact } from "@/lib/ai/demo";
import { compareTheme } from "@/lib/impact/comparison";
import styles from "./review-demo.module.css";

const exampleReviews = exampleInput.reviews.map(r => `${r.rating} | ${r.text}`).join("\n");
const exampleComparison = compareTheme({ baselineCount: exampleImpact.baseline.count, baselineSample: exampleImpact.baseline.sample, afterCount: exampleImpact.after.count, afterSample: exampleImpact.after.sample });
export function ReviewDemo() {
  const [name, setName] = useState("");
  const [facts, setFacts] = useState("");
  const [pasted, setPasted] = useState("");
  const [code, setCode] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sources, setSources] = useState<Review[]>([]);
  const [approved, setApproved] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [provenance, setProvenance] = useState("Fictional example · prepared result · no AI call");
  function invalidate() { setAnalysis(null); setApproved([]); setConfirmed([]); setMessage(""); }
  function loadExample() {
    setName(exampleInput.name); setFacts(exampleInput.facts); setPasted(exampleReviews);
    setSources(exampleInput.reviews); setAnalysis(exampleAnalysis); setApproved([]); setConfirmed([]);
    setProvenance("Fictional example · prepared result · no AI call"); setMessage("");
  }
  async function analyze(event: React.FormEvent) {
    event.preventDefault(); invalidate(); setBusy(true);
    try {
      const input = parseInput({ name, facts, reviews: parsePastedReviews(pasted) });
      const response = await fetch("/api/demo/analyze", {
        method: "POST", headers: { "Content-Type": "application/json", "x-lyoria-access": code },
        body: JSON.stringify(input)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis unavailable.");
      setAnalysis(parseAnalysis(result.analysis, input)); setSources(input.reviews);
      setProvenance(`Live analysis · Nebius · ${result.model} · ${(result.durationMs / 1000).toFixed(1)} s`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Analysis unavailable."); }
    finally { setBusy(false); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Reply copied. Nothing was published."); }
    catch { setMessage("Copy unavailable. Select the text manually."); }
  }
  const average = analysis ? (sources.reduce((sum, review) => sum + review.rating, 0) / sources.length).toFixed(1) : "—";
  const issues = analysis?.insights.filter(item => item.kind === "issue").length;
  return <div className={styles.page}>
    <a className={styles.skip} href="#workspace">Skip to content</a>
    <aside className={styles.sidebar}>
      <LyoriaLogo className={styles.logo} priority />
      <div className={styles.workspaceLabel}><span className={styles.storeIcon}><Store size={19} aria-hidden="true" /></span><div><strong>My restaurant</strong><small>Demo workspace</small></div></div>
      <p className={styles.navLabel}>WORKSPACE</p>
      <nav aria-label="Demo navigation">
        <a href="#workspace" className={styles.navPrimary}><BarChart3 size={18} aria-hidden="true" />Overview</a>
        <a href="#import"><ClipboardList size={18} aria-hidden="true" />Reviews</a>
        <a href="#replies"><MessageSquare size={18} aria-hidden="true" />Replies to approve{analysis && <span>{analysis.replies.length - approved.length}</span>}</a>
        {analysis && provenance.startsWith("Fictional example") && <a href="#impact"><TrendingDown size={18} aria-hidden="true" />Impact</a>}
      </nav>
      <a className={styles.clientLink} href="/workspace">Open saved imports <ArrowRight size={15} aria-hidden="true" /></a>
      <div className={styles.sidebarNote}><ShieldCheck size={23} aria-hidden="true" /><strong>You stay in control.</strong><p>Lyoria suggests. You review and approve every reply.</p></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><span>My restaurant <span className={styles.slash}>/</span> <strong>Overview</strong></span><span className={styles.demoBadge}><span />Interactive demo</span></header>
      <main className={styles.content} id="workspace">
        <div className={styles.heading}><div><p className={styles.eyebrow}>CUSTOMER SIGNALS</p><h1>Turn reviews into better decisions.</h1><p>See what matters to customers, decide what to improve, and draft grounded replies.</p></div><button type="button" className={styles.secondary} disabled={busy} onClick={loadExample}><FileText size={16} aria-hidden="true" />Load example</button></div>
        <div className={styles.exampleNotice}><Leaf size={18} aria-hidden="true" /><p><strong>90-second jury path</strong> · {analysis ? provenance : "Ready for a new analysis"}</p><span>Human approval</span></div>
        <div className={styles.metrics} aria-label="Review metrics">
          <div><span><MessageSquare size={17} aria-hidden="true" />Reviews analyzed</span><strong>{analysis ? sources.length.toString().padStart(2, "0") : "—"}</strong><small>In this import</small></div>
          <div><span><Star size={17} aria-hidden="true" />Average rating</span><strong>{average}<em> / 5</em></strong><small>From imported reviews</small></div>
          <div><span><TriangleAlert size={17} aria-hidden="true" />Improvement areas</span><strong>{issues === undefined ? "—" : issues.toString().padStart(2, "0")}</strong><small>Review with your team</small></div>
          <div><span><CheckCheck size={17} aria-hidden="true" />Approved replies</span><strong>{approved.length.toString().padStart(2, "0")}<em> / {analysis?.replies.length ?? 0}</em></strong><small>In this session</small></div>
        </div>
        <div className={styles.grid}>
      <form className={`${styles.panel} ${styles.importPanel}`} id="import" onSubmit={analyze}>
        <div className={styles.sectionTitle}><span className={styles.step}>01</span><div><h2>Start with evidence</h2><p>Business context keeps replies grounded.</p></div></div>
        <fieldset disabled={busy}>
          <label>Restaurant name<input required maxLength={120} value={name} onChange={e => { setName(e.target.value); invalidate(); }} /></label>
          <label>Verified business facts<textarea rows={3} maxLength={6000} value={facts} onChange={e => { setFacts(e.target.value); invalidate(); }} /></label>
          <label>Customer reviews<textarea required rows={6} placeholder={"5 | Great food and friendly service.\n2 | We waited too long for our order."} value={pasted} onChange={e => { setPasted(e.target.value); invalidate(); }} aria-describedby="review-format" /></label>
          <small id="review-format">1–15 reviews. One per line: 4 | Review text. Use fictional or anonymized data.</small>
          <label>Live analysis access code<input type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} /></label>
          <button type="submit" className={styles.analyzeButton}><Sparkles size={17} aria-hidden="true" />{busy ? "Analyzing…" : "Analyze reviews"}<ArrowRight size={17} aria-hidden="true" /></button>

        </fieldset>
        <small className={styles.privacy}><ShieldCheck size={15} aria-hidden="true" />Two analyses per minute and twenty per day. Text is sent to Nebius and is not saved here. The fictional example uses no AI call.</small>
      </form>
      <section aria-busy={busy} aria-label="Results">
        <p role="status" className={styles.status}>{message || (busy ? "Finding themes and verifying citations…" : "")}</p>
        {analysis ? <>
          <div className={styles.sectionTitle}><span className={styles.step}>02</span><div><h2>What the reviews reveal</h2><p>Every finding starts with customer evidence.</p></div></div>
          {analysis.insights.length === 0 && <p>No finding was proposed for these reviews.</p>}
          {analysis.insights.map((item, i) => <article className={`${styles.panel} ${styles.insight}`} key={i}>
            <div className={styles.insightMeta}><span className={item.kind === "issue" ? styles.warningBadge : styles.positiveBadge}>{item.kind === "issue" ? <TriangleAlert size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{item.kind === "issue" ? "Needs attention" : "Strength"}</span><small>{item.evidence.length} reviews cited out of {sources.length}</small></div>
            <h3>{item.title}</h3><p className={styles.action}>{item.action}</p>
            {item.evidence.map(source => <details key={source.reviewId}><summary>{source.reviewId} — « {source.quote} »</summary><p>{sources.find(r => r.id === source.reviewId)?.text}</p></details>)}
          </article>)}
          <div className={styles.sectionTitle} id="replies"><span className={styles.step}>03</span><div><h2>Grounded replies, approved by you</h2><p>Review facts and tone before approval.</p></div></div>
          {analysis.replies.map(reply => <article className={styles.panel} key={reply.reviewId}>
            <div className={styles.replyHeader}><span className={styles.avatar}>{reply.reviewId}</span><div><h3>Review {reply.reviewId}</h3><span className={styles.rating}><Star size={13} aria-hidden="true" />{sources.find(r => r.id === reply.reviewId)?.rating}/5</span></div><span className={approved.includes(reply.reviewId) ? styles.positiveBadge : styles.draftBadge}>{approved.includes(reply.reviewId) ? "Approved" : "Draft to review"}</span></div>
            <blockquote>{sources.find(r => r.id === reply.reviewId)?.text}</blockquote>
            {reply.factQuotes.length > 0 && <p><strong>Business fact used:</strong> {reply.factQuotes.join(" · ")}</p>}
            <label>Suggested reply<textarea rows={5} maxLength={1800} value={reply.text} onChange={e => {
              setAnalysis({ ...analysis, replies: analysis.replies.map(r => r.reviewId === reply.reviewId ? { ...r, text: e.target.value } : r) });
              setApproved(approved.filter(id => id !== reply.reviewId)); setConfirmed(confirmed.filter(id => id !== reply.reviewId));
            }} /></label>
            {reply.question && <div className={styles.question}><p><strong>Verify first:</strong> {reply.question}</p><label className={styles.check}><input type="checkbox" checked={confirmed.includes(reply.reviewId)} onChange={e => { setConfirmed(e.target.checked ? [...confirmed, reply.reviewId] : confirmed.filter(id => id !== reply.reviewId)); setApproved(approved.filter(id => id !== reply.reviewId)); }} />I verified this information and edited the draft if needed.</label></div>}
            <div className={styles.replyActions}><button type="button" disabled={!reply.text.trim() || (!!reply.question && !confirmed.includes(reply.reviewId)) || approved.includes(reply.reviewId)} onClick={() => setApproved([...approved, reply.reviewId])}><Check size={16} aria-hidden="true" />{approved.includes(reply.reviewId) ? "Approved for this session" : "Approve after review"}</button>
            <button type="button" className={styles.secondary} disabled={!approved.includes(reply.reviewId) || (!!reply.question && !confirmed.includes(reply.reviewId))} onClick={() => copy(reply.text)}><Copy size={15} aria-hidden="true" />Copy reply</button></div>
          </article>)}
          <small>Approval is local to this session. Reloading clears edits. Nothing is published automatically.</small>
          {provenance.startsWith("Fictional example") && <>
            <div className={styles.sectionTitle} id="impact"><span className={styles.step}>04</span><div><h2>Turn insight into measurable impact</h2><p>Compare the same issue across two review periods.</p></div></div>
            <article className={`${styles.panel} ${styles.impactDemo}`}>
              <div className={styles.impactAction}><span className={styles.positiveBadge}><Target size={14} aria-hidden="true" />Completed action</span><h3>{exampleImpact.action}</h3><p>{exampleImpact.target}</p></div>
              <div className={styles.impactOutcome}><span className={styles.positiveBadge}><TrendingDown size={14} aria-hidden="true" />Observed improvement</span><div className={styles.periods}>
                <div><small>Baseline · {exampleImpact.baseline.period}</small><strong>{exampleImpact.baseline.count}/{exampleImpact.baseline.sample}</strong><span>{Math.round(exampleComparison.baselineRate * 100)}% wait mentions</span></div>
                <ArrowRight size={18} aria-hidden="true" />
                <div><small>Follow-up · {exampleImpact.after.period}</small><strong>{exampleImpact.after.count}/{exampleImpact.after.sample}</strong><span>{Math.round(exampleComparison.afterRate * 100)}% wait mentions</span></div>
              </div><p className={styles.delta}>{exampleComparison.deltaPercentagePoints} percentage points</p></div>
              <div className={styles.impactNotes}><small>Matched theme: {exampleImpact.matchedTheme} · {Math.round(exampleImpact.matchConfidence * 100)}% similarity</small><small>Small samples: treat this result as a signal to investigate.</small><small>This is an observed association, not proof that the action caused the change.</small></div>
            </article>
          </>}
        </> : <div className={`${styles.panel} ${styles.empty}`} id="replies"><Sparkles size={32} aria-hidden="true" /><h2>{busy ? "Turning reviews into evidence…" : "Every review is a signal."}</h2><p>{busy ? "Preparing findings, sources, and drafts." : "Add reviews and run the analysis to find grounded actions."}</p></div>}
      </section>
    </div>
    <footer className={styles.footer}><span>Lyoria</span><span>Your decisions. Your voice.</span></footer>
    </main></div>
  </div>;
}
