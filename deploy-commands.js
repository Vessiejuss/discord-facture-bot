const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

const commands = [
  new SlashCommandBuilder().setName('facture').setDescription('🧾 Créer une facture').toJSON(),
  new SlashCommandBuilder().setName('config-marque').setDescription('🏢 Configurer votre marque').toJSON(),
  new SlashCommandBuilder().setName('aide').setDescription('❓ Aide').toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => {
    console.log('✅ Commandes enregistrées !');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
