const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { generateInvoicePDF } = require('./invoiceGenerator');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const pendingInvoices = new Map();

client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand() && interaction.commandName === 'facture') {
    const modal = new ModalBuilder().setCustomId('invoice_modal').setTitle('🧾 Nouvelle Facture');
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('client_name').setLabel('Nom du client').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('client_email').setLabel('Email du client').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('client_address').setLabel('Adresse du client').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('invoice_items').setLabel('Prestations (Nom | Qté | Prix)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Design logo | 1 | 500\nSite web | 3 | 800').setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('invoice_notes').setLabel('Notes (optionnel)').setStyle(TextInputStyle.Paragraph).setRequired(false)),
    );
    await interaction.showModal(modal);
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'config-marque') {
    const modal = new ModalBuilder().setCustomId('brand_modal').setTitle('🏢 Configuration Marque');
    modal.addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('brand_name').setLabel('Nom entreprise').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('brand_address').setLabel('Adresse').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('brand_contact').setLabel('Email | Téléphone | SIRET').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('brand_color').setLabel('Couleur hex (ex: #2563EB)').setStyle(TextInputStyle.Short).setRequired(false)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('brand_tagline').setLabel('Slogan (optionnel)').setStyle(TextInputStyle.Short).setRequired(false)),
    );
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'brand_modal') {
    const brand = {
      name: interaction.fields.getTextInputValue('brand_name'),
      address: interaction.fields.getTextInputValue('brand_address'),
      color: interaction.fields.getTextInputValue('brand_color') || '#2563EB',
      tagline: interaction.fields.getTextInputValue('brand_tagline') || '',
    };
    const contact = interaction.fields.getTextInputValue('brand_contact').split('\n');
    brand.email = contact[0] || '';
    brand.phone = contact[1] || '';
    brand.siret = contact[2] || '';
    saveBrand(interaction.guildId, brand);
    await interaction.reply({ content: `✅ Marque **${brand.name}** configurée !`, ephemeral: true });
  }

  if (interaction.isModalSubmit() && interaction.customId === 'invoice_modal') {
    const brand = loadBrand(interaction.guildId);
    const items = interaction.fields.getTextInputValue('invoice_items').split('\n').map(line => {
      const p = line.split('|').map(s => s.trim());
      return { description: p[0] || 'Prestation', quantity: parseFloat(p[1]) || 1, unitPrice: parseFloat(p[2]) || 0 };
    });
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const invoiceNumber = generateNumber();
    const date = new Date().toLocaleDateString('fr-FR');
    const dueDate = new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR');
    const invoiceData = {
      invoiceNumber, date, dueDate, brand,
      client: {
        name: interaction.fields.getTextInputValue('client_name'),
        email: interaction.fields.getTextInputValue('client_email'),
        address: interaction.fields.getTextInputValue('client_address'),
      },
      items, subtotal, tva: 0, total: subtotal,
      notes: interaction.fields.getTextInputValue('invoice_notes') || '',
    };
    pendingInvoices.set(invoiceNumber, invoiceData);
    const embed = new EmbedBuilder()
      .setColor(brand?.color || '#2563EB')
      .setTitle(`🧾 Facture N° ${invoiceNumber}`)
      .setDescription(`**Client :** ${invoiceData.client.name}\n**Total : ${subtotal.toFixed(2)} €**\n📅 Échéance : ${dueDate}`)
      .setFooter({ text: brand ? `Émis par ${brand.name}` : 'Configurez votre marque avec /config-marque' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`gen_${invoiceNumber}`).setLabel('📄 Générer le PDF').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cancel_${invoiceNumber}`).setLabel('❌ Annuler').setStyle(ButtonStyle.Danger),
    );
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId.startsWith('gen_')) {
    const invoiceNumber = interaction.customId.replace('gen_', '');
    const invoiceData = pendingInvoices.get(invoiceNumber);
    if (!invoiceData) { await interaction.reply({ content: '❌ Facture introuvable.', ephemeral: true }); return; }
    await interaction.deferReply();
    try {
      const pdfPath = await generateInvoicePDF(invoiceData);
      await interaction.editReply({ content: `✅ Facture **${invoiceNumber}** générée !`, files: [{ attachment: pdfPath, name: `facture-${invoiceNumber}.pdf` }] });
      pendingInvoices.delete(invoiceNumber);
      setTimeout(() => fs.existsSync(pdfPath) && fs.unlinkSync(pdfPath), 60000);
    } catch (err) {
      await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }

  if (interaction.isButton() && interaction.customId.startsWith('cancel_')) {
    pendingInvoices.delete(interaction.customId.replace('cancel_', ''));
    await interaction.update({ content: '❌ Annulé.', embeds: [], components: [] });
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'aide') {
    await interaction.reply({ content: '**Commandes :**\n`/config-marque` — Configurer votre marque\n`/facture` — Créer une facture PDF\n`/aide` — Aide', ephemeral: true });
  }
});

function generateNumber() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
}

function saveBrand(guildId, brand) {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `brand_${guildId}.json`), JSON.stringify(brand, null, 2));
}

function loadBrand(guildId) {
  const f = path.join(__dirname, 'data', `brand_${guildId}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : null;
}

client.login(process.env.DISCORD_TOKEN);
