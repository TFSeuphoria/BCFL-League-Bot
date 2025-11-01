const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { roles } = require("../config.js");

const STATS_FILE = path.join(__dirname, "..", "stats.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("importstats")
    .setDescription("Import or update full stats for a player (Commissioners only)")
    .addUserOption(o => o.setName("user").setDescription("Player to import stats for").setRequired(true))
    .addIntegerOption(o => o.setName("sacks_taken").setDescription("Sacks taken").setRequired(true))
    .addIntegerOption(o => o.setName("passing_td").setDescription("Passing TDs").setRequired(true))
    .addIntegerOption(o => o.setName("picks_thrown").setDescription("Interceptions thrown").setRequired(true))
    .addIntegerOption(o => o.setName("passing_yards").setDescription("Passing yards").setRequired(true))
    .addIntegerOption(o => o.setName("completions").setDescription("Completions").setRequired(true))
    .addIntegerOption(o => o.setName("passing_attempts").setDescription("Passing attempts").setRequired(true))
    .addIntegerOption(o => o.setName("rushing_attempts").setDescription("Rushing attempts").setRequired(true))
    .addIntegerOption(o => o.setName("rushing_td").setDescription("Rushing TDs").setRequired(true))
    .addIntegerOption(o => o.setName("rushing_yards").setDescription("Rushing yards").setRequired(true))
    .addIntegerOption(o => o.setName("receptions").setDescription("Receptions").setRequired(true))
    .addIntegerOption(o => o.setName("targets").setDescription("Targets").setRequired(true))
    .addIntegerOption(o => o.setName("receiving_td").setDescription("Receiving TDs").setRequired(true))
    .addIntegerOption(o => o.setName("receiving_yards").setDescription("Receiving yards").setRequired(true))
    .addIntegerOption(o => o.setName("tackles").setDescription("Tackles").setRequired(true))
    .addIntegerOption(o => o.setName("sacks").setDescription("Sacks").setRequired(true))
    .addIntegerOption(o => o.setName("pass_deflections").setDescription("Pass deflections").setRequired(true))
    .addIntegerOption(o => o.setName("fumbles_forced").setDescription("Fumbles forced").setRequired(true))
    .addIntegerOption(o => o.setName("interceptions").setDescription("Interceptions").setRequired(true))
    .addIntegerOption(o => o.setName("defensive_td").setDescription("Defensive TDs").setRequired(true))
    .addIntegerOption(o => o.setName("fg_attempted").setDescription("Field goals attempted").setRequired(true))
    .addIntegerOption(o => o.setName("fg_made").setDescription("Field goals made").setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;

    // 🔒 Role check
    if (!member.roles.cache.has(roles.commissioner)) {
      return interaction.reply({ content: "Only commissioners can use this command.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const statsInput = {};
    interaction.options.data.forEach(opt => {
      if (opt.name !== "user") statsInput[opt.name] = opt.value;
    });

    // 📂 Load stats file
    let stats = [];
    if (fs.existsSync(STATS_FILE)) {
      stats = JSON.parse(fs.readFileSync(STATS_FILE, "utf-8"));
    }

    // 🧩 Find or create player
    let player = stats.find(p => p.userid === user.id);
    if (!player) {
      player = {
        name: user.username,
        userid: user.id,
        sacks_taken: 0,
        passing_td: 0,
        picks_thrown: 0,
        passing_yards: 0,
        completions: 0,
        passing_attempts: 0,
        rushing_attempts: 0,
        rushing_td: 0,
        rushing_yards: 0,
        receptions: 0,
        targets: 0,
        receiving_td: 0,
        receiving_yards: 0,
        tackles: 0,
        sacks: 0,
        pass_deflections: 0,
        fumbles_forced: 0,
        interceptions: 0,
        defensive_td: 0,
        fg_attempted: 0,
        fg_made: 0,
      };
      stats.push(player);
    }

    // ➕ Add all imported values to their totals
    for (const key of Object.keys(statsInput)) {
      player[key] += statsInput[key];
    }

    // 💾 Save file
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

    // ✅ Confirmation message
    await interaction.reply({
      content: `✅ Stats updated for **${user.username}**! All values have been added to their totals.`,
      ephemeral: false
    });
  }
};
