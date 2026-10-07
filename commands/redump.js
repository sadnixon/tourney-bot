const { SlashCommandBuilder } = require("discord.js");
const sheet = require("../sheet");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  await sheet.dumpGuesses(guess_information);

  await interaction.reply("Guesses Re-Dumped.");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("redump")
    .setDescription("Re-dump all Merlin guesses."),
  execute,
};