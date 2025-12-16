const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  args = args.map((arg) => arg.toLowerCase());
  //arg 0: player
  //arg 1: team/opp
  //arg 2: best/worst (default best)
  //arg 3: mingames (default 1)
  let player1;
  let teamOpp = null;
  let bestWorst = "Best";
  let minGames = 2;
  if (args.length < 1) {
    return message.channel.send(
      errorMessage(
        "Must specify team or opp like this: ``s!matchups team``. You can also specify best or worst matchups and minimum games like this: ``s!matchups opp best 5``"
      )
    );
  } else if (args.length < 2) {
    player1 = await ids_dictionary.get(message.author.id);
    if (player1 == null) {
      return message.channel.send(
        errorMessage(
          "Must include a valid player name or player's Discord tag and specify team or opp like this: ``s!matchups imbapingu team``, or be a tourney player yourself and specify team or opp. You can also specify best or worst matchups and minimum games like this: ``s!matchups dev opp best 5``"
        )
      );
    }
  }

  if (player1 == null) {
    if (
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      player1 = await ids_dictionary.get(args[0].substr(2, args[0].length - 3));
    } else {
      player1 = await names_dictionary.get(args[0].toLowerCase());
    }
  }

  if (args.includes("team")) {
    teamOpp = "Team";
  } else if (args.includes("opp")) {
    teamOpp = "Opp";
  }

  if (args.includes("best")) {
    bestWorst = "Best";
  } else if (args.includes("worst")) {
    bestWorst = "Worst";
  }

  for (var arg of args) {
    if (parseInt(arg) > 2) {
      minGames = parseInt(arg);
    }
  }

  if (player1 == null || teamOpp == null) {
    return message.channel.send(
      errorMessage(
        "Must include a valid player name or player's Discord tag and specify team or opp like this: ``s!matchups imbapingu team``, or be a tourney player yourself and specify team or opp. You can also specify best or worst matchups and minimum games like this: ``s!matchups opp best 5``"
      )
    );
  }

  try {
    const player1Info = await matchup_dictionary.get(player1.global);

    let matchupList = [];

    for (var player2 in player1Info) {
      matchupList.push({
        otherName: player2,
        oppGames: player1Info[player2].oppGames,
        oppWins: player1Info[player2].oppWins,
        oppWR: player1Info[player2].oppWR,
        teamGames: player1Info[player2].teamGames,
        teamWins: player1Info[player2].teamWins,
        teamWR: player1Info[player2].teamWR,
      });
    }

    let filteredList = [];

    if (teamOpp === "Team") {
      filteredList = matchupList.filter((item) => item.teamGames >= minGames);
      if (bestWorst === "Best") {
        filteredList.sort(
          (a, b) => b.teamWR - a.teamWR || b.teamGames - a.teamGames
        );
      } else {
        filteredList.sort(
          (a, b) => a.teamWR - b.teamWR || b.teamGames - a.teamGames
        );
      }
    } else {
      filteredList = matchupList.filter((item) => item.oppGames >= minGames);
      if (bestWorst === "Best") {
        filteredList.sort(
          (a, b) => b.oppWR - a.oppWR || b.oppGames - a.oppGames
        );
      } else {
        filteredList.sort(
          (a, b) => a.oppWR - b.oppWR || b.oppGames - a.oppGames
        );
      }
    }

    filteredList = filteredList.slice(0, 10);
    const ranks = rank(
      filteredList,
      teamOpp === "Team" ? "teamWR" : "oppWR",
      teamOpp === "Team" ? "teamGames" : "oppGames",
      10
    );

    const embed = new Discord.MessageEmbed()
      .setTitle(`${bestWorst} ${teamOpp} Matchups: ${player1.global}`)
      .setDescription(
        `**Minimum Games: ${minGames}**\n\n${filteredList.map(
          (entry, i) =>
            `${ranks[i]}\\. ${entry.otherName}: **${
              teamOpp === "Team" ? entry.teamWR : entry.oppWR
            }%** (${teamOpp === "Team" ? entry.teamWins : entry.oppWins}/${
              teamOpp === "Team" ? entry.teamGames : entry.oppGames
            })`
        ).join("\n")}`
      )
      .setFooter(`Updated ${user.updateTime}`);
    message.channel.send(embed);
  } catch (err) {
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. You may have entered incorrect player names."
      )
    );
  }
}

module.exports = {
  name: "matchups",
  aliases: ["m", "mlb", "matchup"],
  description: "Matchups",
  execute,
};
