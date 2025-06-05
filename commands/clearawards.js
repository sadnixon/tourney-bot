const { errorMessage, rank } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    const award_list = [
      "assassin",
      "morgana",
      "merlin",
      "percival",
      "vt",
      "shot",
      "robbed",
    ];
    for (const award of award_list) {
      await team_roles_channels.set(
        award,
        await award_information.clear(award)
      );
    }

    message.channel.send(
      "All team roles and channels have now been cleared from the list."
    );
  }
  console.log(team_roles_channels);
}

module.exports = {
  name: "clearawards",
  aliases: [],
  execute,
};
