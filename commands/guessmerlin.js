const { SlashCommandBuilder, ChannelType } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");
const { getTournamentVCTextTwo, getGameNumber } = require("../constants");

async function execute(interaction, user) {
  const isdm = interaction.channel?.type === ChannelType.DM;

  const games2 = await sheet.getGames();
  const currentGame = games2.find((g) => !g.played);
  const timestamp = new Date();
  const vcTextTwo = await getTournamentVCTextTwo();
  const gameNumber = await getGameNumber();

  const guessOptions = await guess_information.get("guessOptions");
  const subGameIndicator = await guess_information.get("subGameIndicator");
  const finalGame = await guess_information.get("finalGame");
  const player = interaction.options.getString("player");

  if (
    !isdm &&
    interaction.channel.id !== "855806852108255292" &&
    interaction.channel.id !== vcTextTwo.toString()
  ) {
    return interaction.reply({
      embeds: [errorMessage(
        "Merlin guesses can only be made in #tournament-vc-text or DMs.",
      )],
      ephemeral: true,
    });
  }

  if (!(await guess_information.get("open"))) {
    return interaction.reply({
      embeds: [errorMessage(
        "Merlin guesses can only be made during in-progress games.",
      )],
      ephemeral: true,
    });
  }

  // Final game: determine the game number from which sub-array
  // contains the submitted player.
  if (finalGame) {
    const normalizedPlayer = player.toLowerCase();

    const finalGameIndex = guessOptions.findIndex((options) =>
      options.map((opt) => opt.toLowerCase()).includes(normalizedPlayer),
    );

    if (finalGameIndex !== -1) {
      const guessedGame = finalGame[finalGameIndex];

      await guess_information.set(`${interaction.user.id}_${guessedGame}`, [
        timestamp,
        interaction.user.id,
        player,
        guessedGame,
      ]);

      await guess_information.set(
        "guessIDs",
        (await guess_information.get("guessIDs")).concat([
          `${interaction.user.id}_${guessedGame}`,
        ]),
      );

      if (isdm) {
        return interaction.reply("Guess received!");
      }

      return interaction.reply(`<@${interaction.user.id}>'s guess received!`);
    }
  }

  // Normal game / A-B subgame.
  if (
    guessOptions.map((opt) => opt.toLowerCase()).includes(player.toLowerCase())
  ) {
    let guessedGame = currentGame.number;

    if (subGameIndicator) {
      const subIndicatorList = ["a", "b"];

      guessedGame =
        currentGame.number +
        (1 + subIndicatorList.indexOf(subGameIndicator)) / 10;
    }

    await guess_information.set(interaction.user.id, [
      timestamp,
      interaction.user.id,
      player,
      guessedGame,
    ]);

    await guess_information.set(
      "guessIDs",
      (await guess_information.get("guessIDs")).concat([interaction.user.id]),
    );

    if (isdm) {
      return interaction.reply("Guess received!");
    }

    return interaction.reply(`<@${interaction.user.id}>'s guess received!`);
  }

  return interaction.reply({
    embeds: [errorMessage("Must include a valid player username.")],
    ephemeral: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("guessmerlin")
    .setDescription("Submit a guess for Merlin.")
    .addStringOption((option) =>
      option
        .setName("player")
        .setDescription("The player you think is Merlin.")
        .setRequired(true),
    ),

  execute,
};
