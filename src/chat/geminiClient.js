const DEFAULT_MODEL =
  (typeof import.meta.env !== "undefined" &&
    import.meta.env.VITE_GEMINI_MODEL) ||
  "gemini-2.0-flash";

function extractResponseText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";

  const text = parts
    .map((part) => part?.text || "")
    .join("")
    .trim();

  return text;
}

export async function generateGeminiReply({
  apiKey,
  model = DEFAULT_MODEL,
  systemInstruction,
  contents,
  generationConfig,
}) {
  if (!apiKey) {
    throw new Error("missing_gemini_api_key");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        contents,
        generationConfig,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`gemini_http_${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const text = extractResponseText(payload);

  if (!text) {
    throw new Error("gemini_empty_response");
  }

  return text;
}
