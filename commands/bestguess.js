const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");

async function execute(interaction) {
  const gameNumber = interaction.options.getString("game");

  try {
    let game;

    if (["A", "B", "a", "b"].includes(gameNumber.slice(-1))) {
      const subIndicatorList = ["a", "b"];

      game =
        parseInt(gameNumber.slice(0, -1)) +
        (1 + subIndicatorList.indexOf(gameNumber.slice(-1).toLowerCase())) / 10;
    } else {
      game = parseInt(gameNumber);
    }

    if (isNaN(game)) {
      return interaction.reply({
        embeds: [errorMessage(
          "Must include a valid game number, such as 27 or 1B."
        )],
        ephemeral: true,
      });
    }

    const guessInfo = await sheet.getBestGuess(game);

    if (guessInfo.merlin === null) {
      return interaction.reply({
        embeds: [errorMessage(
          "This game is not complete or has no guesses."
        )],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(
        `Correct Merlin Guessers For Game ${gameNumber.toUpperCase()}`
      )
      .setDescription(
        `Merlin: **${guessInfo.merlin}**\n\n` +
          `Correct Guessers: <@${guessInfo.guesserList.join(
            ">, <@"
          )}>\n\n` +
          `Guesser Accuracy: ${(guessInfo.average * 100).toFixed(1)}% ` +
          `(${guessInfo.guesserList.length}/${guessInfo.guessnum})\n` +
          `Most Common False Guess: **${guessInfo.mostfalse}** ` +
          `${(
            (guessInfo.falsenum / guessInfo.guessnum) *
            100
          ).toFixed(1)}% ` +
          `(${guessInfo.falsenum}/${guessInfo.guessnum})`
      );

    await interaction.reply({
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      embeds: [errorMessage(
        "😔 There was an error making your request. You may have entered an incorrect game number."
      )],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bestguess")
    .setDescription("View the best Merlin guess for a specific game.")
    .addStringOption((option) =>
      option
        .setName("game")
        .setDescription("The game number, such as 27, 1A, or 1B.")
        .setRequired(true)
    ),

  execute,
};
