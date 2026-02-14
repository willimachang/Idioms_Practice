const fs = require('fs');
try {
    const code = fs.readFileSync('f:/anti-test_F/data.js', 'utf8');
    const window = {};
    eval(code);
    if (!window.idiomData || !Array.isArray(window.idiomData)) {
        throw new Error("window.idiomData is not an array");
    }
    console.log("Data Valid. Items:", window.idiomData.length);
} catch (e) {
    console.error("Data Syntax Error:", e.message);
    // Print context if possible
    if (e.stack) console.error(e.stack);
}
