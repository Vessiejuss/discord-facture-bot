const fs = require('fs');
const path = require('path');
const os = require('os');

async function generateInvoicePDF(invoiceData) {
  const { invoiceNumber, date, dueDate, brand, client, items, subtotal, total, notes } = invoiceData;
  const brandColor = brand?.color || '#2563EB';
  const brandName = brand?.name || 'Votre Entreprise';

  const itemRows = items.map((item, i) => `
    <tr style="background:${i%2===0?'white':'#f8fafc'}">
      <td style="padding:10px 16px;font-weight:500;border-bottom:1px solid #e2e8f0">${item.description}</td>
      <td style="padding:10px 16px;text-align:center;color:#64748b;border-bottom:1px solid #e2e8f0">${item.quantity}</td>
      <td style="padding:10px 16px;text-align:right;color:#64748b;border-bottom:1px solid #e2e8f0">${item.unitPrice.toFixed(2)} €</td>
      <td style="padding:10px 16px;text-align:right;font-weight:700;border-bottom:1px solid #e2e8f0">${(item.quantity*item.unitPrice).toFixed(2)} €</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:0;color:#0f172a;font-size:13px}
    .header{background:#0f172a;color:white;padding:30px 40px;display:flex;justify-content:space-between}
    .stripe{height:5px;background:${brandColor}}
    .body{padding:32px 40px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px}
    .card-hl{background:${brandColor}22;border-color:${brandColor}55}
    .clabel{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${brandColor};font-weight:700;margin-bottom:8px}
    .cname{font-size:14px;font-weight:700;margin-bottom:4px}
    .cmuted{color:#64748b;font-size:12px;line-height:1.7}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#0f172a;color:white}
    thead th{padding:11px 16px;font-size:10px;text-transform:uppercase;letter-spacing:1px}
    .table-wrap{border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:28px}
    .totals{display:flex;justify-content:flex-end;margin-bottom:28px}
    .totals-box{width:260px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
    .trow{display:flex;justify-content:space-between;padding:10px 18px;border-bottom:1px solid #e2e8f0}
    .trow-total{background:#0f172a;color:white;display:flex;justify-content:space-between;padding:13px 18px}
    .footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  </style></head><body>
  <div class="header">
    <div>
      <div style="font-size:22px;font-weight:800">${brandName}</div>
      ${brand && brand.tagline ? '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px">'+brand.tagline+'</div>' : ''}
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-bottom:4px">Facture</div>
      <div style="font-size:18px;font-weight:700">#${invoiceNumber}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px">Emise le ${date}<br>Echeance ${dueDate}</div>
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="grid">
      <div class="card card-hl">
        <div class="clabel">Emetteur</div>
        <div class="cname">${brandName}</div>
        <div class="cmuted">${(brand && brand.address ? brand.address : '').replace(/\n/g,'<br>')}${brand && brand.email ? '<br>'+brand.email : ''}${brand && brand.phone ? '<br>'+brand.phone : ''}${brand && brand.siret ? '<br>SIRET: '+brand.siret : ''}</div>
      </div>
      <div class="card">
        <div class="clabel">Facture a</div>
        <div class="cname">${client.name}</div>
        <div class="cmuted">${client.address.replace(/\n/g,'<br>')}${client.email ? '<br>'+client.email : ''}</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th style="text-align:left">Description</th>
          <th style="text-align:center">Qte</th>
          <th style="text-align:right">Prix unitaire</th>
          <th style="text-align:right">Total HT</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <div class="totals"><div class="totals-box">
      <div class="trow"><span style="color:#64748b">Sous-total HT</span><span style="font-weight:600">${subtotal.toFixed(2)} EUR</span></div>
      <div class="trow"><span style="color:#64748b">TVA (0%)</span><span style="font-weight:600">0.00 EUR</span></div>
      <div class="trow-total"><span style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:1px">Total TTC</span><span style="font-size:17px;font-weight:800">${total.toFixed(2)} EUR</span></div>
    </div></div>
    ${notes ? '<div style="background:#f8fafc;border-left:3px solid '+brandColor+';padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:'+brandColor+';font-weight:700;margin-bottom:6px">Notes</div><div style="color:#64748b;font-size:12px">'+notes.replace(/\n/g,'<br>')+'</div></div>' : ''}
  </div>
  <div class="footer">
    <div style="font-weight:700;color:#0f172a">${brandName}</div>
    <div>Facture N ${invoiceNumber} - ${date}</div>
  </div>
  </body></html>`;

  const tmpDir = path.join(os.tmpdir(), 'discord-invoices');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const outputPath = path.join(tmpDir, 'facture-' + invoiceNumber + '.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

module.exports = { generateInvoicePDF };
