import { generateGeminiReply } from "./geminiClient.js";
import { CLASS_DATA } from "../data.js";
import { MILESTONES_CANONICAL } from "../data/milestones_canonical.js";

const TEXTBOOK_KNOWLEDGE = `
Nội dung cốt lõi của Giáo trình Tư tưởng Hồ Chí Minh về Đại đoàn kết dân tộc (NXB Chính trị Quốc gia Sự thật):

1. Vai trò của đại đoàn kết toàn dân tộc:
- Câu nói nổi tiếng của Hồ Chí Minh: "Lao động Việt Nam có thể gồm trong 8 chữ là: ĐOÀN KẾT TOÀN DÂN, PHỤNG SỰ TỔ QUỐC".
- Cách mạng là sự nghiệp của quần chúng, do quần chúng, vì quần chúng. Đại đoàn kết là yêu cầu khách quan của cách mạng, là đòi hỏi tự giải phóng của nhân dân.
- Đại đoàn kết là vấn đề có ý nghĩa chiến lược xuyên suốt cách mạng, quyết định thành công của cách mạng (Đoàn kết thì độc lập tự do; chia rẽ thì bị xâm lăng). "Đoàn kết, đoàn kết, đại đoàn kết. Thành công, thành công, đại thành công."

2. Lực lượng của khối đại đoàn kết toàn dân tộc:
- Chủ thể: Bao gồm toàn thể nhân dân, tất cả người Việt Nam yêu nước ở mọi giai cấp, tầng lớp, ngành, giới, lứa tuổi, dân tộc, tôn giáo, đảng phái và kiều bào nước ngoài. "Ai có tài, có đức, có sức, có lòng phụng sự Tổ quốc và nhân dân thì ta đoàn kết với họ."
- Nền tảng: Liên minh công nhân - nông dân - trí thức, đặt dưới sự lãnh đạo của Đảng. Công nông là "nền gốc" của đại đoàn kết (như cái nền của nhà, gốc của cây).
- Hạt nhân: Sự đoàn kết thống nhất trong Đảng là hạt nhân quyết định sức mạnh lãnh đạo của khối đại đoàn kết.

3. Điều kiện để xây dựng khối đại đoàn kết toàn dân tộc:
- Một là: Lấy lợi ích chung làm điểm quy tụ, đồng thời tôn trọng các lợi ích khác biệt chính đáng. Lợi ích tối cao là độc lập, thống nhất của Tổ quốc, tự do, hạnh phúc của nhân dân (nước độc lập mà dân không hạnh phúc thì độc lập cũng vô nghĩa).
- Hai là: Kế thừa truyền thống yêu nước, nhân nghĩa, đoàn kết của dân tộc qua hàng ngàn năm dựng nước và giữ nước.
- Ba là: Có lòng khoan dung, độ lượng với con người. Trân trọng phần thiện dù nhỏ nhất ở mỗi người ("Năm ngón tay có ngón vắn ngón dài nhưng đều họp lại nơi bàn tay", đều là dòng dõi tổ tiên ta, là con Lạc cháu Hồng thì ai cũng có lòng ái quốc). Lấy tình thân ái cảm hóa người lầm đường lạc lối.
- Bốn là: Có niềm tin vào nhân dân. Nguyên tắc "nước lấy dân làm gốc", "chở thuyền và lật thuyền cũng là dân", "cách mạng là sự nghiệp của quần chúng".

4. Hình thức, nguyên tắc tổ chức của khối đại đoàn kết toàn dân tộc (Mặt trận dân tộc thống nhất):
- Mặt trận dân tộc thống nhất là hình thức tổ chức để quy tụ mọi cá nhân và tổ chức yêu nước (Phản đế đồng minh, Mặt trận Việt Minh, Mặt trận Liên Việt, Mặt trận Tổ quốc Việt Nam...).
- Nguyên tắc hoạt động của Mặt trận:
  + Xây dựng trên nền tảng liên minh công - nông - trí thức và đặt dưới sự lãnh đạo duy nhất của Đảng.
  + Hoạt động theo nguyên tắc hiệp thương dân chủ (bàn bạc công khai, đi đến nhất trí đồng thuận, loại trừ áp đặt).
  + Đoàn kết lâu dài, chặt chẽ, chân thành, giúp đỡ nhau cùng tiến bộ (phương châm "cầu đồng tồn dị", vừa đoàn kết vừa đấu tranh phê bình trên lập trường thân ái).

5. Phương thức xây dựng khối đại đoàn kết toàn dân tộc:
- Một là: Làm tốt công tác vận động quần chúng (dân vận). Giáo dục, tuyên truyền, giúp nhân dân hiểu rõ quyền lợi và nghĩa vụ. Phương pháp dân vận phải phù hợp với tâm tư, nguyện vọng, phong tục tập quán của nhân dân.
- Hai là: Thành lập đoàn thể, tổ chức quần chúng phù hợp với từng đối tượng (Công đoàn, Hội Nông dân, Đoàn Thanh niên, Hội Phụ nữ...).
- Ba là: Các đoàn thể, tổ chức quần chúng được tập hợp và đoàn kết chặt chẽ trong Mặt trận dân tộc thống nhất.
`;

const VIETNAMESE_STOP_WORDS = new Set([
  "cho",
  "toi",
  "hoi",
  "muon",
  "hieu",
  "con",
  "gi",
  "nua",
  "khong",
  "co",
  "de",
  "lam",
  "va",
  "nay",
  "trong",
  "cua",
  "la",
  "tai",
  "sao",
  "ai",
  "thi",
  "nhung",
  "cac",
  "mot",
  "hai",
  "ba",
  "ba",
  "bon",
  "nam",
  "sau",
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

  const numMatch = query.match(
    /(?:moc|mộc|mọc|phan|phần|bai|bài|so|số|chủ đề|chu de)\s*([1-6]|mot|một|hai|ba|bá|bon|bốn|nam|năm|sau|sáu)/,
  );
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
    .split(/[^a-z0-9]+/i)
    .filter(
      (word) =>
        (word.length > 2 || /^\d+$/.test(word)) &&
        !VIETNAMESE_STOP_WORDS.has(word),
    );
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

    const searchableWords = new Set(searchableText.split(/[^a-z0-9]+/i).filter(Boolean));
    const score = keywords.reduce(
      (total, keyword) => total + (searchableWords.has(keyword) ? 1 : 0),
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
    .split(/[^a-z0-9]+/i)
    .filter(
      (w) => (w.length > 2 || /^\d+$/.test(w)) && !VIETNAMESE_STOP_WORDS.has(w),
    );
  if (keywords.length === 0) return null;

  const scored = MILESTONES_CANONICAL.map((item) => {
    const hayText = normalizeText(
      [
        item.shortSummary,
        (item.keywords || []).join(" "),
        (item.qas || []).map((q) => q.q).join(" "),
      ].join(" "),
    );
    const hayWords = new Set(hayText.split(/[^a-z0-9]+/i).filter(Boolean));
    const score = keywords.reduce((t, k) => t + (hayWords.has(k) ? 1 : 0), 0);
    return { item, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].item : null;
}

export function findExactOrCloseQAMatch(userText, canonical, { lowerThreshold = false } = {}) {
  const query = normalizeText(userText);
  if (!query || query.length < 4) return null;

  // Filter significant keywords from query
  const queryWords = query
    .split(/[^a-z0-9]+/i)
    .filter(
      (word) =>
        (word.length > 2 || /^\d+$/.test(word)) &&
        !VIETNAMESE_STOP_WORDS.has(word),
    );

  if (queryWords.length === 0) return null;

  // Helper to extract unigrams, bigrams, and trigrams
  const getNGrams = (text) => {
    const words = normalizeText(text).split(/[^a-z0-9]+/i).filter(Boolean);
    const unigrams = new Set();
    const bigrams = new Set();
    const trigrams = new Set();

    for (let i = 0; i < words.length; i++) {
      const w1 = words[i];
      if (w1.length > 2 || /^\d+$/.test(w1)) {
        if (!VIETNAMESE_STOP_WORDS.has(w1)) {
          unigrams.add(w1);
        }
      }
      if (i < words.length - 1) {
        bigrams.add(`${words[i]}_${words[i+1]}`);
      }
      if (i < words.length - 2) {
        trigrams.add(`${words[i]}_${words[i+1]}_${words[i+2]}`);
      }
    }
    return { unigrams, bigrams, trigrams };
  };

  const queryNGrams = getNGrams(userText);

  let bestQA = null;
  let bestScore = 0;

  // Helper to calculate keyword match score based on unigrams, bigrams, and trigrams
  const calculateScore = (qa) => {
    let score = 0;
    const qNGrams = getNGrams(qa.q);
    const aNGrams = getNGrams(qa.a);

    // 1. Unigram match (word matching)
    queryNGrams.unigrams.forEach((word) => {
      if (qNGrams.unigrams.has(word)) score += 2;
      else if (aNGrams.unigrams.has(word)) score += 1;
    });

    // 2. Bigram match (phrase matching)
    queryNGrams.bigrams.forEach((bg) => {
      if (qNGrams.bigrams.has(bg)) score += 8;
      else if (aNGrams.bigrams.has(bg)) score += 4;
    });

    // 3. Trigram match (extended phrase matching)
    queryNGrams.trigrams.forEach((tg) => {
      if (qNGrams.trigrams.has(tg)) score += 15;
      else if (aNGrams.trigrams.has(tg)) score += 8;
    });

    return score;
  };

  // 1. Search in canonical milestone first (higher priority)
  if (canonical && Array.isArray(canonical.qas)) {
    for (const qa of canonical.qas) {
      const score = calculateScore(qa);
      if (score > bestScore) {
        bestScore = score;
        bestQA = qa;
      }
    }
  }

  // 2. Search all milestones
  for (const milestone of MILESTONES_CANONICAL) {
    if (milestone === canonical) continue;
    if (Array.isArray(milestone.qas)) {
      for (const qa of milestone.qas) {
        const score = calculateScore(qa);
        if (score > bestScore) {
          bestScore = score;
          bestQA = qa;
        }
      }
    }
  }

  // Threshold: require enough keyword overlap (based on unigram set size)
  const minWords = lowerThreshold ? 1 : 2;
  const pct = lowerThreshold ? 0.25 : 0.30;
  const threshold = Math.max(minWords, Math.floor(queryNGrams.unigrams.size * pct)) * 2;
  if (bestScore >= threshold) {
    return bestQA;
  }

  return null;
}

/**
 * Handle multi-part questions: split by '?', find QA matches for each sub-question,
 * and combine answers with 'Ý 1:', 'Ý 2:' labels.
 */
function findMultiPartQAMatches(userText) {
  const raw = String(userText || "");
  const parts = raw.split("?").map(p => p.trim()).filter(p => p.length > 8);

  if (parts.length < 2) {
    // Single question — use standard matching
    const canonical = findCanonicalMatch(userText);
    const match = findExactOrCloseQAMatch(userText, canonical);
    return match ? [match] : [];
  }

  // Multiple sub-questions — find best QA for each
  const matches = [];
  const usedAnswers = new Set();

  for (const part of parts) {
    const partCanonical = findCanonicalMatch(part);
    const match = findExactOrCloseQAMatch(part, partCanonical, { lowerThreshold: true });
    if (match && !usedAnswers.has(match.a)) {
      matches.push(match);
      usedAnswers.add(match.a);
    }
  }

  return matches;
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

  // Collect ALL canonical Q&As from ALL milestones so AI can answer any topic
  let allCanonicalQAs = "";
  for (const milestone of MILESTONES_CANONICAL) {
    if (Array.isArray(milestone.qas) && milestone.qas.length > 0) {
      const header = `--- ${milestone.shortSummary || milestone.id} ---`;
      const qaLines = milestone.qas
        .map((qa) => `Hỏi: ${qa.q}\nĐáp: ${qa.a}`)
        .join("\n\n");
      allCanonicalQAs += `\n${header}\n${qaLines}\n`;
    }
  }

  return [
    "Bạn là hướng dẫn viên ảo (NPC) trong không gian Triển lãm 3D học tập Tư tưởng Hồ Chí Minh về Đại đoàn kết dân tộc.",
    "Nhiệm vụ của bạn là trả lời các câu hỏi của người dùng dựa trên nội dung trong Giáo trình Tư tưởng Hồ Chí Minh (NXB Chính trị Quốc gia Sự thật).",
    "",
    "CÁC NGUYÊN TẮC TRẢ LỜI BẮT BUỘC:",
    "1. Chỉ dùng kiến thức đã cung cấp trong phần giáo trình và dữ liệu mốc học tập bên dưới. Không dùng kiến thức ngoài.",
    "2. ĐỌC KỸ câu hỏi trước khi trả lời. Xác định RÕ kiểu câu hỏi:",
    "   - 'Vì sao / Tại sao' → PHẢI nêu RÕ các LÝ DO, NGUYÊN NHÂN cụ thể.",
    "   - 'Là gì / Bao gồm gì' → PHẢI định nghĩa, liệt kê đầy đủ.",
    "   - 'Như thế nào / Làm thế nào' → PHẢI trình bày cách thức, phương pháp.",
    "   - TUYỆT ĐỐI không trả lời lạc sang nội dung khác với yêu cầu.",
    "3. CÂU HỎI NHIỀU VẾ (có 2 dấu ? trở lên hoặc nhiều ý): PHẢI trả lời TỪNG VẾ riêng biệt, trình bày:",
    "   Vế 1: [trả lời vế 1 đầy đủ]",
    "   Vế 2: [trả lời vế 2 đầy đủ]",
    "   KHÔNG ĐƯỢC bỏ sót bất kỳ vế nào.",
    "4. Diễn đạt theo ý, không chép nguyên văn dài từ giáo trình.",
    "5. Độ dài: 3-8 câu, ngắn gọn, mạch lạc, đầy đủ.",
    "6. Không trả lời chung chung hay chỉ liệt kê tiêu đề mục. Mỗi câu phải có NỘI DUNG CỤ THỂ trực tiếp trả lời câu hỏi.",
    "7. Nếu câu hỏi ngoài phạm vi giáo trình, nói rõ chưa đủ thông tin.",
    "8. Nếu người chơi hỏi về thử thách/quiz, hãy khuyên họ mở phần thử thách trên màn hình game.",
    "",
    "KIẾN THỨC CỐT LÕI TỪ GIÁO TRÌNH TƯ TƯỞNG HỒ CHÍ MINH:",
    TEXTBOOK_KNOWLEDGE,
    "",
    allCanonicalQAs
      ? `NGÂN HÀNG CÂU HỎI - ĐÁP CHUẨN HÓA (tham khảo để trả lời chính xác):\n${allCanonicalQAs}`
      : "",
    "",
    `Chủ đề hiện tại bạn đang đứng: ${title}.`,
    summary ? `Tóm tắt chủ đề này: ${summary}` : "",
    quote ? `Trích dẫn tiêu biểu của chủ đề: ${quote}` : "",
    sectionLines ? `Các ý chính của chủ đề:\n${sectionLines}` : "",
    milestoneLines
      ? `Các mốc chủ đề khác có trong triển lãm:\n${milestoneLines}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isMultiIntentQuestion(userText) {
  const raw = String(userText || "");
  const query = normalizeText(raw);
  if (!query) return false;

  const questionMarks = (raw.match(/\?/g) || []).length;
  if (questionMarks >= 2) return true;

  // Check for conjunctions splitting two intents ("và", "đồng thời", "ngoài ra")
  const conjunctionSplit = /\b(va|dong thoi|ngoai ra|ben canh do|mat khac)\b/.test(query);

  const intentHits = (
    query.match(
      /\b(la gi|bao gom|gom nhung|the nao|nhu the nao|vi sao|tai sao|vai tro|y nghia|dieu kien|nguyen tac|phuong thuc|lam sao|nhu the nao|dung hoa|giai quyet)\b/g,
    ) || []
  ).length;

  if (intentHits >= 2) return true;
  if (conjunctionSplit && intentHits >= 1) return true;

  return false;
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
          if (typeof p === "object" && p !== null) {
            if (p.type === "image") {
              result += `  - [Hình ảnh]: ${p.caption || "Ảnh minh họa"}\n`;
            }
          } else {
            result += `  - ${p}\n`;
          }
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
  const quote = milestone?.quote || classInfo?.quote || "";
  const sections = Array.isArray(milestone?.sections)
    ? milestone.sections
    : Array.isArray(classInfo?.sections)
      ? classInfo.sections
      : [];

  if (!query) {
    return "Bạn có thể hỏi tôi về ý nghĩa, bối cảnh, hoặc các mối liên hệ giữa những mốc đang có trong triển lãm.";
  }

  // 1. MULTI-PART QUESTION: split by '?' and find QA for each part
  const multiMatches = findMultiPartQAMatches(userText);
  if (multiMatches.length >= 2) {
    return multiMatches
      .map((qa, i) => `Vế ${i + 1}: ${qa.a}`)
      .join("\n\n");
  }
  // Single QA match
  if (multiMatches.length === 1) {
    return multiMatches[0].a;
  }

  // 2. Quiz / challenge detection
  if (/quiz|thu thach|kiem tra/.test(query)) {
    return "Nếu bạn muốn kiểm tra nhanh kiến thức, hãy mở phần thử thách tương ứng trong game.";
  }

  // 3. Greeting
  if (/\b(chao|hello|hi|xin chao)\b/.test(query) && query.length < 30) {
    return "Xin chào. Bạn có thể hỏi quanh nội dung đang trưng bày hoặc chuyển sang mốc khác trong triển lãm.";
  }

  // 4. Full content request
  if (
    /chi tiet|day du|tat ca|tieu de|noi dung o moc|noi dung o phan|noi dung o bai|noi dung moc|con gi nua|ke tiep|tiep tuc|chi tiet hon/.test(
      query,
    )
  ) {
    return formatFullMilestoneContent(milestone);
  }

  // 5. For 'vì sao / tại sao / làm thế nào' — try harder to find a relevant QA across ALL milestones
  if (/vi sao|tai sao|the nao|lam sao|dung hoa|giai quyet/.test(query)) {
    // Search more aggressively across all milestones with lower threshold
    for (const ms of MILESTONES_CANONICAL) {
      const match = findExactOrCloseQAMatch(userText, ms, { lowerThreshold: true });
      if (match) return match.a;
    }
  }

  // 6. Summary / definition requests
  if (/tom tat|noi dung chinh|y nghia chinh|vai tro chinh/.test(query)) {
    const milestoneSummary =
      milestone?.shortSummary || milestone?.summary || classInfo?.summary || "";
    return `${milestoneSummary}${quote ? ` Câu nhấn mạnh liên quan: “${quote.replace(/^“|”$/g, "")}”.` : ""}`;
  }

  if (/phan|muc|section|giai thich/.test(query) && sections.length > 0) {
    const highlights = sections
      .slice(0, 2)
      .map((section, index) => `${index + 1}. ${section.title}`)
      .join("; ");
    return `${title} có các phần chính sau: ${highlights}. Bạn có câu hỏi cụ thể nào về các phần này không?`;
  }

  if (/\b(chao|hello|hi|xin chao)\b/.test(query)) {
    return "Xin chào. Bạn có thể hỏi quanh nội dung đang trưng bày hoặc chuyển sang mốc khác trong triển lãm.";
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
    const milestoneSummary =
      milestone?.shortSummary ||
      "Khối đại đoàn kết toàn dân tộc mang ý nghĩa sâu sắc.";
    return `Về phần "${relatedSection.title}", giáo trình nêu rõ ý nghĩa cốt lõi: ${milestoneSummary} Bạn có muốn tìm hiểu sâu hơn về nội dung này không?`;
  }

  const defaultSummary =
    milestone?.shortSummary || milestone?.summary || classInfo?.summary || "";
  return `Vấn đề này xoay quanh nội dung: ${defaultSummary} Bạn có muốn hỏi thêm câu hỏi cụ thể nào không?`;
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
      const canonical = findCanonicalMatch(userText);
      const matchedMilestone = canonical || findRelevantMilestone(userText);
      const activeInfo = matchedMilestone || classInfo;

      const systemInstruction = buildSystemInstruction(activeInfo);
      const multiIntentGuard = isMultiIntentQuestion(userText)
        ? "\n\nCÂU HỎI HIỆN TẠI CÓ NHIỀU VẾ/Ý. BẮT BUỘC phải:\n- Tách và trả lời TỪNG VẾ riêng biệt\n- Trình bày: 'Vế 1: [nội dung]', 'Vế 2: [nội dung]'\n- KHÔNG bỏ sót bất kỳ vế nào\n- Mỗi vế phải có nội dung CỤ THỂ, không nói chung chung"
        : "";
      const contents = buildConversationSnapshot(history);

      try {
        const reply = await generateGeminiReply({
          apiKey,
          model,
          systemInstruction: `${systemInstruction}${multiIntentGuard}`,
          contents,
          generationConfig: {
            temperature: 0.25,
            topP: 0.90,
            topK: 40,
            maxOutputTokens: 480,
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
