const { SlashCommandBuilder } = require("discord.js");
const { errorMessage } = require("../message-helpers");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  const key = interaction.options.getString("key");
  const value = interaction.options.getString("value");

  try {
    const numericKeys = [
      "YEAR",
      "MONTH",
      "START_DAY",
      "GAME_NUMBER",
      "GLOBAL_UPDATED",
    ];

    if (numericKeys.includes(key)) {
      const parsedValue = parseInt(value);

      if (!Number.isInteger(parsedValue)) {
        return interaction.reply({
          embeds: [errorMessage("The value must be an integer.")],
          ephemeral: true,
        });
      }

      await sheet_data.set(key, parsedValue);
      return interaction.reply(`Updated ${key} to ${parsedValue}!`);
    }

    await sheet_data.set(key, value);

    return interaction.reply(`Updated ${key} to ${value}!`);
  } catch (err) {
    console.error(err);

    return interaction.reply({
      embeds: [errorMessage("No parameters entered.")],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Update a sheet configuration value.")
    .addStringOption((option) =>
      option
        .setName("key")
        .setDescription("Configuration setting to update.")
        .setRequired(true)
        .addChoices(
          { name: "YEAR", value: "YEAR" },
          { name: "MONTH", value: "MONTH" },
          { name: "START_DAY", value: "START_DAY" },
          { name: "GAME_NUMBER", value: "GAME_NUMBER" },
          { name: "GLOBAL_UPDATED", value: "GLOBAL_UPDATED" },
          { name: "SHEET_URL", value: "SHEET_URL" },
          { name: "FORM_URL", value: "FORM_URL" },
          { name: "VC_TEXT_2_ID", value: "VC_TEXT_2_ID" },
          { name: "GUILD_ID", value: "GUILD_ID" },
          { name: "teamEmoji1", value: "teamEmoji1" },
          { name: "teamEmoji2", value: "teamEmoji2" },
          { name: "teamEmoji3", value: "teamEmoji3" },
          { name: "teamEmoji4", value: "teamEmoji4" },
          { name: "teamEmoji5", value: "teamEmoji5" },
          { name: "teamEmoji6", value: "teamEmoji6" },
          { name: "teamEmoji7", value: "teamEmoji7" },
          { name: "teamEmoji8", value: "teamEmoji8" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("value")
        .setDescription("New value for the setting.")
        .setRequired(true)
    ),

  execute,
};