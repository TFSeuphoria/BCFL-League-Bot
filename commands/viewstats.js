const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const statsFilePath = path.join(__dirname, '../stats.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewstats')
    .setDescription('View a user’s stats.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view stats for')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');

    if (!fs.existsSync(statsFilePath)) {
      fs.writeFileSync(statsFilePath, JSON.stringify([]));
    }

    const statsData = JSON.parse(fs.readFileSync(statsFilePath));
    const playerStats = statsData.find(s => s.userId === user.id);

    if (!playerStats) {
      return interaction.reply({ content: `${user.username} has no recorded stats yet.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Stats`)
      .setColor('#00BFFF')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription('Here are the recorded stats for this player:')
      .addFields(
        { name: 'Passing Yards', value: `${playerStats.passingYards}`, inline: true },
        { name: 'Passing TDs', value: `${playerStats.passingTDs}`, inline: true },
        { name: 'Rushing Yards', value: `${playerStats.rushingYards}`, inline: true },
        { name: 'Rushing TDs', value: `${playerStats.rushingTDs}`, inline: true },
        { name: 'Receiving Yards', value: `${playerStats.receivingYards}`, inline: true },
        { name: 'Receiving TDs', value: `${playerStats.receivingTDs}`, inline: true },
        { name: 'Tackles', value: `${playerStats.tackles}`, inline: true },
        { name: 'Sacks', value: `${playerStats.sacks}`, inline: true },
        { name: 'Interceptions', value: `${playerStats.interceptions}`, inline: true },
        { name: 'Forced Fumbles', value: `${playerStats.forcedFumbles}`, inline: true },
        { name: 'Fumble Recoveries', value: `${playerStats.fumbleRecoveries}`, inline: true },
        { name: 'Field Goals Made', value: `${playerStats.fieldGoalsMade}`, inline: true },
        { name: 'Field Goals Missed', value: `${playerStats.fieldGoalsMissed}`, inline: true },
        { name: 'Extra Points Made', value: `${playerStats.extraPointsMade}`, inline: true },
        { name: 'Extra Points Missed', value: `${playerStats.extraPointsMissed}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
