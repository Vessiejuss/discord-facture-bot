const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder().setName('facture').setDescription('🧾 Créer une facture').toJSON(),
  new SlashCommandBuilder().setName('config-marque').setDescription('🏢 Configurer votre marque').toJSON(),
  new SlashCommandBuilder().setName('aide').setDescription('❓ Aide').toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Commandes enregistrées !');
  } catch (err) {
    console.error(err);
  }
})();
