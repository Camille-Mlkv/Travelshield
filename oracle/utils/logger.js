const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "../logs/oracle.log");
if (!fs.existsSync(path.dirname(logPath))) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
}

function log(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logPath, line);
    console.log(message);
}

module.exports = { log };
