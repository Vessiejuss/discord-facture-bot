require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// TON TOKEN ICI (remplace)
const TOKEN = 'TON_DISCORD_TOKEN_ICI';
const CLIENT_ID = 'TON_CLIENT_ID_ICI';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log('✅ NIKE Invoice Bot en ligne!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'invoice') {
        const clientName = interaction.options.getString('client');
        const products = interaction.options.getString('produits');
        
        // Calcul simple
        const lines = products.split(',');
        let subtotal = 0;
        let table = '';
        
        lines.forEach(line => {
            const parts = line.trim().split(' ');
            const qty = parseInt(parts[0]) || 1;
            const price = parseFloat(parts[parts.length - 1]) || 0;
            const name = parts.slice(1, -1).join(' ');
            const total = qty * price;
            subtotal += total;
            table += `**${name}** ×${qty} = **€${total.toFixed(2)}**\n`;
        });
        
        const tva = subtotal * 0.2;
        const totalTTC = subtotal + tva;
        
        await interaction.reply({ 
            embeds: [{
                title: '🏃‍♂️ **FACTURE NIKE**',
                color: 0xE4002B,
                fields: [
                    { name: '👤 Client', value: clientName, inline: true },
                    { name: '📦 Produits', value: table, inline: false },
                    { 
                        name: '💰 **TOTAL**', 
                        value: `**HT:** €${subtotal.toFixed(2)}\n**TVA:** €${tva.toFixed(2)}\n**TTC:** **€${totalTTC.toFixed(2)}**`,
                        inline: true 
                    }
                ],
                footer: { text: 'NIKE France - 30 jours' }
            }]
        });
    }
});

client.login(TOKEN);
