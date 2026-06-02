import * as THREE from "three";
import { createChatResponder } from "./chatService.js";
import { MILESTONES_CANONICAL } from "../data/milestones_canonical.js";

function formatChatMessage(text) {
  if (!text) return "";
  
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Convert **bold** to <strong>bold</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert [link text](url) to target="_blank" links
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');

  // Convert line breaks to <br>
  escaped = escaped.replace(/\n/g, "<br>");

  return escaped;
}

function createMessageNode(role, text) {
  const row = document.createElement("div");
  row.className = `chat-message chat-message-${role}`;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble-${role}`;
  bubble.innerHTML = formatChatMessage(text);

  row.appendChild(bubble);
  return row;
}

function buildChatTopic(classInfo) {
  const summary = String(classInfo?.summary || "").trim();
  if (!summary) return "Chủ đề tương tác";

  const firstSentence = summary.split(/[.!?]/)[0].trim();
  if (!firstSentence) return "Chủ đề tương tác";

  return firstSentence.length > 72
    ? `${firstSentence.slice(0, 69).trim()}...`
    : firstSentence;
}

export class ChatManager {
  constructor({ sceneManager, onOpenQuiz } = {}) {
    this.sceneManager = sceneManager || null;
    this.onOpenQuiz = onOpenQuiz || null;
    this.responder = createChatResponder();
    this.activeClassInfo = null;
    this.activeRoomObject = null;
    this.isVisible = false;
    this.hideBubbleTimer = null;
    this.worldBubble = new THREE.Vector3();
    this.conversation = [];

    this.dom = {
      overlay: document.getElementById("chat-dialog"),
      panel: document.getElementById("chat-panel"),
      title: document.getElementById("chat-title"),
      subtitle: document.getElementById("chat-subtitle"),
      summary: document.getElementById("chat-summary"),
      messages: document.getElementById("chat-messages"),
      input: document.getElementById("chat-input"),
      sendBtn: document.getElementById("chat-send-btn"),
      closeBtn: document.getElementById("close-chat-btn"),
      quizBtn: document.getElementById("chat-quiz-btn"),
      suggestions: document.getElementById("chat-suggestions"),
      typing: document.getElementById("chat-typing"),
      bubble: document.getElementById("chat-speech-bubble"),
      bubbleText: document.getElementById("chat-speech-bubble-text"),
    };

    this.initEvents();
  }

  initEvents() {
    if (this.dom.sendBtn) {
      this.dom.sendBtn.addEventListener("click", () => {
        this.submitMessage();
      });
    }

    if (this.dom.closeBtn) {
      this.dom.closeBtn.addEventListener("click", () => {
        this.close();
      });
    }

    if (this.dom.quizBtn) {
      this.dom.quizBtn.addEventListener("click", () => {
        if (this.onOpenQuiz && this.activeClassInfo) {
          this.close();
          this.onOpenQuiz(this.activeClassInfo.id);
        }
      });
    }

    if (this.dom.input) {
      this.dom.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          this.submitMessage();
        } else if (event.key === "Escape") {
          this.close();
        }
      });
    }
  }

  isOpen() {
    return this.isVisible;
  }

  open(classInfo, roomObject = null) {
    if (!classInfo || !this.dom.overlay) return;

    this.activeClassInfo = classInfo;
    this.activeRoomObject = roomObject;
    this.isVisible = true;
    this.conversation = [];
    const topicLabel = buildChatTopic(classInfo);

    if (this.dom.title) this.dom.title.textContent = "Chủ đề tương tác";
    if (this.dom.subtitle)
      this.dom.subtitle.textContent = classInfo.icon
        ? `${classInfo.icon} ${topicLabel}`
        : topicLabel;
    if (this.dom.summary)
      this.dom.summary.textContent = `Trao đổi theo từng mốc nội dung, nhưng không lặp nguyên văn tên mốc. Chủ đề hiện tại: ${topicLabel}.`;
    if (this.dom.messages) this.dom.messages.innerHTML = "";

    this.appendMessage(
      "assistant",
      `Chào bạn, hãy hỏi tôi về nội dung đang trưng bày hoặc các mốc liên quan theo cách bạn muốn.`,
    );
    this.conversation.push({
      role: "assistant",
      text: `Chào bạn, hãy hỏi tôi về nội dung đang trưng bày hoặc các mốc liên quan theo cách bạn muốn.`,
    });

    this.showBubble("Hãy hỏi về chủ đề bạn quan tâm.");
    this.renderSuggestions(classInfo);
    this.dom.overlay.classList.remove("hidden");
    this.dom.overlay.classList.add("active");

    if (this.dom.input) {
      this.dom.input.value = "";
      window.setTimeout(() => this.dom.input.focus(), 0);
    }
  }

  close() {
    if (!this.dom.overlay) return;
    this.dom.overlay.classList.remove("active");
    this.dom.overlay.classList.add("hidden");
    this.isVisible = false;
    this.activeClassInfo = null;
    this.activeRoomObject = null;
    this.conversation = [];
    this.hideBubble();
  }

  appendMessage(role, text) {
    if (!this.dom.messages || !text) return;
    this.dom.messages.appendChild(createMessageNode(role, text));
    this.dom.messages.scrollTop = this.dom.messages.scrollHeight;
  }

  setTyping(active) {
    if (!this.dom.typing) return;
    this.dom.typing.classList.toggle("hidden", !active);
  }

  async submitMessage() {
    if (!this.isVisible || !this.activeClassInfo || !this.dom.input) return;

    const text = this.dom.input.value.trim();
    if (!text) return;

    this.dom.input.value = "";
    this.appendMessage("user", text);
    this.conversation.push({ role: "user", text });
    this.setTyping(true);

    const { reply, activeClassInfo } = await this.responder.reply({
      classInfo: this.activeClassInfo,
      userText: text,
      history: this.conversation,
    });

    this.setTyping(false);
    this.appendMessage("assistant", reply);
    this.conversation.push({ role: "assistant", text: reply });

    if (activeClassInfo && activeClassInfo.id !== this.activeClassInfo.id) {
      this.switchActiveMilestone(activeClassInfo);
    }

    this.showBubble(reply);
  }

  switchActiveMilestone(classInfo) {
    if (!classInfo) return;

    this.activeClassInfo = classInfo;
    const topicLabel = buildChatTopic(classInfo);

    if (this.dom.title) this.dom.title.textContent = "Chủ đề tương tác";
    if (this.dom.subtitle) {
      this.dom.subtitle.textContent = classInfo.icon
        ? `${classInfo.icon} ${topicLabel}`
        : topicLabel;
    }
    if (this.dom.summary) {
      this.dom.summary.textContent = `Trao đổi theo từng mốc nội dung, nhưng không lặp nguyên văn tên mốc. Chủ đề hiện tại: ${topicLabel}.`;
    }

    this.renderSuggestions(classInfo);

    if (this.sceneManager && this.sceneManager.scene) {
      const newRoomObject = this.sceneManager.scene.getObjectByName(classInfo.id);
      if (newRoomObject) {
        this.activeRoomObject = newRoomObject;
      }
    }
  }

  showBubble(text) {
    if (!this.dom.bubble || !this.dom.bubbleText) return;

    // Clean up or strip markdown sources from the 3D speech bubble to keep it clean and compact
    let cleanText = text.split("🌐 **Nguồn tham khảo từ Google Search:**")[0].trim();
    if (cleanText.length > 120) {
      cleanText = cleanText.slice(0, 117) + "...";
    }

    this.dom.bubbleText.textContent = cleanText;
    this.dom.bubble.classList.remove("hidden");

    if (this.hideBubbleTimer) {
      window.clearTimeout(this.hideBubbleTimer);
    }

    this.hideBubbleTimer = window.setTimeout(() => {
      this.hideBubble();
    }, 4200);
  }

  hideBubble() {
    if (this.dom.bubble) {
      this.dom.bubble.classList.add("hidden");
    }
    if (this.hideBubbleTimer) {
      window.clearTimeout(this.hideBubbleTimer);
      this.hideBubbleTimer = null;
    }
  }

  update(camera, renderer) {
    if (
      !this.isVisible ||
      !this.activeRoomObject ||
      !this.dom.bubble ||
      !camera ||
      !renderer
    ) {
      return;
    }

    const bubbleTarget =
      this.activeRoomObject.getObjectByName("topLotus") ||
      this.activeRoomObject;
    bubbleTarget.updateWorldMatrix?.(true, false);
    this.worldBubble.setFromMatrixPosition(bubbleTarget.matrixWorld);
    this.worldBubble.y += 4.5;

    const projected = this.worldBubble.clone().project(camera);
    if (projected.z > 1) {
      this.dom.bubble.classList.add("hidden");
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const x = (projected.x + 1) * 0.5 * rect.width + rect.left;
    const y = (1 - projected.y) * 0.5 * rect.height + rect.top;

    this.dom.bubble.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
    this.dom.bubble.classList.remove("hidden");
  }

  renderSuggestions(classInfo) {
    if (!this.dom.suggestions) return;
    this.dom.suggestions.innerHTML = "";

    // Find canonical entry by id, fallback to find by title match
    let canonical = MILESTONES_CANONICAL.find((m) => m.id === classInfo?.id);
    if (!canonical) {
      canonical = MILESTONES_CANONICAL.find((m) =>
        (classInfo?.title || "")
          .toLowerCase()
          .includes((m.id || "").toLowerCase()),
      );
    }
    if (!canonical) canonical = MILESTONES_CANONICAL[0];

    const list = document.createElement("div");
    list.className = "suggestions-list";

    (canonical.qas || []).slice(0, 4).forEach((qa) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion-btn glass";
      btn.textContent = qa.q;
      btn.addEventListener("click", () => {
        if (this.dom.input) {
          this.dom.input.value = qa.q;
          this.dom.input.focus();
        }
      });
      list.appendChild(btn);
    });

    this.dom.suggestions.appendChild(list);
  }
}
