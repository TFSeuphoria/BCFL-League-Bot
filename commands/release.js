const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { roles, channels } = require("../config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release a player from your team")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to release")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for releasing the user")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const guild = interaction.guild;

    // Only leadership roles can use this
    const allowedRoles = [roles.franchiseOwner, roles.generalManager, roles.headCoach, roles.assistantCoach];
    const isLeader = allowedRoles.some(r => member.roles.cache.has(r));
    if (!isLeader) {
      return interaction.reply({ content: "You are not allowed to release members.", ephemeral: true });
    }

    // Prevent self-release
    if (member.id === targetUser.id) {
      return interaction.reply({ content: "You cannot release yourself.", ephemeral: true });
    }

    const targetMember = await guild.members.fetch(targetUser.id);

    // Determine team role of releaser and target
    const teamRoles = interaction.client.teams.map(t => t.id);
    const releaserTeamRole = member.roles.cache.find(r => teamRoles.includes(r.id));
    const targetTeamRole = targetMember.roles.cache.find(r => teamRoles.includes(r.id));

    if (!releaserTeamRole || !targetTeamRole || releaserTeamRole.id !== targetTeamRole.id) {
      return interaction.reply({ content: "You can only release members from your own team.", ephemeral: true });
    }

    // Leadership roles that only franchise owner can remove
    const leadershipRoles = [roles.generalManager, roles.headCoach, roles.assistantCoach];
    const targetLeadershipRoles = targetMember.roles.cache.filter(r => leadershipRoles.includes(r.id));

    if (targetLeadershipRoles.size > 0 && !member.roles.cache.has(roles.franchiseOwner)) {
      return interaction.reply({ content: "Only the franchise owner can release leadership roles.", ephemeral: true });
    }

    // Remove team role and leadership roles if allowed
    const rolesToRemove = [releaserTeamRole.id, ...targetLeadershipRoles.map(r => r.id)];
    await targetMember.roles.remove(rolesToRemove).catch(() => {});

    // Post to transactions channel
    const transactionsChannel = guild.channels.cache.get(channels.transactions);
    if (transactionsChannel && transactionsChannel.type === ChannelType.GuildText) {
      transactionsChannel.send(`${member} has released ${targetMember} from **${releaserTeamRole.name}**.\n**Reason:** ${reason}`);
    }

    await interaction.reply({ content: `${targetMember} has been released from **${releaserTeamRole.name}**.`, ephemeral: true });
  },
};
