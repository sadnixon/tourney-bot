const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");
const { getStartDay } = require("../constants");
const { format, utcToZonedTime } = require("date-fns-tz");
const { formatDistanceToNow } = require("date-fns");

async function scheduleEmbed(dayNumber, footer) {
  const currentDate = new Date();
  const schedule = await sheet.getSchedule();
  //console.log(schedule);

  const daySchedule = schedule.find(
    (day) => day.number === parseInt(dayNumber)
  );
  const games = await sheet.getGames();
  //console.log(games);
  return new Discord.MessageEmbed()
    .setTitle(
      `Day ${dayNumber}: ${format(
        utcToZonedTime(daySchedule.date, "UTC"),
        "eee, LLL do"
      )}`
    )
    .setDescription("All times are shown in your local timezone:")
    .addFields(
      ...daySchedule.games
        .filter((entry) => entry !== null)
        .map((game) => {
          //added this filter to account for possible missing 5th games
          const timeMessage = `${
            game.time > currentDate
              ? "Not played yet - starts"
              : "In progress - started"
          } <t:${game.time / 1000}:R>`;
          const gameHeader = `Game ${game.number} (${game.type}), <t:${
            game.time / 1000
          }:t>`;
          if (
            game.type === "Silent" ||
            game.type === "Silent+" ||
            game.type === "Bullet" ||
            game.type === "Mystery Special" ||
            game.type === "Birthday"
          ) {
            const gameInfos = games.filter((g) => g.number === game.number);
            const gameInfosPlayed = gameInfos.map((gameInfo) => gameInfo.played);
            const played = gameInfosPlayed.every(Boolean);

            return {
              name: gameHeader,
              value: played
                ? gameInfos.map(
                    (gameInfo) =>
                      `${gameInfo.subGame}: ${
                        gameInfo.fasWin ? "Fascist win" : "Liberal win"
                      }: ${gameInfo.winners.join(", ")} - [Replay](${
                        gameInfo.link
                      })`
                  )
                : timeMessage,
            };
          } else {
            const gameInfo = games.find((g) => g.number === game.number);
            return {
              name: gameHeader,
              value: gameInfo.played
                ? `${
                    gameInfo.fasWin ? "Fascist win" : "Liberal win"
                  }: ${gameInfo.winners.join(", ")} - [Replay](${
                    gameInfo.link
                  })`
                : timeMessage,
            };
          }
        })
    )
    .setFooter(footer);
}

async function execute(message, args, user) {
  const currentDate = new Date();
  let dayNumber = Math.min(
    10,
    Math.max(
      1,
      currentDate.getUTCHours() < 9 // day changes at 9AM UTC
        ? currentDate.getUTCDate() - (await getStartDay())
        : currentDate.getUTCDate() - (await getStartDay()) + 1
    )
  );
  if (args.length > 0) {
    dayNumber = parseInt(args[0]);
  }

  if (!dayNumber) {
    message.channel.send(
      errorMessage(
        "Please enter a day (e.g. 1) or leave blank to use the current day."
      )
    );
    return;
  }

  if (dayNumber < 1 || dayNumber > 10) {
    message.channel.send(
      errorMessage(`Could not find a schedule for day ${dayNumber}.`)
    );
    return;
  }

  let footer = `Updated ${user.updateTime}`;

  try {
    const embed = await scheduleEmbed(dayNumber, footer);
    const emb = await message.channel.send(embed);
    await emb.react("◀");
    await emb.react("▶");
    const filter = (reaction, user) => {
      return ["◀", "▶"].includes(reaction.emoji.name);
    };

    const collector = emb.createReactionCollector(filter, { time: 60000 });
    collector.on("collect", async (reaction, author) => {
      if (reaction.emoji.name === "◀") {
        dayNumber = Math.max(dayNumber - 1, 1);
      } else {
        dayNumber = Math.min(dayNumber + 1, 10);
      }
      const newEmbed = await scheduleEmbed(dayNumber, footer);
      emb.edit(newEmbed);
      const userReactions = emb.reactions.cache.filter((reaction) =>
        reaction.users.cache.has(author.id)
      );
      try {
        for (const reaction of userReactions.values()) {
          await reaction.users.remove(author.id);
        }
      } catch (err) {
        // Sentry.captureException(err);
        console.error(err);
        console.error("Failed to remove reactions.");
      }
    });
  } catch (err) {
    // Sentry.captureException(err);
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )
    );
  }
}

module.exports = {
  name: "schedule",
  aliases: ["sc"],
  description: "Schedule",
  execute,
};
