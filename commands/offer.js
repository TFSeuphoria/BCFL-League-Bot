const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require("discord.js");
const { roles, channels } = require("../config.js");
const fs = require("fs");
const path = require("path");

const TEAMS_FILE = path.join(__dirname, "..", "teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("offer")
    .setDescription("Offer a player to join your team")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to offer")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;

    // Check if member has any of the allowed coaching roles
    const allowedRoles = [roles.franchiseOwner, roles.generalManager, roles.headCoach, roles.assistantCoach];
    const hasRole = allowedRoles.some(r => member.roles.cache.has(r));
    if (!hasRole) {
      return interaction.reply({ content: "You are not allowed to use this command.", ephemeral: true });
    }

    // Determine team role of the coach
    if (!fs.existsSync(TEAMS_FILE)) return interaction.reply({ content: "No teams configured.", ephemeral: true });
    const teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
    const teamRole = member.roles.cache.find(r => teams.some(t => t.id === r.id));
    if (!teamRole) return interaction.reply({ content: "You are not assigned to a team.", ephemeral: true });

    const targetUser = interaction.options.getUser("user");
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    // Check if target already has a team role
    const targetTeamRole = targetMember.roles.cache.find(r => teams.some(t => t.id === r.id));
    if (targetTeamRole) return interaction.reply({ content: "This user is already on a team.", ephemeral: true });

    // Build embed & buttons
    const embed = new EmbedBuilder()
      .setTitle("Team Offer")
      .setDescription(`You have been offered to join **${teamRole.name}** by ${member}.`)
      .setColor(teamRole.hexColor || 0x00ff00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`offer_accept_${targetUser.id}_${teamRole.id}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`offer_decline_${targetUser.id}_${teamRole.id}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    // DM the user
    try {
      await targetUser.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `Offer sent to ${targetUser.tag}.`, ephemeral: true });
    } catch {
      return interaction.reply({ content: "Could not DM the user.", ephemeral: true });
    }
  },
};

// Handle button interactions globally in your bot
module.exports.handleButton = async (interaction) => {
  if (!interaction.isButton()) return;

  const transactionsChannel = interaction.guild.channels.cache.get(channels.transactions);
  if (!transactionsChannel) return;

  // Parse customId: offer_accept_userid_teamid or offer_decline_userid_teamid
  const [action, , userId, teamId] = interaction.customId.split("_");

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "This button is not for you.", ephemeral: true });
  }

  const guild = interaction.guild;
  const member = await guild.members.fetch(userId);

  if (action === "offer" && interaction.customId.startsWith("offer_accept")) {
    // Assign team role
    const role = guild.roles.cache.get(teamId);
    if (role) await member.roles.add(role);
    if (transactionsChannel) transactionsChannel.send(`${member} has accepted the offer and joined **${role.name}**.`);
    await interaction.update({ content: `You accepted the offer to join **${role.name}**.`, embeds: [], components: [] });
  }

  if (action === "offer" && interaction.customId.startsWith("offer_decline")) {
    const role = guild.roles.cache.get(teamId);
    if (transactionsChannel) transactionsChannel.send(`${member} declined the offer to join **${role.name}**.`);
    await interaction.update({ content: `You declined the offer to join **${role?.name || "the team"}**.`, embeds: [], components: [] });
  }
};
