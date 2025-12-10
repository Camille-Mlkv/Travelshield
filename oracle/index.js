// require("dotenv").config();
const { startOracle } = require("./jobs/pollEvents");
const { startBackendPoller } = require("./jobs/backendPoll");

console.log("Oracle service started...");
startOracle();
startBackendPoller();

// Логирование статуса
console.log("Services running:");
console.log("- Oracle event polling: ACTIVE");
console.log("- Backend polling: ACTIVE");
console.log(`- Backend URL: http://localhost:3000/api`);
