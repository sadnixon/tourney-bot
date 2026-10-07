const { SlashCommandBuilder } = require("discord.js");
const sheet = require("../sheet");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  sheet.dumpAwards();

  await interaction.reply("Awards Dumped.");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dumpawards")
    .setDescription("Dump awards to the spreadsheet."),

  execute,
};
