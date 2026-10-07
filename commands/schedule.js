const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");
const { getYear, getMonth, getStartDay } = require("../constants");
const { format } = require("date-fns");
const { TZDate } = require("@date-fns/tz");

async function scheduleEmbed(dayNumber, footer) {
  const currentDate = new Date();
  const schedule = await sheet.getSchedule();

  const daySchedule = schedule.find(
    (day) => day.number === parseInt(dayNumber)
  );

  const games = await sheet.getGames();

  return new EmbedBuilder()
    .setTitle(
      `Day ${dayNumber}: ${format(
        new TZDate(daySchedule.date, "UTC"),
        "eee, LLL do"
      )}`
    )
    .setDescription("All times are shown in your local timezone:")
    .addFields(
      ...daySchedule.games
        .filter((entry) => entry !== null)
        .map((game) => {
          const timeMessage = `${
            game.time > currentDate
              ? "Not played yet - starts"
              : "In progress - started"
          } <t:${game.time / 1000}:R>`;

          const gameHeader = `Game ${game.number} (${game.type}), <t:${
            game.time / 1000
          }:t>`;

          if (game.type === "Bullet" || game.type === "Bullet +") {
            const gameInfos = games.filter(
              (g) => g.number === game.number
            );

            const played = gameInfos.every(
              (gameInfo) => gameInfo.played
            );

            return {
              name: gameHeader,
              value: played
                ? gameInfos
                    .map(
                      (gameInfo) =>
                        `${gameInfo.subGame}: ${
                          gameInfo.spyWin
                            ? "Spy win"
                            : "Resistance win"
                        }: ${gameInfo.winners.join(", ")}`
                    )
                    .join("\n")
                : timeMessage,
            };
          }

          const gameInfo = games.find(
            (g) => g.number === game.number
          );

          return {
            name: gameHeader,
            value: gameInfo.played
              ? `${
                  gameInfo.spyWin
                    ? "Spy win"
                    : "Resistance win"
                }: ${gameInfo.winners.join(", ")}`
              : timeMessage,
          };
        })
    )
    .setFooter({
      text: footer,
    });
}

function scheduleButtons(dayNumber) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("schedule_previous")
      .setLabel("Previous Day")
      .setEmoji("◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(dayNumber <= 1),

    new ButtonBuilder()
      .setCustomId("schedule_next")
      .setLabel("Next Day")
      .setEmoji("▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(dayNumber >= 10)
  );
}

async function execute(interaction, user) {
  const YEAR = await getYear();
  const MONTH = await getMonth();
  const START_DAY = await getStartDay();

  const currentDate = new Date();
  const startDate = new Date(
    Date.UTC(YEAR, MONTH, START_DAY)
  );
  const endDate = new Date(
    Date.UTC(YEAR, MONTH, START_DAY + 10)
  );

  let dayNumber;

  if (currentDate.getTime() < startDate.getTime()) {
    dayNumber = 1;
  } else if (currentDate.getTime() > endDate.getTime()) {
    dayNumber = 10;
  } else {
    dayNumber = Math.min(
      10,
      Math.max(
        1,
        currentDate.getUTCHours() < 9
          ? currentDate.getUTCDate() - START_DAY
          : currentDate.getUTCDate() - START_DAY + 1
      )
    );
  }

  const requestedDay = interaction.options.getInteger("day");

  if (requestedDay !== null) {
    dayNumber = requestedDay;
  }

  if (!dayNumber) {
    return interaction.reply({
      embeds: [errorMessage(
        "Please enter a day (e.g. 1) or leave blank to use the current day."
      )],
      ephemeral: true,
    });
  }

  if (dayNumber < 1 || dayNumber > 10) {
    return interaction.reply({
      embeds: [errorMessage(
        `Could not find a schedule for day ${dayNumber}.`
      )],
      ephemeral: true,
    });
  }

  const footer = `Updated ${user.updateTime}`;

  try {
    const embed = await scheduleEmbed(dayNumber, footer);

    await interaction.reply({
      embeds: [embed],
      components: [scheduleButtons(dayNumber)],
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      time: 60000,
      filter: (buttonInteraction) =>
        buttonInteraction.user.id === interaction.user.id &&
        ["schedule_previous", "schedule_next"].includes(
          buttonInteraction.customId
        ),
    });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "schedule_previous") {
        dayNumber = Math.max(dayNumber - 1, 1);
      } else if (buttonInteraction.customId === "schedule_next") {
        dayNumber = Math.min(dayNumber + 1, 10);
      }

      try {
        const newEmbed = await scheduleEmbed(
          dayNumber,
          footer
        );

        await buttonInteraction.update({
          embeds: [newEmbed],
          components: [scheduleButtons(dayNumber)],
        });
      } catch (err) {
        console.error(err);

        if (!buttonInteraction.replied) {
          await buttonInteraction.reply({
            embeds: [errorMessage(
              "😔 There was an error updating the schedule. Please try again in a bit."
            )],
            ephemeral: true,
          });
        }
      }
    });

    collector.on("end", async () => {
      try {
        const finalEmbed = await scheduleEmbed(
          dayNumber,
          footer
        );

        await message.edit({
          embeds: [finalEmbed],
          components: [],
        });
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [errorMessage(
          "😔 There was an error making your request. Please try again in a bit."
        )],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [errorMessage(
          "😔 There was an error making your request. Please try again in a bit."
        )],
        ephemeral: true,
      });
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("View the tournament schedule.")
    .addIntegerOption((option) =>
      option
        .setName("day")
        .setDescription(
          "Day to view. Leave blank to use the current day."
        )
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  execute,
};
