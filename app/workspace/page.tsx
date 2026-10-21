import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Workspace } from "./workspace";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: restaurant }, { data: imports }] = await Promise.all([
    supabase.from("restaurants").select("name,facts,reply_tone").maybeSingle(),
    supabase.from("review_imports").select("id,label,source,period_start,period_end,created_at,reviews(count)").order("created_at", { ascending: false })
  ]);
  return <Workspace email={user.email ?? ""} restaurant={restaurant} initialImports={imports ?? []} />;
}
