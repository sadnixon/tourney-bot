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
  await doc.sheetsByTitle["Short Scoreboard + Player List"].loadCells("B3:H17"); //The borders of the Leaderboard on main sheet
  await doc.sheetsByTitle["Main Scoreboard"].loadCells("B2:AG48"); //The relevant portion of the Main Scoreboard, including the leaderboard
  await doc.sheetsByTitle["Personal Scores + Stats"].loadCells("A1:J70"); //The borders of the Personal Scores Block
  await doc.sheetsByTitle["Fantasy"].loadCells("D60:H108"); //The lefthand portion of the Fantasy League
  await moddoc.loadInfo();
  await moddoc.sheetsByTitle["Guesses"].loadCells("A1:G2000");
  await moddoc.sheetsByTitle["Personal Scores"].loadCells("A1:C200");
  await moddoc.sheetsByTitle["Guesses Per Game"].loadCells("A1:H52");
  await moddoc.sheetsByTitle["Awards"].loadCells("A1:E200");
  await globaldoc.loadInfo();
  await globaldoc.sheetsByTitle["Personal Stats Overall"].loadCells("A2:ES225");
  //await globaldoc.sheetsByTitle["Names Correspondance"].loadCells("A1:S214");
}

async function nameSheetLoader() {
  await globaldoc.loadInfo();
  await globaldoc.sheetsByTitle["Names Correspondance"].loadCells("A1:X231");
  const names = globaldoc.sheetsByTitle["Names Correspondance"];
  const namerows = await names.getRows();
  const namecolumns = ["R", "S", "T", "U", "V"];

  await ids_dictionary.clear();
  await names_dictionary.clear();

  for (let i = 2; i < namerows.length + 2; i++) {
    for (const j of namecolumns) {
      if (names.getCellByA1(`${j}${i}`).value === null) {
        break;
      }
      await names_dictionary.set(
        names.getCellByA1(`${j}${i}`).value.toString().toLowerCase(),
        {
          global: names.getCellByA1(`A${i}`).value.toString(),
          current: names.getCellByA1(`P${i}`).value
            ? names.getCellByA1(`P${i}`).value.toString()
            : null,
          index: i - 1,
          discord: names.getCellByA1(`W${i}`).value
            ? names.getCellByA1(`W${i}`).value.toString()
            : null,
          new: names.getCellByA1(`X${i}`).value === "NEW",
        }
      );
    }
    if (names.getCellByA1(`W${i}`).value !== null) {
      await ids_dictionary.set(names.getCellByA1(`W${i}`).value.toString(), {
        global: names.getCellByA1(`A${i}`).value.toString(),
        current: names.getCellByA1(`P${i}`).value
          ? names.getCellByA1(`P${i}`).value.toString()
          : null,
        index: i - 1,
        new: names.getCellByA1(`X${i}`).value === "NEW",
      });
    }
  }
}

async function gamesDictLoader() {
  await globaldoc.loadInfo();
  await globaldoc.sheetsByTitle["Roles/Teams 6p"].loadCells("A3:P483");
  let resultsRoles = globaldoc.sheetsByTitle["Roles/Teams 6p"];
  let playerDict = {};
  let gameDict = {};
  const seatListReg = ["E", "F", "G", "H", "I", "J"];
  const seatListDuo = [
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
  ];
  let seatList = seatListReg;
  const roleDict = {
    E: { Regular: "VT", Team: "R" },
    F: { Regular: "VT", Team: "R" },
    G: { Regular: "P", Team: "R" },
    H: { Regular: "Me", Team: "R" },
    I: { Regular: "A", Team: "S" },
    J: { Regular: "Mo", Team: "S" },
    K: { Regular: "VT-C", Team: "R" },
    L: { Regular: "VT-C", Team: "R" },
    M: { Regular: "P-C", Team: "R" },
    N: { Regular: "Me-C", Team: "R" },
    O: { Regular: "A-C", Team: "S" },
    P: { Regular: "Mo-C", Team: "S" },
  };
  let tourney = 0;
  let game = 0;
  let mode = "";
  let role = "";
  let team = "";
  let player = "";
  let game_key = "";

  for (let i = 3; i < 484; i++) {
    if (resultsRoles.getCellByA1(`A${i}`).value !== null) {
      tourney++;
    }
    game = resultsRoles.getCellByA1(`B${i}`).value;
    game_key = `${tourney}_${game}`;
    mode = resultsRoles.getCellByA1(`C${i}`).value;
    winner = resultsRoles.getCellByA1(`D${i}`).value[0];
    gameDict[game_key] = {
      mode: mode,
      winner: winner,
      index: i,
      tourney: tourney,
      game: game,
    };
    if (["D", "D+"].includes(mode)) {
      seatList = seatListDuo;
    } else {
      seatList = seatListReg;
    }
    for (const j of seatList) {
      team = roleDict[j].Team;
      player = resultsRoles.getCellByA1(`${j}${i}`).value;
      role = roleDict[j].Regular;

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

  await globaldoc.sheetsByTitle["Opps Instances"].loadCells("A1:HV230");
  await globaldoc.sheetsByTitle["Opps Wins"].loadCells("A1:HV230");
  await globaldoc.sheetsByTitle["Teammates Instances"].loadCells("A1:HV230");
  await globaldoc.sheetsByTitle["Teammates Wins"].loadCells("A1:HV230");

  let opp_games = globaldoc.sheetsByTitle["Opps Instances"];
  let opp_wins = globaldoc.sheetsByTitle["Opps Wins"];
  let team_games = globaldoc.sheetsByTitle["Teammates Instances"];
  let team_wins = globaldoc.sheetsByTitle["Teammates Wins"];
  let matchupDict = {};

  let i_opp_games;
  let i_opp_wins;
  let i_team_games;
  let i_team_wins;
  let i_player;
  let j_player;

  for (let i = 1; i < 230; i++) {
    i_player = opp_games.getCell(i, 0).value;
    if (i === 1) {
      matchupDict[i_player] = {};
    }
    for (let j = i + 1; j < 230; j++) {
      console.log(`${i} ${j}`);
      j_player = opp_games.getCell(0, j).value;
      if (i === 1) {
        matchupDict[j_player] = {};
      }
      i_opp_games = opp_games.getCell(i, j).value;
      i_opp_wins = opp_wins.getCell(i, j).value;
      i_team_games = team_games.getCell(i, j).value;
      i_team_wins = team_wins.getCell(i, j).value;

      matchupDict[i_player][j_player] = {
        oppGames: i_opp_games,
        oppWins: i_opp_wins,
        oppWR: Math.round((i_opp_wins / i_opp_games) * 100),
        teamGames: i_team_games,
        teamWins: i_team_wins,
        teamWR: Math.round((i_team_wins / i_team_games) * 100),
      };

      matchupDict[j_player][i_player] = {
        oppGames: i_opp_games,
        oppWins: i_opp_games - i_opp_wins,
        oppWR:
          Math.round(((i_opp_games - i_opp_wins) / i_opp_games) * 100),
        teamGames: i_team_games,
        teamWins: i_team_wins,
        teamWR: Math.round((i_team_wins / i_team_games) * 100),
      };
    }
  }

  await matchup_dictionary.clear();
  for (const player in matchupDict) {
    await matchup_dictionary.set(player, matchupDict[player]);
  }
}

//setTimeout(loadSheet, 0);
//setInterval(loadSheet, 60000);

function getUpdateTime() {
  return updateTime;
}

async function getLeaderboard() {
  const sheet = doc.sheetsByTitle["Short Scoreboard + Player List"];
  const leaderboard = _.range(0, 6).map((row) => ({
    name: sheet.getCellByA1(`B${3 + row * 2}`).value, //Column has to be leftmost column of leaderboard
    score: sheet.getCellByA1(`C${3 + row * 2}`).value, //Number has to be the position of the top score in the Reformat block
    gamesWon: sheet.getCellByA1(`D${3 + row * 2}`).value,
  }));
  const pointsRemaining = sheet.getCellByA1("H16").value;
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
  const sheet = doc.sheetsByTitle["Fantasy"];
  const leaderboard = _.range(60, 109, 1).map((row) => ({
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
  const sheet = moddoc.sheetsByTitle["Guesses"];
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
  const sheet = moddoc.sheetsByTitle["Guesses"];
  const sheet2 = moddoc.sheetsByTitle["Guesses Per Game"];
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
  const sheet = doc.sheetsByTitle["Main Scoreboard"];
  //await sheet.loadCells("A1:S23");
  const dayGames = [6, 6, 6, 5, 4, 6, 6, 6];
  const dayNames = _.range(0, 8).map(
    (num) =>
      sheet.getCellByA1(
        `B${dayGames.slice(0, num).reduce((a, b) => a + b, 0) + 4}`
      ).formattedValue
  );
  const modeNames = {
    R: "Regular",
    T: "Timer Regular",
    N: "Novice",
    D: "Duo",
    "D+": "Duo +",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    "V+": "VC +",
    A: "Anonymous",
    "A+": "Anonymous +",
    B: "Bullet",
    "B+": "Bullet +",
  };

  const YEAR = await getYear();
  const MONTH = await getMonth();
  //const gameNumber = await getGameNumber();

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
            `E${dayGames.slice(0, idx).reduce((a, b) => a + b, 0) + row + 4}`
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
  const sheet = doc.sheetsByTitle["Main Scoreboard"];
  const emojis = await getTeamEmojis();
  const modeNames = {
    R: "Regular",
    T: "Timer Regular",
    N: "Novice",
    D: "Duo",
    "D+": "Duo +",
    S: "Special",
    "S+": "Special +",
    V: "VC",
    "V+": "VC +",
    A: "Anonymous",
    "A+": "Anonymous +",
    B: "Bullet",
    "B+": "Bullet +",
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
      let players = [];
      if (["Duo", "Duo +"].includes(mode)) {
        players = _.range(0, 6).map(
          (i) =>
            `${emojis[i]} ${sheet.getCell(row + 3, 6 + i * 3).value} (${
              sheet.getCell(row + 3, 27 + i).value
            })`
        );
      } else {
        players = _.range(0, 6).map(
          (i) => `${emojis[i]} ${sheet.getCell(row + 3, 6 + i * 3).value}`
        );
      }

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
  const sheet = doc.sheetsByTitle["Personal Scores + Stats"];
  const players = [];
  let teamName = "";
  for (let i = 0; i < 11 * 6; i++) {
    teamName = sheet.getCell(i + 4, 1).value || teamName;
    players.push({
      name: sheet.getCell(i + 4, 2).value,
      teamName,
      gamesPlayed: sheet.getCell(i + 4, 3).value,
      gamesWon: sheet.getCell(i + 4, 4).value,
      winrate: sheet.getCell(i + 4, 5).value,
      personalScore: sheet.getCell(i + 4, 9).value,
    });
  }
  return players;
}

async function getGlobalPlayer2(player) {
  const sheet = globaldoc.sheetsByTitle["Personal Stats Overall"];
  //const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByTitle["Personal Scores + Stats"];
  const GlobalSheetUpdated = await getGlobalSheetUpdated();
  let canonName = player.global;
  let globalIndex = player.index;
  let currentName = player.current;
  let currentInfo = [];
  let pastInfo = [];
  let teamName = "";
  if (currentName) {
    for (let k = 0; k < 11 * 6; k++) {
      // It has to be the number of players in each team times six
      teamName = currentsheet.getCell(k + 4, 1).value || teamName;
      if (currentsheet.getCell(k + 4, 2).value === currentName) {
        currentInfo.push(
          teamName,
          ..._.range(3, 10).map(
            (entry) => currentsheet.getCell(k + 4, entry).value
          )
        );
        break;
      }
    }
  }
  if (!player.new) {
    pastInfo.push(
      ..._.range(0, 149 + GlobalSheetUpdated * 6).map(
        (entry) => sheet.getCell(globalIndex + 1, entry).value
      ) // Has to be the number of columns in the Global Sheet
    );
  }
  return [canonName, currentInfo, pastInfo];
}

async function getPlayerGames(player) {
  const sheet = doc.sheetsByTitle["Main Scoreboard"];
  const seatDictReg = {
    G: "H",
    J: "K",
    M: "N",
    P: "Q",
    S: "T",
    V: "W",
  };
  const seatDictDuo = {
    G: "H",
    J: "K",
    M: "N",
    P: "Q",
    S: "T",
    V: "W",
    AB: "H",
    AC: "K",
    AD: "N",
    AE: "Q",
    AF: "T",
    AG: "W",
  };
  let seatDict = seatDictReg;
  let gameDict;
  let playerGames;
  if (!player.new) {
    playerGames = await games_dictionary.get(player.global);
    gameDict = await games_dictionary.get("gameDict");
  } else {
    playerGames = [];
    gameDict = {};
  }

  const roleDict = {
    Resistance: { Role: "VT", Team: "R" },
    Percival: { Role: "P", Team: "R" },
    Merlin: { Role: "Me", Team: "R" },
    Morgana: { Role: "Mo", Team: "S" },
    Assassin: { Role: "A", Team: "S" },
  };
  let tourney = 12;
  let game = 0;
  let mode = "";
  let role = "";
  let team = "";
  let game_key = "";

  for (let i = 4; i < 49; i++) {
    if (!["Spies", "Resistance"].includes(sheet.getCellByA1(`Y${i}`).value)) {
      break;
    }
    game = sheet.getCellByA1(`C${i}`).value;

    game_key = `${tourney}_${game}`;

    mode = sheet.getCellByA1(`D${i}`).value;
    winner = sheet.getCellByA1(`Y${i}`).value[0];
    gameDict[game_key] = {
      mode: mode,
      winner: winner,
      index: i + 1000,
      tourney: tourney,
      game: game,
    };
    if (["D", "D+"].includes(mode)) {
      seatDict = seatDictDuo;
    } else {
      seatDict = seatDictReg;
    }
    for (seat in seatDict) {
      if (sheet.getCellByA1(`${seat}${i}`).value !== player.current) {
        continue;
      }

      role = roleDict[sheet.getCellByA1(`${seatDict[seat]}${i}`).value].Role;
      team = roleDict[sheet.getCellByA1(`${seatDict[seat]}${i}`).value].Team;
      if (["D", "D+"].includes(mode) && seat.length > 1) {
        role = role + "-C";
      }

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
  const names = globaldoc.sheetsByTitle["Names Correspondance"];
  const namerows = await names.getRows();
  const sheet = globaldoc.sheetsByTitle["Personal Stats Overall"];
  const rows = await sheet.getRows();
  const currentsheet = doc.sheetsByTitle["Personal Scores + Stats"];
  const GlobalSheetUpdated = await getGlobalSheetUpdated();
  let canonName = "";
  let globalIndex = 0;
  let currentName = "";
  let currentInfo = [];
  let pastInfo = [];
  for (let i = 1; i < namerows.length + 1; i++) {
    for (let j = 14; j < 19; j++) {
      // The first number is the index of the Name 1 column, the second is the one plus the index of the Name 4 column
      if (names.getCell(i, j).value === null) {
        break;
      }
      if (names.getCell(i, j).value.toString().toLowerCase() === player) {
        canonName = names.getCell(i, 0).value;
        globalIndex = i;
        if (names.getCell(i, 12).value !== null) {
          currentName = names.getCell(i, 12).value;
          let teamName = "";
          for (let k = 0; k < 12 * 6; k++) {
            // It has to be the number of players in each team times six
            teamName = currentsheet.getCell(k + 4, 1).value || teamName;
            if (currentsheet.getCell(k + 4, 2).value === currentName) {
              currentInfo.push(
                teamName,
                ..._.range(3, 10).map(
                  (entry) => currentsheet.getCell(k + 4, entry).value
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
      ..._.range(0, 131 + GlobalSheetUpdated * 6).map(
        (entry) => sheet.getCell(globalIndex + 1, entry).value
      ) // Has to be the number of columns in the Global Sheet
    );
  }
  return [canonName, currentInfo, pastInfo];
}

async function dumpGuesses(guesses) {
  const sheet = moddoc.sheetsByTitle["Guesses"];
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
    return first[0] < second[0] ? -1 : first[0] > second[0] ? 1 : 0;
  });

  for (const item of items) {
    await sheet.addRow(item);
  }
}

async function dumpAwards() {
  const sheet = moddoc.sheetsByTitle["Awards"];
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
    all_noms = all_noms.concat(
      (await award_information.get(award)).map((e) => e.concat([award]))
    );
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
  dumpAwards,
};
