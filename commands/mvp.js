const Discord = require("discord.js");
const sheet = require("../sheet");
const { errorMessage, rank, roundToThirds } = require("../message-helpers");
const { PREFIX } = require("../env");

async function execute(message, args, user) {
  let players;
  try {
    players = await sheet.getPlayers();
  } catch (err) {
    console.error(err);
    message.channel.send(
      errorMessage(
        "😔 There was an error making your request. Please try again in a bit."
      )
    );
    return;
  }
  if (args.length === 0) {
    players = players.filter(
      (p) => p.name && p.gamesPlayed > 0 && p.personalScore > 0
    );
    players.sort(
      (a, b) => b.personalScore - a.personalScore || b.winrate - a.winrate
    );
    const ranks = rank(players, "personalScore", "winrate");
    const embed = new Discord.MessageEmbed()
      .setTitle("MVP Running (Personal Score)")
      .setDescription(
        players.length > 0
          ? players
              .slice(0, ranks.length)
              .map(
                (p, i) =>
                  `${ranks[i]}\\. ${p.teamName} - ${p.name} - ${p.personalScore} points `
              )
              .join("\n")
          : "This list will populate once games have been played."
      )
      .setFooter(
        `Use ${PREFIX}mvp wr to view the MVP running by winrate or ${PREFIX}mvp dh to view the Dark Horse running.\nUpdated ${user.updateTime}`
      );
    message.channel.send(embed);
  } else if (args.length === 1 && ["wr", "winrate"].includes(args[0])) {
    players = players.filter(
      (p) => p.name && p.gamesPlayed > 0 && p.winrate > 0
    );
    players.sort(
      (a, b) => b.winrate - a.winrate || b.personalScore - a.personalScore
    );
    const ranks = rank(players, "winrate", "personalScore");
    const embed = new Discord.MessageEmbed()
      .setTitle("MVP Running (Winrate)")
      .setDescription(
        players.length > 0
          ? players
              .slice(0, ranks.length)
              .map(
                (p, i) =>
                  `${ranks[i]}\\. ${p.teamName} - ${p.name} - ${(
                    p.winrate * 100
                  ).toFixed(1)}% (${roundToThirds(p.gamesWon)}/${
                    p.gamesPlayed
                  })`
              )
              .join("\n")
          : "This list will populate once games have been played."
      )
      .setFooter(
        `Use ${PREFIX}mvp to view the MVP running by points.\nUpdated ${user.updateTime}`
      );
    message.channel.send(embed);
  } else if (args.length === 1 && ["dh", "darkhorse"].includes(args[0])) {
    players = players.filter(
      (p) => p.name && p.gamesPlayed > 0 && p.personalScore > 0
    );
    players.sort(
      (a, b) => b.darkHorse - a.darkHorse || b.personalScore - a.personalScore
    );
    const ranks = rank(players, "darkHorse", "personalScore");
    const embed = new Discord.MessageEmbed()
      .setTitle("Dark Horse Running")
      .setDescription(
        players.length > 0
          ? players
              .slice(0, ranks.length)
              .map(
                (p, i) =>
                  `${ranks[i]}\\. ${p.teamName} - ${p.name} - ${p.personalScore} points `
              )
              .join("\n")
          : "This list will populate once games have been played."
      )
      .setFooter(
        `Use ${PREFIX}mvp to view the MVP running by points.\nUpdated ${user.updateTime}`
      );
    message.channel.send(embed);
  } else {
    message.channel.send(
      errorMessage(
        `Unknown argument: "${args[0]}". Try \`${PREFIX}mvp\` or \`${PREFIX}mvp wr\` or \`${PREFIX}mvp dh\`.`
      )
    );
  }
}

module.exports = {
  name: "mvp",
  aliases: [],
  execute,
};
