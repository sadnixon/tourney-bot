const { SlashCommandBuilder } = require("discord.js");
const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  if ((await guess_information.get("open")) || !user.isAuthorized) {
    return;
  }

  const playersInput = interaction.options.getString("players");
  const finalPlayersInput = interaction.options.getString("finalplayers");
  const gameType = interaction.options.getString("type");

  const players = playersInput.trim().split(/\s+/);
  const finalPlayers = finalPlayersInput
    ? finalPlayersInput.trim().split(/\s+/)
    : null;

  if (players.length !== 8) {
    return interaction.reply({
      embeds: [errorMessage(
        "Incorrect parameters. The players input must contain exactly 8 player usernames.",
      )],
      ephemeral: true,
    });
  }

  if (finalPlayers && finalPlayers.length !== 8) {
    return interaction.reply({
      embeds: [errorMessage(
        "Incorrect parameters. The finalplayers input must contain exactly 8 player usernames.",
      )],
      ephemeral: true,
    });
  }

  if (gameType === "final" && !finalPlayers) {
    return interaction.reply({
      embeds: [errorMessage(
        "The final option requires a second set of 8 player usernames.",
      )],
      ephemeral: true,
    });
  }

  if (gameType !== "final" && finalPlayers) {
    return interaction.reply({
      embeds: [errorMessage(
        "A second set of players can only be provided when the final option is selected.",
      )],
      ephemeral: true,
    });
  }

  const gameNumber = await getGameNumber();

  await guess_information.clear();
  await guess_information.set("open", true);
  await guess_information.set("guessIDs", []);

  if (gameType === "final") {
    await guess_information.set("finalGame", [gameNumber - 1, gameNumber]);

    await guess_information.set("guessOptions", [players, finalPlayers]);
  } else if (gameType === "a" || gameType === "b") {
    await guess_information.set("finalGame", false);
    await guess_information.set("subGameIndicator", gameType);
    await guess_information.set("guessOptions", players);
  } else {
    await guess_information.set("finalGame", false);
    await guess_information.set("guessOptions", players);
  }

  await interaction.reply("Guessing Opened!");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("open")
    .setDescription("Open Merlin guessing for a game.")
    .addStringOption((option) =>
      option
        .setName("players")
        .setDescription("Eight player usernames, separated by spaces.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("finalplayers")
        .setDescription("Eight player usernames for the second final game.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of game.")
        .setRequired(false)
        .addChoices(
          { name: "A", value: "a" },
          { name: "B", value: "b" },
          { name: "Final", value: "final" },
        ),
    ),

  execute,
};
