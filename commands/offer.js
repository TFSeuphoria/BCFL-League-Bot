const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { roles, channels } = require("../config.js");
const fs = require("fs");
const path = require("path");

const TEAMS_FILE = path.join(__dirname, "..", "teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("offer")
    .setDescription("Offer a player to join your team")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to offer")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const allowedRoles = [
      roles.franchiseOwner,
      roles.generalManager,
      roles.headCoach,
      roles.assistantCoach,
    ];

    const hasRole = allowedRoles.some(r => member.roles.cache.has(r));
    if (!hasRole)
      return interaction.reply({
        content: "You are not allowed to use this command.",
        ephemeral: true,
      });

    if (!fs.existsSync(TEAMS_FILE))
      return interaction.reply({ content: "No teams configured.", ephemeral: true });

    const teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
    const teamRole = member.roles.cache.find(r => teams.some(t => t.id === r.id));
    if (!teamRole)
      return interaction.reply({
        content: "You are not assigned to a team.",
        ephemeral: true,
      });

    const targetUser = interaction.options.getUser("user");
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    const targetTeamRole = targetMember.roles.cache.find(r =>
      teams.some(t => t.id === r.id)
    );
    if (targetTeamRole)
      return interaction.reply({
        content: "This user is already on a team.",
        ephemeral: true,
      });

    // Build embed & buttons
    const embed = new EmbedBuilder()
      .setTitle("Team Offer")
      .setDescription(
        `You have been offered to join **${teamRole.name}** by ${member}.`
      )
      .setColor(teamRole.hexColor || 0x00ff00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`offer_accept_${interaction.guild.id}_${teamRole.id}_${member.id}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`offer_decline_${interaction.guild.id}_${teamRole.id}_${member.id}`)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    try {
      await targetUser.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: `Offer sent to ${targetUser.tag}.`,
        ephemeral: true,
      });
    } catch {
      return interaction.reply({
        content: "Could not DM the user.",
        ephemeral: true,
      });
    }
  },

  async handleButton(interaction, client) {
    if (!interaction.isButton()) return;
    const [action, type, guildId, teamId, offererId] =
      interaction.customId.split("_");

    if (action !== "offer") return;
    const guild = client.guilds.cache.get(guildId);
    if (!guild)
      return interaction.reply({
        content: "Could not locate the server for this offer.",
        ephemeral: true,
      });

    const member = await guild.members.fetch(interaction.user.id).catch(() => null);
    const offerer = await guild.members.fetch(offererId).catch(() => null);
    const teamRole = guild.roles.cache.get(teamId);
    const transactionsChannel = guild.channels.cache.get(channels.transactions);

    if (!member || !teamRole)
      return interaction.reply({
        content: "Something went wrong with this offer.",
        ephemeral: true,
      });

    if (type === "accept") {
      await member.roles.add(teamRole).catch(() => {});
      if (transactionsChannel)
        transactionsChannel.send(
          `${member} has **accepted** the offer from ${offerer || "a coach"} and joined **${teamRole.name}**.`
        );
      await interaction.update({
        content: `✅ You accepted the offer to join **${teamRole.name}**.`,
        embeds: [],
        components: [],
      });
    } else if (type === "decline") {
      if (transactionsChannel)
        transactionsChannel.send(
          `${member} has **declined** the offer from ${offerer || "a coach"} to join **${teamRole.name}**.`
        );
      await interaction.update({
        content: `❌ You declined the offer to join **${teamRole.name}**.`,
        embeds: [],
        components: [],
      });
    }
  },
};
