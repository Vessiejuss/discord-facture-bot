const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invoice')
        .setDescription('🧾 Génère une facture NIKE pro')
        .addStringOption(option =>
            option.setName('client')
                .setDescription('Nom du client')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('produits')
                .setDescription('Produits (ex: "2x Air Max 129€, 1x Dunk 120€")')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('numero')
                .setDescription('Numéro facture (optionnel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Date (JJ/MM/AAAA)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const client = interaction.options.getString('client');
        const produits = interaction.options.getString('produits');
        const numero = interaction.options.getString('numero') || `NIKE-${Date.now().toString().slice(-6)}`;
        const dateInput = interaction.options.getString('date') || new Date().toLocaleDateString('fr-FR');
        
        // Parsing produits
        const productLines = produits.split(',').map(line => line.trim());
        let subtotal = 0;
        let productsTable = '';

        productLines.forEach(line => {
            const match = line.match(/(\d+)x?\s*(.+?)\s*(\d+(?:[.,]\d+)?)€?/i);
            if (match) {
                const [, qty, name, priceStr] = match;
                const qtyNum = parseFloat(qty) || 1;
                const price = parseFloat(priceStr.replace(',', '.')) || 0;
                const total = qtyNum * price;
                subtotal += total;
                
                productsTable += `**${name.trim()}** ×${qtyNum} | €${price.toFixed(2).replace('.', ',')} | **€${total.toFixed(2).replace('.', ',')}**\n`;
            }
        });

        const tva = subtotal * 0.20;
        const total = subtotal + tva;

        // Embed NIKE pro
        const embed = new EmbedBuilder()
            .setColor('#E4002B')
            .setTitle('🏃‍♂️ **FACTURE NIKE**', 'https://www.nike.com/fr/')
            .setDescription('**NIKE FRANCE SAS** | 123 Champs-Élysées, 75008 Paris')
            .setThumbnail('https://i.imgur.com/nike-logo.png') // Remplace par vrai logo
            .addFields(
                { 
                    name: '📋 FACTURÉ À', 
                    value: `**${client}**\n📍 Paris, France`, 
                    inline: true 
                },
                { 
                    name: '📅 Infos', 
                    value: `**N° ${numero}**\n**Date:** ${dateInput}`, 
                    inline: true 
                },
                { 
                    name: '👟 PRODUITS', 
                    value: productsTable || 'Aucun produit', 
                    inline: false 
                },
                { 
                    name: '💰 TOTALS', 
                    value: `
**Sous-total HT**   €${subtotal.toFixed(2).replace('.', ',')}
**TVA 20%**        €${tva.toFixed(2).replace('.', ',')}
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
**TOTAL TTC**  **€${total.toFixed(2).replace('.', ',')}**
                    `,
                    inline: false 
                },
                { 
                    name: '💳 PAIEMENT', 
                    value: `**30 jours net**\n\`IBAN: FR76 3000 0000 0000 0000 0000 123\``, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: 'NIKE ✓ Just Do It', 
                iconURL: 'https://i.imgur.com/nike-icon.png' 
            })
            .setTimestamp();

        // Boutons
        const row = {
            type: 1,
            components: [
                {
                    type: 2,
                    label: '🖨️ PDF',
                    style: 5,
                    url: `https://invoice.nike.fr/${numero}` // Lien fictif
                },
                {
                    type: 2,
                    label: '➕ Dupliquer',
                    style: 1,
                    custom_id: 'duplicate_invoice'
                }
            ]
        };

        await interaction.editReply({ 
            embeds: [embed], 
            components: [row],
            ephemeral: false 
        });
    }
};

// Event pour bouton dupliquer
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'duplicate_invoice') {
        await interaction.reply({ content: '🔄 Facture dupliquée ! Utilise `/invoice` pour créer une nouvelle.', ephemeral: true });
    }
});
