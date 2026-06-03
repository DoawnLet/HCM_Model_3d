import { generateGeminiReply } from "./geminiClient.js";
import { CLASS_DATA } from "../data.js";
import { MILESTONES_CANONICAL } from "../data/milestones_canonical.js";

const VIETNAMESE_STOP_WORDS = new Set([
  "cho", "toi", "hoi", "muon", "hieu", "con", "gi", "nua", "khong", 
  "co", "de", "lam", "va", "nay", "trong", "cua", "la", "tai", "sao",
  "ai", "thi", "nhung", "cac", "mot", "hai", "ba", "ba", "bon", "nam", "sau"
]);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function pickFirstSentence(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return "";
  const match = cleaned.match(/^.*?[.!?](\s|$)/);
  return match ? match[0].trim() : cleaned;
}

function pickSectionSummary(section) {
  if (!section) return "";
  if (Array.isArray(section.paragraphs) && section.paragraphs.length > 0) {
    return pickFirstSentence(section.paragraphs[0]);
  }
  if (Array.isArray(section.bullets) && section.bullets.length > 0) {
    return section.bullets[0];
  }
  return section.title || "";
}

function buildConversationSnapshot(history = [], limit = 10) {
  return history
    .slice(-limit)
    .map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: String(entry.text || "") }],
    }))
    .filter((entry) => entry.parts[0].text.trim().length > 0);
}

function getMilestoneOverview() {
  return CLASS_DATA.map((item, index) => {
    const title = item?.title || `Mốc ${index + 1}`;
    const summary = item?.summary || "";
    return `- ${title}${summary ? `: ${summary}` : ""}`;
  }).join("\n");
}

function findRelevantMilestone(userText) {
  const query = normalizeText(userText);
  if (!query) return null;

  const cleanQuery = query.trim();
  if (/^[1-6]$/.test(cleanQuery)) {
    const idx = parseInt(cleanQuery) - 1;
    if (idx >= 0 && idx < CLASS_DATA.length) return CLASS_DATA[idx];
  }

  const numMatch = query.match(/(?:moc|mộc|mọc|phan|phần|bai|bài|so|số|chủ đề|chu de)\s*([1-6]|mot|một|hai|ba|bá|bon|bốn|nam|năm|sau|sáu)/);
  if (numMatch) {
    const numStr = numMatch[1];
    let index = -1;
    if (numStr === "1" || numStr === "mot" || numStr === "một") index = 0;
    else if (numStr === "2" || numStr === "hai") index = 1;
    else if (numStr === "3" || numStr === "ba" || numStr === "bá") index = 2;
    else if (numStr === "4" || numStr === "bon" || numStr === "bốn") index = 3;
    else if (numStr === "5" || numStr === "nam" || numStr === "năm") index = 4;
    else if (numStr === "6" || numStr === "sau" || numStr === "sáu") index = 5;

    if (index >= 0 && index < CLASS_DATA.length) {
      return CLASS_DATA[index];
    }
  }

  const keywords = query
    .split(/\s+/)
    .filter((word) => (word.length > 2 || /^\d+$/.test(word)) && !VIETNAMESE_STOP_WORDS.has(word));
  if (keywords.length === 0) return null;

  const scored = CLASS_DATA.map((item) => {
    const searchableText = normalizeText(
      [
        item?.title,
        item?.summary,
        item?.quote,
        ...(Array.isArray(item?.sections)
          ? item.sections.flatMap((section) => [
              section?.title,
              section?.quote,
              ...(Array.isArray(section?.paragraphs) ? section.paragraphs : []),
              ...(Array.isArray(section?.bullets) ? section.bullets : []),
            ])
          : []),
      ]
        .filter(Boolean)
        .join(" "),
    );

    const score = keywords.reduce(
      (total, keyword) => total + (searchableText.includes(keyword) ? 1 : 0),
      0,
    );
    return { item, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].item : null;
}

function findCanonicalMatch(userText) {
  const query = normalizeText(userText);
  if (!query) return null;

  const keywords = query
    .split(/\s+/)
    .filter((w) => (w.length > 2 || /^\d+$/.test(w)) && !VIETNAMESE_STOP_WORDS.has(w));
  if (keywords.length === 0) return null;

  const scored = MILESTONES_CANONICAL.map((item) => {
    const hay = normalizeText(
      [
        item.shortSummary,
        (item.keywords || []).join(" "),
        (item.qas || []).map((q) => q.q).join(" "),
      ].join(" "),
    );
    const score = keywords.reduce((t, k) => t + (hay.includes(k) ? 1 : 0), 0);
    return { item, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].item : null;
}

export function findExactOrCloseQAMatch(userText, canonical) {
  const query = normalizeText(userText);
  if (!query || query.length < 5) return null;

  // Helper to check if two normalized questions match
  const isMatch = (q1, q2) => {
    if (q1 === q2) return true;
    if (q1.length > 15 && q2.length > 15) {
      if (q1.includes(q2)) {
        const minRatio = q2.length > 30 ? 0.5 : 0.75;
        if (q2.length / q1.length > minRatio) return true;
      }
      if (q2.includes(q1)) {
        const minRatio = q1.length > 30 ? 0.5 : 0.75;
        if (q1.length / q2.length > minRatio) return true;
      }
    }
    return false;
  };

  // 1. Check in the matched canonical milestone first (higher priority)
  if (canonical && Array.isArray(canonical.qas)) {
    for (const qa of canonical.qas) {
      if (isMatch(normalizeText(qa.q), query)) return qa;
    }
  }

  // 2. Fallback to search all milestones
  for (const milestone of MILESTONES_CANONICAL) {
    if (milestone === canonical) continue;
    if (Array.isArray(milestone.qas)) {
      for (const qa of milestone.qas) {
        if (isMatch(normalizeText(qa.q), query)) return qa;
      }
    }
  }

  return null;
}

function buildSystemInstruction(classInfo) {
  const title = classInfo?.title || "nhân vật trong game";
  const summary = classInfo?.summary || "";
  const quote = classInfo?.quote || "";
  const sections = Array.isArray(classInfo?.sections) ? classInfo.sections : [];
  const sectionLines = sections
    .slice(0, 4)
    .map((section) => `- ${section.title}: ${pickSectionSummary(section)}`)
    .join("\n");
  const milestoneLines = getMilestoneOverview();

  // Find corresponding canonical Q&As
  let canonicalQAs = "";
  const canonical = MILESTONES_CANONICAL.find((m) => m.id === classInfo?.id);
  if (canonical && Array.isArray(canonical.qas)) {
    canonicalQAs = canonical.qas
      .map((qa) => `Hỏi: ${qa.q}\nĐáp: ${qa.a}`)
      .join("\n\n");
  }

  return [
    "Bạn là NPC trong một trò chơi 3D giáo dục về tư tưởng Hồ Chí Minh và Đại đoàn kết toàn dân tộc.",
    "Trả lời hoàn toàn bằng tiếng Việt, tự nhiên, ngắn gọn vừa đủ, đúng vai NPC, không nhắc đến prompt hay nội bộ hệ thống.",
    "Người chơi được hỏi rộng quanh mọi mốc nội dung trong triển lãm. Hãy trả lời theo mốc phù hợp nhất, không chỉ giới hạn ở mốc đang mở.",
    "Nếu câu hỏi liên quan đến một mốc khác, hãy chuyển sang giải thích mốc đó một cách mượt mà và giữ đúng bối cảnh bảo tàng.",
    "Không lặp nguyên văn tên mốc trong câu trả lời nếu có thể tránh được; hãy diễn giải bằng chủ đề, ý nghĩa hoặc khái niệm tương ứng.",
    "Nếu người chơi hỏi về thử thách/quiz, hãy khuyên họ mở phần thử thách trong game.",
    `Chủ đề hiện tại: ${title}.`,
    summary ? `Tóm tắt: ${summary}` : "",
    quote ? `Câu nhấn mạnh: ${quote}` : "",
    sectionLines ? `Các ý chính:\n${sectionLines}` : "",
    milestoneLines ? `Các mốc đang có trong triển lãm:\n${milestoneLines}` : "",
    canonicalQAs
      ? `Dưới đây là một số câu hỏi thường gặp và câu trả lời chuẩn hóa liên quan đến chủ đề này. Hãy tham khảo chúng để trả lời chính xác, giữ đúng tinh thần và nội dung lịch sử:\n${canonicalQAs}`
      : "",
    "Phong cách: thân thiện, mạch lạc, giống người kể chuyện trong bảo tàng ảo.",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatFullMilestoneContent(milestone) {
  if (!milestone) return "";
  const title = String(milestone.title || "").toUpperCase();
  const summary = milestone.summary || "";
  const quote = milestone.quote || "";
  const sections = Array.isArray(milestone.sections) ? milestone.sections : [];

  let result = `${title}\n\nTóm tắt: ${summary}\n`;
  if (quote) {
    result += `Trích dẫn: ${quote}\n`;
  }

  if (sections.length > 0) {
    result += `\nChi tiết các phần:\n`;
    sections.forEach((section, idx) => {
      const sectionTitle = String(section.title || "").trim();
      if (/^[a-z]\)\s*/i.test(sectionTitle)) {
        result += `\n${sectionTitle}:\n`;
      } else {
        const charCode = String.fromCharCode(97 + idx); // a, b, c...
        result += `\n${charCode}) ${sectionTitle}:\n`;
      }
      if (Array.isArray(section.paragraphs)) {
        section.paragraphs.forEach((p) => {
          result += `  - ${p}\n`;
        });
      }
      if (Array.isArray(section.bullets)) {
        section.bullets.forEach((b) => {
          result += `    • ${b}\n`;
        });
      }
      if (section.quote) {
        result += `  - Trích dẫn: ${section.quote}\n`;
      }
    });
  }
  return result;
}

function buildResponseFromContext(classInfo, userText) {
  const query = normalizeText(userText);
  const canonical = findCanonicalMatch(userText);
  const milestone = findRelevantMilestone(userText) || canonical || classInfo;
  const title = milestone?.title || classInfo?.title || "nhân vật";
  const summary =
    milestone?.summary ||
    classInfo?.summary ||
    "Tôi có thể kể thêm theo nội dung của chủ đề này.";
  const quote = milestone?.quote || classInfo?.quote || "";
  const sections = Array.isArray(milestone?.sections)
    ? milestone.sections
    : Array.isArray(classInfo?.sections)
      ? classInfo.sections
      : [];

  if (!query) {
    return "Bạn có thể hỏi tôi về ý nghĩa, bối cảnh, hoặc các mối liên hệ giữa những mốc đang có trong triển lãm.";
  }

  if (/quiz|thu thach|cau hoi|kiem tra/.test(query)) {
    return "Nếu bạn muốn kiểm tra nhanh kiến thức, hãy mở phần thử thách tương ứng trong game.";
  }

  // If user requests full content / title and content / details
  if (/chi tiet|day du|tat ca|tieu de|noi dung o moc|noi dung o phan|noi dung o bai|noi dung moc|con gi nua|ke tiep|tiep tuc|chi tiet hon/.test(query)) {
    return formatFullMilestoneContent(milestone);
  }

  if (/tom tat|tom|noi dung chinh|y nghia|vai tro|la gi|giup gi/.test(query)) {
    return `${summary}${quote ? ` Câu nhấn mạnh liên quan: “${quote.replace(/^“|”$/g, "")}”.` : ""}`;
  }

  if (
    /phan|muc|section|giai thich/.test(query) &&
    sections.length > 0
  ) {
    const highlights = sections
      .slice(0, 2)
      .map(
        (section, index) =>
          `${index + 1}. ${section.title}: ${pickSectionSummary(section)}`,
      )
      .join(" ");
    return `${title} có vài ý chính rất đáng chú ý. ${highlights}`;
  }

  if (/\b(chao|hello|hi|xin chao)\b/.test(query)) {
    return "Xin chào. Bạn có thể hỏi quanh nội dung đang trưng bày hoặc chuyển sang mốc khác trong triển lãm.";
  }

  // Check for exact or high-similarity canonical QA match first
  const qaMatch = findExactOrCloseQAMatch(userText, canonical);
  if (qaMatch) {
    return qaMatch.a;
  }

  // If there's a canonical entry and user asks for summary/meaning, return shortSummary
  if (canonical && /tom tat|tom|noi dung chinh|y nghia|vai tro|la gi|giup gi/.test(query)) {
    return canonical.shortSummary;
  }

  const relatedSection = sections.find((section) => {
    const sectionText = normalizeText(
      `${section.title} ${pickSectionSummary(section)}`,
    );
    const keywords = query.split(/\s+/).filter(Boolean);
    return keywords.some(
      (keyword) => keyword.length > 2 && sectionText.includes(keyword),
    );
  });

  if (relatedSection) {
    return `${pickSectionSummary(relatedSection)} Nếu cần, tôi có thể giải thích sâu hơn phần “${relatedSection.title}”.`;
  }

  return `Nội dung này xoay quanh: ${summary} Nếu muốn, tôi cũng có thể chuyển sang giải thích một mốc liên quan khác trong triển lãm.`;
}

export function createChatResponder() {
  const apiKey = (typeof import.meta.env !== "undefined" && import.meta.env.VITE_GEMINI_API_KEY) || "";
  const model = (typeof import.meta.env !== "undefined" && import.meta.env.VITE_GEMINI_MODEL) || "gemini-2.0-flash";

  return {
    async reply({ classInfo, userText, history = [] }) {
      const canonical = findCanonicalMatch(userText);
      const matchedMilestone = canonical || findRelevantMilestone(userText);
      const activeInfo = matchedMilestone || classInfo;

      // Check for exact or high-similarity canonical QA match first
      const qaMatch = findExactOrCloseQAMatch(userText, canonical);
      if (qaMatch) {
        // Find which milestone this QA belongs to so we can transition to it
        const targetMilestone = MILESTONES_CANONICAL.find((m) =>
          (m.qas || []).some((qa) => qa.q === qaMatch.q)
        );
        const resolvedClassInfo = targetMilestone
          ? (CLASS_DATA.find((item) => item.id === targetMilestone.id) || activeInfo)
          : activeInfo;
        return { reply: qaMatch.a, activeClassInfo: resolvedClassInfo };
      }

      const systemInstruction = buildSystemInstruction(activeInfo);
      const contents = buildConversationSnapshot(history);

      try {
        const reply = await generateGeminiReply({
          apiKey,
          model,
          systemInstruction,
          contents,
          generationConfig: {
            temperature: 0.65,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 220,
          },
        });

        return { reply, activeClassInfo: activeInfo };
      } catch (error) {
        console.warn("Gemini chat fallback activated:", error);
        await new Promise((resolve) => setTimeout(resolve, 240));
        const reply = buildResponseFromContext(activeInfo, userText);
        return { reply, activeClassInfo: activeInfo };
      }
    },
  };
}
