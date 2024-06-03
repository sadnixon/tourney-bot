const sheet = require("../sheet");
const { errorMessage } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    sheet.dumpAwards();
    message.channel.send("Awards Dumped.");
  }
}

module.exports = {
  name: "dumpawards",
  aliases: ["da"],
  execute,
};
