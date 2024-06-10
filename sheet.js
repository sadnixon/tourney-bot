const _ = require("lodash");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  SHEET_PRIVATE_ID,
  MOD_SHEET_PRIVATE_ID,
  GLOBAL_SHEET_PRIVATE_ID,
  GOOGLE_API_CREDENTIALS,
} = require("./env");
const {
  getYear,
  getMonth,
  getTeamEmojis,
  getGameNumber,
  getGlobalSheetUpdated,
} = require("./constants");

// this is the 4th SH Tourney spreadsheet
const doc = new GoogleSpreadsheet(SHEET_PRIVATE_ID);
const moddoc = new GoogleSpreadsheet(MOD_SHEET_PRIVATE_ID);
const globaldoc = new GoogleSpreadsheet(GLOBAL_SHEET_PRIVATE_ID);
doc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
moddoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);
globaldoc.useServiceAccountAuth(GOOGLE_API_CREDENTIALS);

let updateTime = new Date(new Date().getTime());

async function loadSheet() {
  updateTime = new Date(new Date().getTime());
  await doc.loadInfo();
  await doc.sheetsByIndex[0].loadCells("B3:C14"); //The borders of the Leaderboard on main sheet
  //await doc.sheetsByIndex[4].loadCells("B3:F47"); //The borders of the Schedule on main sheet
  await doc.sheetsByIndex[1].loadCells("B2:Y44"); //The relevant portion of the Main Scoreboard, including the leaderboard
  await doc.sheetsByIndex[2].loadCells("A1:I64"); //The borders of the Personal Scores Block
  await doc.sheetsByIndex[3].loadCells("D54:H97"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByIndex[0].loadCells("A1:G2000");
  await moddoc.sheetsByIndex[1].loadCells("A1:C200");
  await moddoc.sheetsByIndex[2].loadCells("A1:H42");
  await moddoc.sheetsByIndex[3].loadCells("A1:E200");
  await globaldoc.loadInfo();
  await globaldoc.sheetsByIndex[3].loadCells("A2:CI191");
  await globaldoc.sheetsByIndex[6].loadCells("A1:O199");
}

//setTimeout(loadSheet, 0);
//setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByIndex[0];
  const leaderboard = _.range(0, 6).map((row) => ({
    name: sheet.getCellByA1(`B${3 + row * 2}`).value, //Column has to be leftmost column of leaderboard
    score: sheet.getCellByA1(`C${3 + row * 2}`).value, //Number has to be the position of the top score in the Reformat block
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
  const sheet = doc.sheetsByIndex[3];
  const leaderboard = _.range(54, 97, 1).map((row) => ({
    mod: "",
    team: sheet.getCellByA1(`E${row}`).value,
    name: sheet.getCellByA1(`F${row}`).value,
    score: sheet.getCellByA1(`H${row}`).value,
    games: sheet.getCellByA1(`G${row}`).value,
    pointsPerGame:
      Math.round(
        (sheet.getCellByA1(`H${row}`).value /
          sheet.getCellByA1(`G${row}`).value) *
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
        sheet.getCell(row, 5).value == null
      )
        return null;
      return {
        merlin: sheet.getCell(row, 2).value,
        game: sheet.getCell(row, 3).value,
        correct: sheet.getCell(row, 5).value === 1 ? "Correct" : "Incorrect",
      };
    })
    .filter((guess) => guess);
}

async function getBestGuess(game) {
  const sheet = moddoc.sheetsByIndex[0];
  const sheet2 = moddoc.sheetsByIndex[2];
  let guesserList = [];
  for (let i = 2; i < 2000; i++) {
    if (sheet.getCellByA1(`A${i}`).value === null) break;
    if (
      sheet.getCellByA1(`D${i}`).value === game &&
      sheet.getCellByA1(`F${i}`).value === 1
    ) {
      guesserList.push(sheet.getCellByA1(`B${i}`).value);
    }
  }
  return {
    guesserList,
    merlin: sheet2.getCellByA1(`C${game + 1}`).value,
    average: sheet2.getCellByA1(`E${game + 1}`).value,
    guessnum: sheet2.getCellByA1(`F${game + 1}`).value,
    falsenum: sheet2.getCellByA1(`G${game + 1}`).value,
    mostfalse: sheet2.getCellByA1(`H${game + 1}`).value,
  };
}

async function getSchedule() {
  const sheet = doc.sheetsByIndex[1];
  //await sheet.loadCells("A1:S23");
  const dayGames = [6, 6, 3, 3, 3, 3, 4, 6, 6];
  const dayNames = _.range(0, 9).map(
    (num) =>
      sheet.getCellByA1(
        `B${dayGames.slice(0, num).reduce((a, b) => a + b, 0) + 4}`
      ).formattedValue
  );
  const modeNames = {
    R: "Regular",
    T: "Timer Regular",
    D: "Duo",
    "D+": "Duo +",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    "V+": "VC +",
    A: "Anonymous",
    B: "Bullet",
    "B+": "Bullet +"
  };

  const YEAR = await getYear();
  const MONTH = await getMonth();

  const schedule = dayNames.map((name, idx) => {
    const day = parseInt(name.match(/\d+/)[0]);
    const date = new Date(Date.UTC(YEAR, MONTH, day));
    let cellTime;
    return {
      number: idx + 1,
      date,
      games: _.range(0, dayGames[idx]).map((row) => {
        cellTime =
          sheet.getCellByA1(
            `F${dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 4}`
          ).formattedValue || cellTime;
        const cellHours = parseInt(cellTime.match(/\d+/)[0]); //yay for no daylight savings
        const am = cellTime.match(/AM/) != null; //got rid of some BS on these lines
        return {
          type: modeNames[
            sheet.getCellByA1(
              `D${dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 4}`
            ).value
          ],
          number: dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 1,
          time: am
            ? new Date(Date.UTC(YEAR, MONTH, day + 1, cellHours % 12))
            : new Date(Date.UTC(YEAR, MONTH, day, (cellHours % 12) + 12)),
        };
      }),
    };
  });
  return schedule;
}

async function getGames() {
  const sheet = doc.sheetsByIndex[1];
  const emojis = await getTeamEmojis();
  const modeNames = {
    R: "Regular",
    D: "Duo",
    "D+": "Duo +",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    "V+": "VC +",
    A: "Anonymous",
    B: "Bullet",
  };
  const gameNumber = await getGameNumber();
  return _.range(0, gameNumber) //Has to be one more than the number of rows in Inporter
    .map((row) => {
      if (sheet.getCellByA1(`C${row + 4}`).value === null) return null;
      const played =
        sheet.getCellByA1(`Y${row + 4}`).value &&
        sheet.getCellByA1(`Y${row + 4}`).value.length > 0;

      const mode = modeNames[sheet.getCellByA1(`D${row + 4}`).value];

      let number = sheet.getCellByA1(`C${row + 4}`).value;

      if (!played) {
        return {
          number,
          played,
        };
      }

      const winner = sheet.getCellByA1(`Y${row + 4}`).value;
      const spyWin = winner === "Spies";
      const spyIndexes = _.range(0, 6).filter((i) =>
        ["Assassin", "Morgana"].includes(
          sheet.getCell(row + 3, 7 + i * 3).value
        )
      );
      const players = _.range(0, 6).map(
        (i) => `${emojis[i]} ${sheet.getCell(row + 3, 6 + i * 3).value}`
      );

      const spies = [players[spyIndexes[0]], players[spyIndexes[1]]];
      const resistance = players.filter((p) => !spies.includes(p));

      let winners = [];
      if (spyWin) {
        winners = spies;
      } else {
        winners = resistance;
      }

      return {
        number,
        played,
        spyWin,
        players,
        spyIndexes,
        winners,
        mode,
      };
    })
    .filter((game) => game);
}

async function getPlayers() {
  const sheet = doc.sheetsByIndex[2];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 10 * 6; i++) {
    teamName = sheet.getCell(i + 3, 1).value || teamName;
    players.push({
      name: sheet.getCell(i + 3, 2).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 3, 3).value,
      gamesWon: sheet.getCell(i + 3, 4).value,
      winrate: sheet.getCell(i + 3, 5).value,
      personalScore: sheet.getCell(i + 3, 8).value,
    });
  }
  return players;
}

async function getGlobalPlayer(player) {
  const names = globaldoc.sheetsByIndex[6];
  const namerows = await names.getRows();
  const sheet = globaldoc.sheetsByIndex[3];
  const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByIndex[2];
  const GlobalSheetUpdated = await getGlobalSheetUpdated();
  let canonName = "";
  let globalIndex = 0;
  let currentName = "";
  let currentInfo = [];
  let pastInfo = [];
  for (let i = 1; i < namerows.length + 1; i++) {
    for (let j = 11; j < 15; j++) {
      // The first number is the index of the Name 1 column, the second is the one plus the index of the Name 4 column
      if (names.getCell(i, j).value === null) {
        break;
      }

      if (names.getCell(i, j).value.toLowerCase() === player) {
        canonName = names.getCell(i, 0).value;
        globalIndex = i;
        if (names.getCell(i, 9).value !== null) {
          currentName = names.getCell(i, 9).value;
          let teamName = "";
          for (let k = 0; k < 10 * 6; k++) {
            // It has to be the number of players in each team times six
            teamName = currentsheet.getCell(k + 3, 1).value || teamName;
            if (currentsheet.getCell(k + 3, 2).value === currentName) {
              currentInfo.push(
                teamName,
                ..._.range(3, 9).map(
                  (entry) => currentsheet.getCell(k + 3, entry).value
                )
              );
              break;
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
  if (globalIndex < rows.length) {
    pastInfo.push(
      ..._.range(0, 87 + GlobalSheetUpdated * 6).map(
        (entry) => sheet.getCell(globalIndex + 1, entry).value
      ) // Has to be the number of columns in the Global Sheet
    );
  }
  return [canonName, currentInfo, pastInfo];
}

async function dumpGuesses(guesses) {
  const sheet = moddoc.sheetsByIndex[0];
  //var items = Object.keys(dict).map(function (key) {
  //  return dict[key];
  //});
  let guess_keys = [...new Set(await guess_information.get("guessIDs"))];
  let items = [];
  for (const key of guess_keys) {
    items.push(await guess_information.get(key));
  }
  //for await (const [key, value] of guesses.iterator()) {
  //console.log(key, value);
  //if (!["open", "finalGame", "guessOptions"].includes(key)) {
  //  items.push(value);
  //}
  //}

  items.sort(function (first, second) {
    return (first[0] < second[0]) ? -1 : ((first[0] > second[0]) ? 1 : 0);
  });

  for (const item of items) {
    await sheet.addRow(item);
  }
}

async function dumpAwards() {
  const sheet = moddoc.sheetsByIndex[3];
  const award_list = [
    "assassin",
    "morgana",
    "merlin",
    "percival",
    "vt",
    "shot",
    "robbed",
  ];
  let all_noms = [];
  for (const award of award_list) {
    all_noms = all_noms.concat((await award_information.get(award)).map((e) => e.concat([award])));
  }
  console.log(all_noms);
  await sheet.addRows(all_noms);
  //for (const nom of all_noms) {
  //  await sheet.addRow(nom);
  //}

  //for (var award of award_list) {
  //  const noms = await award_information.get(award);
  //  for (var nom of noms) {
  //    await sheet.addRow(nom.concat([award]));
  //  }
  //}
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
  dumpAwards,
};
