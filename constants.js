const { ENABLE_DB } = require("./env");
const Keyv = require("keyv").default;
const KeyvMongo = require("@keyv/mongo").default;
const mongoStore = new KeyvMongo("mongodb://localhost:27017/tourney-bot");

let sheet_data;

sheet_data = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "sheet_data",
    })
  : new Keyv();

async function getYear() {
  const value = await sheet_data.get("YEAR");

  return value ? value : 2026;
}

async function getMonth() {
  const value = await sheet_data.get("MONTH");

  return value ? value : 9;
}

async function getTeamEmojis() {
  const values = [
    await sheet_data.get("teamEmoji1"),
    await sheet_data.get("teamEmoji2"),
    await sheet_data.get("teamEmoji3"),
    await sheet_data.get("teamEmoji4"),
    await sheet_data.get("teamEmoji5"),
    await sheet_data.get("teamEmoji6"),
    await sheet_data.get("teamEmoji7"),
    await sheet_data.get("teamEmoji8"),
  ];

  return values ? values : ["🦉", "🚫", "✌️", "🌮", "🦩", "😈"];
}

async function getSheetURL() {
  const value = await sheet_data.get("SHEET_URL");

  return value
    ? value
    : "https://docs.google.com/spreadsheets/d/1MIgL-vAvQK4gmqmYTBiIh3HYHaZpfupQABa5n0jpZTA/";
}

async function getFormURL() {
  const value = await sheet_data.get("FORM_URL");

  return value ? value : "https://forms.gle/2EuaR9GgFMTgasau9";
}

async function getStartDay() {
  const value = await sheet_data.get("START_DAY");

  return value ? value : 9;
}

async function getGameNumber() {
  const value = await sheet_data.get("GAME_NUMBER");

  return value ? value : 39;
}

async function getTournamentVCTextTwo() {
  const value = await sheet_data.get("VC_TEXT_2_ID");

  return value ? value : "914274308359090238";
}

async function getGuildID() {
  const value = await sheet_data.get("GUILD_ID");

  return value? value: "748771888305668146";
}

async function getGlobalSheetUpdated() {
  const value = await sheet_data.get("GLOBAL_UPDATED");

  return value ? value : 0;
}

module.exports = {
  getSheetURL: getSheetURL,
  getFormURL: getFormURL,
  getMonth: getMonth,
  getYear: getYear,
  getTeamEmojis: getTeamEmojis,
  getStartDay: getStartDay,
  getGameNumber: getGameNumber,
  getTournamentVCTextTwo: getTournamentVCTextTwo,
  getGuildID: getGuildID,
  getGlobalSheetUpdated: getGlobalSheetUpdated,
  sheet_data: sheet_data,
  GLOBAL_SHEET_URL:
    "https://docs.google.com/spreadsheets/d/1-FqHJLGnPiuKNLkBIgNFMWUB_2VPOFGrEa2bWUhzsCE/",
};
