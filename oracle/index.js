require("dotenv").config();
const { startOracle } = require("./jobs/pollEvents");

console.log("Oracle service started...");
startOracle();
