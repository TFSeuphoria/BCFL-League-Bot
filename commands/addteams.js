const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { roles } = require("../config.js");

const TEAMS_FILE = path.join(__dirname, "..", "teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addteam")
    .setDescription("Add a new team to the league")
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("The role for the team")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("emoji")
        .setDescription("The emoji for the team (standard or custom)")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check if user has commissioner role
    if (!interaction.member.roles.cache.has(roles.commissioner)) {
      return interaction.reply({ content: "You are not allowed to use this command.", ephemeral: true });
    }

    const role = interaction.options.getRole("role");
    let emojiInput = interaction.options.getString("emoji");

    // Detect custom emoji ID if provided
    let emojiId = emojiInput;
    const customEmojiMatch = emojiInput.match(/<a?:\w+:(\d+)>/);
    if (customEmojiMatch) {
      emojiId = customEmojiMatch[1]; // just the ID
    }

    // Read existing teams
    let teams = [];
    if (fs.existsSync(TEAMS_FILE)) {
      const data = fs.readFileSync(TEAMS_FILE, "utf-8");
      teams = JSON.parse(data);
    }

    // Check if team already exists
    if (teams.find(t => t.id === role.id)) {
      return interaction.reply({ content: "This team already exists in the list.", ephemeral: true });
    }

    // Add the new team
    const newTeam = {
      id: role.id,
      name: role.name,
      emoji: emojiId
    };
    teams.push(newTeam);

    fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2));

    await interaction.reply({ content: `Team **${role.name}** added with emoji ${emojiInput}!` });
  },
};
