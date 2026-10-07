const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Commands")
    .addFields(
      {
        name: "/schedule [day]",
        value:
          "Find the game schedule and replay links for today or another day.",
      },
      {
        name: "/leaderboard",
        value: "View the team leaderboard.",
      },
      {
        name: "/mvp",
        value: "View the MVP running.",
      },
      {
        name: "/playerstats [player]",
        value: "View all-time statistics for a player.",
      },
      {
        name: "/head2head [player] [player]",
        value:
          "View head-to-head matchup statistics between two players.",
      },
      {
        name: "/guessleaderboard [length]",
        value: "View the Merlin guessers leaderboard.",
      },
      {
        name: "/fantasyleaderboard [length]",
        value: "View the Fantasy League leaderboard.",
      },
      {
        name: "/bestguess [game]",
        value: "View the best guess made for a specific game.",
      },
      {
        name: "/personalrecord [guesser]",
        value: "View a guesser's personal guess record.",
      },
      {
        name: "/sheet",
        value: "Send a link to the official tourney Google sheet.",
      },
      {
        name: "/global",
        value: "Send a link to the official global tourney Google sheet.",
      },
      {
        name: "/guessmerlin [merlin]",
        value: "Submit a guess for a Merlin in a game.",
      },
      {
        name: "/submit",
        value:
          "Nominate a player for one of the end-of-tourney awards.",
      },
      {
        name: "/info",
        value: "Show this help message.",
      }
    );

  await interaction.reply({
    embeds: [embed],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Show the list of available commands."),

  execute,
};