import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const RED = '#C1272D';
const INK = '#1B1B1B';
const GRAY = '#6E675F';
const LIGHT = '#F4F1EC';

const text = (value) => String(value ?? '');
const money = (value) => `${Number(value || 0).toFixed(2).replace('.', ',')} EUR`;
const dateFr = (value) => {
  if (!value) return '';
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');
  return `${day}/${month}/${year}`;
};
const typeLabel = (value) => value === 'sluc_partner' ? 'Partenaire SLUC' : 'Non partenaire SLUC';
const paymentLabel = (value) => ({ carte: 'Carte bleue', virement: 'Virement', cheque: 'Chèque' }[value] || '');

function collectPdf(draw, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, ...options });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fontSize(8).fillColor('#8A8279').text(
        `Page ${page - range.start + 1} / ${range.count}`,
        48,
        doc.page.height - 24,
        { width: doc.page.width - 96, align: 'right', lineBreak: false }
      );
      doc.page.margins.bottom = bottomMargin;
    }
    doc.end();
  });
}

function drawMultiline(doc, value, x, y, width, options = {}) {
  doc.text(text(value), x, y, { width, lineGap: 2, ...options });
}

export function buildInvoicePdf(invoice) {
  const issuer = invoice.issuer_snapshot || {};
  return collectPdf((doc) => {
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(21).text(text(issuer.association_name || 'Association'), 48, 48, { width: 310 });
    doc.fillColor(RED).fontSize(28).text('FACTURE', 365, 45, { width: 180, align: 'right' });
    doc.moveTo(48, 84).lineTo(547, 84).lineWidth(2).strokeColor(RED).stroke();

    doc.font('Helvetica-Bold').fontSize(10).fillColor(GRAY).text('ÉMETTEUR', 48, 108);
    doc.font('Helvetica').fontSize(10).fillColor(INK);
    drawMultiline(doc, issuer.association_name, 48, 126, 215);
    drawMultiline(doc, issuer.association_address, 48, 143, 215);
    if (issuer.association_email) drawMultiline(doc, issuer.association_email, 48, 178, 215);
    if (issuer.association_phone) drawMultiline(doc, issuer.association_phone, 48, 194, 215);
    if (issuer.association_siret) doc.text(`SIRET : ${issuer.association_siret}`, 48, 210, { width: 215 });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(GRAY).text('DESTINATAIRE', 310, 108);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(text(invoice.member_name), 310, 126, { width: 237 });
    doc.font('Helvetica').fontSize(10);
    drawMultiline(doc, invoice.member_address, 310, 145, 237);
    drawMultiline(doc, invoice.member_email, 310, 185, 237);

    doc.roundedRect(48, 240, 499, 58, 4).fill(LIGHT);
    const meta = [
      ['N° de facture', invoice.invoice_number],
      ['Date d’émission', dateFr(invoice.issued_at)],
      ['Date d’échéance', dateFr(invoice.due_date)],
    ];
    meta.forEach(([label, value], index) => {
      const x = 62 + index * 164;
      doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(label.toUpperCase(), x, 253, { width: 145 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(text(value), x, 270, { width: 145 });
    });

    const tableY = 332;
    doc.rect(48, tableY, 499, 30).fill(INK);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    doc.text('DÉSIGNATION', 60, tableY + 10, { width: 275 });
    doc.text('HT', 350, tableY + 10, { width: 80, align: 'right' });
    doc.text('TVA', 445, tableY + 10, { width: 88, align: 'right' });
    doc.rect(48, tableY + 30, 499, 58).fill('#FAF8F5');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(`Adhésion ${invoice.season}`, 60, tableY + 45, { width: 270 });
    doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(typeLabel(invoice.billing_type), 60, tableY + 62, { width: 270 });
    doc.font('Helvetica').fontSize(10).fillColor(INK).text(money(invoice.amount_ht), 350, tableY + 50, { width: 80, align: 'right' });
    doc.text(`${Number(invoice.vat_rate).toFixed(2).replace('.', ',')} %`, 445, tableY + 50, { width: 88, align: 'right' });

    const totalsY = 430;
    const totals = [
      ['Total HT', invoice.amount_ht],
      ['TVA', invoice.vat_amount],
      ['Total TTC', invoice.amount_ttc],
    ];
    totals.forEach(([label, value], index) => {
      const y = totalsY + index * 27;
      if (index === 2) doc.roundedRect(337, y - 7, 210, 28, 3).fill(RED);
      doc.font('Helvetica-Bold').fontSize(index === 2 ? 11 : 10).fillColor(index === 2 ? '#FFFFFF' : INK)
        .text(label, 350, y, { width: 90 })
        .text(money(value), 440, y, { width: 94, align: 'right' });
    });

    let y = 540;
    if (invoice.status === 'payee') {
      doc.roundedRect(48, y, 499, 46, 4).fill('#E8F3EC');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#22623E').text('FACTURE RÉGLÉE', 62, y + 10);
      doc.font('Helvetica').fontSize(9).text(`${paymentLabel(invoice.payment_method)} - ${dateFr(invoice.paid_at)}`, 62, y + 27);
      y += 65;
    } else {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text('RÈGLEMENT', 48, y);
      doc.font('Helvetica').fontSize(9.5).fillColor(GRAY).text(`À régler avant le ${dateFr(invoice.due_date)}.`, 48, y + 18);
      if (issuer.iban) doc.text(`IBAN : ${issuer.iban}`, 48, y + 36, { width: 499 });
      y += issuer.iban ? 72 : 54;
    }

    if (issuer.legal_mentions) {
      if (y > 690) {
        doc.addPage();
        y = 60;
      }
      doc.moveTo(48, y).lineTo(547, y).lineWidth(1).strokeColor('#D9D3CB').stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY).text('MENTIONS LÉGALES', 48, y + 14);
      doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(text(issuer.legal_mentions), 48, y + 29, { width: 499, lineGap: 2 });
    }
  }, { info: { Title: `Facture ${invoice.invoice_number}`, Author: text(invoice.issuer_snapshot?.association_name) } });
}

export function buildPaidMembersPdf({ season, rows }) {
  return collectPdf((doc) => {
    const pageWidth = doc.page.width;
    const left = 36;
    const widths = [90, 150, 90, 70, 75, 70, 70, 75];
    const headers = ['Facture', 'Entreprise', 'Type', 'Date', 'Règlement', 'HT', 'TVA', 'TTC'];
    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(`Adhésions réglées - ${season}`, left, 36);
      doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(`${rows.length} membre${rows.length > 1 ? 's' : ''} à jour`, left, 64);
      let x = left;
      doc.rect(left, 88, pageWidth - left * 2, 26).fill(INK);
      headers.forEach((header, index) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF').text(header.toUpperCase(), x + 4, 97, { width: widths[index] - 8, align: index >= 5 ? 'right' : 'left' });
        x += widths[index];
      });
      return 114;
    };
    let y = drawHeader();
    rows.forEach((row, rowIndex) => {
      if (y > 535) {
        doc.addPage();
        y = drawHeader();
      }
      if (rowIndex % 2 === 0) doc.rect(left, y, pageWidth - left * 2, 29).fill('#FAF8F5');
      const values = [
        row.invoice_number,
        row.member_name,
        typeLabel(row.billing_type),
        dateFr(row.paid_at),
        paymentLabel(row.payment_method),
        money(row.amount_ht),
        money(row.vat_amount),
        money(row.amount_ttc),
      ];
      let x = left;
      values.forEach((value, index) => {
        doc.font('Helvetica').fontSize(7.5).fillColor(INK).text(text(value), x + 4, y + 10, { width: widths[index] - 8, align: index >= 5 ? 'right' : 'left', ellipsis: true });
        x += widths[index];
      });
      y += 29;
    });
    const total = rows.reduce((sum, row) => sum + Number(row.amount_ttc), 0);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(`Total encaissé : ${money(total)}`, left, y + 18, { width: pageWidth - left * 2, align: 'right' });
  }, { size: 'A4', layout: 'landscape', margin: 36, info: { Title: `Adhésions réglées ${season}` } });
}

export async function buildPaidMembersWorkbook({ season, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBC - Module facturation';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Adhésions payées', { views: [{ state: 'frozen', ySplit: 5 }] });
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = `Adhésions réglées - Saison ${season}`;
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF1B1B1B' } };
  sheet.getCell('A2').value = 'Membres à jour';
  sheet.getCell('B2').value = rows.length;
  sheet.getCell('D2').value = 'Total encaissé TTC';
  sheet.getCell('E2').value = { formula: rows.length ? `SUM(H6:H${5 + rows.length})` : '0' };
  sheet.getCell('E2').numFmt = '#,##0.00 [$EUR]';
  sheet.getRow(5).values = ['N° facture', 'Entreprise', 'Type', 'Date de règlement', 'Mode de règlement', 'Montant HT', 'TVA', 'Montant TTC'];
  sheet.getRow(5).height = 24;
  sheet.getRow(5).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B1B1B' } };
    cell.alignment = { vertical: 'middle' };
  });
  rows.forEach((row) => {
    sheet.addRow([
      row.invoice_number,
      row.member_name,
      typeLabel(row.billing_type),
      row.paid_at ? new Date(`${String(row.paid_at).slice(0, 10)}T00:00:00Z`) : null,
      paymentLabel(row.payment_method),
      Number(row.amount_ht),
      Number(row.vat_amount),
      Number(row.amount_ttc),
    ]);
  });
  const lastDataRow = 5 + rows.length;
  if (rows.length) {
    sheet.autoFilter = { from: 'A5', to: `H${lastDataRow}` };
    for (let row = 6; row <= lastDataRow; row += 1) {
      sheet.getCell(`D${row}`).numFmt = 'dd/mm/yyyy';
      ['F', 'G', 'H'].forEach((column) => { sheet.getCell(`${column}${row}`).numFmt = '#,##0.00 [$EUR]'; });
      if (row % 2 === 0) {
        sheet.getRow(row).eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF8F5' } }; });
      }
    }
  }
  const widths = [20, 34, 24, 20, 22, 16, 16, 18];
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
