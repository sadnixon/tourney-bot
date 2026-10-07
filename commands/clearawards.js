const { SlashCommandBuilder } = require("discord.js");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  const awardList = [
    "assassin",
    "morgana",
    "merlin",
    "percival",
    "vt",
    "shot",
    "robbed",
  ];

  for (const award of awardList) {
    await team_roles_channels.set(
      award,
      await award_information.clear(award)
    );
  }

  await interaction.reply(
    "All awards have now been cleared from the list."
  );

  console.log(team_roles_channels);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clearawards")
    .setDescription("Clear all awards."),

  execute,
};
