const { SlashCommandBuilder } = require("discord.js");
const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  const awardList = [
    "assassin",
    "morgana",
    "merlin",
    "percival",
    "vt",
    "shot",
    "robbed",
  ];

  const award = interaction.options.getString("award").toLowerCase();
  const player = interaction.options.getString("player");
  const gameNumber = interaction.options.getInteger("game");

  const currentGameNumber = await getGameNumber();
  const timestamp = new Date();

  if (gameNumber > 0 && gameNumber <= currentGameNumber) {
    const existingNominations =
      (await award_information.get(award)) ?? [];

    await award_information.set(
      award,
      existingNominations.concat([
        [
          timestamp,
          interaction.user.username,
          player,
          gameNumber,
        ],
      ])
    );

    return interaction.reply(
      `Award Nomination received! Thank you, <@${interaction.user.id}>.`
    );
  }

  return interaction.reply({
    embeds: [errorMessage(
      "Must include a valid game number. The game number must be greater than 0 and no greater than the current game number."
    )],
    ephemeral: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit an award nomination.")
    .addStringOption((option) =>
      option
        .setName("award")
        .setDescription("Award category.")
        .setRequired(true)
        .addChoices(
          { name: "Assassin", value: "assassin" },
          { name: "Morgana", value: "morgana" },
          { name: "Merlin", value: "merlin" },
          { name: "Percival", value: "percival" },
          { name: "VT", value: "vt" },
          { name: "Shot", value: "shot" },
          { name: "Robbed", value: "robbed" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("player")
        .setDescription("Player being nominated.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("game")
        .setDescription("Game number.")
        .setRequired(true)
    ),

  execute,
};