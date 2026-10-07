const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { getGlobalSheetUpdated } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  let player;

  const playerInput = interaction.options.getString("player");

  if (!playerInput) {
    player = await ids_dictionary.get(interaction.user.id);

    if (player == null) {
      return interaction.reply({
        embeds: [errorMessage(
          "Must include a valid player name, like wanglebangle or Tom, or have played in the tourney yourself."
        )],
        ephemeral: true,
      });
    }
  } else if (
    ["secretaccount", "secret", "imverybad"].includes(
      playerInput.toLowerCase()
    )
  ) {
    const embed = new EmbedBuilder()
      .setTitle("Dating Statistics for Secret Account")
      .setDescription(
        "**Overall Dates:** 0\n**Overall Record:** 0/17548 (0%)\n**Total Hoes:** 0"
      )
      .setFooter({
        text: `Updated ${user.updateTime}`,
      });

    return interaction.reply({
      embeds: [embed],
    });
  } else if (playerInput.toLowerCase() === "tomsy") {
    const embed = new EmbedBuilder()
      .setTitle("Tomsy Statistics")
      .setDescription("**Who?**")
      .setFooter({
        text: `Updated ${user.updateTime}`,
      });

    return interaction.reply({
      embeds: [embed],
    });
  } else {
    player = await names_dictionary.get(playerInput.toLowerCase());

    if (player == null) {
      return interaction.reply({
        embeds: [errorMessage(
          "Must include a valid player name, like wanglebangle or Tom."
        )],
        ephemeral: true,
      });
    }
  }

  const GlobalSheetUpdated = await getGlobalSheetUpdated();

  try {
    const playerInfo = await sheet.getGlobalPlayer2(player);

    if (
      (playerInfo[1].length === 0 && playerInfo[2].length === 0) ||
      playerInfo[2][3] === "Personal Score"
    ) {
      return interaction.reply({
        embeds: [errorMessage(
          "😔 There was an error making your request. You may have entered an incorrect player name."
        )],
        ephemeral: true,
      });
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
      "8p T1",
      "8p T2",
      "8p T3",
      "8p T4",
    ];

    const wins = playerInfo[2][54] || 0;
    const avgPlace = playerInfo[2][63] || 0;

    const tourneyIndices = [];

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

    const embed = new EmbedBuilder()
      .setTitle(`Player Statistics for ${playerInfo[0]}`)
      .setDescription(
        playerInfo[1].length > 0 && GlobalSheetUpdated === 0
          ? playerInfo[2].length > 0
            ? `**Overall Points:** ${
                playerInfo[2][3] + playerInfo[1][7]
              }\n**Overall Adjusted Points:** ${
                playerInfo[2][4] + playerInfo[1][7]
              }\n**Overall Record:** ${
                playerInfo[2][2] + playerInfo[1][2]
              }/${
                playerInfo[2][1] + playerInfo[1][1]
              } (${+(
                ((playerInfo[2][2] + playerInfo[1][2]) /
                  (playerInfo[2][1] + playerInfo[1][1])) *
                100
              ).toFixed(2)}%)\n**Tourney Wins:** ${wins}\n**Average Placement:** ${avgPlace.toFixed(
                2
              )}\n\n` +
              tourneyIndices
                .map(
                  (entry) =>
                    `${tourneyNames[entry]}: ${
                      playerInfo[2][64 + entry * 6 + (entry > 12) * 1]
                    } - ${
                      playerInfo[2][68 + entry * 6 + (entry > 12) * 1]
                    } pts *${
                      playerInfo[2][69 + entry * 6 + (entry > 12) * 1]
                    } adj.* (${
                      playerInfo[2][67 + entry * 6 + (entry > 12) * 1]
                    }/${
                      playerInfo[2][66 + entry * 6 + (entry > 12) * 1]
                    })`
                )
                .join("\n") +
              `\n8p T4: ${playerInfo[1][0]} - ${playerInfo[1][7]} pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
            : `**Rookie Tourney**\n\n8p T4: ${playerInfo[1][0]} - ${playerInfo[1][7]} pts (${playerInfo[1][2]}/${playerInfo[1][1]})`
          : `**Overall Points:** ${playerInfo[2][3]}\n**Overall Adjusted Points:** ${
              playerInfo[2][4]
            }\n**Overall Record:** ${playerInfo[2][2]}/${
              playerInfo[2][1]
            } (${+(
              (playerInfo[2][2] / playerInfo[2][1]) *
              100
            ).toFixed(2)}%)\n**Tourney Wins:** ${wins}\n**Average Placement:** ${avgPlace.toFixed(
              2
            )}\n\n` +
            tourneyIndices
              .map(
                (entry) =>
                  `${tourneyNames[entry]}: ${
                    playerInfo[2][64 + entry * 6 + (entry > 12) * 1]
                  } - ${
                    playerInfo[2][68 + entry * 6 + (entry > 12) * 1]
                  } pts *${
                    playerInfo[2][69 + entry * 6 + (entry > 12) * 1]
                  } adj.* (${
                    playerInfo[2][67 + entry * 6 + (entry > 12) * 1]
                  }/${
                    playerInfo[2][66 + entry * 6 + (entry > 12) * 1]
                  })`
              )
              .join("\n")
      )
      .setFooter({
        text: `Updated ${user.updateTime}`,
      });

    await interaction.reply({
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      embeds: [errorMessage(
        "😔 There was an error making your request. You may have entered an incorrect player name."
      )],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playerstats")
    .setDescription("View a player's tournament statistics.")
    .addStringOption((option) =>
      option
        .setName("player")
        .setDescription(
          "Player name. Leave blank to view your own statistics."
        )
        .setRequired(false)
    ),

  execute,
};
