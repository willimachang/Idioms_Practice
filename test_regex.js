const phrase = "smaller and smaller (increasingly small)";
const example = "The boat looked smaller and smaller as it sailed away.";

let parts = phrase.split('/').map(p => p.trim());
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

console.log("Search Terms:", searchTerms);

let tempText = example;
let success = false;

for (let term of searchTerms) {
    if (!term) continue;

    let words = term.split(/\s+/);
    const placeholders = ["sb.", "sth.", "sb", "sth", "someone", "something", "one's", "oneself", "one’s", "…", "..."];
    words = words.filter(w => !placeholders.includes(w.toLowerCase()));

    if (words.length === 0) continue;

    console.log("Processing words:", words);

    let regexPattern = "";

    let firstWord = words[0].toLowerCase();

    // Simulate verbConjugations
    regexPattern += "\\b" + firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (let i = 1; i < words.length; i++) {
        let w = words[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regexPattern += "(?:\\s+(?:[\\w']+\\s+){0,3})" + w;
    }
    regexPattern += "\\b";

    console.log("Regex:", regexPattern);

    try {
        const regex = new RegExp(regexPattern, 'gi');
        if (regex.test(tempText)) {
            console.log("Match found!");
            tempText = tempText.replace(regex, '_______');
            success = true;
            break;
        }
    } catch (e) {
        console.error(e);
    }
}

if (success) {
    console.log("Result:", tempText);
} else {
    console.log("Failed to mask.");
}
