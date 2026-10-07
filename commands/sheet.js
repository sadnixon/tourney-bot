const { SlashCommandBuilder } = require("discord.js");
const { getSheetURL } = require("../constants");

async function execute(interaction, user) {
  await interaction.reply(
    `Official Tourney Sheet: <${await getSheetURL()}>`
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sheet")
    .setDescription("Get the official tournament sheet."),
  execute,
};