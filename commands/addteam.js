const { SlashCommandBuilder } = require("discord.js");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  const role = interaction.options.getRole("role");
  const mods = interaction.options.getBoolean("mods") ?? false;

  if (!role) {
    return interaction.reply({
      content: "Incorrect or no parameter.",
      ephemeral: true,
    });
  }

  const roleId = role.id;
  const channelId = interaction.channel.id;

  if (mods) {
    await team_roles_channels.set("mod_team", [roleId, channelId]);

    await interaction.reply({
      content: `<@&${roleId}> is now assigned as the mod team, associated with this channel.`,
      ephemeral: true,
    });
  } else {
    const teams = (await team_roles_channels.get("teams")) ?? [];

    await team_roles_channels.set("teams", teams.concat([[roleId, channelId]]));

    await interaction.reply({
      content: `<@&${roleId}> is now in the list of team roles, associated with this channel.`,
      ephemeral: true,
    });
  }

  console.log(team_roles_channels);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addteam")
    .setDescription("Add a team role associated with this channel.")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to add.")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("mods")
        .setDescription("Assign this role as the mod team instead.")
        .setRequired(false),
    ),

  execute,
};
