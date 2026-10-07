const {
  SlashCommandBuilder,
} = require("discord.js");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  await team_roles_channels.clear("teams");

  await interaction.reply(
    "All team roles and channels have now been cleared from the list."
  );

  console.log(team_roles_channels);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearteams")
    .setDescription("Clear all team roles and their associated channels."),

  execute,
};
