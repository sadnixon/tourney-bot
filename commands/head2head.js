const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  let player1;
  let player2;
  if (args.length < 1) {
    return message.channel.send(
      errorMessage(
        "Must include two valid player names, like Dev and Gamethrower, or tag two valid players' Discords, or include one valid player name and have played in the tourney yourself."
      )
    );
  } else if (args.length < 2) {
    player1 = await ids_dictionary.get(message.author.id);
    if (player1 == null) {
      return message.channel.send(
        errorMessage(
          "Must include two valid player names, like Dev and Gamethrower, or tag two valid players' Discords, or include one valid player name and have played in the tourney yourself."
        )
      );
    }
  }

  if (args.length > 1) {
    if (
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      player1 = await ids_dictionary.get(args[0].substr(2, args[0].length - 3));
    } else {
      player1 = await names_dictionary.get(args[0].toLowerCase());
    }
    if (
      args[1].substr(0, 2) === "<@" &&
      args[1].charAt(args[1].length - 1) === ">"
    ) {
      player2 = await ids_dictionary.get(args[1].substr(2, args[1].length - 3));
    } else {
      player2 = await names_dictionary.get(args[1].toLowerCase());
    }
  } else {
    if (
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      player2 = await ids_dictionary.get(args[0].substr(2, args[0].length - 3));
    } else {
      player2 = await names_dictionary.get(args[0].toLowerCase());
    }
  }

  if (player1 == null || player2 == null) {
    return message.channel.send(
      errorMessage(
        "Must include two valid player names, like Dev and Gamethrower, or tag two valid players' Discords."
      )
    );
  }

  try {
    const player1Info = await sheet.getPlayerGames(player1);
    const player2Info = await sheet.getPlayerGames(player2);
    const gameDict = player1Info.gameDict;

    const player1Games = new Set(Object.keys(player1Info.playerGames));
    const player2Games = new Set(Object.keys(player2Info.playerGames));
    const sharedGames = [...player1Games].filter((g) => player2Games.has(g));
    const sharedInfo = sharedGames.map((key) => ({
      game_key: key,
      tourney: gameDict[key].tourney,
      game: gameDict[key].game,
      mode: gameDict[key].mode,
      winner: gameDict[key].winner,
      index: gameDict[key].index,
      p1_team: player1Info.playerGames[key].team,
      p2_team: player2Info.playerGames[key].team,
      p1_role: player1Info.playerGames[key].role,
      p2_role: player2Info.playerGames[key].role,
      opps:
        player1Info.playerGames[key].team !== player2Info.playerGames[key].team,
      p1_won: gameDict[key].winner === player1Info.playerGames[key].team,
    }));

    const oppGames = sharedInfo.filter((g) => g.opps);
    const teamGames = sharedInfo.filter((g) => !g.opps);
    oppGames.sort((a, b) => a.index - b.index);
    teamGames.sort((a, b) => a.index - b.index);

    const oppGP = oppGames.length;
    const teamGP = teamGames.length;
    const oppWon = oppGames.filter((g) => g.p1_won).length;
    const teamWon = teamGames.filter((g) => g.p1_won).length;

    if (oppGP + teamGP === 0) {
      const embed = new Discord.MessageEmbed()
        .setTitle(`Head 2 Head Record: ${player1.canon} - ${player2.canon}`)
        .setDescription("Never even touched...")
        .setFooter(`Updated ${user.updateTime}`);
      return message.channel.send(embed);
    }

    const embed = new Discord.MessageEmbed()
      .setTitle(`Head 2 Head Record: ${player1.canon} - ${player2.canon}`)
      .setDescription(
        `**Total Played:** ${oppGP + teamGP}\n\n**Winrate VS:** ${
          oppGP ? ((oppWon / oppGP) * 100).toFixed(2) : "0.00"
        }% (${oppWon}/${oppGP})\n**Winrate With:** ${
          teamGP ? ((teamWon / teamGP) * 100).toFixed(2) : "0.00"
        }% (${teamWon}/${teamGP})\n\n**Games As Opps:**\n${
          oppGP
            ? oppGames
                .map(
                  (g) =>
                    `T${g.tourney} - ${g.game}: **${g.p1_won ? "W" : "L"}** - ${
                      g.p1_role
                    } vs. ${g.p2_role} (${g.mode})`
                )
                .join("\n")
            : "*Haven't faced off yet.*"
        }\n\n**Games As Team:**\n${
          teamGP
            ? teamGames
                .map(
                  (g) =>
                    `T${g.tourney} - ${g.game}: **${g.p1_won ? "W" : "L"}** - ${
                      g.p1_role
                    } & ${g.p2_role} (${g.mode})`
                )
                .join("\n")
            : "*No teamups yet.*"
        }`
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
  name: "head2head",
  aliases: ["h2h", "compare", "h"],
  description: "Head 2 Head",
  execute,
};
