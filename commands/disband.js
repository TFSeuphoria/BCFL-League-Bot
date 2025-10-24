const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { roles, channels } = require("../config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disband")
    .setDescription("Disband a team and remove its roles")
    .addRoleOption(option =>
      option.setName("team")
        .setDescription("The team role to disband")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for disbanding the team")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check commissioner role
    if (!interaction.member.roles.cache.has(roles.commissioner)) {
      return interaction.reply({ content: "You are not allowed to use this command.", ephemeral: true });
    }

    const teamRole = interaction.options.getRole("team");
    const reason = interaction.options.getString("reason");
    const guild = interaction.guild;

    // Fetch all members with the team role
    const membersWithTeam = teamRole.members;

    // Remove roles from each member
    for (const [memberId, member] of membersWithTeam) {
      // Remove team role
      await member.roles.remove(teamRole.id).catch(() => {});
      
      // Remove leadership roles if they have them
      const rolesToRemove = [
        roles.franchiseOwner,
        roles.generalManager,
        roles.headCoach,
        roles.assistantCoach
      ];
      await member.roles.remove(rolesToRemove.filter(r => member.roles.cache.has(r))).catch(() => {});
    }

    // Post to transactions channel
    const transactionsChannel = guild.channels.cache.get(channels.transactions);
    if (transactionsChannel && transactionsChannel.type === ChannelType.GuildText) {
      transactionsChannel.send(
        `Team **${teamRole.name}** has been disbanded by ${interaction.user}.\n**Reason:** ${reason}`
      );
    }

    await interaction.reply({ content: `Team **${teamRole.name}** has been disbanded successfully.`, ephemeral: true });
  },
};
