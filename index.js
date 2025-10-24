require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.teams = []; // store teams.json here

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// Load teams.json
const TEAMS_FILE = path.join(__dirname, "teams.json");
function loadTeams() {
  if (fs.existsSync(TEAMS_FILE)) {
    client.teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
    console.log(`Loaded ${client.teams.length} teams from teams.json`);
  } else {
    client.teams = [];
    console.log("teams.json not found. Starting with empty team list.");
  }
}
loadTeams();

// Register slash commands
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Refreshing application commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Commands registered!");
  } catch (error) {
    console.error(error);
  }
})();

// Event: interaction create
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    } else if (interaction.isButton()) {
      // Route button interactions to command-specific handlers
      for (const command of client.commands.values()) {
        if (command.handleButton) {
          await command.handleButton(interaction);
        }
      }
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: "Error executing interaction.", ephemeral: true }).catch(() => {});
    }
  }
});

client.once("ready", () => {
  console.log(`${client.user.tag} is online.`);
});

client.login(process.env.TOKEN);
