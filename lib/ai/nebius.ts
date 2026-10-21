type TextRequest = { instructions: string; prompt: string; maxOutputTokens: number; json?: boolean };

export async function generateText(input: TextRequest) {
  const key = process.env.NEBIUS_API_KEY?.trim();
  const model = process.env.NEBIUS_MODEL?.trim();
  if (!key || !model?.startsWith("nvidia/")) throw new Error("nebius_not_configured");
  const base = process.env.NEBIUS_BASE_URL?.trim() || "https://api.tokenfactory.us-central1.nebius.com/v1";
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: input.instructions }, { role: "user", content: input.prompt }],
      max_tokens: input.maxOutputTokens,
      temperature: 0,
      ...(model === "nvidia/nemotron-3-super-120b-a12b" ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      ...(input.json ? { response_format: { type: "json_object" } } : {})
    }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`nebius_http_${response.status}`);
  const data = await response.json();
  const choice = data.choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string" || !choice.message.content.trim()) {
    throw new Error("incomplete_model_output");
  }
  return { text: choice.message.content as string, model };
}
