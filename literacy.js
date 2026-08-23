/**
 * VaakSiddhi - literacy.js
 * Handles lesson navigation, vocabulary card views, text-to-speech pronunciation, interactive quizzes,
 * and integration with Learner Profile skill tracking.
 */

document.addEventListener("DOMContentLoaded", () => {
  LiteracyModule.init();
});

const LiteracyModule = (() => {
  let lessonsData = [];
  let quizzesData = [];
  let currentLanguage = "Marathi";
  let activeLesson = null;
  let currentWordIndex = 0;
  
  // Voice Pronunciation Practice State
  let vocabRecognition = null;
  let vocabMediaRecorder = null;
  let vocabAudioStream = null;
  let vocabAudioChunks = [];
  let vocabAudioUrl = null;
  let isVocabRecording = false;
  let vocabRecordedTranscript = "";
  
  // Quiz active state
  let activeQuiz = null;
  let currentQuestionIndex = 0;
  let userQuizScore = 0;
  let quizAnswersLog = [];

  // DOM Elements
  const elements = {};

  function init() {
    cacheDOMElements();
    bindEvents();
    loadData();
  }

  function cacheDOMElements() {
    elements.languageSelect = document.getElementById("language-select");
    elements.categoryFilter = document.getElementById("category-filter");
    elements.lessonListContainer = document.getElementById("lesson-list-container");
    elements.lessonViewContainer = document.getElementById("lesson-view-container");
    elements.quizViewContainer = document.getElementById("quiz-view-container");
    elements.quizResultContainer = document.getElementById("quiz-result-container");
    
    // Lesson View Elements
    elements.lessonTitle = document.getElementById("lesson-title");
    elements.lessonDesc = document.getElementById("lesson-description");
    elements.wordNative = document.getElementById("word-native");
    elements.wordRomanized = document.getElementById("word-romanized");
    elements.wordMeaning = document.getElementById("word-meaning");
    elements.wordExample = document.getElementById("word-example");
    elements.pronounceBtn = document.getElementById("pronounce-btn");
    elements.prevWordBtn = document.getElementById("prev-word-btn");
    elements.nextWordBtn = document.getElementById("next-word-btn");
    elements.lessonProgressText = document.getElementById("lesson-progress-text");
    elements.lessonProgressBar = document.getElementById("lesson-progress-bar");
    elements.finishLessonBtn = document.getElementById("finish-lesson-btn");
    elements.startQuizBtn = document.getElementById("start-quiz-btn");
    elements.backToLessonsBtn = document.getElementById("back-to-lessons-btn");

    // Voice Practice DOM Elements
    elements.practiceSpeechBtn = document.getElementById("practice-speech-btn");
    elements.vocabSpeechPracticeBox = document.getElementById("vocab-speech-practice-box");
    elements.vocabStartRecBtn = document.getElementById("vocab-start-rec-btn");
    elements.vocabStopRecBtn = document.getElementById("vocab-stop-rec-btn");
    elements.vocabRecStatus = document.getElementById("vocab-rec-status");
    elements.vocabTranscriptDisplay = document.getElementById("vocab-transcript-display");
    elements.vocabAnalysisResult = document.getElementById("vocab-analysis-result");
    
    elements.vstep1 = document.getElementById("vstep-1");
    elements.vstep2 = document.getElementById("vstep-2");
    elements.vstep3 = document.getElementById("vstep-3");
    elements.vstep4 = document.getElementById("vstep-4");

    // Quiz Elements
    elements.quizTitle = document.getElementById("quiz-title");
    elements.quizProgressText = document.getElementById("quiz-progress-text");
    elements.quizProgressBar = document.getElementById("quiz-progress-bar");
    elements.questionText = document.getElementById("question-text");
    elements.quizOptionsContainer = document.getElementById("quiz-options-container");
    elements.quizFeedback = document.getElementById("quiz-feedback");
    elements.nextQuestionBtn = document.getElementById("next-question-btn");
  }

  function bindEvents() {
    if (elements.languageSelect) {
      elements.languageSelect.addEventListener("change", (e) => {
        currentLanguage = e.target.value;
        const user = window.VaakSiddhiStorage.getUserData();
        user.selectedLanguage = currentLanguage;
        window.VaakSiddhiStorage.saveUserData(user);
        renderLessonsList();
      });
    }

    if (elements.categoryFilter) {
      elements.categoryFilter.addEventListener("change", () => renderLessonsList());
    }

    if (elements.pronounceBtn) {
      elements.pronounceBtn.addEventListener("click", () => pronounceCurrentWord());
    }

    if (elements.practiceSpeechBtn) {
      elements.practiceSpeechBtn.addEventListener("click", () => toggleVocabSpeechPracticeBox());
    }

    if (elements.vocabStartRecBtn) {
      elements.vocabStartRecBtn.addEventListener("click", () => startVocabPronunciationWorkflow());
    }

    if (elements.vocabStopRecBtn) {
      elements.vocabStopRecBtn.addEventListener("click", () => stopVocabPronunciationWorkflow());
    }

    if (elements.prevWordBtn) {
      elements.prevWordBtn.addEventListener("click", () => navigateWord(-1));
    }

    if (elements.nextWordBtn) {
      elements.nextWordBtn.addEventListener("click", () => navigateWord(1));
    }

    if (elements.finishLessonBtn) {
      elements.finishLessonBtn.addEventListener("click", () => completeCurrentLesson());
    }

    if (elements.startQuizBtn) {
      elements.startQuizBtn.addEventListener("click", () => startLessonQuiz());
    }

    if (elements.backToLessonsBtn) {
      elements.backToLessonsBtn.addEventListener("click", () => showLessonListScreen());
    }

    if (elements.nextQuestionBtn) {
      elements.nextQuestionBtn.addEventListener("click", () => goToNextQuestion());
    }
  }

  async function loadData() {
    try {
      const [lessonsRes, quizzesRes] = await Promise.all([
        fetch("data/lessons.json"),
        fetch("data/quizzes.json")
      ]);

      if (!lessonsRes.ok || !quizzesRes.ok) {
        throw new Error("Failed to load lesson/quiz data files.");
      }

      lessonsData = await lessonsRes.json();
      quizzesData = await quizzesRes.json();

      const userData = window.VaakSiddhiStorage.getUserData();
      if (userData.selectedLanguage) {
        currentLanguage = userData.selectedLanguage;
        if (elements.languageSelect) elements.languageSelect.value = currentLanguage;
      }

      renderLessonsList();
    } catch (err) {
      console.error("VaakSiddhi Literacy Error:", err);
      if (elements.lessonListContainer) {
        elements.lessonListContainer.innerHTML = `
          <div style="background:#fee2e2; color:#991b1b; padding:20px; border-radius:12px; text-align:center;">
            <h3>⚠️ Error Loading Data</h3>
            <p>Could not load lessons data. Please ensure local server is running and data files exist.</p>
          </div>
        `;
      }
    }
  }

  function renderLessonsList() {
    if (!elements.lessonListContainer) return;

    showLessonListScreen();

    const selectedCategory = elements.categoryFilter ? elements.categoryFilter.value : "All";
    const completedLessons = window.VaakSiddhiStorage.getLessonProgress();

    const filtered = lessonsData.filter((lesson) => {
      const matchLang = lesson.language.toLowerCase() === currentLanguage.toLowerCase();
      const matchCat = selectedCategory === "All" || lesson.category === selectedCategory;
      return matchLang && matchCat;
    });

    if (filtered.length === 0) {
      elements.lessonListContainer.innerHTML = `
        <div style="text-align:center; padding: 40px; color: #64748b;">
          <p style="font-size:18px;">No lessons found for ${currentLanguage} in this category.</p>
        </div>
      `;
      return;
    }

    elements.lessonListContainer.innerHTML = "";
    filtered.forEach((lesson) => {
      const isCompleted = completedLessons.includes(lesson.id);

      const card = document.createElement("div");
      card.className = `lesson-card ${isCompleted ? 'completed' : ''}`;
      card.style.cssText = `
        background: #ffffff;
        border: 1px solid ${isCompleted ? '#bbf7d0' : '#e2e8f0'};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
      `;

      card.innerHTML = `
        <div>
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <span style="background:${isCompleted ? '#dcfce7' : '#e0f2fe'}; color:${isCompleted ? '#166534' : '#0369a1'}; font-size:12px; font-weight:600; padding:2px 8px; border-radius:12px;">${lesson.category}</span>
            <span style="font-size:12px; color:#64748b;">${lesson.words.length} Words</span>
            ${isCompleted ? '<span style="color:#22c55e; font-weight:bold;">✓ Completed</span>' : ''}
          </div>
          <h3 style="margin:0 0 4px 0; color:#0f172a; font-size:18px;">${lesson.title}</h3>
          <p style="margin:0; color:#64748b; font-size:14px;">${lesson.description}</p>
        </div>
        <button class="start-lesson-btn" style="background:#2563eb; color:#fff; border:none; padding:10px 18px; border-radius:10px; font-weight:600; cursor:pointer;">
          ${isCompleted ? 'Review' : 'Start (+50 XP)'}
        </button>
      `;

      card.addEventListener("click", () => openLesson(lesson));
      elements.lessonListContainer.appendChild(card);
    });
  }

  function openLesson(lesson) {
    activeLesson = lesson;
    currentWordIndex = 0;

    const user = window.VaakSiddhiStorage.getUserData();
    user.currentLessonId = lesson.id;
    window.VaakSiddhiStorage.saveUserData(user);

    if (elements.lessonListContainer) elements.lessonListContainer.style.display = "none";
    if (elements.quizViewContainer) elements.quizViewContainer.style.display = "none";
    if (elements.quizResultContainer) elements.quizResultContainer.style.display = "none";
    if (elements.lessonViewContainer) elements.lessonViewContainer.style.display = "block";

    if (elements.lessonTitle) elements.lessonTitle.innerText = lesson.title;
    if (elements.lessonDesc) elements.lessonDesc.innerText = lesson.description;

    renderWordCard();
  }

  function renderWordCard() {
    if (!activeLesson || !activeLesson.words || activeLesson.words.length === 0) return;

    const word = activeLesson.words[currentWordIndex];
    const totalWords = activeLesson.words.length;

    if (elements.wordNative) elements.wordNative.innerText = word.native || "";
    if (elements.wordRomanized) elements.wordRomanized.innerText = word.romanized ? `(${word.romanized})` : "";
    if (elements.wordMeaning) elements.wordMeaning.innerText = word.meaning || "";
    if (elements.wordExample) elements.wordExample.innerText = word.example ? `"${word.example}"` : "";

    if (elements.lessonProgressText) {
      elements.lessonProgressText.innerText = `Word ${currentWordIndex + 1} of ${totalWords}`;
    }

    if (elements.lessonProgressBar) {
      const pct = Math.round(((currentWordIndex + 1) / totalWords) * 100);
      elements.lessonProgressBar.style.width = `${pct}%`;
    }

    if (elements.prevWordBtn) {
      elements.prevWordBtn.disabled = currentWordIndex === 0;
      elements.prevWordBtn.style.opacity = currentWordIndex === 0 ? "0.5" : "1";
    }

    const isLastWord = currentWordIndex === totalWords - 1;
    if (elements.nextWordBtn) {
      elements.nextWordBtn.style.display = isLastWord ? "none" : "inline-block";
    }

    if (elements.finishLessonBtn) {
      elements.finishLessonBtn.style.display = isLastWord ? "inline-block" : "none";
    }

    resetVocabSpeechPracticeUI();
  }

  function setVocabWorkflowStep(stepNum) {
    const steps = [elements.vstep1, elements.vstep2, elements.vstep3, elements.vstep4];
    steps.forEach((st, idx) => {
      if (!st) return;
      if (idx + 1 === stepNum) {
        st.style.background = "#eff6ff";
        st.style.color = "#2563eb";
        st.style.border = "1px solid #bfdbfe";
      } else if (idx + 1 < stepNum) {
        st.style.background = "#f0fdf4";
        st.style.color = "#166534";
        st.style.border = "1px solid #bbf7d0";
      } else {
        st.style.background = "#f1f5f9";
        st.style.color = "#475569";
        st.style.border = "none";
      }
    });
  }

  function toggleVocabSpeechPracticeBox() {
    if (!elements.vocabSpeechPracticeBox) return;
    const isHidden = elements.vocabSpeechPracticeBox.style.display === "none";
    elements.vocabSpeechPracticeBox.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      setVocabWorkflowStep(1);
    }
  }

  function resetVocabSpeechPracticeUI() {
    setVocabWorkflowStep(1);
    if (elements.vocabSpeechPracticeBox) elements.vocabSpeechPracticeBox.style.display = "none";
    if (elements.vocabStartRecBtn) elements.vocabStartRecBtn.style.display = "inline-block";
    if (elements.vocabStopRecBtn) elements.vocabStopRecBtn.style.display = "none";
    if (elements.vocabRecStatus) elements.vocabRecStatus.style.display = "none";
    if (elements.vocabTranscriptDisplay) {
      elements.vocabTranscriptDisplay.innerText = "Click 'Request Mic & Speak Word' to begin...";
    }
    if (elements.vocabAnalysisResult) elements.vocabAnalysisResult.style.display = "none";
  }

  async function startVocabPronunciationWorkflow() {
    if (window.VaakSiddhiSubscription) {
      const allowed = window.VaakSiddhiSubscription.checkAndEnforceLimit("pronunciation", "Pronunciation Practice");
      if (!allowed) return;
    }

    vocabRecordedTranscript = "";
    vocabAudioChunks = [];

    setVocabWorkflowStep(1);

    try {
      vocabAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Mic permission error:", err);
      alert("Microphone permission was denied. Please allow microphone access in your browser settings.");
      return;
    }

    setVocabWorkflowStep(2);
    isVocabRecording = true;

    try {
      vocabMediaRecorder = new MediaRecorder(vocabAudioStream);
      vocabMediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) vocabAudioChunks.push(e.data);
      };
      vocabMediaRecorder.start();
    } catch (e) {
      console.warn("Vocab MediaRecorder error:", e);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      vocabRecognition = new SpeechRecognition();
      vocabRecognition.continuous = true;
      vocabRecognition.interimResults = true;

      const lang = activeLesson ? activeLesson.language.toLowerCase() : "marathi";
      if (lang === "marathi") vocabRecognition.lang = "mr-IN";
      else if (lang === "hindi") vocabRecognition.lang = "hi-IN";
      else if (lang === "kannada") vocabRecognition.lang = "kn-IN";
      else vocabRecognition.lang = "en-US";

      vocabRecognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (final) vocabRecordedTranscript += " " + final;
        const currentDisplay = (vocabRecordedTranscript + " " + interim).trim();
        if (elements.vocabTranscriptDisplay) {
          elements.vocabTranscriptDisplay.innerText = currentDisplay || "Listening...";
        }
      };

      try { vocabRecognition.start(); } catch (e) {}
    }

    if (elements.vocabStartRecBtn) elements.vocabStartRecBtn.style.display = "none";
    if (elements.vocabStopRecBtn) elements.vocabStopRecBtn.style.display = "inline-block";
    if (elements.vocabRecStatus) elements.vocabRecStatus.style.display = "block";
    if (elements.vocabAnalysisResult) elements.vocabAnalysisResult.style.display = "none";

    setVocabWorkflowStep(3);
  }

  function stopVocabPronunciationWorkflow() {
    if (!isVocabRecording) return;
    isVocabRecording = false;

    if (vocabRecognition) {
      try { vocabRecognition.stop(); } catch (e) {}
    }

    if (vocabMediaRecorder && vocabMediaRecorder.state !== "inactive") {
      vocabMediaRecorder.onstop = () => {
        const audioBlob = new Blob(vocabAudioChunks, { type: "audio/webm" });
        vocabAudioUrl = URL.createObjectURL(audioBlob);
        evaluateVocabPronunciation();
      };
      vocabMediaRecorder.stop();
    } else {
      evaluateVocabPronunciation();
    }

    if (vocabAudioStream) {
      vocabAudioStream.getTracks().forEach((track) => track.stop());
    }

    if (elements.vocabStartRecBtn) elements.vocabStartRecBtn.style.display = "inline-block";
    if (elements.vocabStopRecBtn) elements.vocabStopRecBtn.style.display = "none";
    if (elements.vocabRecStatus) elements.vocabRecStatus.style.display = "none";
  }

  function breakDownSyllables(word) {
    if (!word) return "";
    const clean = word.trim();
    if (clean.length <= 4) return clean.toUpperCase();
    const chunks = [];
    for (let i = 0; i < clean.length; i += 3) {
      chunks.push(clean.substring(i, i + 3));
    }
    return chunks.join(" - ").toUpperCase();
  }

  function evaluateVocabPronunciation() {
    setVocabWorkflowStep(4);

    if (!activeLesson || !activeLesson.words) return;
    const currentWordObj = activeLesson.words[currentWordIndex];
    if (!currentWordObj) return;

    let spokenRaw = (elements.vocabTranscriptDisplay ? elements.vocabTranscriptDisplay.innerText : vocabRecordedTranscript).trim();
    if (
      spokenRaw === "Click 'Request Mic & Speak Word' to begin..." ||
      spokenRaw === "Listening..." ||
      spokenRaw === "Listening"
    ) {
      spokenRaw = "";
    }

    const targetNative = (currentWordObj.native || "").toLowerCase().trim();
    const targetRomanized = (currentWordObj.romanized || "").toLowerCase().trim();
    const targetMeaning = (currentWordObj.meaning || "").toLowerCase().trim();
    
    const spokenClean = spokenRaw.toLowerCase().replace(/[^\w\u0900-\u097F\u0C80-\u0CFF\s]/g, "").trim();

    const syllableGuide = breakDownSyllables(currentWordObj.romanized || currentWordObj.native);

    let isCorrect = false;
    let matchAccuracy = 0;
    let badgeBg = "#fee2e2";
    let badgeText = "#991b1b";
    let badgeBorder = "#fca5a5";
    let statusTitle = "❌ Incorrect Pronunciation";
    let feedbackTips = [];
    let xpAwarded = 0;

    if (!spokenClean || spokenClean.length < 2) {
      isCorrect = false;
      matchAccuracy = 0;
      statusTitle = "❌ No Speech Detected / Could Not Hear You";
      badgeBg = "#fee2e2";
      badgeText = "#991b1b";
      badgeBorder = "#fca5a5";
      
      feedbackTips = [
        `🎙️ <strong>Microphone Check</strong>: Make sure your mic is unmuted and speak clearly into it.`,
        `🔊 <strong>Listen First</strong>: Click <strong>'🔊 Listen Native Audio'</strong> to hear the word model.`,
        `🗣️ <strong>How to Speak Properly</strong>: Say <strong>"${currentWordObj.romanized || currentWordObj.native}"</strong> immediately after clicking start.`
      ];
      xpAwarded = 0;
    } else {
      const simNative = calculateStringSimilarity(spokenClean, targetNative);
      const simRoman = calculateStringSimilarity(spokenClean, targetRomanized);
      const simMeaning = calculateStringSimilarity(spokenClean, targetMeaning);

      const maxSim = Math.max(simNative, simRoman, simMeaning);
      const directWordMatch =
        spokenClean.includes(targetNative) ||
        spokenClean.includes(targetRomanized) ||
        (targetMeaning.length > 3 && spokenClean.includes(targetMeaning));

      if (directWordMatch) {
        matchAccuracy = Math.max(90, Math.round(maxSim * 100));
        if (matchAccuracy < 90) matchAccuracy = 92;
      } else {
        matchAccuracy = Math.round(maxSim * 100);
      }

      if (matchAccuracy >= 65) {
        isCorrect = true;
        statusTitle = "✅ Excellent Pronunciation! Correct!";
        badgeBg = "#dcfce7";
        badgeText = "#15803d";
        badgeBorder = "#86efac";
        xpAwarded = 15;

        feedbackTips = [
          `🌟 <strong>Spot-on Enunciation!</strong> You accurately pronounced <strong>"${currentWordObj.native}" (${currentWordObj.romanized})</strong>.`,
          `🎯 <strong>Fluency Tip</strong>: Practice using this word in a full sentence to build natural rhythm.`
        ];
      } else if (matchAccuracy >= 40) {
        isCorrect = false;
        statusTitle = "⚠️ Mispronounced Word / Almost There!";
        badgeBg = "#ffedd5";
        badgeText = "#c2410c";
        badgeBorder = "#fdba74";
        xpAwarded = 5;

        feedbackTips = [
          `❌ <strong>Incorrect Pronunciation</strong>: You said <strong>"${spokenRaw}"</strong>, but the target word is <strong>"${currentWordObj.native}" (${currentWordObj.romanized})</strong>.`,
          `🔤 <strong>Syllable Breakdown Guide</strong>: Practice saying it slowly: <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-weight:800;">${syllableGuide}</span>`,
          `🔊 <strong>Step-by-Step Practice Tip</strong>: Listen to native audio model and repeat.`
        ];
      } else {
        isCorrect = false;
        statusTitle = "❌ Incorrect! Wrong Word Spoken";
        badgeBg = "#fee2e2";
        badgeText = "#991b1b";
        badgeBorder = "#fca5a5";
        xpAwarded = 0;

        feedbackTips = [
          `❌ <strong>Wrong Word</strong>: You said <strong>"${spokenRaw}"</strong>. Expected: <strong>"${currentWordObj.native}" (${currentWordObj.romanized})</strong>.`,
          `🔤 <strong>Phonetic Syllable Guide</strong>: <span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:6px; font-weight:800;">${syllableGuide}</span>`,
          `💡 <strong>How to Speak Properly</strong>: Ensure you speak in ${activeLesson ? activeLesson.language : 'target language'}.`
        ];
      }
    }

    // Update Learner Profile Skill Score for Pronunciation
    if (window.VaakSiddhiProfile) {
      window.VaakSiddhiProfile.updateSkillScore(currentLanguage, "pronunciation", matchAccuracy);
    }

    if (xpAwarded > 0) {
      window.VaakSiddhiStorage.addXP(xpAwarded, `Pronunciation Practice: ${currentWordObj.native || currentWordObj.meaning}`);
      window.VaakSiddhiStorage.updateStreak();
    }

    const tipsHTML = feedbackTips
      .map((tip) => `<li style="margin-bottom:8px; color:#1e293b; font-size:14px; line-height:1.5;">${tip}</li>`)
      .join("");

    if (elements.vocabAnalysisResult) {
      elements.vocabAnalysisResult.style.display = "block";
      elements.vocabAnalysisResult.innerHTML = `
        <div style="background:${isCorrect ? '#f0fdf4' : '#fff5f5'}; border:2px solid ${badgeBorder}; padding:20px; border-radius:16px; margin-top:14px; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <strong style="font-size:17px; color:${badgeText}; font-weight:800;">
              ${statusTitle}
            </strong>
            <span style="background:${badgeBg}; color:${badgeText}; font-weight:800; font-size:14px; padding:4px 12px; border-radius:12px; border:1px solid ${badgeBorder};">
              ${matchAccuracy}% Accuracy Match
            </span>
          </div>

          <div style="background:#ffffff; border:1px solid #cbd5e1; padding:12px 16px; border-radius:12px; margin-bottom:14px;">
            <div style="font-size:13px; color:#475569; margin-bottom:4px; font-weight:700;">Target Vocabulary Word:</div>
            <div style="font-size:18px; font-weight:800; color:#2563eb;">
              ${currentWordObj.native} <span style="font-size:15px; color:#475569; font-weight:600;">(${currentWordObj.romanized})</span>
            </div>
            <div style="font-size:13px; color:#64748b; margin-top:2px;">Meaning: "${currentWordObj.meaning}"</div>
            
            <hr style="border:0; border-top:1px dashed #e2e8f0; margin:10px 0;" />
            
            <div style="font-size:13px; color:#475569; margin-bottom:2px; font-weight:700;">What You Spoke:</div>
            <div style="font-size:16px; font-weight:700; color:${isCorrect ? '#166534' : '#991b1b'};">
              "${spokenRaw || 'No speech recognized'}"
            </div>
          </div>

          ${
            vocabAudioUrl
              ? `
            <div style="background:#ffffff; border:1px solid #cbd5e1; padding:10px; border-radius:10px; margin-bottom:14px;">
              <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:4px;">🎧 Your Voice Playback:</div>
              <audio controls src="${vocabAudioUrl}" style="width:100%; border-radius:6px; outline:none;"></audio>
            </div>
          `
              : ""
          }

          <div style="background:#ffffff; border-left:4px solid ${isCorrect ? '#22c55e' : '#ef4444'}; padding:14px; border-radius:10px; margin-bottom:12px;">
            <strong style="font-size:14px; color:#0f172a; display:block; margin-bottom:6px;">💡 Feedback & Tips to Speak Properly:</strong>
            <ul style="margin:0; padding-left:18px;">${tipsHTML}</ul>
          </div>

          <div style="font-size:13px; font-weight:700; color:${xpAwarded > 0 ? '#b45309' : '#64748b'}; text-align:right;">
            ${xpAwarded > 0 ? `🎉 XP Earned: +${xpAwarded} XP` : `Practice again to earn XP!`}
          </div>
        </div>
      `;
    }
  }

  function calculateStringSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    let longer = s1.length > s2.length ? s1 : s2;
    let shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
  }

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function navigateWord(direction) {
    if (!activeLesson) return;
    const newIdx = currentWordIndex + direction;
    if (newIdx >= 0 && newIdx < activeLesson.words.length) {
      currentWordIndex = newIdx;
      renderWordCard();
    }
  }

  function pronounceCurrentWord() {
    if (!activeLesson) return;
    const word = activeLesson.words[currentWordIndex];
    if (!word) return;

    if (window.VaakSiddhiAudio) {
      window.VaakSiddhiAudio.speakWordWithModel(word, activeLesson.language);
    } else {
      const textToSpeak = word.native || word.meaning;
      if (!('speechSynthesis' in window)) {
        alert("Text-to-Speech is not supported in your browser.");
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.85;

      const lang = activeLesson.language.toLowerCase();
      if (lang === "marathi") utterance.lang = "mr-IN";
      else if (lang === "hindi") utterance.lang = "hi-IN";
      else if (lang === "kannada") utterance.lang = "kn-IN";
      else utterance.lang = "en-US";

      window.speechSynthesis.speak(utterance);
    }
  }

  function completeCurrentLesson() {
    if (!activeLesson) return;

    window.VaakSiddhiStorage.saveLessonProgress(activeLesson.id, activeLesson.words, activeLesson.language);
    window.VaakSiddhiStorage.addXP(50, `Completed: ${activeLesson.title}`);
    const currentStreak = window.VaakSiddhiStorage.updateStreak();

    // Update Learner Profile Vocabulary Skill Score
    const user = window.VaakSiddhiStorage.getUserData();
    const wordsLearnedCount = (user.wordsLearned || []).length;
    const totalLangWords = lessonsData
      .filter((l) => l.language.toLowerCase() === currentLanguage.toLowerCase())
      .reduce((acc, l) => acc + (l.words ? l.words.length : 0), 0) || 15;
    
    const vocabScore = Math.min(100, Math.round((wordsLearnedCount / totalLangWords) * 100));

    if (window.VaakSiddhiProfile) {
      window.VaakSiddhiProfile.updateSkillScore(currentLanguage, "vocabulary", vocabScore);
    }

    window.VaakSiddhiStorage.showToastNotification(
      "🎉 Lesson Complete!",
      `+50 XP | 🔥 ${currentStreak} Day Streak!`,
      "levelup"
    );

    const matchingQuiz = quizzesData.find((q) => q.lessonId === activeLesson.id || q.language === activeLesson.language);
    if (matchingQuiz && confirm("Great job! Would you like to test your knowledge with a quiz now?")) {
      openQuiz(matchingQuiz);
    } else {
      renderLessonsList();
    }
  }

  function startLessonQuiz() {
    if (!activeLesson) return;
    const matchingQuiz = quizzesData.find((q) => q.lessonId === activeLesson.id) || quizzesData.find((q) => q.language === activeLesson.language);
    if (matchingQuiz) {
      openQuiz(matchingQuiz);
    } else {
      alert("No quiz available for this specific lesson yet!");
    }
  }

  function openQuiz(quiz) {
    activeQuiz = quiz;
    currentQuestionIndex = 0;
    userQuizScore = 0;
    quizAnswersLog = [];

    if (elements.lessonViewContainer) elements.lessonViewContainer.style.display = "none";
    if (elements.lessonListContainer) elements.lessonListContainer.style.display = "none";
    if (elements.quizResultContainer) elements.quizResultContainer.style.display = "none";
    if (elements.quizViewContainer) elements.quizViewContainer.style.display = "block";

    if (elements.quizTitle) elements.quizTitle.innerText = quiz.title;

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) return;

    const q = activeQuiz.questions[currentQuestionIndex];
    const totalQ = activeQuiz.questions.length;

    if (elements.quizProgressText) {
      elements.quizProgressText.innerText = `Question ${currentQuestionIndex + 1} of ${totalQ}`;
    }

    if (elements.quizProgressBar) {
      const pct = Math.round(((currentQuestionIndex + 1) / totalQ) * 100);
      elements.quizProgressBar.style.width = `${pct}%`;
    }

    if (elements.questionText) elements.questionText.innerText = q.question;
    if (elements.quizFeedback) {
      elements.quizFeedback.style.display = "none";
      elements.quizFeedback.innerText = "";
    }

    if (elements.nextQuestionBtn) {
      elements.nextQuestionBtn.style.display = "none";
    }

    if (elements.quizOptionsContainer) {
      elements.quizOptionsContainer.innerHTML = "";
      q.options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option-btn";
        btn.style.cssText = `
          display: block;
          width: 100%;
          text-align: left;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 10px;
          font-size: 16px;
          font-weight: 500;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s;
        `;
        btn.innerText = opt;
        btn.addEventListener("click", () => handleAnswerSelect(opt, q, btn));
        elements.quizOptionsContainer.appendChild(btn);
      });
    }
  }

  function handleAnswerSelect(selectedOption, questionObj, selectedBtn) {
    const allBtns = elements.quizOptionsContainer.querySelectorAll(".quiz-option-btn");
    allBtns.forEach((b) => (b.disabled = true));

    const isCorrect = selectedOption.trim() === questionObj.answer.trim();

    if (isCorrect) {
      userQuizScore++;
      selectedBtn.style.background = "#dcfce7";
      selectedBtn.style.borderColor = "#22c55e";
      selectedBtn.style.color = "#15803d";
      window.VaakSiddhiStorage.addXP(10, "Correct Quiz Answer");
    } else {
      selectedBtn.style.background = "#fee2e2";
      selectedBtn.style.borderColor = "#ef4444";
      selectedBtn.style.color = "#b91c1c";

      allBtns.forEach((b) => {
        if (b.innerText.trim() === questionObj.answer.trim()) {
          b.style.background = "#dcfce7";
          b.style.borderColor = "#22c55e";
        }
      });
    }

    if (elements.quizFeedback) {
      elements.quizFeedback.style.display = "block";
      elements.quizFeedback.style.cssText = `
        display: block;
        padding: 12px 16px;
        border-radius: 10px;
        margin-top: 15px;
        background: ${isCorrect ? '#f0fdf4' : '#fff1f2'};
        color: ${isCorrect ? '#166534' : '#9f1239'};
        border: 1px solid ${isCorrect ? '#bbf7d0' : '#fecdd3'};
      `;
      elements.quizFeedback.innerText = isCorrect
        ? `Correct! +10 XP 🎉 ${questionObj.explanation || ''}`
        : `Not quite. Correct answer: ${questionObj.answer}. ${questionObj.explanation || ''}`;
    }

    if (elements.nextQuestionBtn) {
      elements.nextQuestionBtn.style.display = "inline-block";
      elements.nextQuestionBtn.innerText =
        currentQuestionIndex === activeQuiz.questions.length - 1 ? "View Final Score" : "Next Question →";
    }
  }

  function goToNextQuestion() {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      currentQuestionIndex++;
      renderQuizQuestion();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const totalQ = activeQuiz.questions.length;
    const accuracy = Math.round((userQuizScore / totalQ) * 100);

    let xpEarned = userQuizScore * 10 + 25;
    let isPerfect = accuracy === 100;
    if (isPerfect) xpEarned += 50;

    window.VaakSiddhiStorage.addXP(xpEarned, `Quiz Completed: ${activeQuiz.title}`);
    window.VaakSiddhiStorage.saveQuizResult(activeQuiz.id, userQuizScore, totalQ, accuracy, currentLanguage);
    window.VaakSiddhiStorage.updateStreak();

    // Update Learner Profile Quiz Skill Score
    if (window.VaakSiddhiProfile) {
      window.VaakSiddhiProfile.updateSkillScore(currentLanguage, "quiz", accuracy);
    }

    if (elements.quizViewContainer) elements.quizViewContainer.style.display = "none";
    if (elements.quizResultContainer) {
      elements.quizResultContainer.style.display = "block";
      elements.quizResultContainer.innerHTML = `
        <div style="background:#ffffff; border-radius:20px; padding:30px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.08); max-width:500px; margin:0 auto;">
          <h2 style="font-size:28px; margin-bottom:10px; color:#0f172a;">${isPerfect ? '🌟 Perfect Score!' : '🎉 Quiz Complete!'}</h2>
          <div style="font-size:48px; font-weight:800; color:#2563eb; margin:15px 0;">${userQuizScore} / ${totalQ}</div>
          <p style="font-size:18px; color:#475569; margin-bottom:20px;">
            Accuracy: <strong>${accuracy}%</strong> | XP Earned: <strong style="color:#eab308;">+${xpEarned} XP</strong>
          </p>
          <div style="display:flex; gap:12px; justify-center; margin-top:25px;">
            <button id="retry-quiz-btn" style="flex:1; background:#f1f5f9; color:#334155; border:none; padding:12px 20px; border-radius:12px; font-weight:600; cursor:pointer;">
              Retry Quiz
            </button>
            <button id="finish-quiz-nav-btn" style="flex:1; background:#2563eb; color:#ffffff; border:none; padding:12px 20px; border-radius:12px; font-weight:600; cursor:pointer;">
              Continue Learning
            </button>
          </div>
        </div>
      `;

      document.getElementById("retry-quiz-btn")?.addEventListener("click", () => openQuiz(activeQuiz));
      document.getElementById("finish-quiz-nav-btn")?.addEventListener("click", () => renderLessonsList());
    }
  }

  function showLessonListScreen() {
    if (elements.lessonListContainer) elements.lessonListContainer.style.display = "block";
    if (elements.lessonViewContainer) elements.lessonViewContainer.style.display = "none";
    if (elements.quizViewContainer) elements.quizViewContainer.style.display = "none";
    if (elements.quizResultContainer) elements.quizResultContainer.style.display = "none";
  }

  return {
    init,
    openLesson,
    openQuiz,
    renderLessonsList
  };
})();
