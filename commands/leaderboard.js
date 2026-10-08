const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(interaction, user) {
  try {
    const output = await sheet.getLeaderboard();
    const leaderboard = output.leaderboard;
    const pointsRemaining = output.pointsRemaining;

    leaderboard.sort(
      (a, b) => b.score - a.score || b.gamesWon - a.gamesWon
    );

    const ranks = rank(leaderboard, "score", "gamesWon");

    const embed = new EmbedBuilder()
      .setTitle("Leaderboard")
      .setDescription(
        `${leaderboard
          .map(
            (entry, i) =>
              `${ranks[i]}\\. ${entry.name}: ${entry.score}`
          )
          .join("\n")}\n\n**Points Remaining:** ${pointsRemaining}`
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
        "😔 There was an error making your request. Please try again in a bit."
      )],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Leaderboard"),

  execute,
};
