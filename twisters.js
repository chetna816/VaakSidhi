/**
 * VaakSiddhi - twisters.js
 * Regional Cultural Tongue Twisters Arena & Speed Practice Controller
 */

const TWISTER_DATABASE = {
  Marathi: [
    {
      id: "mr-twister-1",
      native: "काकाचा काकूने काकाचा काकुच्या काकुच्या काकुला काकाचा काकुच्या काकुला मारले.",
      romanized: "Kaka chya Kakune Kaka chya Kakuchya Kakuchya Kakula Kaka chya Kakuchya Kakula marle.",
      meaning: "Classic Marathi tongue twister with repeating 'Ka' soft velar alliterations.",
      difficulty: "Hard",
      category: "Consonant Speed",
      keywords: ["काकाचा", "काकूने", "काकुच्या", "मारले"]
    },
    {
      id: "mr-twister-2",
      native: "चंद्राच्या चांदण्यात चांदीच्या चमच्याने चटणी चाटली.",
      romanized: "Chandrachya chandnyat chandichya chamchyane chatni chatli.",
      meaning: "In the moonlight, licked chutney with a silver spoon.",
      difficulty: "Medium",
      category: "Palatal Rhythm",
      keywords: ["चंद्राच्या", "चांदण्यात", "चांदीच्या", "चमच्याने", "चटणी", "चाटली"]
    },
    {
      id: "mr-twister-3",
      native: "कच्चा पापड पक्का पापड, कच्चा पापड पक्का पापड.",
      romanized: "Kachha papad pakkha papad, kachha papad pakkha papad.",
      meaning: "Raw papad, cooked papad speed test.",
      difficulty: "Easy",
      category: "Speed Repetition",
      keywords: ["कच्चा", "पापड", "पक्का"]
    },
    {
      id: "mr-twister-4",
      native: "भाऊ भाऊ भाऊ म्हातारा म्हातारा म्हातारा म्हातारा.",
      romanized: "Bhau bhau bhau mhatara mhatara mhatara mhatara.",
      meaning: "Repetitive speed test focusing on aspirated consonants and retroflex vowels.",
      difficulty: "Easy",
      category: "Aspirated Flow",
      keywords: ["भाऊ", "म्हातारा"]
    },
    {
      id: "mr-twister-5",
      native: "रंगीत पतंग उडाला उंचावर उंचावर, उंचावर उडाला रंगीत पतंग.",
      romanized: "Rangiit patang udala unchavar unchavar, unchavar udala rangiit patang.",
      meaning: "Colorful kite flew high up in the sky.",
      difficulty: "Medium",
      category: "Nasal Harmony",
      keywords: ["रंगीत", "पतंग", "उडाला", "उंचावर"]
    }
  ],
  Hindi: [
    {
      id: "hi-twister-1",
      native: "चंदू के चाचा ने चंदू की चाची को चाँदनी चौक में चाँदनी रात में चाँदी की चम्मच से चटनी चटाई।",
      romanized: "Chandu ke chacha ne Chandu ki chachi ko Chandni Chowk mein Chandni raat mein chandi ki chammach se chutney chatai.",
      meaning: "Famous Hindi tongue twister with repetitive 'Cha' sounds.",
      difficulty: "Hard",
      category: "Palatal Alliteration",
      keywords: ["चंदू", "चाचा", "चाची", "चाँदनी", "चौक", "चम्मच", "चटनी"]
    },
    {
      id: "hi-twister-2",
      native: "कच्चा पापड़ पक्का पापड़, कच्चा पापड़ पक्का पापड़।",
      romanized: "Kachha papad pakkha papad, kachha papad pakkha papad.",
      meaning: "Raw crispy papad, cooked crispy papad.",
      difficulty: "Easy",
      category: "Speed Rapid Fire",
      keywords: ["कच्चा", "पापड़", "पक्का"]
    },
    {
      id: "hi-twister-3",
      native: "समझ समझ के समझ को समझो, समझ समझना भी एक समझ है।",
      romanized: "Samjh samjh ke samjh ko samjho, samjh samjhna bhi ek samjh hai.",
      meaning: "Understand understanding to understand understanding.",
      difficulty: "Medium",
      category: "Sibilant Rhythm",
      keywords: ["समझ", "समझो", "समझना"]
    },
    {
      id: "hi-twister-4",
      native: "खड़क सिंह के खड़कने से खड़कती हैं खिड़कियां, खिड़कियों के खड़कने से खड़कता है खड़क सिंह।",
      romanized: "Khadak Singh ke khadakne se khadakti hain khidkiyan, khidkiyon ke khadakne se khadakta hai Khadak Singh.",
      meaning: "Khadak Singh's rattling rattles the windows.",
      difficulty: "Hard",
      category: "Retroflex Speed",
      keywords: ["खड़क", "सिंह", "खिड़कियां", "खिड़कियों"]
    },
    {
      id: "hi-twister-5",
      native: "ऊंट ऊंचा ऊंट की पीठ ऊंची, ऊंची पूछ ऊंट की।",
      romanized: "Oont ooncha oont ki peeth oonchi, oonchi poonch oont ki.",
      meaning: "Tall camel, tall camel's back, tall camel's tail.",
      difficulty: "Medium",
      category: "Vowel Length Test",
      keywords: ["ऊंट", "ऊंचा", "पीठ", "पूछ"]
    }
  ],
  Kannada: [
    {
      id: "kn-twister-1",
      native: "ಕಪ್ಪು ಕಾಡಿಗೆ ಬಿಳಿ ಕಾಡಿಗೆ ಕಾಡಿಗೆ ಹಚ್ಚಿದ ಕಣ್ಣಿಗೆ.",
      romanized: "Kappu kaadige bili kaadige kaadige hachida kannige.",
      meaning: "Black eyeliner, white eyeliner applied to the eyes.",
      difficulty: "Hard",
      category: "Consonant Alliteration",
      keywords: ["ಕಪ್ಪು", "ಕಾಡಿಗೆ", "ಬಿಳಿ", "ಕಣ್ಣಿಗೆ"]
    },
    {
      id: "kn-twister-2",
      native: "ಅಜ್ಜಿಗೆ ಅಜ್ಜನ ಅಜ್ಜಿಗೆ ಅಜ್ಜಿ, ಅಜ್ಜನ ಅಜ್ಜಿಗೆ ಅಜ್ಜ.",
      romanized: "Ajjige ajjana ajjige ajji, ajjana ajjige ajja.",
      meaning: "Grandmother's grandfather's grandmother's grandfather.",
      difficulty: "Medium",
      category: "Aspirated Syllables",
      keywords: ["ಅಜ್ಜಿಗೆ", "ಅಜ್ಜನ", "ಅಜ್ಜಿ", "ಅಜ್ಜ"]
    },
    {
      id: "kn-twister-3",
      native: "ಕಾಗೆ ಕೂಗಿ ಕೂಗಿ ಕಾಗೆ ಕಣ್ಣು ಕೆಂಪಾಯಿತು.",
      romanized: "Kaage koogi koogi kaage kannu kempayitu.",
      meaning: "Crows cawing again and again turned red-eyed.",
      difficulty: "Medium",
      category: "Velar Repetition",
      keywords: ["ಕಾಗೆ", "ಕೂಗಿ", "ಕಣ್ಣು", "ಕೆಂಪಾಯಿತು"]
    },
    {
      id: "kn-twister-4",
      native: "ಮರದಲ್ಲಿ ಕೋತಿ ಕೋತಿ ಮೇಲೆ ಮರ.",
      romanized: "Maradalli koti koti meele mara.",
      meaning: "Monkey on the tree, tree above the monkey.",
      difficulty: "Easy",
      category: "Word Inversion",
      keywords: ["ಮರದಲ್ಲಿ", "ಕೋತಿ", "ಮರ"]
    }
  ],
  Tamil: [
    {
      id: "ta-twister-1",
      native: "வாழைப்பழம் வழுக்கி விழுந்தது.",
      romanized: "Vazhaipazham vazhukki vizhundhadhu.",
      meaning: "The banana slipped and fell down.",
      difficulty: "Hard",
      category: "Special 'Zha' Sound",
      keywords: ["வாழைப்பழம்", "வழுக்கி", "விழுந்தது"]
    },
    {
      id: "ta-twister-2",
      native: "யானை வரும் பின்னே மணி யோசை வரும் முன்னே.",
      romanized: "Yaanai varum pinne mani osai varum munne.",
      meaning: "The elephant comes behind, the bell sound comes ahead.",
      difficulty: "Medium",
      category: "Nasal Harmony",
      keywords: ["யானை", "பின்னே", "மணி", "முன்னே"]
    },
    {
      id: "ta-twister-3",
      native: "துப்பாக்கி சுட்டான் துப்பாக்கி சுட்டான்.",
      romanized: "Thuppakki suttan thuppakki suttan.",
      meaning: "Gun fired, gun fired rapid repetition.",
      difficulty: "Easy",
      category: "Dental Plosives",
      keywords: ["துப்பாக்கி", "சுட்டான்"]
    }
  ],
  Telugu: [
    {
      id: "te-twister-1",
      native: "కాకి కాకి కంటికి కంటికి కాకి కాకి.",
      romanized: "Kaaki kaaki kantiki kantiki kaaki kaaki.",
      meaning: "Crow crow's eye eye crow crow.",
      difficulty: "Medium",
      category: "Soft Plosive Speed",
      keywords: ["కాకి", "కంటికి"]
    },
    {
      id: "te-twister-2",
      native: "గోడమీద పిల్లి పిల్లి మీద గోడ.",
      romanized: "Goda meeda pilli pilli meeda goda.",
      meaning: "Cat on the wall, wall on the cat.",
      difficulty: "Easy",
      category: "Rhythmic Twist",
      keywords: ["గోడమీద", "పిల్లి", "గోడ"]
    },
    {
      id: "te-twister-3",
      native: "చింతకాయ తొక్కు చింతకాయ దొక్కు.",
      romanized: "Chintakaya thokku chintakaya dokku.",
      meaning: "Tamarind chutney pickle speed recitation.",
      difficulty: "Hard",
      category: "Retroflex Plosives",
      keywords: ["చింతకాయ", "తొక్కు", "దొక్కు"]
    }
  ],
  English: [
    {
      id: "en-twister-1",
      native: "Peter Piper picked a peck of pickled peppers.",
      romanized: "Peter Piper picked a peck of pickled peppers.",
      meaning: "Classic English tongue twister with 'P' alliterations.",
      difficulty: "Medium",
      category: "Bilabial Plosive",
      keywords: ["peter", "piper", "picked", "peck", "pickled", "peppers"]
    },
    {
      id: "en-twister-2",
      native: "She sells seashells by the seashore.",
      romanized: "She sells seashells by the seashore.",
      meaning: "Classic English tongue twister with 'S' and 'Sh' sounds.",
      difficulty: "Hard",
      category: "Sibilant Distinction",
      keywords: ["she", "sells", "seashells", "seashore"]
    },
    {
      id: "en-twister-3",
      native: "Red lorry, yellow lorry, red lorry, yellow lorry.",
      romanized: "Red lorry, yellow lorry, red lorry, yellow lorry.",
      meaning: "Fast liquid consonant 'R' and 'L' repetition test.",
      difficulty: "Hard",
      category: "Liquid Alternation",
      keywords: ["red", "lorry", "yellow"]
    },
    {
      id: "en-twister-4",
      native: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
      romanized: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
      meaning: "Rhythmic English tongue twister focusing on 'W' and 'Ch' sounds.",
      difficulty: "Medium",
      category: "Voiced Glide",
      keywords: ["wood", "woodchuck", "chuck"]
    },
    {
      id: "en-twister-5",
      native: "I saw Susie sitting in a shoeshine shop.",
      romanized: "I saw Susie sitting in a shoeshine shop.",
      meaning: "Sibilant clarity test for speech therapy.",
      difficulty: "Easy",
      category: "Sibilant Clarity",
      keywords: ["susie", "sitting", "shoeshine", "shop"]
    }
  ]
};

let currentLanguage = "Marathi";
let activeTwister = TWISTER_DATABASE.Marathi[0];
let activeDifficulty = "All";
let recognition = null;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioUrl = null;
let isRecording = false;
let startTime = 0;
let timerInterval = null;
let recordedTranscript = "";

document.addEventListener("DOMContentLoaded", () => {
  initLanguageSelector();
  initDifficultyFilters();
  initRandomButton();
  renderTwistersGrid();
  renderActiveTwister();
  bindTwisterAudioControls();
  bindTwisterSpeechRec();
});

function initLanguageSelector() {
  const select = document.getElementById("twister-language-select");
  if (!select) return;

  const user = window.VaakSiddhiStorage ? window.VaakSiddhiStorage.getUserData() : {};
  currentLanguage = user.selectedLanguage || "Marathi";
  if (TWISTER_DATABASE[currentLanguage]) {
    select.value = currentLanguage;
  } else {
    currentLanguage = "Marathi";
    select.value = "Marathi";
  }

  select.addEventListener("change", (e) => {
    currentLanguage = e.target.value;
    const twisters = TWISTER_DATABASE[currentLanguage] || TWISTER_DATABASE.Marathi;
    activeTwister = twisters[0];
    renderActiveTwister();
    renderTwistersGrid();
    if (window.VaakSiddhiAudio) {
      window.VaakSiddhiAudio.playClick();
      window.VaakSiddhiAudio.speakText(`Switched tongue twisters to ${currentLanguage}`, currentLanguage);
    }
  });
}

function initDifficultyFilters() {
  const filterBtns = document.querySelectorAll(".diff-filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.className = "btn btn-outline-dashed diff-filter-btn";
      });
      btn.className = "btn btn-primary diff-filter-btn";
      activeDifficulty = btn.getAttribute("data-diff") || "All";
      renderTwistersGrid();
      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.playClick();
      }
    });
  });
}

function initRandomButton() {
  const randomBtn = document.getElementById("twister-random-btn");
  if (!randomBtn) return;

  randomBtn.addEventListener("click", () => {
    let twisters = TWISTER_DATABASE[currentLanguage] || TWISTER_DATABASE.Marathi;
    if (activeDifficulty !== "All") {
      twisters = twisters.filter((t) => t.difficulty === activeDifficulty);
    }
    if (twisters.length === 0) {
      twisters = TWISTER_DATABASE[currentLanguage] || TWISTER_DATABASE.Marathi;
    }

    const randomIndex = Math.floor(Math.random() * twisters.length);
    activeTwister = twisters[randomIndex];
    renderActiveTwister();
    renderTwistersGrid();

    if (window.VaakSiddhiAudio) {
      window.VaakSiddhiAudio.playClick();
      window.VaakSiddhiAudio.speakText(activeTwister.native, currentLanguage);
    }
  });
}

function renderActiveTwister() {
  if (!activeTwister) return;

  const nativeEl = document.getElementById("twister-native-text");
  const romanizedEl = document.getElementById("twister-romanized-text");
  const meaningEl = document.getElementById("twister-meaning-text");
  const levelBadge = document.getElementById("twister-level-badge");
  const categoryBadge = document.getElementById("twister-category-badge");

  if (nativeEl) nativeEl.innerText = activeTwister.native;
  if (romanizedEl) romanizedEl.innerText = `(${activeTwister.romanized})`;
  if (meaningEl) meaningEl.innerText = activeTwister.meaning;
  if (levelBadge) levelBadge.innerText = `⭐ Level: ${activeTwister.difficulty}`;
  if (categoryBadge) categoryBadge.innerText = activeTwister.category || "Speed Challenge";

  const transcriptDisplay = document.getElementById("twister-transcript-display");
  if (transcriptDisplay) transcriptDisplay.innerText = "Click 'Start Twister Speed Test' and recite the phrase quickly...";

  const evalCard = document.getElementById("twister-evaluation-card");
  if (evalCard) evalCard.style.display = "none";
}

function renderTwistersGrid() {
  const container = document.getElementById("twisters-grid-container");
  if (!container) return;

  let twisters = TWISTER_DATABASE[currentLanguage] || TWISTER_DATABASE.Marathi;
  if (activeDifficulty !== "All") {
    twisters = twisters.filter((t) => t.difficulty === activeDifficulty);
  }

  container.innerHTML = "";

  if (twisters.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:30px; background:#fffdf0; border:1.5px dashed #3d131f; border-radius:16px;">
        <p style="font-size:16px; font-weight:700; color:#3d131f;">No tongue twisters found for this filter in ${currentLanguage}.</p>
      </div>
    `;
    return;
  }

  twisters.forEach((t) => {
    const isSelected = activeTwister && activeTwister.id === t.id;
    const card = document.createElement("div");
    card.className = "polaroid-frame";
    card.style.cssText = `
      padding:20px;
      text-align:left;
      border: 2px dashed ${isSelected ? '#dc2626' : '#3d131f'};
      background: ${isSelected ? '#fffdf0' : '#ffffff'};
      cursor:pointer;
      transition: all 0.25s ease;
      position: relative;
    `;

    const diffColor = t.difficulty === "Easy" ? "#dcfce7" : (t.difficulty === "Medium" ? "#fef3c7" : "#fee2e2");
    const diffTextColor = t.difficulty === "Easy" ? "#166534" : (t.difficulty === "Medium" ? "#92400e" : "#991b1b");

    card.innerHTML = `
      <div style="display:flex; justify-space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:11px; font-weight:800; background:${diffColor}; color:${diffTextColor}; padding:3px 10px; border-radius:10px; border:1px solid #3d131f;">
          ${t.difficulty}
        </span>
        <span style="font-size:11px; font-weight:700; color:#6b4c55; margin-left:auto;">
          ${t.category || "Speed"}
        </span>
      </div>
      <h4 style="font-size:20px; color:#3d131f; margin-bottom:6px; font-family:'Playfair Display', serif; line-height:1.3;">
        ${t.native}
      </h4>
      <p style="font-size:13px; color:#6b4c55; margin-bottom:12px; font-style:italic;">
        (${t.romanized})
      </p>
      <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'}" style="padding:8px 14px; font-size:12px; width:100%; border-radius:20px;">
        ${isSelected ? '✓ Active Challenge' : 'Select Challenge'}
      </button>
    `;

    card.addEventListener("click", () => {
      activeTwister = t;
      renderActiveTwister();
      renderTwistersGrid();
      if (window.VaakSiddhiAudio) {
        window.VaakSiddhiAudio.playClick();
      }
    });

    container.appendChild(card);
  });
}

function speakTwisterWithRate(rate = 1.0) {
  if (!activeTwister) return;

  if ('speechSynthesis' in window) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(activeTwister.native);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const langLower = currentLanguage.toLowerCase();
    if (langLower === "marathi") utterance.lang = "mr-IN";
    else if (langLower === "hindi") utterance.lang = "hi-IN";
    else if (langLower === "kannada") utterance.lang = "kn-IN";
    else if (langLower === "tamil") utterance.lang = "ta-IN";
    else if (langLower === "telugu") utterance.lang = "te-IN";
    else utterance.lang = "en-US";

    window.speechSynthesis.speak(utterance);
  } else if (window.VaakSiddhiAudio) {
    window.VaakSiddhiAudio.speakText(activeTwister.native, currentLanguage);
  }
}

function bindTwisterAudioControls() {
  const slowBtn = document.getElementById("twister-listen-slow-btn");
  const normalBtn = document.getElementById("twister-listen-normal-btn");
  const fastBtn = document.getElementById("twister-listen-fast-btn");

  if (slowBtn) {
    slowBtn.addEventListener("click", () => speakTwisterWithRate(0.6));
  }
  if (normalBtn) {
    normalBtn.addEventListener("click", () => speakTwisterWithRate(1.0));
  }
  if (fastBtn) {
    fastBtn.addEventListener("click", () => speakTwisterWithRate(1.3));
  }
}

function bindTwisterSpeechRec() {
  const startBtn = document.getElementById("twister-start-btn");
  const stopBtn = document.getElementById("twister-stop-btn");
  const statusEl = document.getElementById("twister-rec-status");
  const timerEl = document.getElementById("twister-timer");
  const transcriptDisplay = document.getElementById("twister-transcript-display");

  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      if (window.VaakSiddhiSubscription) {
        const allowed = window.VaakSiddhiSubscription.checkAndEnforceLimit("twisters", "Tongue Twisters Practice");
        if (!allowed) return;
      }

      recordedTranscript = "";
      audioChunks = [];
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        recordedAudioUrl = null;
      }

      if (transcriptDisplay) {
        transcriptDisplay.innerText = "🎙️ Listening to speed recitation...";
      }

      // Initialize SpeechRecognition if available
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechClass) {
        try {
          recognition = new SpeechClass();
          recognition.continuous = true;
          recognition.interimResults = true;

          const langLower = currentLanguage.toLowerCase();
          if (langLower === "marathi") recognition.lang = "mr-IN";
          else if (langLower === "hindi") recognition.lang = "hi-IN";
          else if (langLower === "kannada") recognition.lang = "kn-IN";
          else if (langLower === "tamil") recognition.lang = "ta-IN";
          else if (langLower === "telugu") recognition.lang = "te-IN";
          else recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                recordedTranscript += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (transcriptDisplay) {
              transcriptDisplay.innerText = (recordedTranscript + interim) || "Listening...";
            }
          };

          recognition.onerror = (e) => {
            console.warn("SpeechRecognition error:", e);
            if (isRecording) {
              stopTwisterTest();
            }
          };

          recognition.onend = () => {
            if (isRecording) {
              stopTwisterTest();
            }
          };

          recognition.start();
        } catch (err) {
          console.warn("Could not start SpeechRecognition:", err);
        }
      }

      // Concurrently start MediaRecorder for audio playback
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };
          mediaRecorder.onstop = () => {
            if (audioChunks.length > 0) {
              const blob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
              recordedAudioUrl = URL.createObjectURL(blob);
            }
            stream.getTracks().forEach((track) => track.stop());
          };
          mediaRecorder.start();
        } catch (mErr) {
          console.warn("MediaRecorder mic access error:", mErr);
        }
      }

      isRecording = true;
      startTime = Date.now();

      if (startBtn) startBtn.style.display = "none";
      if (stopBtn) stopBtn.style.display = "inline-flex";
      if (statusEl) statusEl.style.display = "block";

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const secs = String(elapsed % 60).padStart(2, "0");
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
      }, 1000);
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopTwisterTest();
    });
  }
}

function stopTwisterTest() {
  if (!isRecording) return;
  isRecording = false;

  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try { mediaRecorder.stop(); } catch (e) {}
  }

  const startBtn = document.getElementById("twister-start-btn");
  const stopBtn = document.getElementById("twister-stop-btn");
  const statusEl = document.getElementById("twister-rec-status");

  if (startBtn) startBtn.style.display = "inline-flex";
  if (stopBtn) stopBtn.style.display = "none";
  if (statusEl) statusEl.style.display = "none";

  clearInterval(timerInterval);

  // Brief delay to allow final audio blob and speech transcript processing
  setTimeout(() => {
    evaluateTwisterRecitation();
  }, 400);
}

function evaluateTwisterRecitation() {
  const evalCard = document.getElementById("twister-evaluation-card");
  if (!evalCard) return;

  const durationSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const spokenText = recordedTranscript.trim().toLowerCase();
  const spokenWords = spokenText.split(/\s+/).filter(Boolean);
  const totalWords = spokenWords.length;

  let accuracyPct = 0;
  let wpm = 0;
  let speedRating = "Good Tempo";
  let feedbackText = "";
  let isNoSpeech = false;

  if (totalWords === 0 || spokenText === "") {
    isNoSpeech = true;
    accuracyPct = 0;
    wpm = 0;
    speedRating = "❌ No Speech Heard";
    feedbackText = "❌ <strong>No Speech Detected</strong>: Please check microphone permissions and recite the tongue twister phrase out loud clearly.";
  } else {
    wpm = Math.round((totalWords / durationSecs) * 60);

    const nativeWords = activeTwister.native.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\w\u0900-\u097F\u0C80-\u0CFF\u0B80-\u0BFF\u0C00-\u0C7F]/g, "")).filter(Boolean);
    const romanWords = activeTwister.romanized.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\w]/g, "")).filter(Boolean);
    const keywords = (activeTwister.keywords || []).map((k) => k.toLowerCase());

    let keywordMatches = keywords.filter((kw) => spokenText.includes(kw)).length;
    let nativeMatches = nativeWords.filter((nw) => spokenText.includes(nw)).length;
    let romanMatches = romanWords.filter((rw) => spokenText.includes(rw)).length;

    const maxKeyword = keywords.length || 1;
    const maxNative = nativeWords.length || 1;
    const maxRoman = romanWords.length || 1;

    const kwPct = (keywordMatches / maxKeyword) * 100;
    const natPct = (nativeMatches / maxNative) * 100;
    const romPct = (romanMatches / maxRoman) * 100;

    let bestMatchPct = Math.max(kwPct, Math.max(natPct, romPct));

    if (totalWords < Math.max(2, Math.floor(nativeWords.length * 0.4))) {
      bestMatchPct = bestMatchPct * 0.5;
    }

    accuracyPct = Math.min(100, Math.max(0, Math.round(bestMatchPct)));

    if (wpm >= 120) speedRating = "⚡ Lightning Fast!";
    else if (wpm >= 70) speedRating = "🚀 Excellent Speed";
    else if (wpm >= 35) speedRating = "👍 Good Pace";
    else speedRating = "🐢 Steady Practice";

    if (accuracyPct >= 80) {
      feedbackText = "🎉 <strong>Outstanding Articulation!</strong> Your pronunciation and tongue twister rhythm were crisp and precise.";
    } else if (accuracyPct >= 50) {
      feedbackText = "👍 <strong>Good Attempt!</strong> You pronounced key sounds well. Try practicing with the 🐌 Slow Practice (0.6x) button to refine tricky syllables.";
    } else {
      feedbackText = "⚠️ <strong>Needs Articulation Practice</strong>: The spoken words didn't match the target twister phrase closely. Use slow practice listening and try again.";
    }
  }

  evalCard.style.display = "block";
  evalCard.className = "polaroid-frame";
  evalCard.style.cssText = "background:#ffffff; border:2px dashed #3d131f; padding:20px; text-align:left; margin-top:16px;";

  const badgeColor = isNoSpeech ? '#fee2e2' : (accuracyPct >= 70 ? '#dcfce7' : '#fef3c7');
  const textColor = isNoSpeech ? '#991b1b' : (accuracyPct >= 70 ? '#166534' : '#92400e');

  evalCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:12px; gap:8px;">
      <h4 style="font-size:22px; color:#3d131f; margin:0; font-family:'Playfair Display', serif;">
        🎉 Tongue Twister Evaluation Results
      </h4>
      <span style="font-size:14px; font-weight:800; background:${badgeColor}; color:${textColor}; padding:6px 14px; border-radius:12px; border:1px solid #3d131f;">
        ${speedRating}
      </span>
    </div>

    <div class="grid-3" style="gap:12px; margin-bottom:16px;">
      <div style="background:#fffdf0; padding:12px; border-radius:12px; border:1px dashed #3d131f; text-align:center;">
        <div style="font-size:11px; font-weight:800; color:#6b4c55; text-transform:uppercase;">Accuracy</div>
        <div style="font-size:26px; font-weight:800; color:${accuracyPct >= 70 ? '#166534' : (accuracyPct > 0 ? '#b45309' : '#dc2626')};">${accuracyPct}%</div>
      </div>
      <div style="background:#fffdf0; padding:12px; border-radius:12px; border:1px dashed #3d131f; text-align:center;">
        <div style="font-size:11px; font-weight:800; color:#6b4c55; text-transform:uppercase;">Speed (WPM)</div>
        <div style="font-size:26px; font-weight:800; color:#1e40af;">${wpm} WPM</div>
      </div>
      <div style="background:#fffdf0; padding:12px; border-radius:12px; border:1px dashed #3d131f; text-align:center;">
        <div style="font-size:11px; font-weight:800; color:#6b4c55; text-transform:uppercase;">Words Spoken</div>
        <div style="font-size:26px; font-weight:800; color:#3d131f;">${totalWords}</div>
      </div>
    </div>

    <div style="background:#f8fafc; border-left:4px solid #3d131f; padding:12px 16px; border-radius:8px; margin-bottom:14px; font-size:14px; color:#3d131f;">
      ${feedbackText}
    </div>

    ${spokenText ? `
      <div style="margin-bottom:14px; background:#fffdf0; padding:10px 14px; border-radius:10px; border:1px solid #e2e8f0;">
        <strong style="font-size:12px; color:#6b4c55;">Spoken Transcript:</strong>
        <div style="font-size:14px; color:#280b14; font-weight:700; margin-top:2px;">"${spokenText}"</div>
      </div>
    ` : ''}

    ${recordedAudioUrl ? `
      <div style="margin-bottom:14px; background:#fffdf0; padding:12px; border-radius:12px; border:1px dashed #3d131f;">
        <strong style="font-size:12px; color:#6b4c55; display:block; margin-bottom:6px;">▶️ Playback Your Recorded Recitation:</strong>
        <audio controls src="${recordedAudioUrl}" style="width:100%; height:36px; outline:none;"></audio>
      </div>
    ` : ''}

    <button id="claim-twister-xp-btn" class="btn btn-primary" style="width:100%; padding:12px; ${isNoSpeech ? 'opacity:0.6;' : ''}">
      🎁 Claim +40 XP & Save to Profile
    </button>
  `;

  if (window.VaakSiddhiAudio) {
    if (accuracyPct >= 70) window.VaakSiddhiAudio.playSuccessChime();
  }

  const claimBtn = document.getElementById("claim-twister-xp-btn");
  if (claimBtn) {
    claimBtn.addEventListener("click", () => {
      const awardedXP = Math.max(10, Math.round(accuracyPct * 0.4));
      if (window.VaakSiddhiStorage) {
        window.VaakSiddhiStorage.addXP(awardedXP, `Twister Mastered: ${activeTwister.native.substring(0, 20)}...`);
      }
      if (window.VaakSiddhiProfile) {
        window.VaakSiddhiProfile.addSpeakingAttempt(currentLanguage, {
          topic: `Tongue Twister (${activeTwister.difficulty}): ${activeTwister.native.substring(0, 15)}`,
          score: accuracyPct,
          pronunciation: accuracyPct,
          fluency: Math.min(100, wpm),
          wordCount: totalWords
        });
      }
      claimBtn.disabled = true;
      claimBtn.innerText = `✓ +${awardedXP} XP Claimed & Profile Updated!`;
      claimBtn.style.background = "#166534";
    });
  }
}
