const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(interaction, user) {
  try {
    const ppg = interaction.options.getBoolean("ppg") ?? false;
    const requestedNumber = interaction.options.getInteger("players");

    const playerNumber = Math.min(requestedNumber ?? 10, 30);

    const leaderboard = await sheet.getFantasyLeaderboard();

    let noModLeaderboard = leaderboard.filter((entry) => entry.mod !== "mod");

    noModLeaderboard = noModLeaderboard.filter(
      (entry) => entry.score > 0 || entry.games > 0,
    );

    ppg
      ? noModLeaderboard.sort(
          (a, b) => b.pointsPerGame - a.pointsPerGame || b.score - a.score,
        )
      : noModLeaderboard.sort(
          (a, b) => b.score - a.score || b.pointsPerGame - a.pointsPerGame,
        );

    const ranks = rank(
      noModLeaderboard,
      ppg ? "pointsPerGame" : "score",
      ppg ? "score" : "pointsPerGame",
      playerNumber,
    );

    const embed = new EmbedBuilder()
      .setTitle(
        ppg
          ? "Fantasy League Points Per Game Leaderboard"
          : "Fantasy League Leaderboard",
      )
      .setDescription(
        noModLeaderboard.length > 0
          ? noModLeaderboard
              .slice(0, playerNumber)
              .map(
                ppg
                  ? (entry, i) =>
                      `${ranks[i]}. <@${entry.name}>'s ${entry.team}: ${entry.pointsPerGame}`
                  : (entry, i) =>
                      `${ranks[i]}. <@${entry.name}>'s ${entry.team}: ${entry.score}`,
              )
              .join("\n")
          : "This list will populate once games have been played.",
      )
      .setFooter({
        text: ppg
          ? `Use /fantasyleaderboard to view the best Fantasy Teams by points.\nUpdated ${user.updateTime}`
          : `Use /fantasyleaderboard ppg:true to view the best Fantasy Teams by points per game.\nUpdated ${user.updateTime}`,
      });

    await interaction.reply({
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      content: errorMessage(
        "😔 There was an error making your request. Please try again in a bit.",
      ),
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fantasyleaderboard")
    .setDescription("Fantasy Leaderboard")
    .addIntegerOption((option) =>
      option
        .setName("players")
        .setDescription(
          "Number of players to display (default 10, maximum 30).",
        )
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("ppg")
        .setDescription("Sort by points per game instead of total points.")
        .setRequired(false),
    ),

  execute,
};
