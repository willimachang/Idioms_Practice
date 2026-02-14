const fs = require('fs');

// 1. Load Data
const content = fs.readFileSync('f:/anti-test_F/data.js', 'utf8');
const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const jsonStr = content.substring(jsonStart, jsonEnd + 1);

let idiomList;
try {
    idiomList = eval(jsonStr);
} catch (e) {
    console.error("Parse error:", e);
    process.exit(1);
}

// 2. Setup Logic (Copied from script.js)
const verbConjugations = {
    "be": ["be", "is", "am", "are", "was", "were", "been", "being", "'m", "'re", "'s"],
    "do": ["do", "does", "did", "done", "doing"],
    "have": ["have", "has", "had", "having", "'ve", "'d"],
    "will": ["will", "would", "'ll", "'d"],
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
    "mean": ["mean", "means", "meant", "meaning"],
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

// 3. Test Loop
let failureCount = 0;
let successCount = 0;
let failures = [];

idiomList.forEach((item, index) => {
    // 3.1 Get Potential Questions
    let potentialQuestons = [];
    if (item.example) potentialQuestons.push(item.example);
    if (item.note) {
        const lines = item.note.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith('example:')) {
                potentialQuestons.push(trimmed.substring(8).trim());
            }
        });
    }

    if (potentialQuestons.length === 0) {
        failures.push({
            index: index + 1,
            phrase: item.phrase,
            reason: "No examples found"
        });
        failureCount++;
        return;
    }

    // 3.2 Prepare Search Terms
    let parts = item.phrase.split('/').map(p => p.trim());
    let searchTerms = [];
    parts.forEach(p => {
        let cleanP = p.replace(/\s*\(.*?\)/g, '')
            .replace(/\s*\+.*$/g, '')
            .trim();
        searchTerms.push(cleanP);
        if (cleanP.toLowerCase().startsWith('to ')) {
            searchTerms.push(cleanP.substring(3).trim());
        }
    });
    searchTerms.sort((a, b) => b.length - a.length);

    // 3.3 Test Masking
    let anySuccess = false;
    let attemptedQuestions = [];

    for (let q of potentialQuestons) {
        let tempText = q;
        let success = false;

        for (let term of searchTerms) {
            if (!term) continue;

            let words = term.split(/\s+/);
            const placeholders = ["sb.", "sth.", "sb", "sth", "someone", "something", "one's", "oneself", "one’s", "…", "...", "one"];
            words = words.filter(w => !placeholders.includes(w.toLowerCase()));

            if (words.length === 0) continue;

            let regexPattern = "";
            let firstWord = words[0].toLowerCase();

            if (verbConjugations[firstWord]) {
                regexPattern += "\\b(" + verbConjugations[firstWord].join("|") + ")";
            } else {
                regexPattern += "\\b" + firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }

            for (let i = 1; i < words.length; i++) {
                let w = words[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regexPattern += "(?:\\s+(?:[\\w']+\\s+){0,3})" + w;
            }
            regexPattern += "\\b";

            try {
                const regex = new RegExp(regexPattern, 'gi');
                if (regex.test(tempText)) {
                    success = true;
                    break;
                }
            } catch (e) {
                // Ignore regex errors
            }
        }

        attemptedQuestions.push({ q, success });
        if (success) {
            anySuccess = true;
            break;
        }
    }

    if (anySuccess) {
        successCount++;
    } else {
        failureCount++;
        failures.push({
            index: index + 1,
            phrase: item.phrase,
            searchTerms: searchTerms,
            reason: "Masking failed",
            attempts: attemptedQuestions
        });
    }
});

// 4. Output Results
console.log(`Total: ${idiomList.length}`);
console.log(`Success: ${successCount}`);
console.log(`Failures: ${failureCount}`);
console.log("---------------------------------------------------");

if (failures.length > 0) {
    console.log(JSON.stringify(failures, null, 2));
}
