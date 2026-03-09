// 確保 idiomData 已載入
if (typeof window.idiomData === 'undefined') {
    console.error("Idiom data not loaded!");
}

const idiomList = window.idiomData || [];

// 狀態變數
let currentIndex = 0;
let quizScore = 0;
let quizIndex = 0;
let quizQuestions = []; // 存放隨機抽出的題目
const TOTAL_QUIZ_QUESTIONS = 10; // 每次測驗 10 題

// DOM 元素
const btnLearn = document.getElementById('btn-learn');
const btnQuiz = document.getElementById('btn-quiz');
const learnSection = document.getElementById('learn-section');
const quizSection = document.getElementById('quiz-section');

// 學習模式元素
const flashcard = document.getElementById('flashcard');
const cardPhrase = document.getElementById('card-phrase');
const cardMeaning = document.getElementById('card-meaning');
const cardExample = document.getElementById('card-example');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const counter = document.getElementById('counter');

// 測驗模式元素
const scoreEl = document.getElementById('score');
const quizProgressEl = document.getElementById('quiz-progress');
const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsEl = document.getElementById('quiz-options');
const quizFeedbackEl = document.getElementById('quiz-feedback');
const btnRestart = document.getElementById('btn-restart');
const quizModeSelect = document.getElementById('quiz-mode-select');


// 語音朗讀
let voices = [];

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    // Pre-load logic if needed
}

// 確保聲音已載入 (Chrome 有時需要)
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    if ('speechSynthesis' in window) {
        // 確保 voices 已載入
        if (voices.length === 0) {
            loadVoices();
        }

        // 取消之前的朗讀
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // 預設美式英語
        utterance.rate = 0.8; // 語速

        // 嘗試尋找更好的英文聲音 (例如 Google US English)
        const englishVoice = voices.find(voice =>
            voice.name.includes('Google US English') ||
            (voice.lang.includes('en-US') && !voice.name.includes('UK'))
        ) || voices.find(voice => voice.lang.includes('en'));

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
        };

        window.speechSynthesis.speak(utterance);
    } else {
        alert("您的瀏覽器不支援語音朗讀功能。");
    }
}

// 音效控制
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'correct') {
        // Ding sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'wrong') {
        // Buzz sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

// 初始化
function init() {
    if (idiomList.length === 0) {
        alert("Data Error: Phrase database is empty!\nPlease check internet connection or refresh.");
        return;
    }
    try {
        updateCard();
    } catch (e) {
        console.error("Update Card Error:", e);
        alert("Render Error: " + e.message);
    }
    setupEventListeners();
}

function setupEventListeners() {
    // 模式切換
    btnLearn.addEventListener('click', () => switchMode('learn'));
    btnQuiz.addEventListener('click', () => switchMode('quiz'));

    // 測驗模式切換
    if (quizModeSelect) {
        quizModeSelect.addEventListener('change', () => {
            startQuiz();
        });
    }

    // 學習模式控制
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    btnNext.addEventListener('click', () => {
        if (currentIndex < idiomList.length - 1) {
            currentIndex++;
            updateCard();
            flashcard.classList.remove('flipped');
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCard();
            flashcard.classList.remove('flipped');
        }
    });

    btnRestart.addEventListener('click', startQuiz);
}

function switchMode(mode) {
    if (mode === 'learn') {
        learnSection.classList.add('active');
        quizSection.classList.remove('active');
        btnLearn.classList.add('active');
        btnQuiz.classList.remove('active');
    } else {
        quizSection.classList.add('active');
        learnSection.classList.remove('active');
        btnQuiz.classList.add('active');
        btnLearn.classList.remove('active');
        startQuiz(); // 切換到測驗模式時自動開始
    }
}

// ----------------- 學習模式邏輯 -----------------

function updateCard() {
    const currentIdiom = idiomList[currentIndex];
    cardPhrase.textContent = currentIdiom.phrase;
    cardMeaning.textContent = currentIdiom.meaning;
    cardExample.textContent = currentIdiom.example;
    counter.textContent = `${currentIndex + 1} / ${idiomList.length}`;

    // 綁定發音按鈕
    document.getElementById('btn-speak-phrase').onclick = (e) => {
        e.stopPropagation();
        speak(currentIdiom.phrase);
    };

    document.getElementById('btn-speak-example').onclick = (e) => {
        e.stopPropagation();
        speak(currentIdiom.example);
    };

    // 更新按鈕狀態
    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex === idiomList.length - 1;

    btnPrev.style.opacity = currentIndex === 0 ? "0.5" : "1";
    btnNext.style.opacity = currentIndex === idiomList.length - 1 ? "0.5" : "1";

    // 詳細資料處理
    const btnDetails = document.getElementById('btn-details');
    const cardDetails = document.getElementById('card-details');

    // 重置詳細資料顯示狀態
    cardDetails.classList.add('hidden');
    btnDetails.textContent = "詳細資料";

    // 填入詳細資料內容
    if (currentIdiom.note) {
        cardDetails.textContent = currentIdiom.note;
        btnDetails.style.display = "block";
    } else {
        btnDetails.style.display = "none";
    }

    // 移除舊的 event listener (避免重複綁定)
    const newBtnDetails = btnDetails.cloneNode(true);
    btnDetails.parentNode.replaceChild(newBtnDetails, btnDetails);

    newBtnDetails.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止觸發卡片翻轉
        const isHidden = cardDetails.classList.contains('hidden');
        if (isHidden) {
            cardDetails.classList.remove('hidden');
            newBtnDetails.textContent = "隱藏資料";
        } else {
            cardDetails.classList.add('hidden');
            newBtnDetails.textContent = "詳細資料";
        }
    });
}

// ----------------- 測驗模式邏輯 -----------------

function startQuiz() {
    quizScore = 0;
    quizIndex = 0;
    scoreEl.textContent = quizScore;
    btnRestart.classList.add('hidden');

    // 隨機選出 10 題
    quizQuestions = shuffleArray([...idiomList]).slice(0, TOTAL_QUIZ_QUESTIONS);

    loadQuizQuestion();
}

function loadQuizQuestion() {
    if (quizIndex >= quizQuestions.length) {
        finishQuiz();
        return;
    }

    const currentQuestion = quizQuestions[quizIndex];
    quizProgressEl.textContent = `${quizIndex + 1} / ${TOTAL_QUIZ_QUESTIONS}`;

    const mode = quizModeSelect ? quizModeSelect.value : 'meaning';

    if (mode === 'cloze') {
        // 填空模式
        let potentialQuestons = [];

        // 1. 主要例句
        if (currentQuestion.example) {
            potentialQuestons.push(currentQuestion.example);
        }

        // 2. 備用例句 (從 note 解析)
        if (currentQuestion.note) {
            const lines = currentQuestion.note.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                // 尋找以 "Example:" 或單純例句開頭的 (有些可能沒標 Example)
                // 這裡主要抓取明確標示的，避免抓到中文解釋
                if (trimmed.toLowerCase().startsWith('example:')) {
                    potentialQuestons.push(trimmed.substring(8).trim()); // 去掉 "Example:"
                }
            });
        }

        let questionText = "";
        let masked = false;

        // 準備搜尋詞 (包含去除 "to " 的版本)
        let parts = currentQuestion.phrase.split('/').map(p => p.trim());
        let searchTerms = [];
        parts.forEach(p => {
            // 清理片語中的括號內容及符號 (如 "(1)", "+ Ving", "sb.")
            // 移除 (...) 和 + ...
            let cleanP = p.replace(/\s*\(.*?\)/g, '')
                .replace(/\s*\+.*$/g, '')
                .trim();

            // 原始片語
            searchTerms.push(cleanP);
            // 如果有 "to " 開頭，也加入去除去 "to " 的版本
            if (cleanP.toLowerCase().startsWith('to ')) {
                searchTerms.push(cleanP.substring(3).trim());
            }
        });
        // 依長度排序
        searchTerms.sort((a, b) => b.length - a.length);

        // 常見動詞變化表
        const verbConjugations = {
            "be": ["be", "is", "am", "are", "was", "were", "been", "being", "'m", "'re", "'s"],
            "do": ["do", "does", "did", "done", "doing"],
            "have": ["have", "has", "had", "having", "'ve", "'d"], // 'd can be had
            "will": ["will", "would", "'ll", "'d"], // 'd can be would
            "would": ["would", "'d"],
            "can": ["can", "could"],
            "may": ["may", "might"],
            "take": ["take", "takes", "took", "taken", "taking"],
            "make": ["make", "makes", "made", "making"],
            "get": ["get", "gets", "got", "gotten", "getting"],
            "go": ["go", "goes", "went", "gone", "going"],
            "come": ["come", "comes", "came", "coming"],
            "keep": ["keep", "keeps", "kept", "keeping"],
            "give": ["give", "gives", "gave", "given", "giving"],
            "look": ["look", "looks", "looked", "looking"],
            "put": ["put", "puts", "putting"],
            "run": ["run", "runs", "ran", "running"],
            "call": ["call", "calls", "called", "calling"],
            "turn": ["turn", "turns", "turned", "turning"],
            "bring": ["bring", "brings", "brought", "bringing"],
            "break": ["break", "breaks", "broke", "broken", "breaking"],
            "fall": ["fall", "falls", "fell", "fallen", "falling"],
            "hold": ["hold", "holds", "held", "holding"],
            "lay": ["lay", "lays", "laid", "laying"],
            "set": ["set", "sets", "setting"],
            "catch": ["catch", "catches", "caught", "catching"],
            "cut": ["cut", "cuts", "cutting"],
            "beat": ["beat", "beats", "beaten", "beating"],
            "stir": ["stir", "stirs", "stirred", "stirring"],
            "tell": ["tell", "tells", "told", "telling"],
            "find": ["find", "finds", "found", "finding"],
            "stick": ["stick", "sticks", "stuck", "sticking"],
            "cheer": ["cheer", "cheers", "cheered", "cheering"],
            "check": ["check", "checks", "checked", "checking"],
            "show": ["show", "shows", "showed", "shown", "showing"],
            "burn": ["burn", "burns", "burned", "burnt", "burning"],
            "stand": ["stand", "stands", "stood", "standing"],
            "hear": ["hear", "hears", "heard", "hearing"],
            "think": ["think", "thinks", "thought", "thinking"],
            "feel": ["feel", "feels", "felt", "feeling"],
            "wear": ["wear", "wears", "wore", "worn", "wearing"],
            "pay": ["pay", "pays", "paid", "paying"],
            "eat": ["eat", "eats", "ate", "eaten", "eating"],
            "meet": ["meet", "meets", "met", "meeting"],
            "leave": ["leave", "leaves", "left", "leaving"],
            "light": ["light", "lights", "lit", "lighted", "lighting"],
            "hit": ["hit", "hits", "hitting"],
            "lose": ["lose", "loses", "lost", "losing"],
            "sit": ["sit", "sits", "sat", "sitting"],
            "send": ["send", "sends", "sent", "sending"],
            "spend": ["spend", "spends", "spent", "spending"],
            "build": ["build", "builds", "built", "building"],
            "dissuade": ["dissuade", "dissuades", "dissuaded", "dissuading"],
            "persuade": ["persuade", "persuades", "persuaded", "persuading"],
            "prevent": ["prevent", "prevents", "prevented", "preventing"],
            "stop": ["stop", "stops", "stopped", "stopping"],
            "sell": ["sell", "sells", "sold", "selling"],
            "buy": ["buy", "buys", "bought", "buying"],
            "teach": ["teach", "teaches", "taught", "teaching"],
            "sing": ["sing", "sings", "sang", "sung", "singing"],
            "write": ["write", "writes", "wrote", "written", "writing"],
            "read": ["read", "reads", "reading"],
            "mean": ["mean", "means", "meant", "meaning"],
            "try": ["try", "tries", "tried", "trying"],
            "wait": ["wait", "waits", "waited", "waiting"],
            "happen": ["happen", "happens", "happened", "happening"],
            "seem": ["seem", "seems", "seemed", "seeming"],
            "serve": ["serve", "serves", "served", "serving"],
            "die": ["die", "dies", "died", "dying"],
            "rob": ["rob", "robs", "robbed", "robbing"],
            "steal": ["steal", "steals", "stole", "stolen", "stealing"],
            "knock": ["knock", "knocks", "knocked", "knocking"],
            "strike": ["strike", "strikes", "struck", "striking", "stricken"],
            "talk": ["talk", "talks", "talked", "talking"],
            "walk": ["walk", "walks", "walked", "walking"],
            "ask": ["ask", "asks", "asked", "asking"],
            "shake": ["shake", "shakes", "shook", "shaken", "shaking"],
            "point": ["point", "points", "pointed", "pointing"],
            "blow": ["blow", "blows", "blew", "blown", "blowing"],
            "pass": ["pass", "passes", "passed", "passing"],
            "fool": ["fool", "fools", "fooled", "fooling"],
            "name": ["name", "names", "named", "naming"],
            "drop": ["drop", "drops", "dropped", "dropping"],
            "bump": ["bump", "bumps", "bumped", "bumping"],
            "let": ["let", "lets", "letting"],
            "bind": ["bind", "binds", "bound", "binding"]
        };

        // 嘗試每一個例句，直到成功 Mask
        for (let q of potentialQuestons) {
            let tempText = q;
            let success = false;

            for (let term of searchTerms) {
                if (!term) continue;

                // 建立智慧匹配的正則表達式
                let words = term.split(/\s+/);

                // 過濾掉佔位符 (placeholders)
                const placeholders = ["sb.", "sth.", "sb", "sth", "someone", "something", "one's", "oneself", "one’s", "…", "...", "one", "somewhere"];
                words = words.filter(w => !placeholders.includes(w.toLowerCase()));

                if (words.length === 0) continue;

                let regexPattern = "";

                // 處理第一個字 (如果是動詞，允許變化)
                let firstWord = words[0].toLowerCase();
                if (verbConjugations[firstWord]) {
                    regexPattern += "\\b(" + verbConjugations[firstWord].join("|") + ")";
                } else {
                    // 處理 Regex 特殊字元
                    regexPattern += "\\b" + firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }

                // 處理後續的字 (允許中間插入 0-3 個額外單字)
                // 為了避免匹配跨度過大 (例如跨句)，我們限制單字數量
                for (let i = 1; i < words.length; i++) {
                    let w = words[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // 允許中間有空白和 0-3 個單字 (non-capturing group)
                    // \s+ : 必要空白
                    // (?:[\w']+\s+){0,3} : 0-3 個單字 (包含 ' 如 don't) + 空白
                    regexPattern += "(?:\\s+(?:[\\w']+\\s+){0,3})" + w;
                }
                regexPattern += "\\b"; // 結尾邊界

                try {
                    const regex = new RegExp(regexPattern, 'gi');
                    // 執行替換
                    if (regex.test(tempText)) {
                        tempText = tempText.replace(regex, '_______');
                        success = true;
                        // 一旦成功，就不需要再試其他 search term (因為 searchTerms 已經由長排到短)
                        break;
                    }
                } catch (e) {
                    console.error("Regex error:", e);
                    // Fallback to simple escape if complex regex fails
                    const simpleEscaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const simpleRegex = new RegExp(simpleEscaped, 'gi');
                    if (simpleRegex.test(tempText)) {
                        tempText = tempText.replace(simpleRegex, '_______');
                        success = true;
                        break;
                    }
                }
            }

            if (success) {
                questionText = tempText;
                masked = true;
                break; // 找到一個可用的例句就停止
            }
        }

        // 如果所有例句都失敗 (或沒有例句)
        if (!masked) {
            // 最終 Fallback: 顯示中文意思
            // 用戶希望看到英文句子，但若無英文句子可用，只能顯示提示
            questionText = `[請選出對應的片語] ${currentQuestion.meaning}`;
        }

        quizQuestionEl.textContent = questionText;
        document.getElementById('btn-speak-quiz').style.display = 'none';

    } else {
        // 預設：英選中
        quizQuestionEl.textContent = currentQuestion.phrase;
        document.getElementById('btn-speak-quiz').style.display = 'inline-block';
    }

    quizFeedbackEl.textContent = '';
    quizFeedbackEl.className = 'feedback';

    // 生成選項 (1 正確 + 3 錯誤)
    const options = generateOptions(currentQuestion);

    quizOptionsEl.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';

        if (mode === 'cloze') {
            btn.textContent = option.phrase;
        } else {
            btn.textContent = option.meaning;
        }

        btn.onclick = () => checkAnswer(option, currentQuestion, btn);
        quizOptionsEl.appendChild(btn);
    });
}

function generateOptions(correctAnswer) {
    const wrongAnswers = idiomList
        .filter(item => item.phrase !== correctAnswer.phrase)
        .map(item => item);

    const selectedWrong = shuffleArray(wrongAnswers).slice(0, 3);
    return shuffleArray([correctAnswer, ...selectedWrong]);
}

function checkAnswer(selected, correct, btnElement) {
    const mode = quizModeSelect ? quizModeSelect.value : 'meaning';

    const allBtns = quizOptionsEl.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);

    if (selected.phrase === correct.phrase) {
        btnElement.classList.add('correct');
        playSound('correct');
        quizScore += 10;
        scoreEl.textContent = quizScore;
        quizFeedbackEl.textContent = "答對了！";
        quizFeedbackEl.style.color = "#2ecc71";
    } else {
        btnElement.classList.add('wrong');
        playSound('wrong');

        allBtns.forEach(btn => {
            if (mode === 'cloze') {
                if (btn.textContent === correct.phrase) {
                    btn.classList.add('correct');
                }
            } else {
                if (btn.textContent === correct.meaning) {
                    btn.classList.add('correct');
                }
            }
        });

        if (mode === 'cloze') {
            quizFeedbackEl.textContent = `錯誤，正確答案是：${correct.phrase}`;
        } else {
            quizFeedbackEl.textContent = `錯誤，正確答案是：${correct.meaning}`;
        }

        quizFeedbackEl.style.color = "#e74c3c";
    }

    setTimeout(() => {
        quizIndex++;
        loadQuizQuestion();
    }, 1500);
}

function finishQuiz() {
    quizQuestionEl.textContent = "測驗結束";
    quizOptionsEl.innerHTML = `
        <div style="text-align: center; font-size: 1.2rem;">
            <p>你的總分是：</p>
            <h1 style="font-size: 4rem; color: #3498db; margin: 1rem 0;">${quizScore}</h1>
        </div>
    `;
    quizProgressEl.textContent = "完成";
    quizFeedbackEl.textContent = "";
    btnRestart.classList.remove('hidden');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

try {
    init();
} catch (e) {
    console.error("Init Error:", e);
    alert("System Error: " + e.message + "\nPlease refresh or clear cache.");
}
