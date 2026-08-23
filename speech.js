/**
 * VaakSiddhi - speech.js
 * AI Speech Coach & Public Speaking Practice Module integrated with Speech Structure Analysis,
 * Real-World Scenarios (Student, Interview, Professional, Presentation, Debate, Impromptu),
 * Gamified Improvement XP, and Adaptive Recommendation Engine.
 */

document.addEventListener("DOMContentLoaded", () => {
  SpeechPracticeModule.init();
});

const SpeechPracticeModule = (() => {
  let topicsData = [];
  let fillerWordsData = {};
  let selectedTopic = null;
  let activeScenarioMode = "student";
  let activeLanguage = "English";

  // Speech Recognition & Recording states
  let recognition = null;
  let mediaRecorder = null;
  let audioStream = null;
  let audioChunks = [];
  let audioPlaybackUrl = null;
  
  let isRecording = false;
  let startTime = null;
  let timerInterval = null;
  let impromptuTimerInterval = null;
  let speechDurationSeconds = 0;
  let recordedTranscript = "";

  const elements = {};

  const SCENARIOS = {
    student: {
      id: "student",
      title: "🎓 Student Mode: Introduce Yourself",
      prompt: "Introduce yourself to a new class. Speak about your background, major/interests, and future goals.",
      difficulty: "Beginner",
      modeName: "Student Mode"
    },
    interview: {
      id: "interview",
      title: "💼 Interview Mode: Tell Me About Yourself",
      prompt: "Tell me about yourself. Highlight your key strengths, achievements, and why you are suited for this opportunity.",
      difficulty: "Intermediate",
      modeName: "Interview Mode"
    },
    professional: {
      id: "professional",
      title: "🧑‍💼 Professional Mode: Project Update",
      prompt: "Present your project to your manager. Explain project goals, current status, key deliverables, and next milestones.",
      difficulty: "Advanced",
      modeName: "Professional Mode"
    },
    presentation: {
      id: "presentation",
      title: "🎤 Presentation Mode: 2-Minute Pitch",
      prompt: "Explain your project in 2 minutes. Clearly outline the core problem, your solution, key features, and impact.",
      difficulty: "Advanced",
      modeName: "Presentation Mode"
    },
    debate: {
      id: "debate",
      title: "🗳️ Debate Mode: Mandatory Attendance",
      prompt: "Should college attendance be mandatory? Present a persuasive argument with clear reasoning and supporting evidence.",
      difficulty: "Advanced",
      modeName: "Debate Mode"
    },
    impromptu: {
      id: "impromptu",
      title: "📰 Impromptu Mode: Instant Topic Pitch",
      prompt: "Spin a random topic and take 10 seconds to organize your thoughts before speaking!",
      difficulty: "Master",
      modeName: "Impromptu Mode"
    }
  };

  const IMPROMPTU_TOPICS = [
    "Why mistakes are often our best teachers in life.",
    "How artificial intelligence will transform daily learning.",
    "If you could visit any historical era, which would you choose and why?",
    "The importance of reading books in a digital screen age.",
    "Why teamwork accomplishes more than individual effort.",
    "What makes a truly inspiring leader?",
    "Should physical education be compulsory in every college curriculum?"
  ];

  function init() {
    cacheDOMElements();
    bindEvents();
    loadSpeechData();
  }

  function cacheDOMElements() {
    elements.topicSelect = document.getElementById("topic-select");
    elements.scenarioLangSelect = document.getElementById("scenario-language-select");
    elements.scenariosGrid = document.getElementById("scenarios-grid");
    elements.topicTitle = document.getElementById("topic-title");
    elements.topicPrompt = document.getElementById("topic-prompt");
    elements.topicDifficulty = document.getElementById("topic-difficulty");
    elements.topicLanguage = document.getElementById("topic-language");
    elements.impromptuSpinBtn = document.getElementById("impromptu-spin-btn");
    elements.impromptuPrepBox = document.getElementById("impromptu-prep-box");
    elements.impromptuTimerNum = document.getElementById("impromptu-timer-num");
    elements.startPrepBtn = document.getElementById("start-prep-btn");
    
    elements.startRecordBtn = document.getElementById("start-record-btn");
    elements.stopRecordBtn = document.getElementById("stop-record-btn");
    elements.recordingStatus = document.getElementById("recording-status");
    elements.timerDisplay = document.getElementById("timer-display");
    elements.liveTranscript = document.getElementById("live-transcript");
    elements.liveWordCount = document.getElementById("live-word-count");
    elements.speechResultsContainer = document.getElementById("speech-results-container");
    elements.adaptiveRecContainer = document.getElementById("speech-adaptive-rec-container");
    elements.unsupportedAlert = document.getElementById("unsupported-alert");
    
    elements.step1 = document.getElementById("step-1");
    elements.step2 = document.getElementById("step-2");
    elements.step3 = document.getElementById("step-3");
    elements.step4 = document.getElementById("step-4");
  }

  function setWorkflowStep(stepNum) {
    const steps = [elements.step1, elements.step2, elements.step3, elements.step4];
    steps.forEach((st, idx) => {
      if (!st) return;
      if (idx + 1 === stepNum) {
        st.style.borderColor = "#2563eb";
        st.style.background = "#eff6ff";
        st.style.boxShadow = "0 4px 12px rgba(37,99,235,0.15)";
      } else if (idx + 1 < stepNum) {
        st.style.borderColor = "#22c55e";
        st.style.background = "#f0fdf4";
        st.style.boxShadow = "none";
      } else {
        st.style.borderColor = "#e2e8f0";
        st.style.background = "#ffffff";
        st.style.boxShadow = "none";
      }
    });
  }

  function bindEvents() {
    // Scenario Cards Selection
    if (elements.scenariosGrid) {
      elements.scenariosGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".scenario-card");
        if (!card) return;

        const mode = card.dataset.mode;
        if (!mode || !SCENARIOS[mode]) return;

        activeScenarioMode = mode;
        
        // Update Card Styles
        document.querySelectorAll(".scenario-card").forEach((c) => {
          c.classList.remove("active-scenario");
          c.style.border = "1.5px dashed #3d131f";
          c.style.boxShadow = "2px 2px 0px #3d131f";
        });
        card.classList.add("active-scenario");
        card.style.border = "2px solid #3d131f";
        card.style.boxShadow = "3px 3px 0px #3d131f";

        renderScenarioDetails();
        if (window.VaakSiddhiAudio) window.VaakSiddhiAudio.playClick();
      });
    }

    // Language Selector
    if (elements.scenarioLangSelect) {
      elements.scenarioLangSelect.addEventListener("change", (e) => {
        activeLanguage = e.target.value;
        if (elements.topicLanguage) elements.topicLanguage.innerText = activeLanguage;
      });
    }

    // Custom Topic Select
    if (elements.topicSelect) {
      elements.topicSelect.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        const topic = topicsData.find((t) => t.id === selectedId);
        if (topic) {
          selectedTopic = topic;
          if (elements.topicTitle) elements.topicTitle.innerText = topic.title;
          if (elements.topicPrompt) elements.topicPrompt.innerText = topic.prompt;
          if (elements.topicDifficulty) elements.topicDifficulty.innerText = topic.difficulty || "Beginner";
          if (elements.topicLanguage) {
            elements.topicLanguage.innerText = topic.language || "English";
            activeLanguage = topic.language || "English";
            if (elements.scenarioLangSelect) elements.scenarioLangSelect.value = activeLanguage;
          }
        }
      });
    }

    // Spin Impromptu Topic Button
    if (elements.impromptuSpinBtn) {
      elements.impromptuSpinBtn.addEventListener("click", () => {
        spinImpromptuTopic();
        if (window.VaakSiddhiAudio) window.VaakSiddhiAudio.playClick();
      });
    }

    // Start 10s Prep Timer Button
    if (elements.startPrepBtn) {
      elements.startPrepBtn.addEventListener("click", startImpromptuPrepTimer);
    }

    // Listen Prompt Audio Button
    const listenPromptBtn = document.getElementById("listen-prompt-audio-btn");
    if (listenPromptBtn) {
      listenPromptBtn.addEventListener("click", () => {
        const textToSpeak = elements.topicPrompt ? elements.topicPrompt.innerText : "Practice your speech now.";
        if (window.VaakSiddhiAudio) {
          window.VaakSiddhiAudio.speakText(textToSpeak, activeLanguage);
        }
      });
    }

    if (elements.startRecordBtn) {
      elements.startRecordBtn.addEventListener("click", handleStartSpeakingWorkflow);
    }

    if (elements.stopRecordBtn) {
      elements.stopRecordBtn.addEventListener("click", stopRecordingWorkflow);
    }
  }

  function renderScenarioDetails() {
    const sc = SCENARIOS[activeScenarioMode] || SCENARIOS.student;
    
    if (elements.topicTitle) elements.topicTitle.innerText = sc.title;
    if (elements.topicPrompt) elements.topicPrompt.innerText = `"${sc.prompt}"`;
    if (elements.topicDifficulty) elements.topicDifficulty.innerText = `🎯 ${sc.modeName}`;
    if (elements.topicLanguage) elements.topicLanguage.innerText = activeLanguage;

    if (activeScenarioMode === "impromptu") {
      if (elements.impromptuSpinBtn) elements.impromptuSpinBtn.style.display = "inline-flex";
      if (elements.impromptuPrepBox) elements.impromptuPrepBox.style.display = "block";
      spinImpromptuTopic();
    } else {
      if (elements.impromptuSpinBtn) elements.impromptuSpinBtn.style.display = "none";
      if (elements.impromptuPrepBox) elements.impromptuPrepBox.style.display = "none";
    }

    resetSpeechStateUI();
  }

  function spinImpromptuTopic() {
    const randomTopic = IMPROMPTU_TOPICS[Math.floor(Math.random() * IMPROMPTU_TOPICS.length)];
    if (elements.topicTitle) elements.topicTitle.innerText = "📰 Impromptu Mode: Random Topic";
    if (elements.topicPrompt) elements.topicPrompt.innerText = `"${randomTopic}"`;
  }

  function startImpromptuPrepTimer() {
    if (impromptuTimerInterval) clearInterval(impromptuTimerInterval);

    let timeLeft = 10;
    if (elements.impromptuTimerNum) elements.impromptuTimerNum.innerText = timeLeft;
    if (elements.startPrepBtn) elements.startPrepBtn.disabled = true;

    impromptuTimerInterval = setInterval(() => {
      timeLeft--;
      if (elements.impromptuTimerNum) elements.impromptuTimerNum.innerText = timeLeft;
      
      if (window.VaakSiddhiAudio) window.VaakSiddhiAudio.playClick();

      if (timeLeft <= 0) {
        clearInterval(impromptuTimerInterval);
        if (elements.startPrepBtn) elements.startPrepBtn.disabled = false;
        if (window.VaakSiddhiAudio) window.VaakSiddhiAudio.playSuccessChime();
        handleStartSpeakingWorkflow();
      }
    }, 1000);
  }

  async function loadSpeechData() {
    try {
      const [topicsRes, fillerRes] = await Promise.all([
        fetch("data/topics.json"),
        fetch("data/fillerwords.json")
      ]);

      if (topicsRes.ok) topicsData = await topicsRes.json();
      if (fillerRes.ok) fillerWordsData = await fillerRes.json();

      populateTopicSelector();
      initSpeechRecognition();
      renderScenarioDetails();
      setWorkflowStep(1);
    } catch (err) {
      console.error("VaakSiddhi Speech Data Load Issue:", err);
    }
  }

  function populateTopicSelector() {
    if (!elements.topicSelect || !topicsData.length) return;

    elements.topicSelect.innerHTML = `<option value="">Custom Prompt Selector...</option>`;
    topicsData.forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.innerText = `${topic.title} (${topic.language})`;
      elements.topicSelect.appendChild(opt);
    });
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (elements.unsupportedAlert) elements.unsupportedAlert.style.display = "block";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) recordedTranscript += " " + final;

      const displayText = (recordedTranscript + " " + interim).trim();
      if (elements.liveTranscript) {
        elements.liveTranscript.innerText = displayText || "Listening...";
      }

      const wordCount = displayText ? displayText.split(/\s+/).filter(Boolean).length : 0;
      if (elements.liveWordCount) {
        elements.liveWordCount.innerText = `${wordCount} Words`;
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech Recognition Error:", event.error);
    };

    recognition.onend = () => {
      if (isRecording && recognition) {
        try { recognition.start(); } catch (e) {}
      }
    };
  }

  async function handleStartSpeakingWorkflow() {
    if (window.VaakSiddhiSubscription) {
      const allowed = window.VaakSiddhiSubscription.checkAndEnforceLimit("public_speaking", "Public Speaking Practice");
      if (!allowed) return;
    }

    recordedTranscript = "";
    audioChunks = [];
    speechDurationSeconds = 0;

    setWorkflowStep(1);

    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Microphone access was denied. Please allow mic permissions in browser settings.");
      return;
    }

    setWorkflowStep(2);
    isRecording = true;

    try {
      mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };
      mediaRecorder.start();
    } catch (e) {}

    if (recognition) {
      const langLower = activeLanguage.toLowerCase();
      if (langLower === "marathi") recognition.lang = "mr-IN";
      else if (langLower === "hindi") recognition.lang = "hi-IN";
      else if (langLower === "kannada") recognition.lang = "kn-IN";
      else recognition.lang = "en-US";

      try { recognition.start(); } catch (err) {}
    }

    startTime = Date.now();
    timerInterval = setInterval(() => {
      speechDurationSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (elements.timerDisplay) {
        const mins = String(Math.floor(speechDurationSeconds / 60)).padStart(2, "0");
        const secs = String(speechDurationSeconds % 60).padStart(2, "0");
        elements.timerDisplay.innerText = `${mins}:${secs}`;
      }
    }, 1000);

    if (elements.startRecordBtn) elements.startRecordBtn.style.display = "none";
    if (elements.stopRecordBtn) elements.stopRecordBtn.style.display = "inline-block";
    if (elements.recordingStatus) elements.recordingStatus.style.display = "block";
    if (elements.liveTranscript) elements.liveTranscript.innerText = "Listening live... Speak clearly into your microphone.";
    if (elements.liveWordCount) elements.liveWordCount.innerText = "0 Words";
    if (elements.speechResultsContainer) elements.speechResultsContainer.style.display = "none";

    setWorkflowStep(3);
  }

  function stopRecordingWorkflow() {
    if (!isRecording) return;
    isRecording = false;

    if (timerInterval) clearInterval(timerInterval);

    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        audioPlaybackUrl = URL.createObjectURL(audioBlob);
        analyzeSpeechResults();
      };
      mediaRecorder.stop();
    } else {
      analyzeSpeechResults();
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    if (elements.startRecordBtn) elements.startRecordBtn.style.display = "inline-block";
    if (elements.stopRecordBtn) elements.stopRecordBtn.style.display = "none";
    if (elements.recordingStatus) elements.recordingStatus.style.display = "none";
  }

  function analyzeSpeechStructure(rawText, language) {
    const text = rawText.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const totalWordCount = words.length;

    const markers = {
      intro: ["hello", "hi", "good morning", "good afternoon", "welcome", "my name", "today i", "introduce", "first of all", "namaste", "namaskar", "नमस्कार", "आज मी", "माझे नाव", "नमस्ते", "मेरा नाम", "ನಮಸ್ಕಾರ", "ಇಂದು ನಾನು"],
      mainArg: ["main point", "argument", "because", "the reason", "believe that", "in my opinion", "primary goal", "key reason", "important", "crucial", "therefore", "essential", "focus", "मुख्य", "कारण", "माझे मत", "म्हणून", "मेरा मानना", "इसलिए", "ಅಗತ್ಯ", "ಪ್ರಮುಖ"],
      examples: ["for example", "for instance", "such as", "studies show", "an example", "case study", "data shows", "like when", "to illustrate", "according to", "उदाहरणार्थ", "उदाहरणावरून", "जसे की", "उदाहरण के लिए", "जैसे कि", "ಉದಾಹರಣೆಗೆ"],
      conclusion: ["in conclusion", "to summarize", "to sum up", "finally", "thank you", "in summary", "overall", "closing", "thank you for your time", "lastly", "to conclude", "शेवटी", "निष्कर्ष", "धन्यवाद", "अंत में", "ಕೊನೆಯಲ್ಲಿ", "ಧನ್ಯವಾದಗಳು"]
    };

    let introFound = markers.intro.some(m => text.includes(m)) || totalWordCount >= 10;
    let mainArgFound = markers.mainArg.some(m => text.includes(m)) || totalWordCount >= 18;
    let examplesFound = markers.examples.some(m => text.includes(m));
    let conclusionFound = markers.conclusion.some(m => text.includes(m));

    let introScore = introFound ? (text.indexOf(markers.intro.find(m => text.includes(m)) || "") < 120 ? 100 : 75) : 30;
    let mainArgScore = mainArgFound ? 90 : 40;
    let examplesScore = examplesFound ? 95 : (totalWordCount > 35 ? 65 : 30);
    let conclusionScore = conclusionFound ? 100 : 35;

    if (totalWordCount < 8) {
      introScore = 0;
      mainArgScore = 0;
      examplesScore = 0;
      conclusionScore = 0;
    }

    const getStatus = (score) => {
      if (score >= 75) return { symbol: "✓", text: "Strong", color: "#166534", fill: score };
      if (score >= 45) return { symbol: "⚠", text: "Moderate", color: "#b45309", fill: score };
      return { symbol: "✗", text: "Weak / Missing", color: "#dc2626", fill: Math.max(15, score) };
    };

    const introStatus = getStatus(introScore);
    const mainArgStatus = getStatus(mainArgScore);
    const examplesStatus = getStatus(examplesScore);
    const conclusionStatus = getStatus(conclusionScore);

    const structuralAdvice = [];
    if (conclusionScore < 60) {
      structuralAdvice.push("Your speech needs a stronger conclusion. Try ending with 'In conclusion...' or 'Thank you for your time' to wrap up effectively.");
    }
    if (examplesScore < 60) {
      structuralAdvice.push("Add supporting examples using phrases like 'For example...' or 'For instance...' to back up your main points.");
    }
    if (mainArgScore < 60) {
      structuralAdvice.push("Clarify your main argument using explicit transition phrases like 'The main point is...' or 'In my opinion...'.");
    }
    if (introScore < 60) {
      structuralAdvice.push("Begin with a warm greeting and introduction like 'Hello everyone, today I want to present...' to set the stage.");
    }
    if (structuralAdvice.length === 0) {
      structuralAdvice.push("🌟 Flawless Speech Structure! You included a crisp Introduction, solid Main Argument, clear Examples, and a memorable Conclusion!");
    }

    return {
      intro: { score: introScore, ...introStatus },
      mainArg: { score: mainArgScore, ...mainArgStatus },
      examples: { score: examplesScore, ...examplesStatus },
      conclusion: { score: conclusionScore, ...conclusionStatus },
      structuralAdvice
    };
  }

  function analyzeSpeechResults() {
    setWorkflowStep(4);

    let rawText = (elements.liveTranscript ? elements.liveTranscript.innerText : recordedTranscript).trim();
    if (
      rawText === "Click 'Request Mic & Start Speaking' to begin..." ||
      rawText === "Listening live... Speak clearly into your microphone." ||
      rawText === "Listening..." ||
      rawText === "Listening"
    ) {
      rawText = "";
    }

    const wordsArray = rawText.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = wordsArray.length;

    // Handle empty speech or less than 4 words
    if (wordCount < 4) {
      const feedbackTips = [
        `❌ <strong>No Speech Recognized / Speech Too Short</strong>: We detected only ${wordCount} word(s). Speak at least 10–15 words clearly for analysis.`,
        `🎙️ <strong>Microphone Check</strong>: Ensure your microphone permissions are granted.`,
        `🗣️ <strong>Practice Guidance</strong>: Read the prompt and speak 3-4 complete sentences.`
      ];

      renderDetailedScoreCard({
        score: 0,
        rating: "❌ Speech Unclear or Too Short",
        wordCount,
        durationSec: speechDurationSeconds,
        wpm: 0,
        paceRating: "No Speech Detected",
        fillersMap: {},
        fillerCount: 0,
        vocabDiversityPct: 0,
        transcript: rawText || "No intelligible speech detected from microphone.",
        audioUrl: audioPlaybackUrl,
        feedbackTips,
        xpAwarded: 0,
        isError: true,
        evalResult: null,
        structure: analyzeSpeechStructure("", activeLanguage)
      });
      return;
    }

    // WPM calculation
    const effectiveSecs = Math.max(2, speechDurationSeconds);
    const wpm = Math.round((wordCount / effectiveSecs) * 60);

    // Language Filler Words Scan
    const languageFillers = fillerWordsData[activeLanguage] || fillerWordsData["English"] || ["um", "uh", "like"];
    const detectedFillersMap = {};
    let totalFillerCount = 0;

    wordsArray.forEach((w) => {
      const cleanWord = w.replace(/[^\w\u0900-\u097F\u0C80-\u0CFF]/g, "");
      if (languageFillers.includes(cleanWord)) {
        detectedFillersMap[cleanWord] = (detectedFillersMap[cleanWord] || 0) + 1;
        totalFillerCount++;
      }
    });

    // Vocabulary Diversity Ratio
    const uniqueWords = new Set(wordsArray.map((w) => w.replace(/[^\w]/g, "")));
    const vocabDiversityPct = wordCount > 0 ? Math.round((uniqueWords.size / wordCount) * 100) : 0;

    // Perform Speech Structure Analysis
    const structure = analyzeSpeechStructure(rawText, activeLanguage);

    // Scoring Rules
    let baseScore = 100;
    const fillerPenalty = Math.min(36, totalFillerCount * 6);
    baseScore -= fillerPenalty;

    if (wordCount < 10) baseScore -= 25;
    else if (wordCount < 18) baseScore -= 10;
    else if (wordCount >= 30) baseScore += 5;

    let paceRating = "Optimal Pace";
    if (wpm < 70) {
      baseScore -= 12;
      paceRating = "❌ Too Slow / Hesitant";
    } else if (wpm > 180) {
      baseScore -= 12;
      paceRating = "❌ Too Fast / Rushed";
    } else {
      paceRating = "✅ Optimal Natural Pace";
    }

    // Structure Score Influence
    const avgStructure = Math.round((structure.intro.score + structure.mainArg.score + structure.examples.score + structure.conclusion.score) / 4);
    if (avgStructure < 50) baseScore -= 15;

    const finalScore = Math.min(100, Math.max(15, baseScore));
    const fluencyScore = Math.min(100, Math.max(10, finalScore - fillerPenalty / 2));
    const pronunciationScore = Math.min(100, Math.max(20, finalScore));
    const fillerScore = Math.max(0, 100 - totalFillerCount * 12);

    let rating = "Needs Practice";
    let isError = false;

    if (finalScore >= 80) rating = "✅ Excellent Public Speech! 🌟";
    else if (finalScore >= 60) rating = "👍 Good Structure & Delivery";
    else if (finalScore >= 40) { rating = "⚠️ Needs Structure Improvement"; isError = true; }
    else { rating = "❌ Poor Speech Delivery"; isError = true; }

    const feedbackTips = [];
    if (totalFillerCount > 0) {
      feedbackTips.push(`❌ <strong>Filler Words (${totalFillerCount}x)</strong>: Detected (${Object.keys(detectedFillersMap).map(w => `"${w}"`).join(', ')}). Pause silently instead of using fillers.`);
    } else {
      feedbackTips.push("✨ <strong>Zero Fillers</strong>: Impressive vocal clarity!");
    }

    if (wpm < 70) feedbackTips.push(`⏱️ <strong>Pace Too Slow (${wpm} WPM)</strong>: Increase speaking speed for better audience engagement.`);
    else if (wpm > 180) feedbackTips.push(`⏱️ <strong>Pace Too Fast (${wpm} WPM)</strong>: Slow down to ensure every word is understood.`);
    else feedbackTips.push(`🎯 <strong>Optimal Speaking Speed (${wpm} WPM)</strong>: Excellent conversational pace.`);

    const currentTopicTitle = elements.topicTitle ? elements.topicTitle.innerText : "Public Speaking";

    const attemptResultObj = {
      topic: `${SCENARIOS[activeScenarioMode]?.modeName || 'Speech'}: ${currentTopicTitle}`,
      score: finalScore,
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      fillerScore: fillerScore,
      wordCount: wordCount,
      fillerCount: totalFillerCount
    };

    const evalResult = window.VaakSiddhiProfile.addSpeakingAttempt(activeLanguage, attemptResultObj);
    window.VaakSiddhiStorage.updateStreak();

    renderDetailedScoreCard({
      score: finalScore,
      rating,
      wordCount,
      durationSec: speechDurationSeconds,
      wpm,
      paceRating,
      fillersMap: detectedFillersMap,
      fillerCount: totalFillerCount,
      vocabDiversityPct,
      transcript: rawText,
      audioUrl: audioPlaybackUrl,
      feedbackTips,
      xpAwarded: evalResult.totalXP,
      isError,
      evalResult,
      structure
    });

    if (window.VaakSiddhiAdaptive && elements.adaptiveRecContainer) {
      window.VaakSiddhiAdaptive.renderRecommendationCard("speech-adaptive-rec-container", activeLanguage);
    }
  }

  function renderDetailedScoreCard(data) {
    if (!elements.speechResultsContainer) return;

    elements.speechResultsContainer.style.display = "block";

    let fillerListHTML = "";
    if (data.fillerCount > 0) {
      fillerListHTML = Object.entries(data.fillersMap)
        .map(([word, count]) => `<span style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:12px; font-size:13px; font-weight:700;">"${word}": ${count}x</span>`)
        .join(" ");
    } else {
      fillerListHTML = `<span style="color:#166534; font-weight:700;">✨ Zero filler words detected! Outstanding delivery clarity!</span>`;
    }

    const tipsHTML = data.feedbackTips
      .map((tip) => `<li style="margin-bottom:8px; color:#1e293b; font-size:14px; line-height:1.5;">${tip}</li>`)
      .join("");

    const badgeBg = data.isError ? (data.score === 0 ? '#fee2e2' : '#ffedd5') : '#dcfce7';
    const badgeText = data.isError ? (data.score === 0 ? '#991b1b' : '#c2410c') : '#15803d';
    const badgeBorder = data.isError ? (data.score === 0 ? '#fca5a5' : '#fdba74') : '#86efac';

    let improvementBannerHTML = "";
    if (data.evalResult) {
      const res = data.evalResult;
      improvementBannerHTML = `
        <div style="background:linear-gradient(135deg, #1e1b4b, #312e81); color:#ffffff; padding:18px 22px; border-radius:16px; margin-bottom:20px; box-shadow:0 8px 20px rgba(49,46,129,0.25);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h4 style="margin:0; font-size:18px; color:#fef08a;">🎉 Public Speaking Performance & XP Report</h4>
              <div style="font-size:14px; margin-top:4px; opacity:0.95;">
                Previous Score: <strong>${res.previousScore}</strong> | Current Score: <strong>${res.currentScore}</strong>
                ${res.improvement > 0 ? ` | Improvement: <span style="color:#4ade80; font-weight:800;">+${res.improvement}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:22px; font-weight:800; color:#facc15;">+${res.totalXP} XP</span>
              <div style="font-size:12px; opacity:0.85;">Base: +${res.baseXP} XP | Bonus: +${res.bonusXP} XP</div>
            </div>
          </div>
        </div>
      `;
    }

    const st = data.structure;

    elements.speechResultsContainer.innerHTML = `
      <div style="background:#ffffff; border-radius:20px; padding:28px; border:2px solid ${badgeBorder}; box-shadow:0 10px 30px rgba(0,0,0,0.08); margin-top:20px;">
        
        ${improvementBannerHTML}

        <!-- Header & Overall Speech Score -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:18px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="margin:0; font-size:24px; color:#0f172a;">🗣️ AI Speech Coach Score Page</h3>
            <span style="color:#64748b; font-size:14px; font-weight:600;">Scenario: ${SCENARIOS[activeScenarioMode]?.modeName || 'Public Speaking'} (${activeLanguage})</span>
          </div>
          <div style="text-align:right;">
            <div style="font-size:38px; font-weight:800; color:${data.isError ? '#dc2626' : '#2563eb'};">${data.score} <span style="font-size:18px; color:#64748b;">/100</span></div>
            <span style="background:${badgeBg}; color:${badgeText}; font-weight:800; font-size:13px; padding:4px 14px; border-radius:14px; border:1px solid ${badgeBorder};">${data.rating}</span>
          </div>
        </div>

        <!-- AI Speech Structure Analysis Block -->
        <div style="background:#fffdf0; border:2px dashed #3d131f; padding:20px; border-radius:18px; margin-bottom:22px;">
          <h4 style="margin:0 0 12px 0; font-size:18px; color:#3d131f; font-family:'Playfair Display', serif;">
            📊 AI Speech Structure Analysis
          </h4>
          <p style="font-size:13px; color:#6b4c55; margin-bottom:14px;">
            Academic & Professional Presentation Flow: <strong>Introduction → Main Argument → Examples → Conclusion</strong>
          </p>

          <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
            
            <!-- Introduction -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:800; color:#3d131f; margin-bottom:4px;">
                <span>Introduction</span>
                <span style="color:${st.intro.color}">${st.intro.text} (${st.intro.symbol})</span>
              </div>
              <div style="background:#e2e8f0; height:12px; border-radius:6px; overflow:hidden;">
                <div style="width:${st.intro.fill}%; background:${st.intro.color}; height:100%; transition:width 0.5s ease;"></div>
              </div>
            </div>

            <!-- Main Argument -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:800; color:#3d131f; margin-bottom:4px;">
                <span>Main Argument</span>
                <span style="color:${st.mainArg.color}">${st.mainArg.text} (${st.mainArg.symbol})</span>
              </div>
              <div style="background:#e2e8f0; height:12px; border-radius:6px; overflow:hidden;">
                <div style="width:${st.mainArg.fill}%; background:${st.mainArg.color}; height:100%; transition:width 0.5s ease;"></div>
              </div>
            </div>

            <!-- Supporting Ideas / Examples -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:800; color:#3d131f; margin-bottom:4px;">
                <span>Supporting Ideas / Examples</span>
                <span style="color:${st.examples.color}">${st.examples.text} (${st.examples.symbol})</span>
              </div>
              <div style="background:#e2e8f0; height:12px; border-radius:6px; overflow:hidden;">
                <div style="width:${st.examples.fill}%; background:${st.examples.color}; height:100%; transition:width 0.5s ease;"></div>
              </div>
            </div>

            <!-- Conclusion -->
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:800; color:#3d131f; margin-bottom:4px;">
                <span>Conclusion</span>
                <span style="color:${st.conclusion.color}">${st.conclusion.text} (${st.conclusion.symbol})</span>
              </div>
              <div style="background:#e2e8f0; height:12px; border-radius:6px; overflow:hidden;">
                <div style="width:${st.conclusion.fill}%; background:${st.conclusion.color}; height:100%; transition:width 0.5s ease;"></div>
              </div>
            </div>

          </div>

          <!-- Coach Guidance Box -->
          <div style="background:#fce7f3; padding:14px; border-radius:12px; border:1px solid #fbcfe8;">
            <strong style="font-size:14px; color:#78263e; display:block; margin-bottom:6px;">💬 AI Speech Coach Guidance:</strong>
            <ul style="margin:0; padding-left:20px; font-size:13px; color:#3d131f;">
              ${st.structuralAdvice.map(adv => `<li style="margin-bottom:4px;">${adv}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Audio Playback -->
        ${
          data.audioUrl
            ? `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:14px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:14px; color:#0f172a;">🎧 Playback Recorded Speech (${data.durationSec}s):</strong>
            </div>
            <audio controls src="${data.audioUrl}" style="width:100%; border-radius:8px; outline:none;"></audio>
          </div>
        `
            : ""
        }

        <!-- Metrics Grid -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:20px;">
          <div style="background:#f8fafc; padding:14px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Speaking Pace</div>
            <div style="font-size:20px; font-weight:800; color:#2563eb; margin-top:2px;">${data.wpm} <span style="font-size:12px;">WPM</span></div>
            <div style="font-size:11px; color:#475569; font-weight:600;">${data.paceRating}</div>
          </div>

          <div style="background:#f8fafc; padding:14px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Word Count</div>
            <div style="font-size:20px; font-weight:800; color:#0f172a; margin-top:2px;">${data.wordCount}</div>
            <div style="font-size:11px; color:#475569; font-weight:600;">${data.durationSec}s duration</div>
          </div>

          <div style="background:#f8fafc; padding:14px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Filler Words</div>
            <div style="font-size:20px; font-weight:800; color:${data.fillerCount > 0 ? '#ef4444' : '#22c55e'}; margin-top:2px;">${data.fillerCount}</div>
            <div style="font-size:11px; color:#475569; font-weight:600;">Count</div>
          </div>

          <div style="background:#f8fafc; padding:14px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
            <div style="font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase;">Vocab Diversity</div>
            <div style="font-size:20px; font-weight:800; color:#a855f7; margin-top:2px;">${data.vocabDiversityPct}%</div>
            <div style="font-size:11px; color:#475569; font-weight:600;">Unique ratio</div>
          </div>

          <div style="background:#fef3c7; padding:14px; border-radius:12px; text-align:center; border:1px solid #fde68a;">
            <div style="font-size:12px; color:#92400e; font-weight:700; text-transform:uppercase;">XP Earned</div>
            <div style="font-size:20px; font-weight:800; color:#b45309; margin-top:2px;">+${data.xpAwarded} XP</div>
            <div style="font-size:11px; color:#92400e; font-weight:600;">Practice Total</div>
          </div>
        </div>

        <!-- Fillers -->
        <div style="margin-bottom:18px; background:#fafafa; padding:14px; border-radius:12px; border:1px solid #f1f5f9;">
          <strong style="font-size:14px; color:#334155; display:block; margin-bottom:8px;">Filler Words Analysis:</strong>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">${fillerListHTML}</div>
        </div>

        <!-- Feedback -->
        <div style="margin-bottom:18px; background:${data.isError ? '#fff5f5' : '#eff6ff'}; padding:18px; border-radius:14px; border:1px solid ${data.isError ? '#fca5a5' : '#bfdbfe'};">
          <strong style="font-size:15px; color:${data.isError ? '#b91c1c' : '#1e40af'}; display:block; margin-bottom:10px;">
            ${data.isError ? '⚠️ Speech Evaluation Guidance:' : '💡 Delivery & Speaking Tips:'}
          </strong>
          <ul style="margin:0; padding-left:20px;">${tipsHTML}</ul>
        </div>

        <!-- Transcript -->
        <div style="margin-bottom:20px;">
          <strong style="font-size:14px; color:#334155; display:block; margin-bottom:8px;">Full Speech Transcript:</strong>
          <p style="background:#f8fafc; border-left:4px solid ${data.isError ? '#ef4444' : '#2563eb'}; padding:14px; border-radius:8px; font-size:15px; color:#1e293b; margin:0; line-height:1.6;">
            "${data.transcript}"
          </p>
        </div>

        <!-- Adaptive Practice Recommendation Container -->
        <div id="speech-adaptive-rec-container"></div>

      </div>
    `;
  }

  function resetSpeechStateUI() {
    setWorkflowStep(1);
    if (elements.timerDisplay) elements.timerDisplay.innerText = "00:00";
    if (elements.liveTranscript) elements.liveTranscript.innerText = "Click 'Request Mic & Start Speaking' and begin talking...";
    if (elements.liveWordCount) elements.liveWordCount.innerText = "0 Words";
    if (elements.speechResultsContainer) elements.speechResultsContainer.style.display = "none";
    if (elements.startRecordBtn) elements.startRecordBtn.style.display = "inline-block";
    if (elements.stopRecordBtn) elements.stopRecordBtn.style.display = "none";
    if (elements.recordingStatus) elements.recordingStatus.style.display = "none";
  }

  return {
    init,
    handleStartSpeakingWorkflow,
    stopRecordingWorkflow
  };
})();

