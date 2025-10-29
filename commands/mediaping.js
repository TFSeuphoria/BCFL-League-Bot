const { SlashCommandBuilder } = require("discord.js");
const config = require("../config.js");

const cooldowns = new Map(); // userId -> timestamp

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mediaping")
    .setDescription("Ping everyone to announce a media event."),

  async execute(interaction) {
    const mediaHosterRole = config.roles.mediaHoster;
    const userId = interaction.user.id;

    // Permission check
    if (!interaction.member.roles.cache.has(mediaHosterRole)) {
      return await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    // Cooldown check (2 hours = 7200000 ms)
    const now = Date.now();
    const cooldown = cooldowns.get(userId);
    if (cooldown && now - cooldown < 7200000) {
      const remaining = Math.ceil((7200000 - (now - cooldown)) / 60000);
      return await interaction.reply({
        content: `You can use this command again in ${remaining} minutes.`,
        ephemeral: true,
      });
    }

    cooldowns.set(userId, now);

    await interaction.reply({
      content: "@everyone",
      allowedMentions: { parse: ["everyone"] },
    });
  },
};
