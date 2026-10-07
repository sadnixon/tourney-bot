const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(interaction, user) {
  try {
    const accuracy = interaction.options.getBoolean("accuracy") ?? false;
    const requestedNumber = interaction.options.getInteger("players");

    const playerNumber = Math.min(requestedNumber ?? 10, 30);

    const leaderboard = await sheet.getGuessLeaderboard();

    accuracy
      ? leaderboard.sort((a, b) => b.acc - a.acc || b.score - a.score)
      : leaderboard.sort((a, b) => b.score - a.score || b.acc - a.acc);

    const ranks = rank(
      leaderboard,
      accuracy ? "acc" : "score",
      accuracy ? "score" : "acc",
      playerNumber
    );

    const embed = new EmbedBuilder()
      .setTitle(
        accuracy
          ? "Merlin Guesser Accuracy Leaderboard"
          : "Merlin Guesser Leaderboard"
      )
      .setDescription(
        leaderboard
          .slice(0, playerNumber)
          .filter((entry) => entry.name !== null)
          .map(
            (entry, i) =>
              `${ranks[i]}. <@${entry.name}> Points: ${
                entry.score
              } Accuracy: ${(entry.acc * 100).toFixed(1)}%`
          )
          .join("\n")
      )
      .setFooter({
        text: accuracy
          ? `Use /guessleaderboard to view the best Merlin guessers by points.\nUpdated ${user.updateTime}`
          : `Use /guessleaderboard accuracy:true to view the best Merlin guessers by accuracy.\nUpdated ${user.updateTime}`,
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
    .setName("guessleaderboard")
    .setDescription("Merlin Guesser Leaderboard")
    .addIntegerOption((option) =>
      option
        .setName("players")
        .setDescription("Number of players to display (default 10, maximum 30).")
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("accuracy")
        .setDescription("Sort by accuracy instead of total points.")
        .setRequired(false)
    ),

  execute,
};