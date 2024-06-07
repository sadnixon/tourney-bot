const { getGameNumber } = require("../constants");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  const award_list = [
    "assassin",
    "morgana",
    "merlin",
    "percival",
    "vt",
    "shot",
    "robbed",
  ];
  const gameNumber = await getGameNumber();
  const timestamp = new Date(new Date().getTime());
  if (
    args.length > 2 &&
    award_list.includes(args[0].toLowerCase()) &&
    parseInt(args[2]) > 0 &&
    parseInt(args[2]) <= gameNumber
  ) {
    await award_information.set(
      args[0].toLowerCase(),
      (
        await award_information.get(args[0].toLowerCase())
      ).concat([[timestamp, message.author.username, args[1], parseInt(args[2])]])
    );
    message.channel.send(`Award Nomination received! Thank you, <@${message.author.id}>.`)
  } else {
    message.channel.send(
      errorMessage(
        "Must include an award category, a player name, and a game number in that order. For example: `s!submit vt SadNixon 32`\n\n The award categories are `vt`, `percival`, `merlin`, `morgana`, `assassin`, and `shot`."
      )
    );
  }
}

module.exports = {
  name: "submit",
  aliases: ["award", "nom", "nominate"],
  execute,
};
