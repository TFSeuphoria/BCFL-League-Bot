const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.js");
const teams = require("../teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a coaching staff member back to player.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to demote")
        .setRequired(true)
    ),

  async execute(interaction) {
    const executor = interaction.member;
    const target = interaction.options.getMember("user");

    if (!executor.roles.cache.has(config.roles.franchiseOwner))
      return interaction.reply({ content: "❌ Only Franchise Owners can use this command.", ephemeral: true });

    const executorTeam = executor.roles.cache.find(role => teams.some(t => t.id === role.id));
    const targetTeam = target.roles.cache.find(role => teams.some(t => t.id === role.id));

    if (!executorTeam || !targetTeam || executorTeam.id !== targetTeam.id)
      return interaction.reply({ content: "❌ You can only demote members from your own team.", ephemeral: true });

    const coachingRoles = [
      config.roles.generalManager,
      config.roles.headCoach,
      config.roles.assistantCoach,
    ];

    for (const roleId of coachingRoles) {
      if (target.roles.cache.has(roleId)) await target.roles.remove(roleId).catch(() => null);
    }

    const transactionsChannel = interaction.guild.channels.cache.get(config.channels.transactions);
    if (transactionsChannel) {
      transactionsChannel.send(`📉 ${executor} demoted ${target} from **${executorTeam.name}**.`);
    }

    await interaction.reply({ content: `✅ Demoted ${target.user.tag} successfully.`, ephemeral: true });
  },
};
