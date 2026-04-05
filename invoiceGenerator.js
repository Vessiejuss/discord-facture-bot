const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invoice')
        .setDescription('🧾 Facture NIKE')
        .addStringOption(option => 
            option.setName('client')
                .setDescription('Nom client')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('produits')
                .setDescription('ex: "2x Air Max 129, 1x Dunk 120"')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        
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
            table += `**${name}** ×${qty} €${price} = **€${total.toFixed(2)}**\n`;
        });
        
        const tva = subtotal * 0.2;
        const total = subtotal + tva;
        
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('🏃‍♂️ NIKE INVOICE')
            .addFields(
                { name: '👤 Client', value: clientName, inline: true },
                { name: '📦 Produits', value: table, inline: false },
                { 
                    name: '💰 Total', 
                    value: `**HT:** €${subtotal.toFixed(2)}\n**TVA 20%:** €${tva.toFixed(2)}\n**TTC:** €${total.toFixed(2)}`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'NIKE France - 30 jours net' });
        
        await interaction.editReply({ embeds: [embed] });
    },
};
