const { SlashCommandBuilder } = require("discord.js");
const { alertMessage } = require("../message-helpers");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  if (coolDown) {
    return interaction.editReply({
      content: "You can only do that command every 5 minutes.",
      ephemeral: true,
    });
  }

  await alertMessage(interaction.client);

  coolDown = true;

  setTimeout(() => {
    coolDown = false;
  }, 300000);

  await interaction.editReply("Alert sent.");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alert")
    .setDescription("Send an alert to the appropriate channels."),

  execute,
};
