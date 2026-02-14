const fs = require('fs');

const content = fs.readFileSync('f:/anti-test_F/data.js', 'utf8');
const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const jsonStr = content.substring(jsonStart, jsonEnd + 1);

let data;
try {
    data = eval(jsonStr);
} catch (e) {
    console.error("Parse error:", e);
    process.exit(1);
}

const targets = data.filter(item => item.meaning.includes('越來越小'));

if (targets.length > 0) {
    console.log("Found:", JSON.stringify(targets, null, 2));
} else {
    console.log("Not found.");
}
