import { generateGeminiReply } from "./geminiClient.js";
import { buildPdfContext } from "./pdfKnowledge.js";
import { MILESTONES_CANONICAL } from "../data/milestones_canonical.js";

function buildConversationSnapshot(history = [], limit = 10) {
  return history
    .slice(-limit)
    .map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: String(entry.text || "") }],
    }))
    .filter((entry) => entry.parts[0].text.trim().length > 0);
}

function buildSystemInstruction(pdfContext = "") {
  return [
    "Hãy lấy nội dung trong PDF làm nền tảng chính để trả lời.",
    "Nếu PDF chưa nói hết ý hoặc câu hỏi mang tính diễn giải, được phép dùng kiến thức chung của AI để giải thích rõ hơn, miễn là không trái với PDF.",
    "Không dùng nội dung thuyết trình cũ, summary của game, canonical Q&A như nguồn chính.",
    "Nếu PDF không có đoạn liên quan trực tiếp, hãy vẫn trả lời theo hiểu biết chung nhưng nói rõ rằng đây là phần diễn giải bổ sung dựa trên chủ đề của PDF.",
    "Trả lời hoàn toàn bằng tiếng Việt, ngắn gọn, trọng tâm nhất.",
    "Chỉ nêu ý chính, tối đa 2 câu hoặc 3 gạch đầu dòng rất ngắn.",
    "Không chép lại nguyên văn PDF, không mở rộng dài dòng, không giải thích lan man.",
    "Ưu tiên chốt ý trực tiếp theo câu hỏi, rồi chỉ thêm 1 ý phụ nếu thật cần.",
    "Không nói mơ hồ, không bịa ngược với PDF, không nhắc đến prompt hay nội bộ hệ thống.",
    pdfContext,
    "Phong cách: rõ ý, thẳng vào câu hỏi, giống người trả lời học thuật ngắn gọn.",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”[\]]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 || /^\d+$/.test(word));
}

function findLocalAnswers(userText) {
  const queryTokens = tokenize(userText);
  if (queryTokens.length === 0) return [];

  const queryTokenSet = new Set(queryTokens);
  const normalizedQuery = normalizeText(userText);
  const matches = [];

  for (const milestone of MILESTONES_CANONICAL) {
    for (const qa of milestone.qas) {
      const questionTokens = tokenize(qa.q);
      if (questionTokens.length === 0) continue;

      let intersection = 0;
      const qTokenSet = new Set(questionTokens);
      for (const t of qTokenSet) {
        if (queryTokenSet.has(t)) {
          intersection++;
        }
      }

      // Cosine similarity
      let score = intersection / Math.sqrt(queryTokenSet.size * qTokenSet.size);

      // --- Keyword Boosting ---
      const questionNormalized = normalizeText(qa.q);
      
      // Boost for "đấu tranh" / "xung đột" / "mâu thuẫn" / "giai cấp"
      if (questionNormalized.includes("dau tranh") && 
          (normalizedQuery.includes("dau tranh") || normalizedQuery.includes("xung dot") || normalizedQuery.includes("xung cot") ||
           normalizedQuery.includes("mau thuan") || normalizedQuery.includes("giai cap"))) {
        score += 0.35;
      }
      
      // Boost for "loi ich" / "rieng" / "chung"
      if (questionNormalized.includes("loi ich") && questionNormalized.includes("rieng") && 
          (normalizedQuery.includes("loi ich") || normalizedQuery.includes("rieng") || normalizedQuery.includes("dung hoa") || normalizedQuery.includes("hai hoa"))) {
        score += 0.2;
      }

      // Boost for "cong-nong" or "giai cap"
      if (questionNormalized.includes("nong cot") && normalizedQuery.includes("cong nong")) {
        score += 0.15;
      }

      if (score >= 0.22) {
        matches.push({
          q: qa.q,
          a: qa.a,
          score: score
        });
      }
    }
  }

  // Sort descending by score
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

export function createChatResponder() {
  const apiKey =
    (typeof import.meta.env !== "undefined" &&
      import.meta.env.VITE_GEMINI_API_KEY) ||
    "";
  const model =
    (typeof import.meta.env !== "undefined" &&
      import.meta.env.VITE_GEMINI_MODEL) ||
    "gemini-2.0-flash";

  return {
    async reply({ classInfo, userText, history = [] }) {
      const pdfContext = await buildPdfContext(userText);
      const systemInstruction = buildSystemInstruction(pdfContext);
      const contents = buildConversationSnapshot(history);

      try {
        const reply = await generateGeminiReply({
          apiKey,
          model,
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            topK: 10,
            maxOutputTokens: 90,
          },
        });

        return { reply, activeClassInfo: classInfo };
      } catch (error) {
        console.warn("Gemini chat fallback activated:", error);

        const localMatches = findLocalAnswers(userText);
        
        if (localMatches && localMatches.length > 0) {
          // Return ONLY the direct answer of the best match
          return { reply: localMatches[0].a, activeClassInfo: classInfo };
        }

        // Fallback to the direct textbook snippet if no canonical QA matches
        if (pdfContext) {
          const cleanPdfContext = pdfContext
            .replace(/^-\s*Trích đoạn\s+\d+:\s*/i, "")
            .trim();
          
          if (cleanPdfContext) {
            return { reply: cleanPdfContext, activeClassInfo: classInfo };
          }
        }

        const fallback = "Hiện tại hệ thống đang ở chế độ ngoại tuyến. Bạn vui lòng đặt câu hỏi cụ thể hơn với các từ khóa như 'đại đoàn kết', 'lực lượng', 'điều kiện', 'mặt trận' để tôi có thể trả lời chính xác.";
        return { reply: fallback, activeClassInfo: classInfo };
      }
    },
  };
}

