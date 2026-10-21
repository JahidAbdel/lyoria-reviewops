"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../workspace/workspace.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/workspace`, shouldCreateUser: false } });
    setMessage(error ? "Sign-in unavailable. Try again." : "Link sent. Open your email to continue.");
    setBusy(false);
  }
  return <main className={styles.centered}>
    <section className={styles.card}>
      <p className={styles.eyebrow}>PRIVATE WORKSPACE</p>
      <h1>Return to saved imports</h1>
      <p>Receive a secure sign-in link by email. Access is limited to the project owner.</p>
      <form onSubmit={submit} className={styles.form}>
        <label>Email address<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
        <button disabled={busy}>{busy ? "Sending…" : "Send sign-in link"}</button>
      </form>
      <p role="status">{message}</p>
      <Link href="/">Back to public demo</Link>
    </section>
  </main>;
}
