const Discord = require("discord.js");
const sheet = require("../sheet");
const { getGlobalSheetUpdated } = require("../constants");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");

async function execute(message, args, user) {
  let player;
  if (args.length < 1) {
    player = await ids_dictionary.get(message.author.id);
    if (player == null) {
      return message.channel.send(
        errorMessage(
          "Must include a valid player name, like wanglebangle or Tom, or have played in the tourney yourself."
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
      .setTitle("Tomsy Statistics")
      .setDescription("**Who?**")
      .setFooter(`Updated ${user.updateTime}`);
    return message.channel.send(embed);
  }
  
  if (args.length > 0) {
    if (
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      player = await ids_dictionary.get(
        args[0].substr(2, args[0].length - 3)
      );
    } else {
      player = await names_dictionary.get(
        args.join("").toLowerCase()
      );
    }
  }
  if (player == null) {
    return message.channel.send(
      errorMessage(
        "Must include a valid player name, like wanglebangle or Tom, or tag a valid player's Discord."
      )
    );
  }


  const GlobalSheetUpdated = await getGlobalSheetUpdated();
  try {
    //const playerInfo = await sheet.getGlobalPlayer(args.join("").toLowerCase());
    const playerInfo = await sheet.getGlobalPlayer2(player);
    if (
      (playerInfo[1].length === 0 && playerInfo[2].length === 0) ||
      playerInfo[2][3] === "Personal Score"
    ) {
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
      "8p T1",
      "8p T2",
    ];
    const wins = playerInfo[2][54] || 0; //Must be the number of the global sheet column for tourney 1sts
    const avgPlace = playerInfo[2][63] || 0;
    let tourneyIndices = [];
    if (playerInfo[2].length > 0) {
      for (let i = 0; i < tourneyNames.length; i++) {
        if (i === tourneyNames.length - 1 && GlobalSheetUpdated === 0) {
          break;
        }
        if (playerInfo[2][65 + i * 6]) {
          tourneyIndices.push(i);
        }
      }
    }

    const embed = new Discord.MessageEmbed()
      .setTitle(`Player Statistics for ${playerInfo[0]}`)
      .setDescription(
        playerInfo[1].length > 0 && GlobalSheetUpdated === 0
          ? playerInfo[2].length > 0
            ? //Case where player has both past and present records
              `**Overall Points:** ${
                playerInfo[2][3] + playerInfo[1][7] //Second numbers must be the Personal Score columns of global and present sheet
              }\n**Overall Adjusted Points:** ${
                playerInfo[2][4] + playerInfo[1][7] //Second numbers must be the Adj Personal Score columns of global and present sheet
              }\n**Overall Record:** ${playerInfo[2][2] + playerInfo[1][2]}/${
                playerInfo[2][1] + playerInfo[1][1]
              } (${+(
                ((playerInfo[2][2] + playerInfo[1][2]) /
                  (playerInfo[2][1] + playerInfo[1][1])) *
                100
              ).toFixed(
                2
              )}%)\n**Tourney Wins:** ${wins}\n**Average Placement:** ${avgPlace.toFixed(
                2
              )}\n\n` +
              tourneyIndices
                .map(
                  (entry) =>
                    `${tourneyNames[entry]}: ${
                      playerInfo[2][64 + entry * 6 + (entry > 8) * 1]
                    } - ${
                      playerInfo[2][68 + entry * 6 + (entry > 8) * 1]
                    } pts *${
                      playerInfo[2][69 + entry * 6 + (entry > 8) * 1]
                    } adj.* (${
                      playerInfo[2][67 + entry * 6 + (entry > 8) * 1]
                    }/${playerInfo[2][66 + entry * 6 + (entry > 8) * 1]})`
                )
                .join("\n") +
              `\nT10: ${playerInfo[1][0]} - ${playerInfo[1][7]} pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
            : //Case where player has only present records
              `**Rookie Tourney**\n\nT10: ${playerInfo[1][0]} - ${playerInfo[1][7]} pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
          : //Case where player has only past records
            `**Overall Points:** ${
              playerInfo[2][3]
            }\n**Overall Adjusted Points:** ${
              playerInfo[2][4]
            }\n**Overall Record:** ${playerInfo[2][2]}/${playerInfo[2][1]} (${+(
              (playerInfo[2][2] / playerInfo[2][1]) *
              100
            ).toFixed(
              2
            )}%)\n**Tourney Wins:** ${wins}\n**Average Placement:** ${avgPlace.toFixed(
              2
            )}\n\n` +
              tourneyIndices
                .map(
                  (entry) =>
                    `${tourneyNames[entry]}: ${
                      playerInfo[2][64 + entry * 6 + (entry > 8) * 1]
                    } - ${
                      playerInfo[2][68 + entry * 6 + (entry > 8) * 1]
                    } pts *${
                      playerInfo[2][69 + entry * 6 + (entry > 8) * 1]
                    } adj.* (${
                      playerInfo[2][67 + entry * 6 + (entry > 8) * 1]
                    }/${playerInfo[2][66 + entry * 6 + (entry > 8) * 1]})`
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
