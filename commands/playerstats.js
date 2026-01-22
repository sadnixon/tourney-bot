const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  let player;
  if (args.length < 1) {
    player = await ids_dictionary.get(message.author.id);
    if (player == null) {
      return message.channel.send(
        errorMessage(
          "Must include a valid player name, like Dev or Gamethrower, or tag a valid player's Discord, or have played in the tourney yourself."
        )
      );
    }
  }

  if (
    ["secretaccount", "secret", "imverybad"].includes(
      args.join("").toLowerCase()
    )
  ) {
    const embed = new Discord.MessageEmbed()
      .setTitle("Dating Statistics for Secret Account")
      .setDescription(
        "**Overall Dates:** 0\n**Overall Record:** 0/17548 (0%)\n**Total Hoes:** 0"
      )
      .setFooter(`Updated ${user.updateTime}`);
    return message.channel.send(embed);
  } else if (args.join("").toLowerCase() === "tomsy") {
    const embed = new Discord.MessageEmbed()
      .setTitle("Who?")
      .setFooter(`Updated ${user.updateTime}`);
    return message.channel.send(embed);
  }

  if (args.length > 0) {
    if (
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      player = await ids_dictionary.get(args[0].substr(2, args[0].length - 3));
    } else {
      player = await names_dictionary.get(args.join("").toLowerCase());
    }
  }
  if (player == null) {
    return message.channel.send(
      errorMessage(
        "Must include a valid player name, like Dev or Gamethrower, or tag a valid player's Discord."
      )
    );
  }

  try {
    //const playerInfo = await sheet.getGlobalPlayer(args.join(" ").toLowerCase());
    const playerInfo = await sheet.getGlobalPlayer2(player);

    if (playerInfo[1].length === 0 && playerInfo[2].length === 0) {
      return message.channel.send(
        errorMessage(
          "😔 There was an error making your request. You may have entered an incorrect player name."
        )
      );
    }
    const tourneyNames = [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
      "T13",
      "T14",
    ];
    const wins = playerInfo[2][59] || 0;
    let tourneyIndices = [];
    if (playerInfo[2].length > 0) {
      for (let i = 0; i < tourneyNames.length; i++) {
        // Has to be number of past tournies
        if (playerInfo[2][66 + i * 5]) {
          tourneyIndices.push(i);
        }
      }
    }

    const embed = new Discord.MessageEmbed()
      .setTitle(`Player Statistics for ${playerInfo[0]}`)
      .setDescription(
        playerInfo[1].length > 0
          ? playerInfo[2].length > 0
            ? `**Overall Points:** ${
                playerInfo[2][6] + playerInfo[1][5]
              }\n**Overall Record:** ${roundToThirds(
                playerInfo[2][3] + playerInfo[1][3]
              )}/${playerInfo[2][2] + playerInfo[1][2]} (${+(
                ((playerInfo[2][3] + playerInfo[1][3]) /
                  (playerInfo[2][2] + playerInfo[1][2])) *
                100
              ).toFixed(2)}%)\n**Tourney Wins:** ${wins}\n\n` +
              tourneyIndices
                .map(
                  (entry) =>
                    `${tourneyNames[entry]}: ${
                      playerInfo[2][66 + entry * 5]
                    } - ${playerInfo[2][69 + entry * 5]} pts (${roundToThirds(
                      playerInfo[2][68 + entry * 5]
                    )}/${playerInfo[2][67 + entry * 5]})`
                )
                .join("\n") +
              `\nT15: ${playerInfo[1][0]} - ${
                playerInfo[1][5]
              } pts (${roundToThirds(playerInfo[1][3])}/${playerInfo[1][2]})`
            : `**Rookie Tourney**\n\nT15: ${playerInfo[1][0]} - ${
                playerInfo[1][5]
              } pts (${roundToThirds(playerInfo[1][3])}/${playerInfo[1][2]})`
          : `**Overall Points:** ${
              playerInfo[2][6]
            }\n**Overall Record:** ${roundToThirds(playerInfo[2][3])}/${
              playerInfo[2][2]
            } (${+((playerInfo[2][3] / playerInfo[2][2]) * 100).toFixed(
              2
            )}%)\n**Tourney Wins:** ${wins}\n\n` +
              tourneyIndices
                .map(
                  (entry) =>
                    `${tourneyNames[entry]}: ${
                      playerInfo[2][66 + entry * 5]
                    } - ${playerInfo[2][69 + entry * 5]} pts (${roundToThirds(
                      playerInfo[2][68 + entry * 5]
                    )}/${playerInfo[2][67 + entry * 5]})`
                )
                .join("\n")
      )
      .setFooter(`Updated ${user.updateTime}`);
    message.channel.send(embed);
  } catch (err) {
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. You may have entered an incorrect player name."
      )
    );
  }
}

module.exports = {
  name: "playerstats",
  aliases: ["ps", "stats"],
  description: "Player Stats",
  execute,
};
