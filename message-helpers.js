const Discord = require("discord.js");
const sheet = require("./sheet");
const _ = require("lodash");
const { getGameNumber, getGuildID } = require("./constants");

const errorMessage = (message) => {
  return new Discord.MessageEmbed().setDescription(message).setColor("#ff0000");
};

const rank = (competitorList, column, secondary = false, limit = 10) => {
  // assume competitorList is sorted by column
  // returns rank of each competitor (i and j have the same rank if i[column] === j[column])
  const ranks = [];
  let lastRank = 1;
  let lastScore = -1;
  let lastSecondary = -1;
  let reachedLimit = false;
  competitorList.forEach((p, i) => {
    if (reachedLimit) {
      return;
    }
    if (p[column] !== lastScore) {
      lastRank = i + 1;
      if (lastRank > limit) {
        reachedLimit = true;
        return;
      }
    } else if (p[secondary] !== lastSecondary) {
      lastRank = i + 1;
      if (lastRank > limit) {
        reachedLimit = true;
        return;
      }
    }
    ranks.push(lastRank);
    lastScore = p[column];
    lastSecondary = p[secondary];
  });
  return ranks;
};

const roundToThirds = (points) => {
  return +(Math.round(points * 3) / 3).toFixed(2);
};

async function alertMessage(client, mods = false) {
  var teams = await team_roles_channels.get("teams");
  var mod_team = await team_roles_channels.get("mod_team");
  const gameNumber = await getGameNumber();
  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const schedule = await sheet.getSchedule();
  const gametimes = _.range(0, 8)
    .map((day) => schedule[day].games)
    .flat();
  const currentTime = gametimes
    .filter((entry) => entry !== null)
    .find((g) => g.number === currentGame.number).time;
  const currentType = gametimes
    .filter((entry) => entry !== null)
    .find((g) => g.number === currentGame.number).type;

    
  console.log(client);
  console.log(await client.guilds.cache);
  console.log(await getGuildID());
  const guild = await client.guilds.fetch(await getGuildID());
  console.log(guild);
  console.log(guild.channels.cache);

  if (mods) {
    await guild.channels.cache
      .get(mod_team[1])
      .send(
        `Hello, ${mod_team[0]}! The game will happen <t:${
          currentTime / 1000
        }:R>. Are you ready to wrangle some players?`
      );
  }

  for (var team of teams) {
    if (currentGame.number > gameNumber - 2) {
      await guild.channels.cache
        .get(team[1])
        .send(
          `Hello, ${team[0]}! The final games will happen <t:${
            currentTime / 1000
          }:R>. Are your players ready?`
        );
    } else if (["Duo", "Duo +"].includes(currentType)) {
      await guild.channels.cache
        .get(team[1])
        .send(
          `Hello, ${team[0]}! The game will happen <t:${
            currentTime / 1000
          }:R>. Are your player and coach ready?`
        );
    } else {
      await guild.channels.cache
        .get(team[1])
        .send(
          `Hello, ${team[0]}! The game will happen <t:${
            currentTime / 1000
          }:R>. Is your player ready?`
        );
    }
  }
}

module.exports = { errorMessage, rank, roundToThirds, alertMessage };
