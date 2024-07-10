const Discord = require("discord.js");
const sheet = require("../sheet");
const _ = require("lodash");
const { getGameNumber } = require("../constants");
const { alertMessage } = require("../message-helpers");

async function execute(message, args, user) {
  if (user.isAuthorized) {
    if (coolDown) {
      return message.reply("you can only do that command every 5 minutes.");
    }
    await alertMessage(message.client);
    coolDown = true;
    setTimeout(() => {
      coolDown = false;
    }, 300000);
  }
}

module.exports = {
  name: "alert",
  aliases: [],
  execute,
};
