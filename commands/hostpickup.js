const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hostpickup")
    .setDescription("Announce that you're hosting a pickup game.")
    .addStringOption(option =>
      option
        .setName("server_name")
        .setDescription("Name of the pickup server.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const pickupHosterRole = config.roles.pickupHoster;
    const pickupsChannelId = config.channels.pickups;

    // Permission check
    if (!interaction.member.roles.cache.has(pickupHosterRole)) {
      return await interaction.reply({
        content: "You don't have permission to host pickups.",
        ephemeral: true,
      });
    }

    const serverName = interaction.options.getString("server_name");
    const pickupsChannel = interaction.guild.channels.cache.get(pickupsChannelId);

    if (!pickupsChannel) {
      return await interaction.reply({
        content: "Pickups channel not found. Please check your config.js.",
        ephemeral: true,
      });
    }

    await pickupsChannel.send({
      content: `${interaction.user} is hosting a pickup! The server name is **${serverName}**!\n||@everyone||`,
    });

    await interaction.reply({
      content: `Pickup hosted successfully in <#${pickupsChannelId}>.`,
      ephemeral: true,
    });
  },
};
