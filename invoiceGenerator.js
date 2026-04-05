const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function generateInvoicePDF(invoiceData) {
  const { invoiceNumber, date, dueDate, brand, client, items, subtotal, tva, total, notes } = invoiceData;
  const brandColor = brand?.color || '#2563EB';
  const brandName = brand?.name || 'Votre Entreprise';

  const itemRows = items.map((item, i) => `
    <tr style="background:${i%2===0?'white':'#f8fafc'}">
      <td style="padding:12px 18px;font-weight:500">${item.description}</td>
      <td style="padding:12px 18px;text-align:center;color:#64748b">${item.quantity}</td>
      <td style="padding:12px 18px;text-align:right;color:#64748b">${item.unitPrice.toFixed(2)} €</td>
      <td style="padding:12px 18px;text-align:right;font-weight:700">${(item.quantity*item.unitPrice).toFixed(2)} €</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:sans-serif;margin:0;color:#0f172a;font-size:13px}
    .header{background:#0f172a;color:white;padding:36px 48px;display:flex;justify-content:space-between}
    .brand-name{font-size:24px;font-weight:800}
    .brand-name span{color:${brandColor}}
    .stripe{height:5px;background:${brandColor}}
    .body{padding:40px 48px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px}
    .card-hl{background:${brandColor}15;border-color:${brandColor}30}
    .label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${brandColor};font-weight:700;margin-bottom:8px}
    .name{font-size:15px;font-weight:700;margin-bottom:4px}
    .muted{color:#64748b;font-size:12px;line-height:1.7}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#0f172a;color:white}
    thead th{padding:12px 18px;font-size:10px;text-transform:uppercase;letter-spacing:1px}
    .table-wrap{border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:32px}
    .totals{display:flex;justify-content:flex-end;margin-bottom:32px}
    .totals-box{width:280px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
    .trow{display:flex;justify-content:space-between;padding:11px 20px;border-bottom:1px solid #e2e8f0;font-size:13px}
    .trow-total{background:#0f172a;color:white;display:flex;justify-content:space-between;padding:14px 20px}
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 48px;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  </style></head><body>
  <div class="header">
    <div><div class="brand-name">${brandName.replace(/(\s)(\S+)$/, '$1<span>$2</span>')}</div>
    ${brand?.tagline?`<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;font-style:italic">${brand.tagline}</div>`:''}</div>
    <div style="text-align:right">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-bottom:6px">Facture</div>
      <div style="font-size:20px;font-weight:700">#${invoiceNumber}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px">Émise le ${date}<br>Échéance ${dueDate}</div>
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="grid">
      <div class="card card-hl">
        <div class="label">✦ Émetteur</div>
        <div class="name">${brandName}</div>
        <div class="muted">${(brand?.address||'').replace(/\n/g,'<br>')}${brand?.email?'<br>'+brand.email:''}${brand?.phone?'<br>'+brand.phone:''}${brand?.siret?'<br>SIRET: '+brand.siret:''}</div>
      </div>
      <div class="card">
        <div class="label">▸ Facturé à</div>
        <div class="name">${client.name}</div>
        <div class="muted">${client.address.replace(/\n/g,'<br>')}${client.email?'<br>'+client.email:''}</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th style="text-align:left">Description</th>
          <th style="text-align:center">Qté</th>
          <th style="text-align:right">Prix unitaire</th>
          <th style="text-align:right">Total HT</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <div class="totals"><div class="totals-box">
      <div class="trow"><span style="color:#64748b">Sous-total HT</span><span style="font-weight:600">${subtotal.toFixed(2)} €</span></div>
      <div class="trow"><span style="color:#64748b">TVA (0%)</span><span style="font-weight:600">0.00 €</span></div>
      <div class="trow-total"><span style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1px">Total TTC</span><span style="font-size:18px;font-weight:800">${total.toFixed(2)} €</span></div>
    </div></div>
    ${notes?`<div style="background:#f8fafc;border-left:3px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:32px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${brandColor};font-weight:700;margin-bottom:6px">Notes</div><div style="color:#64748b;font-size:12px">${notes.replace(/\n/g,'<br>')}</div></div>`:''}
  </div>
  <div class="footer">
    <div style="font-weight:700;color:#0f172a">${brandName}</div>
    <div>Facture N° ${invoiceNumber} — ${date}</div>
  </div>
  </body></html>`;

  const tmpDir = path.join(os.tmpdir(), 'discord-invoices');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outputPath = path.join(tmpDir, `facture-${invoiceNumber}.pdf`);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  await browser.close();
  return outputPath;
}

module.exports = { generateInvoicePDF };
