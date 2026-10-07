const { SlashCommandBuilder } = require("discord.js");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  const targetUser = interaction.options.getUser("user");
  const id = targetUser.id;

  const authorizedUsers =
    (await authorized_data_setters.get("auth")) ?? [];

  await authorized_data_setters.set(
    "auth",
    authorizedUsers.concat([id])
  );

  await interaction.reply(`<@${id}> is now authorized.`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("authorize")
    .setDescription("Authorize a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to authorize.")
        .setRequired(true)
    ),

  execute,
};
