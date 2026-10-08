const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { errorMessage, rank } = require("../message-helpers");

async function execute(interaction, user) {
  return await interaction.reply(
    `Sorry, no matchups command right now, it's a real pain.`,
  );
  try {
    const playerInput = interaction.options.getString("player");
    const teamOpp = interaction.options.getString("type");
    const bestWorst =
      interaction.options.getString("sort") === "worst" ? "Worst" : "Best";
    const minGames = interaction.options.getInteger("mingames") ?? 2;

    let player1;

    if (playerInput) {
      player1 = await names_dictionary.get(playerInput.toLowerCase());
    } else {
      player1 = await ids_dictionary.get(interaction.user.id);
    }

    if (player1 == null) {
      return interaction.reply({
        embeds: [
          errorMessage(
            "Must include a valid player name or be a tournament player yourself.",
          ),
        ],
        ephemeral: true,
      });
    }

    const player1Info = await matchup_dictionary.get(player1.global);

    let matchupList = [];

    for (const player2 in player1Info) {
      matchupList.push({
        otherName: player2,
        oppGames: player1Info[player2].oppGames,
        oppWins: player1Info[player2].oppWins,
        oppWR: player1Info[player2].oppWR,
        teamGames: player1Info[player2].teamGames,
        teamWins: player1Info[player2].teamWins,
        teamWR: player1Info[player2].teamWR,
      });
    }

    let filteredList;

    if (teamOpp === "team") {
      filteredList = matchupList.filter((item) => item.teamGames >= minGames);

      if (bestWorst === "Best") {
        filteredList.sort(
          (a, b) => b.teamWR - a.teamWR || b.teamGames - a.teamGames,
        );
      } else {
        filteredList.sort(
          (a, b) => a.teamWR - b.teamWR || b.teamGames - a.teamGames,
        );
      }
    } else {
      filteredList = matchupList.filter((item) => item.oppGames >= minGames);

      if (bestWorst === "Best") {
        filteredList.sort(
          (a, b) => b.oppWR - a.oppWR || b.oppGames - a.oppGames,
        );
      } else {
        filteredList.sort(
          (a, b) => a.oppWR - b.oppWR || b.oppGames - a.oppGames,
        );
      }
    }

    filteredList = filteredList.slice(0, 10);

    const ranks = rank(
      filteredList,
      teamOpp === "team" ? "teamWR" : "oppWR",
      teamOpp === "team" ? "teamGames" : "oppGames",
      10,
    );

    const embed = new EmbedBuilder()
      .setTitle(
        `${bestWorst} ${
          teamOpp === "team" ? "Team" : "Opp"
        } Matchups: ${player1.global}`,
      )
      .setDescription(
        `**Minimum Games: ${minGames}**\n\n${filteredList
          .map(
            (entry, i) =>
              `${ranks[i]}\\. ${entry.otherName}: **${
                teamOpp === "team" ? entry.teamWR : entry.oppWR
              }%** (${teamOpp === "team" ? entry.teamWins : entry.oppWins}/${
                teamOpp === "team" ? entry.teamGames : entry.oppGames
              })`,
          )
          .join("\n")}`,
      )
      .setFooter({
        text: `Updated ${user.updateTime}`,
      });

    await interaction.reply({
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      embeds: [
        errorMessage(
          "😔 There was an error making your request. You may have entered incorrect player names.",
        ),
      ],
      ephemeral: true,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("matchups")
    .setDescription("View a player's best or worst matchups.")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("View games played together or against each other.")
        .setRequired(true)
        .addChoices(
          { name: "Team", value: "team" },
          { name: "Opp", value: "opp" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("player")
        .setDescription("Player to view. Leave blank to use yourself.")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription("Show the best or worst matchups.")
        .setRequired(false)
        .addChoices(
          { name: "Best", value: "best" },
          { name: "Worst", value: "worst" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("mingames")
        .setDescription("Minimum number of games played.")
        .setMinValue(1)
        .setRequired(false),
    ),

  execute,
};
