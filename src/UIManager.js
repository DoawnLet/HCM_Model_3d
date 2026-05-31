export class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks; // callbacks: { onStartGame, onReplay, onAudioToggle }

    this.dom = {
      loadingScreen: document.getElementById("loading-screen"),
      mainMenu: document.getElementById("main-menu"),
      gameHud: document.getElementById("game-hud"),
      quizDialog: document.getElementById("quiz-dialog"),
      victoryScreen: document.getElementById("victory-screen"),

      // HUD values
      playerScore: document.getElementById("player-score"),
      unityProgressText: document.getElementById("unity-progress-text"),
      unityProgressFill: document.getElementById("unity-progress-fill"),
      interactionPrompt: document.getElementById("interaction-prompt"),
      targetPedestalName: document.getElementById("target-pedestal-name"),
      questText: document.getElementById("quest-text"),

      // Quiz overlay content
      classIcon: document.getElementById("class-icon"),
      classTitle: document.getElementById("class-title"),
      classQuote: document.getElementById("class-quote"),
      classSummary: document.getElementById("class-summary"),
      classDetails: document.getElementById("class-details"),
      quizQuestion: document.getElementById("quiz-question"),
      quizOptions: document.getElementById("quiz-options"),
      quizFeedback: document.getElementById("quiz-feedback"),
      classImage: document.getElementById("class-image"),
      classImageCaption: document.getElementById("class-image-caption"),

      // Action buttons
      startGameBtn: document.getElementById("start-game-btn"),
      replayBtn: document.getElementById("replay-btn"),
      closeQuizBtn: document.getElementById("close-quiz-btn"),
      audioToggleBtn: document.getElementById("audio-toggle-btn"),
      helpToggleBtn: document.getElementById("help-toggle-btn"),
      qualitySelect: document.getElementById("quality-select"),

      // Victory values
      finalScore: document.getElementById("final-score"),
    };

    this.initEvents();
  }

  initEvents() {
    // Start Game
    if (this.dom.startGameBtn) {
      this.dom.startGameBtn.addEventListener("click", () => {
        if (this.callbacks.onStartGame) this.callbacks.onStartGame();
      });
    }

    // Replay Game
    if (this.dom.replayBtn) {
      this.dom.replayBtn.addEventListener("click", () => {
        if (this.callbacks.onReplay) this.callbacks.onReplay();
      });
    }

    // Close Quiz
    if (this.dom.closeQuizBtn) {
      this.dom.closeQuizBtn.addEventListener("click", () => {
        this.closeQuiz();
      });
    }

    // Toggle Audio (kept basic for now as requested by user)
    if (this.dom.audioToggleBtn) {
      this.dom.audioToggleBtn.addEventListener("click", () => {
        if (this.callbacks.onAudioToggle) this.callbacks.onAudioToggle();
      });
    }

    // Help Button
    if (this.dom.helpToggleBtn) {
      this.dom.helpToggleBtn.addEventListener("click", () => {
        this.showMainMenu();
      });
    }

    // Quality Selector
    if (this.dom.qualitySelect) {
      this.dom.qualitySelect.addEventListener("change", (event) => {
        if (this.callbacks.onQualityChange) {
          this.callbacks.onQualityChange(event.target.value);
        }
      });
    }
  }

  hideLoader() {
    if (this.dom.loadingScreen) {
      this.dom.loadingScreen.classList.add("hidden");
    }
  }

  showMainMenu() {
    if (this.dom.mainMenu) this.dom.mainMenu.classList.add("active");
    if (this.dom.gameHud) this.dom.gameHud.classList.add("hidden");
  }

  hideMainMenu() {
    if (this.dom.mainMenu) this.dom.mainMenu.classList.remove("active");
    if (this.dom.gameHud) this.dom.gameHud.classList.remove("hidden");
  }

  setQualityValue(value) {
    if (this.dom.qualitySelect) this.dom.qualitySelect.value = value;
  }

  showInteractionPrompt(pedestalName) {
    if (this.dom.interactionPrompt) {
      this.dom.targetPedestalName.innerText = pedestalName;
      this.dom.interactionPrompt.classList.remove("hidden");
    }
  }

  hideInteractionPrompt() {
    if (this.dom.interactionPrompt) {
      this.dom.interactionPrompt.classList.add("hidden");
    }
  }

  openQuiz(classInfo, onAnswerCallback) {
    if (!this.dom.quizDialog) return;

    // Reset scroll position to top
    const scrollBody = this.dom.quizDialog.querySelector('.scroll-body');
    if (scrollBody) scrollBody.scrollTop = 0;

    // Set Texts
    if (this.dom.classIcon) this.dom.classIcon.innerText = classInfo.icon;
    this.dom.classTitle.innerText = classInfo.title;
    this.dom.classTitle.style.color = classInfo.hexColor;
    this.dom.classQuote.innerText = classInfo.quote;
    this.dom.classSummary.innerText = classInfo.summary;
    this.dom.quizQuestion.innerText = classInfo.quiz.question;

    if (this.dom.classImage) {
      this.dom.classImage.src = classInfo.image || "./assets/doan-ket.jpg";
    }
    if (this.dom.classImageCaption) {
      this.dom.classImageCaption.innerText = classInfo.imageCaption || "Ảnh tư liệu";
    }

    const articleMeta = document.getElementById("article-meta");
    const articleSubtitle = document.getElementById("article-subtitle");
    const articleEyebrow = document.getElementById("article-eyebrow");
    if (articleMeta) articleMeta.textContent = "Số đặc biệt: Tư tưởng Hồ Chí Minh";
    if (articleSubtitle) articleSubtitle.textContent = "Thứ Ba, Ngày 22 tháng 10 năm 2024";
    if (articleEyebrow) articleEyebrow.textContent = "ẤN PHẨM ĐẶC BIỆT • TÀI LIỆU LỊCH SỬ";

    // Details Box
    if (this.dom.classDetails) {
      this.dom.classDetails.innerHTML = "";

      if (Array.isArray(classInfo.sections) && classInfo.sections.length > 0) {
        classInfo.sections.forEach((section, idx) => {
          const sectionEl = document.createElement("section");
          sectionEl.className = "lesson-section newspaper-section";

          const labelRow = document.createElement("div");
          labelRow.className = "section-label-row";

          const badge = document.createElement("span");
          badge.className = "section-badge";
          badge.textContent = String.fromCharCode(65 + idx);
          labelRow.appendChild(badge);

          const heading = document.createElement("h3");
          heading.className = "lesson-section-title";
          heading.textContent = section.title;
          labelRow.appendChild(heading);
          sectionEl.appendChild(labelRow);

          if (Array.isArray(section.paragraphs) && section.paragraphs.length > 0) {
            const leadRow = document.createElement("div");
            leadRow.className = "newspaper-paragraph-row";
            const dropCap = document.createElement("span");
            dropCap.className = "drop-cap";
            dropCap.textContent = section.paragraphs[0].trim().charAt(0).toUpperCase();
            const leadText = document.createElement("p");
            leadText.textContent = section.paragraphs[0].slice(1);
            leadRow.appendChild(dropCap);
            leadRow.appendChild(leadText);
            sectionEl.appendChild(leadRow);

            section.paragraphs.slice(1).forEach((paragraph) => {
              const p = document.createElement("p");
              p.textContent = paragraph;
              sectionEl.appendChild(p);
            });
          }

          if (Array.isArray(section.bullets) && section.bullets.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "lesson-bullets";
            section.bullets.forEach((bullet) => {
              const li = document.createElement("li");
              li.textContent = bullet;
              ul.appendChild(li);
            });
            sectionEl.appendChild(ul);
          }

          if (section.quote) {
            const blockquote = document.createElement("blockquote");
            blockquote.className = "lesson-quote newspaper-quote";
            blockquote.textContent = section.quote;
            sectionEl.appendChild(blockquote);
          }

          if (section.conclusion) {
            const conclusion = document.createElement("p");
            conclusion.className = "lesson-conclusion newspaper-conclusion";
            conclusion.textContent = section.conclusion;
            sectionEl.appendChild(conclusion);
          }

          this.dom.classDetails.appendChild(sectionEl);
        });
      } else {
        classInfo.details.forEach((detail) => {
          const p = document.createElement("p");
          p.textContent = detail;
          this.dom.classDetails.appendChild(p);
        });
      }
    }

    // Options Buttons Grid
    if (this.dom.quizOptions) {
      this.dom.quizOptions.innerHTML = "";
      classInfo.quiz.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.addEventListener("click", () => {
          // Lock inputs temporarily during feedback animation
          const optionsBtns =
            this.dom.quizOptions.querySelectorAll(".option-btn");
          optionsBtns.forEach((b) => (b.style.pointerEvents = "none"));

          const isCorrect = idx === classInfo.quiz.answer;
          if (isCorrect) {
            btn.classList.add("correct");
            this.showFeedback(true, "CHÍNH XÁC! Thử thách đã được hoàn thành.");
          } else {
            btn.classList.add("wrong");
            this.showFeedback(
              false,
              "Chưa đúng. Hãy xem kỹ tóm tắt bảo tàng bên trên và thử lại!",
            );
            setTimeout(() => {
              btn.classList.remove("wrong");
              optionsBtns.forEach((b) => (b.style.pointerEvents = "auto"));
              this.hideFeedback();
            }, 2200);
          }

          onAnswerCallback(isCorrect);
        });
        this.dom.quizOptions.appendChild(btn);
      });
    }

    this.hideFeedback();
    this.dom.quizDialog.classList.remove("hidden");
    this.dom.quizDialog.classList.add("active");
  }

  closeQuiz() {
    if (this.dom.quizDialog) {
      this.dom.quizDialog.classList.remove("active");
      this.dom.quizDialog.classList.add("hidden");
    }
    this.hideInteractionPrompt();
  }

  showFeedback(isSuccess, message) {
    if (this.dom.quizFeedback) {
      this.dom.quizFeedback.className = "quiz-feedback-msg";
      this.dom.quizFeedback.classList.add(isSuccess ? "success" : "error");
      this.dom.quizFeedback.innerText = message;
      this.dom.quizFeedback.classList.remove("hidden");
    }
  }

  hideFeedback() {
    if (this.dom.quizFeedback) {
      this.dom.quizFeedback.classList.add("hidden");
    }
  }

  updateHUD(score, completedCount, totalCount) {
    if (this.dom.playerScore) this.dom.playerScore.innerText = score;
    if (this.dom.unityProgressText)
      this.dom.unityProgressText.innerText = `${completedCount}/${totalCount}`;
    if (this.dom.unityProgressFill) {
      this.dom.unityProgressFill.style.width = `${(completedCount / totalCount) * 100}%`;
    }
  }

  updateQuest(text) {
    if (this.dom.questText) {
      this.dom.questText.innerText = text;
    }
  }

  markChecklistCompleted(classId) {
    const item = document.getElementById(`chk-${classId}`);
    if (item) item.classList.add("completed");
  }

  resetChecklist(classData) {
    classData.forEach((c) => {
      const item = document.getElementById(`chk-${c.id}`);
      if (item) item.classList.remove("completed");
    });
  }

  showVictoryScreen(score) {
    if (this.dom.finalScore) this.dom.finalScore.innerText = score;
    if (this.dom.victoryScreen) {
      this.dom.victoryScreen.classList.remove("hidden");
      this.dom.victoryScreen.classList.add("active");
    }
    if (this.dom.gameHud) this.dom.gameHud.classList.add("hidden");
  }

  hideVictoryScreen() {
    if (this.dom.victoryScreen) {
      this.dom.victoryScreen.classList.remove("active");
      this.dom.victoryScreen.classList.add("hidden");
    }
    if (this.dom.gameHud) this.dom.gameHud.classList.remove("hidden");
  }
}
