const fs = require('fs');
const path = require('path');
const os = require('os');

async function generateInvoicePDF(invoiceData) {
  const { invoiceNumber, date, dueDate, brand, client, items, subtotal, total, notes } = invoiceData;
  const brandColor = brand?.color || '#111111';
  const brandName = brand?.name || 'Votre Entreprise';

  const itemRows = items.map((item, i) => `
    <tr style="background:${i%2===0?'#ffffff':'#f5f5f5'}">
      <td style="padding:12px 16px;border-bottom:1px solid #ddd">${item.description}</td>
      <td style="padding:12px 16px;text-align:center;border-bottom:1px solid #ddd">${item.quantity}</td>
      <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #ddd">${item.unitPrice.toFixed(2)} EUR</td>
      <td style="padding:12px 16px;text-align:right;font-weight:bold;border-bottom:1px solid #ddd">${(item.quantity*item.unitPrice).toFixed(2)} EUR</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #ffffff; color: #111111; font-size: 14px; padding: 40px; }
  .header { background: #111111; color: #ffffff; padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; border-radius: 8px; margin-bottom: 0; }
  .stripe { height: 6px; background: ${brandColor === '#111111' ? '#ffffff' : brandColor}; margin-bottom: 30px; }
  .brand-name { font-size: 26px; font-weight: 900; letter-spacing: 2px; }
  .tagline { font-size: 12px; color: #aaaaaa; margin-top: 4px; }
  .invoice-num { font-size: 20px; font-weight: 700; text-align: right; }
  .invoice-date { font-size: 11px; color: #aaaaaa; text-align: right; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .card { background: #f9f9f9; border: 1px solid #dddddd; border-radius: 8px; padding: 18px; }
  .card-hl { border-left: 4px solid ${brandColor}; }
  .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${brandColor}; font-weight: 700; margin-bottom: 8px; }
  .card-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; color: #111111; }
  .card-info { font-size: 12px; color: #555555; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #dddddd; margin-bottom: 24px; }
  thead tr { background: #111111; color: #ffffff; }
  thead th { padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; }
  .trow { display: flex; justify-content: space-between; padding: 10px 18px; border-bottom: 1px solid #dddddd; font-size: 13px; background: #f9f9f9; }
  .trow-total { display: flex; justify-content: space-between; padding: 14px 18px; background: #111111; color: #ffffff; }
  .trow-total .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #aaaaaa; }
  .trow-total .amount { font-size: 20px; font-weight: 900; }
  .notes-box { background: #f9f9f9; border-left: 4px solid ${brandColor}; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 12px; color: #555555; line-height: 1.8; }
  .notes-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${brandColor}; font-weight: 700; margin-bottom: 6px; }
  .footer { display: flex; justify-content: space-between; font-size: 11px; color: #888888; border-top: 1px solid #dddddd; padding-top: 16px; margin-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand-name">${brandName}</div>
    ${brand && brand.tagline ? `<div class="tagline">${brand.tagline}</div>` : ''}
  </div>
  <div>
    <div class="invoice-num">FACTURE #${invoiceNumber}</div>
    <div class="invoice-date">Emise le ${date}<br>Echeance ${dueDate}</div>
  </div>
</div>
<div class="stripe"></div>

<div class="grid">
  <div class="card card-hl">
    <div class="card-label">Emetteur</div>
    <div class="card-name">${brandName}</div>
    <div class="card-info">
      ${(brand && brand.address ? brand.address : '').replace(/\n/g,'<br>')}
      ${brand && brand.email ? '<br>' + brand.email : ''}
      ${brand && brand.phone ? '<br>' + brand.phone : ''}
      ${brand && brand.siret ? '<br>SIRET: ' + brand.siret : ''}
    </div>
  </div>
  <div class="card">
    <div class="card-label">Facture a</div>
    <div class="card-name">${client.name}</div>
    <div class="card-info">
      ${client.address.replace(/\n/g,'<br>')}
      ${client.email ? '<br>' + client.email : ''}
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="text-align:left">Description</th>
      <th style="text-align:center">Qte</th>
      <th style="text-align:right">Prix unitaire</th>
      <th style="text-align:right">Total HT</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="totals-box">
    <div class="trow"><span>Sous-total HT</span><span>${subtotal.toFixed(2)} EUR</span></div>
    <div class="trow"><span>TVA (0%)</span><span>0.00 EUR</span></div>
    <div class="trow-total"><span class="label">Total TTC</span><span class="amount">${total.toFixed(2)} EUR</span></div>
  </div>
</div>

${notes ? `<div class="notes-box"><div class="notes-label">Notes</div>${notes.replace(/\n/g,'<br>')}</div>` : ''}

<div class="footer">
  <span>${brandName}</span>
  <span>Facture N ${invoiceNumber} — ${date}</span>
</div>
</body>
</html>`;

  const tmpDir = path.join(os.tmpdir(), 'discord-invoices');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outputPath = path.join(tmpDir, 'facture-' + invoiceNumber + '.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

module.exports = { generateInvoicePDF };
