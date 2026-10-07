const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  try {
    const playerInput = interaction.options.getString("player");

    let id = interaction.user.id;

    if (playerInput) {
      const player = await names_dictionary.get(
        playerInput.toLowerCase()
      );

      if (player == null || player.discord == null) {
        return interaction.reply({
          embeds: [errorMessage(
            "Must include a valid tourney name for someone who has guessed."
          )],
          ephemeral: true,
        });
      }

      id = player.discord;
    }

    const guessRecord = await sheet.getPersonalStats(id);

    const embed = new EmbedBuilder()
      .setTitle("Personal Guess Record")
      .setDescription(
        guessRecord
          .map(
            (entry) =>
              `**${entry.game}.** ${entry.merlin} (${entry.correct})`
          )
          .join("\n")
      )
      .addFields({
        name: "Guesser:",
        value: `<@${id}>`,
      })
      .setFooter({
        text: `Updated ${user.updateTime}`,
      });

    await interaction.reply({
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      embeds: [errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("personalrecord")
    .setDescription("View a player's personal Merlin guess record.")
    .addStringOption((option) =>
      option
        .setName("player")
        .setDescription(
          "Tourney name of the player. Leave blank to view your own record."
        )
        .setRequired(false)
    ),

  execute,
};
