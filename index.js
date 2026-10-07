const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  ActivityType,
} = require("discord.js");
const Keyv = require("keyv").default;
const KeyvMongo = require("@keyv/mongo").default;
const Sentry = require("@sentry/node");
const sheet = require("./sheet");
const { format } = require("date-fns");
const { TZDate } = require("@date-fns/tz");
const {
  PREFIX,
  ENABLE_DB,
  DISCORD_TOKEN,
  SENTRY_DSN,
  ENABLE_SENTRY,
  OWNER,
} = require("./env");
const { errorMessage, alertMessage } = require("./message-helpers");
var cron = require("node-cron");

if (ENABLE_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}

const mongoStore = new KeyvMongo("mongodb://localhost:27017/tourney-bot");

global.authorized_data_setters = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "authorized_data_setter",
    })
  : new Keyv();

global.team_roles_channels = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "team_roles_channels",
    })
  : new Keyv();

global.guess_information = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "guess_information",
    })
  : new Keyv();

global.award_information = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "award_information",
    })
  : new Keyv();

global.names_dictionary = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "names_dictionary",
    })
  : new Keyv();

global.ids_dictionary = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "ids_dictionary",
    })
  : new Keyv();

global.games_dictionary = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "games_dictionary",
    })
  : new Keyv();

global.matchup_dictionary = ENABLE_DB
  ? new Keyv({
      store: mongoStore,
      namespace: "matchup_dictionary",
    })
  : new Keyv();

global.coolDown = false;

authorized_data_setters.on("error", (error) => {
  console.error("Authorized data store error:", error);
  Sentry.captureException(error);
});

team_roles_channels.on("error", (error) => {
  console.error("Team roles store error:", error);
  Sentry.captureException(error);
});

guess_information.on("error", (error) => {
  console.error("Guess info store error:", error);
  Sentry.captureException(error);
});

award_information.on("error", (error) => {
  console.error("Award store error:", error);
  Sentry.captureException(error);
});

names_dictionary.on("error", (error) => {
  console.error("Names store error:", error);
  Sentry.captureException(error);
});

ids_dictionary.on("error", (error) => {
  console.error("Ids store error:", error);
  Sentry.captureException(error);
});

games_dictionary.on("error", (error) => {
  console.error("Games store error:", error);
  Sentry.captureException(error);
});

matchup_dictionary.on("error", (error) => {
  console.error("Matchups store error:", error);
  Sentry.captureException(error);
});

// -----------------------------------------------------------------------------
// Discord client
// -----------------------------------------------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    //GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],

  partials: [Partials.Channel],
});

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command.data || typeof command.execute !== "function") {
    console.warn(`Skipping invalid command file: ${file}`);
    continue;
  }

  const commandName = command.data.name;

  client.commands.set(commandName, command);

  console.log(`Loaded command: /${commandName}`);
}

// -----------------------------------------------------------------------------
// Initialize database
// -----------------------------------------------------------------------------

async function initializeData() {
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
  if (!(await guess_information.get("guessOptions"))) {
    await guess_information.set("guessOptions", false);
  }
  if (!(await guess_information.get("subGameIndicator"))) {
    await guess_information.set("subGameIndicator", false);
  }
  if (!(await guess_information.get("finalGame"))) {
    await guess_information.set("finalGame", false);
  }
  if (!(await guess_information.get("guessIDs"))) {
    await guess_information.set("guessIDs", []);
  }

  if (!(await award_information.get("vt"))) {
    await award_information.set("vt", []);
  }
  if (!(await award_information.get("percival"))) {
    await award_information.set("percival", []);
  }
  if (!(await award_information.get("merlin"))) {
    await award_information.set("merlin", []);
  }
  if (!(await award_information.get("assassin"))) {
    await award_information.set("assassin", []);
  }
  if (!(await award_information.get("morgana"))) {
    await award_information.set("morgana", []);
  }
  if (!(await award_information.get("shot"))) {
    await award_information.set("shot", []);
  }
  if (!(await award_information.get("robbed"))) {
    await award_information.set("robbed", []);
  }
}

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
        console.log(`${minute} ${hour} ${date} ${month + 1} *`);
        cron.schedule(
          `${minute} ${hour} ${date} ${month + 1} *`,
          () => {
            alertMessage(client, true);
          },
          {
            timezone: "UTC",
          },
        );
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Ready
// -----------------------------------------------------------------------------

client.once(Events.ClientReady, async (readyClient) => {
  try {
    await initializeData();

    readyClient.user.setActivity("/info", {
      type: ActivityType.Watching,
    });

    await scheduler();
    await sheet.nameSheetLoader();
    await sheet.gamesDictLoader();

    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  } catch (error) {
    console.error("Failed to initialize bot:", error);
    Sentry.captureException(error);
  }
});

// -----------------------------------------------------------------------------
// Slash command interactions
// -----------------------------------------------------------------------------

client.on(Events.InteractionCreate, async (interaction) => {
  // Only handle slash commands
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`Received unknown slash command: /${interaction.commandName}`);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(
        errorMessage(`Unknown command: /${interaction.commandName}`),
      );
    } else {
      await interaction.reply(
        errorMessage(`Unknown command: /${interaction.commandName}`),
      );
    }

    return;
  }

  try {
    // -------------------------------------------------------------------------
    // Authorization
    // -------------------------------------------------------------------------

    const authorizedUsers = (await authorized_data_setters.get("auth")) ?? [];

    const isOwner = interaction.user.id === OWNER;

    const isAuthorized =
      isOwner || authorizedUsers.includes(interaction.user.id);

    // -------------------------------------------------------------------------
    // User information passed to commands
    // -------------------------------------------------------------------------

    const updateTime = format(
      new TZDate(sheet.getUpdateTime(), "America/Los_Angeles"),
      "h:mm:ss a zzz",
      { timeZone: "America/Los_Angeles" },
    );

    const user = {
      updateTime,
      isAuthorized,
      isOwner,
    };

    // -------------------------------------------------------------------------
    // Execute command
    // -------------------------------------------------------------------------

    await command.execute(interaction, user);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);

    Sentry.captureException(error);

    const response = errorMessage(
      `There was an error trying to execute \`/${interaction.commandName}\`.`,
    );

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
      } else {
        await interaction.reply(response);
      }
    } catch (replyError) {
      console.error("Failed to send command error response:", replyError);

      Sentry.captureException(replyError);
    }
  }
});

// -----------------------------------------------------------------------------
// Process-level error handling
// -----------------------------------------------------------------------------

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  Sentry.captureException(error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  Sentry.captureException(error);
});

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------

client.login(DISCORD_TOKEN);
