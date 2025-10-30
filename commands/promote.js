const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.js");
const teams = require("../teams.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a player to a coaching role.")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to promote")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("rank")
        .setDescription("Coaching rank to promote to")
        .setRequired(true)
        .addChoices(
          { name: "General Manager", value: "generalManager" },
          { name: "Head Coach", value: "headCoach" },
          { name: "Assistant Coach", value: "assistantCoach" }
        )
    ),

  async execute(interaction) {
    const executor = interaction.member;
    const target = interaction.options.getMember("user");
    const rank = interaction.options.getString("rank");

    if (!executor.roles.cache.has(config.roles.franchiseOwner))
      return interaction.reply({ content: "❌ Only Franchise Owners can use this command.", ephemeral: true });

    // Find which team they belong to
    const executorTeam = executor.roles.cache.find(role => teams.some(t => t.id === role.id));
    const targetTeam = target.roles.cache.find(role => teams.some(t => t.id === role.id));

    if (!executorTeam || !targetTeam || executorTeam.id !== targetTeam.id)
      return interaction.reply({ content: "❌ You can only promote members from your own team.", ephemeral: true });

    const rankRoleId = config.roles[rank];
    if (!rankRoleId) return interaction.reply({ content: "❌ Invalid role selection.", ephemeral: true });

    await target.roles.add(rankRoleId).catch(() => null);

    const transactionsChannel = interaction.guild.channels.cache.get(config.channels.transactions);
    if (transactionsChannel) {
      transactionsChannel.send(`📈 ${executor} promoted ${target} to **${rank.replace(/([A-Z])/g, ' $1').trim()}** for **${executorTeam.name}**!`);
    }

    await interaction.reply({ content: `✅ Promoted ${target.user.tag} to ${rank.replace(/([A-Z])/g, ' $1').trim()}.`, ephemeral: true });
  },
};
