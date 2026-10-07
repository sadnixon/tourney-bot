const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(interaction, user) {
  let players;

  try {
    players = await sheet.getPlayers();
  } catch (err) {
    console.error(err);

    return interaction.reply({
      embeds: [errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )],
      ephemeral: true,
    });
  }

  const winrate = interaction.options.getBoolean("winrate") ?? false;

  if (!winrate) {
    players = players.filter(
      (p) => p.name && p.gamesPlayed > 0 && p.personalScore > 0
    );

    players.sort(
      (a, b) =>
        b.personalScore - a.personalScore || b.winrate - a.winrate
    );

    const ranks = rank(players, "personalScore", "winrate");

    const embed = new EmbedBuilder()
      .setTitle("MVP Running (Personal Score)")
      .setDescription(
        players.length > 0
          ? players
              .slice(0, ranks.length)
              .map(
                (p, i) =>
                  `${ranks[i]}. ${p.teamName} - ${p.name} - ${p.personalScore} points`
              )
              .join("\n")
          : "This list will populate once games have been played."
      )
      .setFooter({
        text: `Use /mvp winrate:true to view the MVP running by winrate.\nUpdated ${user.updateTime}`,
      });

    return interaction.reply({
      embeds: [embed],
    });
  }

  players = players.filter(
    (p) => p.name && p.gamesPlayed > 0 && p.winrate > 0
  );

  players.sort(
    (a, b) =>
      b.winrate - a.winrate || b.personalScore - a.personalScore
  );

  const ranks = rank(players, "winrate", "personalScore");

  const embed = new EmbedBuilder()
    .setTitle("MVP Running (Winrate)")
    .setDescription(
      players.length > 0
        ? players
            .slice(0, ranks.length)
            .map(
              (p, i) =>
                `${ranks[i]}. ${p.teamName} - ${p.name} - ${(
                  p.winrate * 100
                ).toFixed(1)}% (${p.gamesWon}/${p.gamesPlayed})`
            )
            .join("\n")
        : "This list will populate once games have been played."
    )
    .setFooter({
      text: `Use /mvp to view the MVP running by points.\nUpdated ${user.updateTime}`,
    });

  await interaction.reply({
    embeds: [embed],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mvp")
    .setDescription("View the current MVP running.")
    .addBooleanOption((option) =>
      option
        .setName("winrate")
        .setDescription("Rank MVP candidates by winrate instead of points.")
        .setRequired(false)
    ),

  execute,
};
