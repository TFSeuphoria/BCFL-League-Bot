const { SlashCommandBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { roles, channels } = require("../config.js");

const TEAMS_FILE = path.join(__dirname, "..", "teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("appoint")
    .setDescription("Appoint a user to a team")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to appoint")
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName("team")
        .setDescription("Select the team role")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check commissioner role
    if (!interaction.member.roles.cache.has(roles.commissioner)) {
      return interaction.reply({ content: "You are not allowed to use this command.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const selectedRole = interaction.options.getRole("team");

    // Load teams
    if (!fs.existsSync(TEAMS_FILE)) {
      return interaction.reply({ content: "No teams are configured.", ephemeral: true });
    }
    const teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));

    // Check if selected role is in teams.json
    const team = teams.find(t => t.id === selectedRole.id);
    if (!team) {
      return interaction.reply({ content: "That role is not a valid team.", ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id);

    // Assign roles: team + franchise owner
    await member.roles.add([selectedRole.id, roles.franchiseOwner]);

    // Post in transactions channel
    const transactionsChannel = interaction.guild.channels.cache.get(channels.transactions);
    if (transactionsChannel && transactionsChannel.type === ChannelType.GuildText) {
      transactionsChannel.send(`${user} has been appointed to **${team.name}** by ${interaction.user}.`);
    }

    await interaction.reply({ content: `${user} has been appointed to **${team.name}** successfully!`, ephemeral: true });
  },
};
