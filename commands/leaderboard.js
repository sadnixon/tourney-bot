const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  try {
    const output = await sheet.getLeaderboard();
    const leaderboard = output.leaderboard;
    const pointsRemaining = output.pointsRemaining;
    leaderboard.sort((a, b) => b.score - a.score || b.gamesWon - a.gamesWon);
    const ranks = rank(leaderboard, "score", "gamesWon");
    const embed = new Discord.MessageEmbed()
      .setTitle("Leaderboard")
      .setDescription(
        `${leaderboard
          .map((entry, i) => `${ranks[i]}\\. ${entry.name}: ${entry.score}`)
          .join("\n")}\n\n**Points Remaining:** ${pointsRemaining}`
      )
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
  name: "leaderboard",
  aliases: ["lb", "le"],
  description: "Leaderboard",
  execute,
};
