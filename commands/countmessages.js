const { errorMessage, rank } = require("../message-helpers");
const sheet = require("../sheet");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    let eventGeneral = message.guild.channels.cache.get("599756425241296897");

    const startTime = new Date(Date.UTC(2025, 6, 31, 0));
    const endTime = new Date(Date.UTC(2025, 7, 12, 0));

    let authorDict = {};

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
            msg.createdTimestamp > startTime && msg.createdTimestamp < endTime
              ? authorDict[msg.author.id]
                ? authorDict[msg.author.id]["eventGen"]++
                : (authorDict[msg.author.id] = { eventGen: 1, teamChan: 0 })
              : null
          );

          // Update our message pointer to be the last message on the page of messages
          message1 = 0 < messagePage.size ? messagePage.last() : null;
        });
      counter++;
      console.log(counter * 100);
    }

    let teams = await team_roles_channels.get("teams");
    for (var team of teams) {
      teamChannel = await message.guild.channels.cache.get(team[1]);

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
              msg.createdTimestamp > startTime && msg.createdTimestamp < endTime
                ? authorDict[msg.author.id]
                  ? authorDict[msg.author.id]["teamChan"]++
                  : (authorDict[msg.author.id] = {
                      eventGen: 0,
                      teamChan: 1,
                    })
                : null
            );

            // Update our message pointer to be the last message on the page of messages
            message1 = 0 < messagePage.size ? messagePage.last() : null;
          });
      }
    }

    for (const key in authorDict) {
      let player = await ids_dictionary.get(key);
      if (player) {
        authorDict[key]["current"] = player.current;
        authorDict[key]["global"] = player.global;
      } else {
        authorDict[key]["current"] = null;
        authorDict[key]["global"] = null;
      }
    }
    sheet.dumpChatCounts(authorDict);
  }
}

module.exports = {
  name: "countmessages",
  aliases: [],
  execute,
};
