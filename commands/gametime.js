const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config.js");
const fs = require("fs");
const path = require("path");

const TEAMS_FILE = path.join(__dirname, "../teams.json");
let teams = [];
if (fs.existsSync(TEAMS_FILE)) teams = JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gametime")
    .setDescription("Schedule a game between your team and another.")
    .addStringOption(opt =>
      opt.setName("time").setDescription("Game time (e.g. 7 PM)").setRequired(true))
    .addStringOption(opt =>
      opt.setName("timezone").setDescription("Timezone (e.g. EST, CST)").setRequired(true))
    .addStringOption(opt =>
      opt.setName("date").setDescription("Date (e.g. 10/30)").setRequired(true))
    .addRoleOption(opt =>
      opt.setName("opponent").setDescription("Opponent team role").setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;
    const allowedRoles = [
      config.roles.franchiseOwner,
      config.roles.generalManager,
      config.roles.headCoach,
      config.roles.assistantCoach
    ];

    // Permission check
    if (!allowedRoles.some(r => member.roles.cache.has(r))) {
      return await interaction.reply({
        content: "You must be part of a coaching staff to use this command.",
        ephemeral: true,
      });
    }

    const time = interaction.options.getString("time");
    const timezone = interaction.options.getString("timezone");
    const date = interaction.options.getString("date");
    const opponent = interaction.options.getRole("opponent");

    // Find user's team
    const userTeam = member.roles.cache.find(r => teams.some(t => t.roleId === r.id));
    if (!userTeam) {
      return await interaction.reply({
        content: "You must be on a team to schedule a game.",
        ephemeral: true,
      });
    }

    // Validate opponent team
    const opponentTeam = teams.find(t => t.roleId === opponent.id);
    if (!opponentTeam) {
      return await interaction.reply({
        content: "That is not a valid team.",
        ephemeral: true,
      });
    }

    const gametimesChannel = interaction.guild.channels.cache.get(config.channels.gametimes);
    if (!gametimesChannel) {
      return await interaction.reply({
        content: "Gametimes channel not found in config.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🏈 Game Scheduled")
      .setColor("#00b0f4")
      .setDescription(
        `${userTeam.name} vs ${opponent.name}\n**Date:** ${date}\n**Time:** ${time} ${timezone}`
      )
      .addFields(
        { name: "Streamer", value: "Unclaimed", inline: true },
        { name: "Referee", value: "Unclaimed", inline: true }
      )
      .setFooter({ text: `Scheduled by ${interaction.user.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_streamer")
        .setLabel("Claim Streamer")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("claim_ref")
        .setLabel("Claim Ref")
        .setStyle(ButtonStyle.Secondary)
    );

    const message = await gametimesChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "Game successfully scheduled.", ephemeral: true });

    // Button handler
    const collector = message.createMessageComponentCollector();

    collector.on("collect", async (btn) => {
      const isStreamer = btn.customId === "claim_streamer";
      const isRef = btn.customId === "claim_ref";

      // Role restrictions
      if (isStreamer && !btn.member.roles.cache.has(config.roles.streamer))
        return btn.reply({ content: "Only streamers can claim this.", ephemeral: true });

      if (isRef && !btn.member.roles.cache.has(config.roles.referee))
        return btn.reply({ content: "Only referees can claim this.", ephemeral: true });

      const currentEmbed = EmbedBuilder.from(message.embeds[0]);
      const fields = currentEmbed.data.fields;

      const currentStreamer = fields[0].value;
      const currentRef = fields[1].value;

      if (isStreamer) {
        if (currentStreamer === btn.user.tag) {
          // Remove claim
          fields[0].value = "Unclaimed";
          await btn.reply({ content: "You have removed yourself as streamer.", ephemeral: true });
        } else if (currentStreamer === "Unclaimed") {
          fields[0].value = btn.user.tag;
          await btn.reply({ content: "You have claimed as streamer.", ephemeral: true });
        } else {
          return btn.reply({ content: "A streamer has already been claimed.", ephemeral: true });
        }
      }

      if (isRef) {
        if (currentRef === btn.user.tag) {
          // Remove claim
          fields[1].value = "Unclaimed";
          await btn.reply({ content: "You have removed yourself as referee.", ephemeral: true });
        } else if (currentRef === "Unclaimed") {
          fields[1].value = btn.user.tag;
          await btn.reply({ content: "You have claimed as referee.", ephemeral: true });
        } else {
          return btn.reply({ content: "A referee has already been claimed.", ephemeral: true });
        }
      }

      await message.edit({ embeds: [currentEmbed], components: [row] });
    });
  },
};
