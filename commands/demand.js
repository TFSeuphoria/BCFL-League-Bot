const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { roles, channels } = require("../config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("demand")
    .setDescription("Demand to leave your current team")
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for leaving your team")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;

    // Check if member has franchise owner role
    if (member.roles.cache.has(roles.franchiseOwner)) {
      return interaction.reply({ content: "Franchise owners cannot use this command.", ephemeral: true });
    }

    // Determine their team role
    const teamRole = member.roles.cache.find(r =>
      interaction.client.teams.some(t => t.id === r.id)
    );
    if (!teamRole) {
      return interaction.reply({ content: "You are not currently on a team.", ephemeral: true });
    }

    // Remove team role
    await member.roles.remove(teamRole.id).catch(() => {});

    // Remove any leadership roles
    const leadershipRoles = [roles.generalManager, roles.headCoach, roles.assistantCoach];
    const rolesToRemove = leadershipRoles.filter(r => member.roles.cache.has(r));
    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove).catch(() => {});
    }

    // Post to transactions channel
    const transactionsChannel = interaction.guild.channels.cache.get(channels.transactions);
    if (transactionsChannel && transactionsChannel.type === ChannelType.GuildText) {
      const reason = interaction.options.getString("reason");
      transactionsChannel.send(`${member} has demanded to leave **${teamRole.name}**.\n**Reason:** ${reason}`);
    }

    await interaction.reply({ content: `You have successfully demanded to leave **${teamRole.name}**.`, ephemeral: true });
  },
};
