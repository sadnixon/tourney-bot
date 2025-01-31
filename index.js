const fs = require("fs");
const Discord = require("discord.js");
const Keyv = require("keyv");
const sheet = require("./sheet");
const client = new Discord.Client();
const { format, utcToZonedTime } = require("date-fns-tz");
const {
  PREFIX,
  ENABLE_DB,
  DISCORD_TOKEN,
  SENTRY_DSN,
  ENABLE_SENTRY,
  OWNER,
} = require("./env");
const { errorMessage, alertMessage } = require("./message-helpers");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
var cron = require("node-cron");

if (ENABLE_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

global.authorized_data_setters;
global.team_roles_channels;
//global.open = false;
//global.subGameIndicator = false;
//global.finalGame = false;
//global.guessDict = false;
global.guess_information;
global.names_dictionary;
global.ids_dictionary;
global.games_dictionary;
global.coolDown = false;

if (ENABLE_DB) {
  authorized_data_setters = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "authorized_data_setter",
  });
  team_roles_channels = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "team_roles_channels",
  });
  guess_information = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "guess_information",
  });
  names_dictionary = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "names_dictionary",
  });
  ids_dictionary = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "ids_dictionary",
  });
  games_dictionary = new Keyv("mongodb://localhost:27017/tourney-bot", {
    namespace: "games_dictionary",
  });
} else {
  authorized_data_setters = new Keyv();
  team_roles_channels = new Keyv();
  guess_information = new Keyv();
  names_dictionary = new Keyv();
  ids_dictionary = new Keyv();
  games_dictionary = new Keyv();
}

client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

client.once("ready", () => {
  client.user.setActivity(`${PREFIX}info`, { type: "WATCHING" });
  console.log("Ready!");
  scheduler();
  sheet.nameSheetLoader();
  sheet.gamesDictLoader();
});

async function scheduler() {
  await sheet.loadSheet();
  //setTimeout(loadSheet, 0);
  setInterval(sheet.loadSheet, 60000);
  const game_schedule = await sheet.getSchedule();
  const current_date = new Date();
  for (let i = 0; i < game_schedule.length; i++) {
    for (let j = 0; j < game_schedule[i].games.length; j++) {
      const game_time = game_schedule[i].games[j].time;
      const before_game = new Date(game_time - 20 * 60000);
      if (
        before_game.getTime() > current_date.getTime() &&
        !(
          i === game_schedule.length - 1 &&
          j === game_schedule[i].games.length - 1
        )
      ) {
        const minute = before_game.getUTCMinutes();
        const hour = before_game.getUTCHours();
        const date = before_game.getUTCDate();
        const month = before_game.getUTCMonth();
        console.log(`${minute} ${hour} ${date} ${month+1} *`);
        cron.schedule(
          `${minute} ${hour} ${date} ${month+1} *`,
          () => {
            alertMessage(client, true);
          },
          {
            timezone: "UTC",
          }
        );
      }
    }
  }
}

client.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;
  // initialize auth if not done already
  if (!(await authorized_data_setters.get("auth"))) {
    await authorized_data_setters.set("auth", []);
  }

  if (!(await team_roles_channels.get("teams"))) {
    await team_roles_channels.set("teams", []);
  }
  if (!(await team_roles_channels.get("mod_team"))) {
    await team_roles_channels.set("mod_team", []);
  }

  if (!(await guess_information.get("open"))) {
    await guess_information.set("open", false);
  }
  if (!(await guess_information.get("openSpecial"))) {
    await guess_information.set("openSpecial", false);
  }
  if (!(await guess_information.get("subGameIndicator"))) {
    await guess_information.set("subGameIndicator", false);
  }
  if (!(await guess_information.get("finalGame"))) {
    await guess_information.set("finalGame", false);
  }
  if (!(await guess_information.get("specialFinalGame"))) {
    await guess_information.set("specialFinalGame", false);
  }

  const isAuthorized =
    (await authorized_data_setters.get("auth")).indexOf(message.author.id) >=
      0 || message.author.id === OWNER;

  if (message.channel.id === "599756425241296897" && !isAuthorized) return; //event-general-chat id

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const updateTime = format(
    utcToZonedTime(sheet.getUpdateTime(), "Etc/UTC"),
    "h:mm:ss a zzz",
    { timeZone: "Etc/UTC" }
  );

  const user = {
    updateTime,
    isAuthorized,
    isOwner: message.author.id === OWNER,
  };

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (command) {
    try {
      await command.execute(message, args, user);
    } catch (error) {
      console.error(error);
      message.channel.send(
        errorMessage(`There was an error trying to execute \`${commandName}\`.`)
      );
    }
  } else {
    message.channel.send(
      errorMessage(
        `Unknown command: "${command}". Please use \`${PREFIX}info\` to find a list of commands.`
      )
    );
  }
});

client.login(DISCORD_TOKEN);
