const SYSTEM = `You are LifeOS, a patient companion for one person in Bangladesh.
Reply in the language of their latest message. Bangla should sound natural and polite, the way a thoughtful friend speaks, not like a government notice.
Talk about whatever they bring up: ideas, study, cooking, travel, work, stories, and explanations.
Do not invent government fees, court outcomes, or a medical diagnosis. For health worries, give general information and suggest seeing a doctor when it matters.
You cannot see their NID, documents, bank, or bills. Do not guess those details.
Do not claim you paid a bill, sent an SMS, or changed their records.
If you are unsure, say so in one sentence.`;

type ChatTurn = { role: "user" | "assistant"; content: string };

export function chatProvider() {
  const base = process.env.AI_BASE_URL?.replace(/\/$/, "");
  const key = process.env.AI_API_KEY;
  if (base && key) {
    return {
      own: true,
      model: process.env.AI_MODEL || "gpt-4o-mini",
      url: base.endsWith("/chat/completions") ? base : `${base}/chat/completions`,
      key,
    };
  }
  return { own: false, model: "openai", url: "https://text.pollinations.ai/openai", key: null };
}

async function requestChat(history: ChatTurn[]) {
  const provider = chatProvider();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(provider.key ? { Authorization: `Bearer ${provider.key}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "system", content: SYSTEM }, ...history.slice(-16)],
      }),
    });
    if (!response.ok) {
      const busy = response.status === 429 || response.status === 402;
      throw new Error(busy ? "busy" : "down");
    }
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty");
    return text;
  } catch (error) {
    if (error instanceof Error && (error.message === "busy" || error.message === "down" || error.message === "empty")) throw error;
    throw new Error("down");
  } finally {
    clearTimeout(timer);
  }
}

export async function completeChat(history: ChatTurn[]) {
  try {
    return await requestChat(history);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "busy") throw error;
    await new Promise((resolve) => setTimeout(resolve, 20_000));
    return requestChat(history);
  }
}

export function chatFailure(text: string, reason: string) {
  const bangla = /[\u0980-\u09FF]/.test(text);
  if (reason === "busy") {
    return bangla ? "একটু ব্যস্ত আছি। কয়েক সেকেন্ড পর আবার বললেই উত্তর দিতে পারব।" : "I need a few seconds before the next reply. Please try again shortly.";
  }
  return bangla ? "এই মুহূর্তে উত্তর আসছে না। একটু পরে আবার চেষ্টা করুন।" : "I could not get an answer just now. Please try again in a moment.";
}
