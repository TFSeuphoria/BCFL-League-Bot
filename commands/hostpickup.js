const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hostpickup")
    .setDescription("Announce that you're hosting a pickup game.")
    .addStringOption(option =>
      option
        .setName("server_name")
        .setDescription("The name of the pickup server.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const pickupsChannel = interaction.guild.channels.cache.get(config.channels.pickups);
    const requiredRole = config.roles.pickupHoster;

    // role check
    if (!member.roles.cache.has(requiredRole)) {
      return interaction.reply({
        content: "You must have the Pickup Hoster role to use this command.",
        ephemeral: true,
      });
    }

    if (!pickupsChannel) {
      return interaction.reply({
        content: "The pickups channel isn't configured properly.",
        ephemeral: true,
      });
    }

    const serverName = interaction.options.getString("server_name");

    // send pickup announcement
    await pickupsChannel.send({
      content: `${member} is hosting a pickup! The server name is **${serverName}**!\n||@everyone||`,
    });

    await interaction.reply({
      content: "Pickup announcement sent successfully.",
      ephemeral: true,
    });
  },
};
