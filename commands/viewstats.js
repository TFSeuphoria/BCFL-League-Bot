const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const STATS_FILE = path.join(__dirname, "../stats.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewstats")
    .setDescription("View a user's football stats.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User whose stats you want to view")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");

    if (!fs.existsSync(STATS_FILE)) {
      return interaction.reply({
        content: "No stats file found.",
        ephemeral: true,
      });
    }

    const statsData = JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
    const player = statsData.find(p => p.userid === user.id);

    if (!player) {
      return interaction.reply({
        content: `${user.username} has no stats recorded.`,
        ephemeral: true,
      });
    }

    // build embed with all stats neatly formatted
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Stats`)
      .setColor("#2b2d31")
      .addFields(
        { name: "Passing", value: `TD: ${player.passing_td || 0}\nINTs: ${player.picks_thrown || 0}\nYards: ${player.passing_yards || 0}\nComp/Att: ${player.completions || 0}/${player.passing_attempts || 0}`, inline: true },
        { name: "Rushing", value: `TD: ${player.rushing_td || 0}\nYards: ${player.rushing_yards || 0}\nAttempts: ${player.rushing_attempts || 0}`, inline: true },
        { name: "Receiving", value: `TD: ${player.receiving_td || 0}\nYards: ${player.receiving_yards || 0}\nRec/Tgt: ${player.receptions || 0}/${player.targets || 0}`, inline: true },
        { name: "Defense", value: `Tackles: ${player.tackles || 0}\nSacks: ${player.sacks || 0}\nPD: ${player.pass_deflections || 0}\nINTs: ${player.interceptions || 0}\nFF: ${player.fumbles_forced || 0}\nTD: ${player.defensive_td || 0}`, inline: true },
        { name: "Kicking", value: `FG Made: ${player.fg_made || 0}/${player.fg_attempted || 0}`, inline: true }
      )
      .setFooter({ text: "BCFL League Stats" });

    await interaction.reply({ embeds: [embed] });
  },
};
