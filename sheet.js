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
  await doc.sheetsByTitle["Team Stats 🧮"].loadCells("B11:E17"); //The borders of the Leaderboard on main sheet
  await doc.sheetsByTitle["Leaderboard 🥇"].loadCells("X3:AA3"); //The borders of the Schedule on main sheet
  await doc.sheetsByTitle["Importer"].loadCells("A1:BH80"); //The relevant portion of the Importer
  await doc.sheetsByTitle["Personal Scores + Stats 🧮"].loadCells("A1:O108"); //The borders of the Personal Scores Block
  await doc.sheetsByTitle["Fantasy League 🔮"].loadCells("B72:I134"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByTitle["Guesses"].loadCells("A1:N2000");
  await moddoc.sheetsByTitle["Personal Scores"].loadCells("A1:C200");
  await moddoc.sheetsByTitle["Guesses Per Game"].loadCells("A1:O80");
  await moddoc.sheetsByTitle["Team Guesses"].loadCells("A1:N500");
  await moddoc.sheetsByTitle["Merlin Guesses"].loadCells("A1:N500");
  await moddoc.sheetsByTitle["Chat Counts"].loadCells("A1:E200");
  //#await namesdoc.loadInfo();
  //await namesdoc.sheetsByTitle["Names By Tourney"].loadCells("O1:U398");
  //await globaldoc.loadInfo();
  //await globaldoc.sheetsByTitle["Personal Stats"].loadCells("A1:DU387");
}

async function loadGlobalSheet() {
  await globaldoc.loadInfo();
  await globaldoc.sheetsByTitle["Personal Stats"].loadCells("A1:EA396");
}

setTimeout(loadGlobalSheet, 0);
setInterval(loadGlobalSheet, 600000);

async function nameSheetLoader() {
  await namesdoc.loadInfo();
  await namesdoc.sheetsByTitle["Names By Tourney"].loadCells("P1:AA409");
  const names = namesdoc.sheetsByTitle["Names By Tourney"];
  //const namerows = await names.getRows();
  const namecolumns = ["R", "S", "T", "U", "V", "W", "X", "Y"];

  await ids_dictionary.clear();
  await names_dictionary.clear();

  for (let i = 2; i < 393; i++) {
    await new Promise(r => setTimeout(r, 50));
    for (const j of namecolumns) {
      if (names.getCellByA1(`${j}${i}`).value === null) {
        break;
      }
      await names_dictionary.set(
        names.getCellByA1(`${j}${i}`).value.toString().toLowerCase(),
        {
          global: names.getCellByA1(`Q${i}`).value
            ? names.getCellByA1(`Q${i}`).value.toString()
            : null,
          current: names.getCellByA1(`P${i}`).value
            ? names.getCellByA1(`P${i}`).value.toString()
            : null,
          canon: names.getCellByA1(`R${i}`).value.toString(),
          index: i - 1,
          discord: names.getCellByA1(`AA${i}`).value
            ? names.getCellByA1(`AA${i}`).value.toString()
            : null,
        }
      );
    }
    if (names.getCellByA1(`AA${i}`).value !== null) {
      await ids_dictionary.set(names.getCellByA1(`AA${i}`).value.toString(), {
        global: names.getCellByA1(`Q${i}`).value
          ? names.getCellByA1(`Q${i}`).value.toString()
          : null,
        current: names.getCellByA1(`P${i}`).value
          ? names.getCellByA1(`P${i}`).value.toString()
          : null,
        canon: names.getCellByA1(`R${i}`).value.toString(),
        index: i - 1,
      });
    }
  }
}

async function gamesDictLoader() {
  await globaldoc.loadInfo();
  await globaldoc.sheetsByTitle["Game Results & Roles"].loadCells("A3:L705");
  resultsRoles = globaldoc.sheetsByTitle["Game Results & Roles"];
  let playerDict = {};
  let gameDict = {};
  const seatList = ["F", "G", "H", "I", "J", "K", "L"];
  const modeDict = {
    A: "Anonymous",
    "A-S": "Anon. Special",
    Av: "Avalon SH",
    "Av-S": "Avalon SH Special",
    "Av+": "Avalon SH+",
    BD: "Birthday",
    Bl: "Blitz",
    Bu: "Bullet",
    "Bu+": "Bullet+",
    "C-B1": "Custom 1",
    "C-B2": "Custom 2",
    "C-B3": "Custom 3",
    "C-B4": "Custom 4",
    D: "Duo",
    "D+": "Duo+",
    "E<": "Elo Max",
    "E>": "Elo Min",
    Em: "Emotes",
    "Em-S": "Emotes Special",
    "Em+": "Emotes+",
    R: "Regular",
    Ra: "Rapid",
    "Ra+": "Rapid+",
    S: "Special",
    Si: "Silent",
    "Si+": "Silent+",
    VC: "VC",
    "VC-S": "VC Special",
    "VC+": "VC+",
  };
  const roleDict = {
    F: { Avalon: "Me", Regular: "L", Team: "L" },
    G: { Avalon: "P", Regular: "L", Team: "L" },
    H: { Avalon: "L", Regular: "L", Team: "L" },
    I: { Avalon: "L", Regular: "L", Team: "L" },
    J: { Avalon: "Mo", Regular: "F", Team: "F" },
    K: { Avalon: "F", Regular: "F", Team: "F" },
    L: { Avalon: "H", Regular: "H", Team: "F" },
  };
  let tourney = 0;
  let game = 0;
  let mode = "";
  let role = "";
  let team = "";
  let player = "";
  let game_key = "";

  for (let i = 3; i < 705; i++) {
    await new Promise(r => setTimeout(r, 50));
    if (resultsRoles.getCellByA1(`A${i}`).value !== null) {
      tourney++;
    }
    game = resultsRoles.getCellByA1(`B${i}`).value;
    game_key = `${tourney}_${game}`;
    mode = modeDict[resultsRoles.getCellByA1(`C${i}`).value];
    winner = resultsRoles.getCellByA1(`E${i}`).value;
    gameDict[game_key] = {
      mode: mode,
      winner: winner,
      index: i,
      tourney: tourney,
      game: game,
    };
    for (const j of seatList) {
      team = roleDict[j].Team;
      player = resultsRoles.getCellByA1(`${j}${i}`).value;
      if (["Avalon SH", "Avalon SH+", "Avalon SH Special"].includes(mode)) {
        role = roleDict[j].Avalon;
      } else {
        role = roleDict[j].Regular;
      }
      if (player in playerDict) {
        playerDict[player][game_key] = {
          role: role,
          team: team,
        };
      } else {
        playerDict[player] = {};
        playerDict[player][game_key] = {
          role: role,
          team: team,
        };
      }
    }
  }
  await games_dictionary.clear();
  await games_dictionary.set("gameDict", gameDict);
  for (const player in playerDict) {
    await games_dictionary.set(player, playerDict[player]);
  }
}

//setTimeout(loadSheet, 0);
//setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByTitle["Team Stats 🧮"];
  const fpSheet = doc.sheetsByTitle["Leaderboard 🥇"];
  // await sheet.loadCells("AA2:AL15");
  const leaderboard = _.range(0, 7).map((row) => ({
    name: sheet.getCellByA1(`C${11 + row}`).value, //Column has to be leftmost column of leaderboard
    points: sheet.getCellByA1(`D${11 + row}`).value,
    wins: sheet.getCellByA1(`E${11 + row}`).value,
  }));
  const pointsRemaining = fpSheet.getCellByA1("X3").value;
  return { leaderboard: leaderboard, pointsRemaining: pointsRemaining };
}

async function getGuessLeaderboard() {
  const sheet = moddoc.sheetsByTitle["Personal Scores"];
  const leaderboard = _.range(2, 200, 1).map((row) => ({
    name: sheet.getCellByA1(`A${row}`).value,
    score: sheet.getCellByA1(`B${row}`).value,
    acc: sheet.getCellByA1(`C${row}`).value,
  }));
  return leaderboard;
}

async function getFantasyLeaderboard() {
  const sheet = doc.sheetsByTitle["Fantasy League 🔮"];
  const leaderboard = _.range(72, 134, 1).map((row) => ({
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
  const sheet = moddoc.sheetsByTitle["Guesses"];
  const merlinSheet = moddoc.sheetsByTitle["Merlin Guesses"];
  const teamSheet = moddoc.sheetsByTitle["Team Guesses"];
  let guessList = _.range(1, 2000)
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
  let merlinGuessList = _.range(1, 500)
    .map((row) => {
      if (
        merlinSheet.getCell(row, 0).value === null ||
        merlinSheet.getCell(row, 1).value !== player ||
        merlinSheet.getCell(row, 5).value == null
      )
        return null;
      let game;
      if (Number.isInteger(parseFloat(merlinSheet.getCell(row, 3).value))) {
        game = merlinSheet.getCell(row, 3).value;
      } else if (parseFloat(merlinSheet.getCell(row, 3).value) < 1) {
        game = `BG${parseInt(
          parseFloat(merlinSheet.getCell(row, 3).value) * 10
        )}`;
      } else {
        const subGameList = ["A", "B", "C", "D"];
        const subGame =
          subGameList[
            (parseFloat(merlinSheet.getCell(row, 3).value) % 1).toFixed(1) *
              10 -
              1
          ];
        game = [parseInt(merlinSheet.getCell(row, 3).value), subGame].join("");
      }
      return {
        line: `${merlinSheet.getCell(row, 2).value} (merlin)`,
        game,
        points: merlinSheet.getCell(row, 5).value,
      };
    })
    .filter((guess) => guess);
  let teamGuessList = _.range(1, 500)
    .map((row) => {
      if (
        teamSheet.getCell(row, 0).value === null ||
        teamSheet.getCell(row, 1).value !== player ||
        teamSheet.getCell(row, 5).value == null
      )
        return null;
      let game;
      if (Number.isInteger(parseFloat(teamSheet.getCell(row, 3).value))) {
        game = teamSheet.getCell(row, 3).value;
      } else if (parseFloat(teamSheet.getCell(row, 3).value) < 1) {
        game = `BG${parseInt(
          parseFloat(teamSheet.getCell(row, 3).value) * 10
        )}`;
      } else {
        const subGameList = ["A", "B", "C", "D"];
        const subGame =
          subGameList[
            (parseFloat(teamSheet.getCell(row, 3).value) % 1).toFixed(1) * 10 -
              1
          ];
        game = [parseInt(teamSheet.getCell(row, 3).value), subGame].join("");
      }
      return {
        line: `${teamSheet.getCell(row, 2).value} (teams)`,
        game,
        points: teamSheet.getCell(row, 5).value,
      };
    })
    .filter((guess) => guess);
  const compositeList = guessList.concat(merlinGuessList, teamGuessList);
  compositeList.sort((a, b) => a.game - b.game);
  return compositeList;
}

async function getBestGuess(game) {
  const sheet = moddoc.sheetsByTitle["Guesses Per Game"];
  const sheetMerlin = moddoc.sheetsByTitle["Merlin Guesses"];
  const rows = await sheet.getRows();
  let guesserList = [];
  let bestRow = [];
  for (let i = 0; i < 80; i++) {
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
  const sheet = doc.sheetsByTitle["Importer"];
  //await sheet.loadCells("A1:S23");
  const dayGames = [4, 6, 6, 6, 4, 4, 4, 4, 6, 6, 6];
  let dayTriples = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let dayQuads = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  //console.log(
  //  sheet.getCellByA1(`B${dayGames.slice(8, 0).reduce((a, b) => a + b, 0) + 3}`)
  //    .value
  //);

  const START_DAY = await getStartDay();
  const YEAR = await getYear();
  let MONTH = await getMonth();

  const dayNames = _.range(0, dayGames.length).map((num) => num + START_DAY);

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
        if (
          [
            "Silent",
            "Bullet",
            "Birthday",
            "Blitz",
            "Team Pick G - Silent",
          ].includes(gameType)
        ) {
          skips = skips + 2;
          dayTriples[idx] = dayTriples[idx] + 1;
        } else if (["Silent Special", "Mystery Special"].includes(gameType)) {
          skips = skips + 3;
          dayQuads[idx] = dayQuads[idx] + 1;
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
  const sheet = doc.sheetsByTitle["Importer"];
  const emojis = await getTeamEmojis();
  return _.range(2, 79) //Has to be one more than the number of rows in Inporter
    .map((row) => {
      if (sheet.getCell(row, 1).value === null) return null;

      const played =
        sheet.getCell(row, 7).value && sheet.getCell(row, 7).value.length > 0;

      const mode = sheet.getCell(row, 3).value.replace(/\s/g, "");

      let number = sheet.getCell(row, 1).value;
      let subGame;
      if (
        mode === "Silent" ||
        mode === "Bullet" ||
        mode === "Blitz" ||
        mode === "SilentSpecial" ||
        mode === "TeamPickG-Silent" ||
        mode === "MysterySpecial"
      ) {
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
        (i) => `${emojis[i]} ${sheet.getCell(row, 37 + i).value}`
      );
      let coaches;
      if (["Duo", "Duo+", "DuoSpecial"].includes(mode)) {
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
  const sheet = doc.sheetsByTitle["Personal Scores + Stats 🧮"];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 14 * 7; i++) {
    teamName = sheet.getCell(i + 10, 2).value || teamName;
    players.push({
      name: sheet.getCell(i + 10, 3).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 10, 4).value,
      gamesWon: sheet.getCell(i + 10, 5).value,
      winrate: sheet.getCell(i + 10, 6).value,
      personalScore: sheet.getCell(i + 10, 7).value,
      darkHorse: sheet.getCell(i + 10, 13).value,
      // deductionValue: sheet.getCell(i + 8, 8).value,
      // gameDeductions: sheet.getCell(i + 8, 9).value,
      // personalDeductions: sheet.getCell(i + 8, 10).value,
    });
  }
  return players;
}

async function getGlobalPlayer2(player) {
  const sheet = globaldoc.sheetsByTitle["Personal Stats"];
  //const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByTitle["Personal Scores + Stats 🧮"];
  let canonName = player.canon;
  let globalIndex = player.index;
  let currentName = player.current;
  let currentInfo = [];
  let pastInfo = [];
  let teamName = "";
  if (currentName) {
    for (let k = 0; k < 14 * 7; k++) {
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
  if (globalIndex < 395) {
    pastInfo.push(
      ..._.range(0, 131).map(
        (entry) => sheet.getCell(globalIndex + 3, entry).value
      ) // Has to be the number of columns in the Global Sheet
    );
  }
  return [canonName, currentInfo, pastInfo];
}

async function getPlayerGames(player) {
  const sheet = doc.sheetsByTitle["Importer"];
  const seatDict = {
    AL: "AS",
    AM: "AT",
    AN: "AU",
    AO: "AV",
    AP: "AW",
    AQ: "AX",
    AR: "AY",
  };
  let gameDict;
  let playerGames;
  if (player.global) {
    playerGames = await games_dictionary.get(player.global);
    gameDict = await games_dictionary.get("gameDict");
  } else {
    playerGames = [];
    gameDict = {};
  }

  const roleDict = {
    L: "L",
    P: "L",
    Me: "L",
    Mo: "F",
    F: "F",
    H: "F",
  };
  let tourney = 14;
  let game = 0;
  let mode = "";
  let role = "";
  let team = "";
  let game_key = "";

  for (let i = 3; i < 79; i++) {
    if (sheet.getCellByA1(`H${i}`).value !== "GO") {
      break;
    }
    if (sheet.getCellByA1(`E${i}`).value !== null) {
      game = sheet.getCellByA1(`E${i}`).value.match(/Game (\d+[A-D])/)[1];
    } else {
      game = sheet.getCellByA1(`B${i}`).value.match(/Game (\d+)/)[1];
    }

    game_key = `${tourney}_${game}`;

    mode = sheet.getCellByA1(`D${i}`).value;
    winner = sheet.getCellByA1(`K${i}`).value[0];
    gameDict[game_key] = {
      mode: mode,
      winner: winner,
      index: i + 1000,
      tourney: tourney,
      game: game,
    };

    for (seat in seatDict) {
      if (sheet.getCellByA1(`${seat}${i}`).value !== player.current) {
        continue;
      }

      role = sheet.getCellByA1(`${seatDict[seat]}${i}`).value;
      team = roleDict[role];

      playerGames[game_key] = {
        role: role,
        team: team,
      };
      break;
    }
  }

  return { playerGames: playerGames, gameDict: gameDict };
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
  const sheet = moddoc.sheetsByTitle["Guesses"];
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
    sheet = moddoc.sheetsByTitle["Team Guesses"];
  } else {
    sheet = moddoc.sheetsByTitle["Merlin Guesses"];
  }
  for (const item of items) {
    await sheet.addRow(item);
  }
}

async function dumpChatCounts(chatDict) {
  const sheet = moddoc.sheetsByTitle["Chat Counts"];

  let sheetBlock = [];

  for (const key in chatDict) {
    sheetBlock.push([
      key,
      chatDict[key].current,
      chatDict[key].global,
      chatDict[key].eventGen,
      chatDict[key].teamChan,
    ]);
  }

  await sheet.addRows(sheetBlock);
}

module.exports = {
  loadSheet,
  loadGlobalSheet,
  nameSheetLoader,
  gamesDictLoader,
  getLeaderboard,
  getGuessLeaderboard,
  getFantasyLeaderboard,
  getPersonalStats,
  getBestGuess,
  getSchedule,
  getGames,
  getPlayers,
  getGlobalPlayer,
  getGlobalPlayer2,
  getPlayerGames,
  getUpdateTime,
  dumpGuesses,
  dumpSpecialGuesses,
  dumpChatCounts,
};
