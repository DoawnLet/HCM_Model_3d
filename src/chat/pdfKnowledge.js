import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import extractedPdfText from "../../extracted_content.txt?raw";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const PDF_URL = encodeURI(
  "/assets/GIAO TRINH TT HCM 2021  (Quoc gia)-trang-2.pdf",
);

let pdfTextPromise = null;
let sourceTextPromise = null;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^\d+$/.test(word));
}

async function loadPdfText() {
  if (!pdfTextPromise) {
    pdfTextPromise = (async () => {
      try {
        const response = await fetch(PDF_URL);
        if (!response.ok) {
          throw new Error(`pdf_fetch_${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const document = await getDocument({ data: new Uint8Array(buffer) })
          .promise;
        const pages = [];

        for (
          let pageNumber = 1;
          pageNumber <= document.numPages;
          pageNumber += 1
        ) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          const text = content.items
            .map((item) => item?.str || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

          if (text) {
            pages.push(text);
          }
        }

        return pages.join("\n\n").trim();
      } catch {
        return String(extractedPdfText || "").trim();
      }
    })().catch((error) => {
      pdfTextPromise = null;
      throw error;
    });
  }

  return pdfTextPromise;
}

async function loadSourceText() {
  if (!sourceTextPromise) {
    sourceTextPromise = loadPdfText().then((text) => {
      const fallbackText = String(extractedPdfText || "").trim();
      return String(text || fallbackText || "").trim();
    });
  }

  return sourceTextPromise;
}

function splitPdfChunks(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function buildPdfContext(userText, maxChunks = 1) {
  const fullText = await loadSourceText();
  if (!fullText) return "";

  const chunks = splitPdfChunks(fullText);
  if (chunks.length === 0) return "";

  const queryTokens = tokenize(userText);
  const scored = chunks
    .map((chunk, index) => {
      const haystack = normalizeText(chunk);
      const score = queryTokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );

      return { chunk, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = scored.some((item) => item.score > 0)
    ? scored.filter((item) => item.score > 0).slice(0, maxChunks)
    : scored.slice(0, maxChunks);

  const snippets = selected.map((item) => item.chunk.slice(0, 700));

  return [
    ...snippets.map(
      (snippet, index) => `- Trích đoạn ${index + 1}: ${snippet}`,
    ),
  ].join("\n");
}
