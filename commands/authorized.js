const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  const authorizedUsers =
    (await authorized_data_setters.get("auth")) ?? [];

  const uniqueUsers = [...new Set(authorizedUsers)];

  const embed = new EmbedBuilder()
    .setTitle("Authorized Tourney Bot Users:")
    .setDescription(
      uniqueUsers.length > 0
        ? uniqueUsers.map((id) => `<@${id}>`).join(", ")
        : "No authorized users."
    )
    .setFooter({
      text: `Updated ${user.updateTime}`,
    });

  await interaction.reply({
    embeds: [embed],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("authorized")
    .setDescription("Display all authorized Tourney Bot users."),

  execute,
};
