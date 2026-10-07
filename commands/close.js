const { SlashCommandBuilder } = require("discord.js");
const sheet = require("../sheet");
const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  const gameNumber = await getGameNumber();
  const finalGame = await guess_information.get("finalGame");
  const game = interaction.options.getInteger("game");

  if (!await guess_information.get("open") || !user.isAuthorized) {
    return;
  }

  if (finalGame && game !== null) {
    if (!finalGame.includes(game)) {
      return interaction.reply({
        embeds: [errorMessage("Incorrect or no parameters.")],
        ephemeral: true,
      });
    }

    if (game === gameNumber - 1) {
      await guess_information.set("finalGame", [gameNumber]);
    } else {
      await guess_information.set("finalGame", [gameNumber - 1]);
    }

    return interaction.reply(`Guessing for Game ${game} Closed.`);
  }

  if (game !== null) {
    return interaction.reply({
      embeds: [errorMessage("Incorrect or no parameters.")],
      ephemeral: true,
    });
  }

  await interaction.reply("Guessing Closed.");

  if (finalGame) {
    await guess_information.set("finalGame", false);
  } else {
    await guess_information.set("subGameIndicator", false);
  }

  await guess_information.set("open", false);

  sheet.dumpGuesses(guess_information);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close Merlin guessing.")
    .addIntegerOption((option) =>
      option
        .setName("game")
        .setDescription("Final game number to close.")
        .setRequired(false)
    ),

  execute,
};
