const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  if (args.length !== 1) {
    message.channel.send(
      errorMessage("Must include a valid game number, such as 27 or 1B."),
    );
  } else {
    try {
      let game;

      if (["A", "B", "a", "b"].includes(args[0].slice(-1))) {
        const subIndicatorList = ["a", "b"];
        game =
          parseInt(args[0].slice(0, -1)) +
          (1 + subIndicatorList.indexOf(args[0].slice(-1).toLowerCase())) / 10;
      } else {
        game = parseInt(args[0]);
      }

      const guessInfo = await sheet.getBestGuess(game);
      if (guessInfo.merlin === null) {
        message.channel.send(
          errorMessage("This game is not complete or has no guesses."),
        );
      } else {
        const embed = new Discord.MessageEmbed()
          .setTitle(`Correct Merlin Guessers For Game ${args[0].toUpperCase()}`)
          .setDescription(
            `Merlin: **${
              guessInfo.merlin
            }**\n\nCorrect Guessers: <@${guessInfo.guesserList.join(
              ">, <@",
            )}>\n\nGuesser Accuracy: ${(guessInfo.average * 100).toFixed(
              1,
            )}% (${guessInfo.guesserList.length}/${
              guessInfo.guessnum
            })\nMost Common False Guess: **${guessInfo.mostfalse}** ${(
              (guessInfo.falsenum / guessInfo.guessnum) *
              100
            ).toFixed(1)}% (${guessInfo.falsenum}/${guessInfo.guessnum})`,
          );
        message.channel.send(embed);
      }
    } catch (err) {
      console.error(err);
      message.channel.send(
        errorMessage(
          "😔 There was an error making your request. You may have entered an incorrect game number.",
        ),
      );
    }
  }
}

module.exports = {
  name: "bestguess",
  aliases: ["bg"],
  description: "Guess Leaderboard",
  execute,
};
