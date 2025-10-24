require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();
client.teams = [];

// === Load Commands ===
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// === Load Teams ===
const TEAMS_FILE = path.join(__dirname, "teams.json");
function loadTeams() {
  if (fs.existsSync(TEAMS_FILE)) {
    client.teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
    console.log(`Loaded ${client.teams.length} teams from teams.json`);
  } else {
    client.teams = [];
    console.log("⚠️ teams.json not found — starting with empty team list.");
  }
}
loadTeams();

// === Register Commands ===
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔁 Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commands registered successfully!");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();

// === Interaction Handler ===
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
    } 
    
    else if (interaction.isButton()) {
      // Route buttons to the right command handler
      for (const command of client.commands.values()) {
        if (command.handleButton) {
          await command.handleButton(interaction, client);
        }
      }
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "Error executing interaction.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

// === Ready Event ===
client.once("ready", () => {
  console.log(`🤖 ${client.user.tag} is online and ready.`);
});

client.login(process.env.TOKEN);
