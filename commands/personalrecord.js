const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  try {
    let id = message.author.id;
    if (
      args.length > 0 &&
      args[0].substr(0, 2) === "<@" &&
      args[0].charAt(args[0].length - 1) === ">"
    ) {
      // Assume it's a mention
      id = args[0].substr(2, args[0].length - 3);
    } else if (args.length > 0) {
      const player = await names_dictionary.get(args.join("").toLowerCase());
      id = player.discord;
      if (id == null) {
        return message.channel.send(
          errorMessage(
            "Must include either a tag for someone who has guessed, or a valid tourney name for someone who has guessed."
          )
        );
      }
    }
    const guessRecord = await sheet.getPersonalStats(id);
    const embed = new Discord.MessageEmbed()
      .setTitle("Personal Guess Record")
      .setDescription(
        guessRecord.map(
          (entry, i) => `**${entry.game}.** ${entry.merlin} (${entry.correct})`
        )
      )
      .addField("Guesser:", `<@${id}>`)
      .setFooter(`Updated ${user.updateTime}`);
    message.channel.send(embed);
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
  name: "personalrecord",
  aliases: ["pr"],
  description: "Personal Guess Record",
  execute,
};
