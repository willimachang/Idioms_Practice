const fs = require('fs');
const path = require('path');

const raw1 = fs.readFileSync('f:/anti-test_F/raw_data_part1.txt', 'utf8');
const raw2 = fs.readFileSync('f:/anti-test_F/raw_data_part2.txt', 'utf8');
const rawData = raw1 + '\n' + raw2;

const lines = rawData.split(/\r?\n/);
let idioms = [];
let currentIdiom = null;

const idiomRegex = /^(\d+)\.\s+(.+?)([\u4e00-\u9fa5].*)/;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    if (line.match(/^Unit\s+\d+/i)) {
        continue; // Skip Unit headers
    }

    const match = line.match(idiomRegex);
    if (match) {
        // Save previous idiom if exists
        if (currentIdiom) {
            idioms.push(currentIdiom);
        }

        // Start new idiom
        let phrase = match[2].trim();
        let meaning = match[3].trim();

        currentIdiom = {
            phrase: phrase,
            meaning: meaning,
            example: "",
            note: ""
        };
    } else if (currentIdiom) {
        // Process context lines for current idiom
        if (line.startsWith('※')) {
            // Found a note
            if (!currentIdiom.note) {
                currentIdiom.note = line;
            } else {
                currentIdiom.note += "\n" + line;
            }
            continue;
        }

        if (line.startsWith('(') && line.endsWith(')')) {
            // English definition/synonym, e.g. (to board)
            // Append to meaning if not already there
            if (!currentIdiom.meaning.includes(line)) {
                currentIdiom.meaning += " " + line;
            }
            continue;
        }

        // Potential example
        // If it looks like an English sentence (starts with capital letter, ends with punctuation usually)
        if (!currentIdiom.example && line.match(/^[A-Za-z"“].+/)) {
            currentIdiom.example = line;
        } else if (currentIdiom.example && line.match(/^[A-Za-z"“].+/)) {
            // Second example, append to note or create a separate examples array?
            // Let's append to note for now to keep data structure simple but rich
            if (!currentIdiom.note) {
                currentIdiom.note = "Example: " + line;
            } else {
                if (!currentIdiom.note.includes("Example: " + line)) {
                    currentIdiom.note += "\nExample: " + line;
                }
            }
        }
    }
}

// Push last idiom
if (currentIdiom) {
    idioms.push(currentIdiom);
}

// Generate new data.js content
const outputContent = `window.idiomData = ${JSON.stringify(idioms, null, 2)};

// Data loaded
`;

fs.writeFileSync('f:/anti-test_F/data.js', outputContent, 'utf8');

console.log(`Imported ${idioms.length} idioms.`);
