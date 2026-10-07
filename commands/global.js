const { SlashCommandBuilder } = require("discord.js");
const { GLOBAL_SHEET_URL } = require("../constants");

async function execute(interaction, user) {
  await interaction.reply(
    `Official Global Tourney Sheet: <${GLOBAL_SHEET_URL}>`,
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("global")
    .setDescription("Get the official Global Tourney Sheet."),

  execute,
};
