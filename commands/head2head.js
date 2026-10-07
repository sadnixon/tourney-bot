const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  let player1;
  let player2;

  const player1Input = interaction.options.getString("player1");
  const player2Input = interaction.options.getString("player2");

  if (!player1Input) {
    return interaction.reply({
      embeds: [errorMessage(
        "Must include two valid player names, or include one valid player name and have played in the tourney yourself."
      )],
      ephemeral: true,
    });
  }

  if (!player2Input) {
    player1 = await names_dictionary.get(player1Input.toLowerCase());
    player2 = await ids_dictionary.get(interaction.user.id);

    if (player2 == null) {
      return interaction.reply({
        embeds: [errorMessage(
          "Must include two valid player names, or have played in the tourney yourself when only providing one player."
        )],
        ephemeral: true,
      });
    }
  } else {
    player1 = await names_dictionary.get(player1Input.toLowerCase());
    player2 = await names_dictionary.get(player2Input.toLowerCase());
  }

  if (player1 == null || player2 == null) {
    return interaction.reply({
      embeds: [errorMessage(
        "Must include two valid player names."
      )],
      ephemeral: true,
    });
  }

  try {
    const player1Info = await sheet.getPlayerGames(player1);
    const player2Info = await sheet.getPlayerGames(player2);
    const gameDict = player1Info.gameDict;

    const player1Games = new Set(Object.keys(player1Info.playerGames));
    const player2Games = new Set(Object.keys(player2Info.playerGames));

    const sharedGames = [...player1Games].filter((g) =>
      player2Games.has(g)
    );

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
        player1Info.playerGames[key].team !==
        player2Info.playerGames[key].team,
      p1_won:
        gameDict[key].winner === player1Info.playerGames[key].team,
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
      const embed = new EmbedBuilder()
        .setTitle(
          `Head 2 Head Record: ${player1.global} - ${player2.global}`
        )
        .setDescription("Never even touched...")
        .setFooter({
          text: `Updated ${user.updateTime}`,
        });

      return interaction.reply({
        embeds: [embed],
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(
        `Head 2 Head Record: ${player1.global} - ${player2.global}`
      )
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
                    `8p T${g.tourney} - ${g.game}: **${
                      g.p1_won ? "W" : "L"
                    }** - ${g.p1_role} vs. ${g.p2_role} (${g.mode})`
                )
                .join("\n")
            : "*Haven't faced off yet.*"
        }\n\n**Games As Team:**\n${
          teamGP
            ? teamGames
                .map(
                  (g) =>
                    `8p T${g.tourney} - ${g.game}: **${
                      g.p1_won ? "W" : "L"
                    }** - ${g.p1_role} & ${g.p2_role} (${g.mode})`
                )
                .join("\n")
            : "*No teamups yet.*"
        }`
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
        "😔 There was an error making your request. You may have entered incorrect player names."
      )],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("head2head")
    .setDescription("Compare the head-to-head record of two players.")
    .addStringOption((option) =>
      option
        .setName("player1")
        .setDescription("First player.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("player2")
        .setDescription(
          "Second player. Leave blank to compare against yourself."
        )
        .setRequired(false)
    ),

  execute,
};
