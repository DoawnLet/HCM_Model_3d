const DEFAULT_MODEL = (typeof import.meta.env !== "undefined" && import.meta.env.VITE_GEMINI_MODEL) || "gemini-2.0-flash";

function extractResponseText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";

  let text = parts
    .map((part) => part?.text || "")
    .join("")
    .trim();

  // Extract Google Search grounding sources if available
  const metadata = candidate?.groundingMetadata;
  if (metadata && Array.isArray(metadata.groundingChunks)) {
    const sources = [];
    metadata.groundingChunks.forEach((chunk) => {
      const title = chunk?.web?.title || chunk?.web?.uri;
      const uri = chunk?.web?.uri;
      if (uri) {
        sources.push(`- [${title}](${uri})`);
      }
    });

    if (sources.length > 0) {
      const uniqueSources = [...new Set(sources)];
      text += `\n\n🌐 **Nguồn tham khảo từ Google Search:**\n${uniqueSources.join("\n")}`;
    }
  }

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
        tools: [{ googleSearch: {} }],
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
