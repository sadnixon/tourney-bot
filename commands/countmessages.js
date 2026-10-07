const { SlashCommandBuilder } = require("discord.js");
const sheet = require("../sheet");

async function execute(interaction, user) {
  if (!user.isAuthorized) {
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const eventGeneral = interaction.guild.channels.cache.get(
    "727261182448107550"
  );

  const startTime = new Date(Date.UTC(2026, 4, 30, 0));
  const endTime = new Date(Date.UTC(2026, 5, 16, 0));

  const authorDict = {};

  let message1 = await eventGeneral.messages
    .fetch({ limit: 1 })
    .then((messagePage) =>
      messagePage.size === 1 ? messagePage.first() : null
    );

  console.log(message1.channel.name);

  let counter = 1;

  while (message1 && message1.createdTimestamp > startTime) {
    await eventGeneral.messages
      .fetch({ limit: 100, before: message1.id })
      .then((messagePage) => {
        messagePage.forEach((msg) =>
          msg.createdTimestamp > startTime &&
          msg.createdTimestamp < endTime
            ? authorDict[msg.author.id]
              ? authorDict[msg.author.id].eventGen++
              : (authorDict[msg.author.id] = {
                  eventGen: 1,
                  teamChan: 0,
                })
            : null
        );

        message1 =
          messagePage.size > 0 ? messagePage.last() : null;
      });

    counter++;
    console.log(counter * 100);
  }

  const teams = (await team_roles_channels.get("teams")) ?? [];

  for (const team of teams) {
    const teamChannel = interaction.guild.channels.cache.get(team[1]);

    message1 = await teamChannel.messages
      .fetch({ limit: 1 })
      .then((messagePage) =>
        messagePage.size === 1 ? messagePage.first() : null
      );

    console.log(message1.channel.name);

    while (message1 && message1.createdTimestamp > startTime) {
      await teamChannel.messages
        .fetch({ limit: 100, before: message1.id })
        .then((messagePage) => {
          messagePage.forEach((msg) =>
            msg.createdTimestamp > startTime &&
            msg.createdTimestamp < endTime
              ? authorDict[msg.author.id]
                ? authorDict[msg.author.id].teamChan++
                : (authorDict[msg.author.id] = {
                    eventGen: 0,
                    teamChan: 1,
                  })
              : null
          );

          message1 =
            messagePage.size > 0 ? messagePage.last() : null;
        });
    }
  }

  for (const key in authorDict) {
    const player = await ids_dictionary.get(key);

    if (player) {
      authorDict[key].current = player.current;
      authorDict[key].global = player.global;
    } else {
      authorDict[key].current = null;
      authorDict[key].global = null;
    }
  }

  sheet.dumpChatCounts(authorDict);

  await interaction.editReply("Message counts completed.");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("countmessages")
    .setDescription("Count messages from the event and team channels."),

  execute,
};
