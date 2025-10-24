const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { roles } = require("../config.js");

const TEAMS_FILE = path.join(__dirname, "..", "teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removeteam")
    .setDescription("Remove a team from the league list")
    .addRoleOption(option =>
      option.setName("team")
        .setDescription("The team role to remove")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check commissioner role
    if (!interaction.member.roles.cache.has(roles.commissioner)) {
      return interaction.reply({ content: "You are not allowed to use this command.", ephemeral: true });
    }

    const teamRole = interaction.options.getRole("team");

    // Load teams
    if (!fs.existsSync(TEAMS_FILE)) {
      return interaction.reply({ content: "No teams are configured.", ephemeral: true });
    }
    let teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));

    // Check if team exists
    if (!teams.find(t => t.id === teamRole.id)) {
      return interaction.reply({ content: "That team is not in the list.", ephemeral: true });
    }

    // Remove the team from the list
    teams = teams.filter(t => t.id !== teamRole.id);
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2));

    await interaction.reply({ content: `Team **${teamRole.name}** has been removed from the league list.` });
  },
};
