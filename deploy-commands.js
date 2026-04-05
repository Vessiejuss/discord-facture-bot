require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandsFolder = './commands';

fs.readdirSync(commandsFolder).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }
});

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Commandes globales déployées!');
    } catch (error) {
        console.error(error);
    }
})();
