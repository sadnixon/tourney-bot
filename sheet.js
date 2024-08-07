const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  SHEET_PRIVATE_ID,
  MOD_SHEET_PRIVATE_ID,
  GLOBAL_SHEET_PRIVATE_ID,
  NAMES_SHEET_PRIVATE_ID,
  GOOGLE_API_CREDENTIALS,
} = require("./env");
const {
  getYear,
  getMonth,
  getTeamEmojis,
  getGameNumber,
  getStartDay,
} = require("./constants");
const { lastEventId } = require("@sentry/node");

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(SHEET_PRIVATE_ID);
const moddoc = new GoogleSpreadsheet(MOD_SHEET_PRIVATE_ID);
const globaldoc = new GoogleSpreadsheet(GLOBAL_SHEET_PRIVATE_ID);
const namesdoc = new GoogleSpreadsheet(NAMES_SHEET_PRIVATE_ID);
doc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
moddoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
globaldoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
namesdoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);

let updateTime = new Date(new Date().getTime());

async function loadSheet() {
  updateTime = new Date(new Date().getTime());
  await doc.loadInfo();
  await doc.sheetsByIndex[8].loadCells("B11:E17"); //The borders of the Leaderboard on main sheet
  await doc.sheetsByIndex[2].loadCells("B1:O18"); //The borders of the Schedule on main sheet
  await doc.sheetsByIndex[7].loadCells("A1:BH66"); //The relevant portion of the Importer
  await doc.sheetsByIndex[5].loadCells("A1:O101"); //The borders of the Personal Scores Block
  await doc.sheetsByIndex[9].loadCells("B78:I142"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByIndex[0].loadCells("A1:N2000");
  await moddoc.sheetsByIndex[1].loadCells("A1:C200");
  await moddoc.sheetsByIndex[2].loadCells("A1:O75");
  await moddoc.sheetsByIndex[3].loadCells("A1:N2000");
  await moddoc.sheetsByIndex[4].loadCells("A1:N2000");
  await namesdoc.loadInfo();
  await namesdoc.sheetsByIndex[0].loadCells("M1:U389");
  await globaldoc.loadInfo();
  await globaldoc.sheetsByIndex[2].loadCells("A1:BP380");
}

//setTimeout(loadSheet, 0);
//setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[8];
  // await sheet.loadCells("AA2:AL15");
  const leaderboard = _.range(0, 7).map((row) => ({
    name: sheet.getCellByA1(`C${11 + row}`).value, //Column has to be leftmost column of leaderboard
    points: sheet.getCellByA1(`D${11 + row}`).value,
    wins: sheet.getCellByA1(`E${11 + row}`).value,
  }));
  return leaderboard;
}

async function getGuessLeaderboard() {
  const sheet = moddoc.sheetsByIndex[1];
  const leaderboard = _.range(2, 200, 1).map((row) => ({
    name: sheet.getCellByA1(`A${row}`).value,
    score: sheet.getCellByA1(`B${row}`).value,
    acc: sheet.getCellByA1(`C${row}`).value,
  }));
  return leaderboard;
}

async function getFantasyLeaderboard() {
  const sheet = doc.sheetsByIndex[9];
  const leaderboard = _.range(78, 143, 1).map((row) => ({
    mod: sheet.getCellByA1(`B${row}`).value,
    team: sheet.getCellByA1(`D${row}`).value,
    name: sheet.getCellByA1(`E${row}`).value,
    score: sheet.getCellByA1(`F${row}`).value,
    gamesWon: sheet.getCellByA1(`I${row}`).value,
    pointsPerGame:
      Math.round(
        (sheet.getCellByA1(`F${row}`).value /
          sheet.getCellByA1(`H${row}`).value) *
          100
      ) / 100,
  }));
  return leaderboard;
}

async function getPersonalStats(player) {
  const sheet = moddoc.sheetsByIndex[0];
  return _.range(1, 2000)
    .map((row) => {
      if (
        sheet.getCell(row, 0).value === null ||
        sheet.getCell(row, 1).value !== player ||
        sheet.getCell(row, 12).value == null
      )
        return null;
      let game;
      if (Number.isInteger(parseFloat(sheet.getCell(row, 3).value))) {
        game = sheet.getCell(row, 3).value;
      } else if (parseFloat(sheet.getCell(row, 3).value) < 1) {
        game = `BG${parseInt(parseFloat(sheet.getCell(row, 3).value) * 10)}`;
      } else {
        const subGameList = ["A", "B", "C", "D"];
        const subGame =
          subGameList[
            (parseFloat(sheet.getCell(row, 3).value) % 1).toFixed(1) * 10 - 1
          ];
        game = [parseInt(sheet.getCell(row, 3).value), subGame].join("");
      }
      return {
        line: sheet.getCell(row, 2).value,
        game,
        points: sheet.getCell(row, 12).value,
      };
    })
    .filter((guess) => guess);
}

async function getBestGuess(game) {
  const sheet = moddoc.sheetsByIndex[2];
  const sheetMerlin = moddoc.sheetsByIndex[4];
  const rows = await sheet.getRows();
  let guesserList = [];
  let bestRow = [];
  for (let i = 0; i < 75; i++) {
    if (parseFloat(rows[i]._rawData[0]) === game) {
      bestRow = rows[i]._rawData;
      break;
    }
  }
  if (bestRow[18] !== "#N/A") {
    for (let i = 2; i < 2000; i++) {
      if (sheetMerlin.getCellByA1(`A${i}`).value === null) break;
      if (
        sheetMerlin.getCellByA1(`D${i}`).value === game &&
        sheetMerlin.getCellByA1(`F${i}`).value === 1
      ) {
        guesserList.push(sheetMerlin.getCellByA1(`B${i}`).value);
      }
    }
  }
  return {
    bestRow,
    guesserList,
  };
}

async function getSchedule() {
  const sheet = doc.sheetsByIndex[7];
  //await sheet.loadCells("A1:S23");
  const dayGames = [5, 6, 6, 5, 5, 5, 5, 5, 6, 6];
  const dayTriples = [0, 0, 1, 0, 1, 0, 1, 0, 0, 0];
  const dayQuads = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
  //console.log(
  //  sheet.getCellByA1(`B${dayGames.slice(8, 0).reduce((a, b) => a + b, 0) + 3}`)
  //    .value
  //);

  const START_DAY = await getStartDay();
  const YEAR = await getYear();
  const MONTH = await getMonth();

  const dayNames = _.range(0, 10).map((num) => num + START_DAY);

  const schedule = dayNames.map((name, idx) => {
    const day = name;
    const date = new Date(Date.UTC(YEAR, MONTH, day));
    let cellTime;
    let skips = 0;
    return {
      number: idx + 1,
      date,
      games: _.range(0, dayGames[idx]).map((row) => {
        cellTime =
          sheet.getCellByA1(
            `C${
              dayGames.slice(0, idx).reduce((a, b) => a + b, 0) +
              dayTriples.slice(0, idx).reduce((a, b) => a + b, 0) * 2 +
              dayQuads.slice(0, idx).reduce((a, b) => a + b, 0) * 3 +
              row +
              skips +
              3
            }`
          ).formattedValue || cellTime;
        const cellHours = parseInt(cellTime.match(/\d+/)[0]); //yay for no daylight savings
        const am = cellTime.match(/am/) != null; //got rid of some BS on these lines
        const gameType = sheet.getCellByA1(
          `D${
            dayGames.slice(0, idx).reduce((a, b) => a + b, 0) +
            dayTriples.slice(0, idx).reduce((a, b) => a + b, 0) * 2 +
            dayQuads.slice(0, idx).reduce((a, b) => a + b, 0) * 3 +
            row +
            skips +
            3
          }`
        ).value;
        const gameNumber = sheet.getCellByA1(
          `B${
            dayGames.slice(0, idx).reduce((a, b) => a + b, 0) +
            dayTriples.slice(0, idx).reduce((a, b) => a + b, 0) * 2 +
            dayQuads.slice(0, idx).reduce((a, b) => a + b, 0) * 3 +
            row +
            skips +
            3
          }`
        ).value;
        if (["Silent", "Bullet", "Birthday"].includes(gameType)) {
          skips = skips + 2;
        } else if (["Silent+"].includes(gameType)) {
          skips = skips + 3;
        }
        if (row === dayGames[idx] - 1) {
          skips = 0;
        }
        return {
          type: gameType,
          number:
            gameType === "Birthday"
              ? `BG ${parseInt(gameNumber.replace(/[^\d]/g, ""))}-${
                  parseInt(gameNumber.replace(/[^\d]/g, "")) + 2
                }`
              : parseInt(gameNumber.replace(/[^\d]/g, "")),
          time: am
            ? new Date(Date.UTC(YEAR, MONTH, day + 1, cellHours % 12)) // also got rid of the BS nested switch in here
            : new Date(Date.UTC(YEAR, MONTH, day, (cellHours % 12) + 12)),
        };
      }),
    };
  });
  return schedule;
}

async function getGames() {
  const sheet = doc.sheetsByIndex[7];
  const emojis = await getTeamEmojis();
  return _.range(2, 66) //Has to be one more than the number of rows in Inporter
    .map((row) => {
      if (sheet.getCell(row, 1).value === null) return null;

      const played =
        sheet.getCell(row, 7).value && sheet.getCell(row, 7).value.length > 0;

      const mode = sheet.getCell(row, 3).value.replace(/\s/g, "");

      let number = sheet.getCell(row, 1).value;
      let subGame;
      if (mode === "Silent" || mode === "Bullet" || mode === "Silent+") {
        const subGameCell = sheet.getCell(row, 4).value;
        number = parseInt(subGameCell.replace(/[^\d]/g, ""));
        subGame = subGameCell.replace(/\s/g, "").slice(-1);
      } else if (mode === "Birthday") {
        subGame = parseInt(number.replace(/[^\d]/g, ""));
        number = `BG ${3 * Math.floor((subGame - 1) / 3) + 1}-${
          3 * Math.floor((subGame - 1) / 3) + 3
        }`;
      } else {
        number = parseInt(number.replace(/[^\d]/g, ""));
      }

      if (!played) {
        return {
          number,
          played,
          mode,
        };
      }

      const winner = sheet.getCell(row, 10).value.replace(/\s/g, "");
      const fasWin = winner === "Fascist";
      const hitler = parseInt(sheet.getCell(row, 9).value) - 1;
      const fascist1 = parseInt(sheet.getCell(row, 58).value) - 1;
      const fascist2 = parseInt(sheet.getCell(row, 59).value) - 1;
      let players = _.range(0, 7).map(
        (i) => `${emojis[i]} ${sheet.getCell(row, 13 + i).value}`
      );
      let coaches;
      if (["Duo","Duo+"].includes(mode)) {
        coaches = _.range(0, 7).map(
          (i) => `${sheet.getCell(row, 20 + i).value}`
        );
        players = _.range(0, 7).map((i) => `${players[i]} (${coaches[i]})`);
      } else {
        coaches = false;
      }

      const fascists = [players[hitler], players[fascist1], players[fascist2]];
      const liberals = players.filter((p) => !fascists.includes(p));
      let winners = [];
      if (fasWin) {
        winners = fascists;
      } else {
        winners = liberals;
      }

      return {
        number,
        played,
        fasWin,
        link: sheet.getCell(row, 12).value,
        players,
        coaches,
        hitler,
        fascist1,
        fascist2,
        winners,
        mode,
        subGame,
      };
    })
    .filter((game) => game);
}

async function getPlayers() {
  const sheet = doc.sheetsByIndex[5];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 13 * 7; i++) {
    teamName = sheet.getCell(i + 9, 2).value || teamName;
    players.push({
      name: sheet.getCell(i + 9, 3).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 9, 4).value,
      gamesWon: sheet.getCell(i + 9, 5).value,
      winrate: sheet.getCell(i + 9, 6).value,
      personalScore: sheet.getCell(i + 9, 7).value,
      // deductionValue: sheet.getCell(i + 8, 8).value,
      // gameDeductions: sheet.getCell(i + 8, 9).value,
      // personalDeductions: sheet.getCell(i + 8, 10).value,
    });
  }
  return players;
}

async function getGlobalPlayer(player) {
  const names = namesdoc.sheetsByIndex[0];
  const namerows = await names.getRows();
  const sheet = globaldoc.sheetsByIndex[2];
  const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByIndex[5];
  let canonName = "";
  let gName = "";
  let currentName = "";
  let currentInfo = [];
  let pastInfo = [];
  for (let i = 1; i < namerows.length + 1; i++) {
    for (let j = 13; j < 21; j++) {
      // The first number is one plus the index of the current tourney column, the second is the one plus the index of Tourney Name 5
      if (j > 16 && names.getCell(i, j).value === null) {
        break;
      }
      //console.log(names.getCell(i, j).value);
      if (
        names.getCell(i, j).value !== null &&
        names.getCell(i, j).value.toLowerCase() === player
      ) {
        canonName = names.getCell(i, 14).value;
        if (names.getCell(i, 13).value !== null) {
          gName = names.getCell(i, 13).value;
        }
        if (names.getCell(i, 12).value !== null) {
          currentName = names.getCell(i, 12).value;
          let teamName = "";
          for (let k = 0; k < 13 * 7; k++) {
            // It has to be the number of players in each team times seven
            teamName = currentsheet.getCell(k + 9, 2).value || teamName;
            if (currentsheet.getCell(k + 9, 3).value === currentName) {
              currentInfo.push(
                teamName,
                ..._.range(3, 9).map(
                  (entry) => currentsheet.getCell(k + 9, entry).value
                )
              );
            }
          }
        }
        break;
      }
    }
    if (canonName !== "") {
      break;
    }
  }
  if (gName !== "") {
    for (let i = 4; i < rows.length + 1; i++) {
      if (sheet.getCell(i, 0).value === gName) {
        pastInfo.push(
          ..._.range(0, 68).map((entry) => sheet.getCell(i, entry).value) // Has to be the number of columns in the Global Sheet
        );
        break;
      }
    }
  }
  return [canonName, currentInfo, pastInfo];
}

async function dumpGuesses(guesses) {
  const sheet = moddoc.sheetsByIndex[0];
  let guess_keys = [...new Set(await guess_information.get("guessIDs"))];
  let items = [];
  for (const key of guess_keys) {
    items.push(await guess_information.get(key));
  }

  items.sort(function (first, second) {
    return first[0] < second[0] ? -1 : first[0] > second[0] ? 1 : 0;
  });

  for (const item of items) {
    await sheet.addRow(item);
  }
}

async function dumpSpecialGuesses(guesses) {
  let guess_keys = [...new Set(await guess_information.get("specialGuessIDs"))];
  let items = [];
  for (const key of guess_keys) {
    items.push(await guess_information.get(key));
  }

  items.sort(function (first, second) {
    return first[0] < second[0] ? -1 : first[0] > second[0] ? 1 : 0;
  });

  let sheet;
  if (
    ["Anon.Special", "Anonymous"].includes(
      await guess_information.get("specialMode")
    )
  ) {
    sheet = moddoc.sheetsByIndex[3];
  } else {
    sheet = moddoc.sheetsByIndex[4];
  }
  for (const item of items) {
    await sheet.addRow(item);
  }
}

module.exports = {
  loadSheet,
  getLeaderboard,
  getGuessLeaderboard,
  getFantasyLeaderboard,
  getPersonalStats,
  getBestGuess,
  getSchedule,
  getGames,
  getPlayers,
  getGlobalPlayer,
  getUpdateTime,
  dumpGuesses,
  dumpSpecialGuesses,
};
