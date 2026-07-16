import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RED = '#C1272D';
const INK = '#1B1B1B';
const GRAY = '#6E675F';
const LIGHT = '#F4F1EC';
const VAT_EXEMPTION = 'TVA non applicable, article 293 B du CGI';
const DEFAULT_PAYMENT_TERMS = 'Aucun escompte pour règlement anticipé. En cas de retard, une indemnité forfaitaire de 40 EUR pour frais de recouvrement est due.';

const logoCandidates = [
  fileURLToPath(new URL('../public/assets/logo.jpg', import.meta.url)),
  fileURLToPath(new URL('../../web/public/assets/logo.jpg', import.meta.url)),
];
const logoPath = logoCandidates.find(existsSync);

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

export function sanitizeLegalMentions(value) {
  return text(value)
    .split(/\r?\n/)
    .map((rawLine) => rawLine.trim())
    .filter(Boolean)
    .filter((line) => !/^facture en euros[.!]?$/i.test(line))
    .filter((line) => !/^tva non applicable\b/i.test(line))
    .filter((line) => !/^r[èe]glement\s*:/i.test(line))
    .map((line) => line.replace(/^paiement\s+[àa]\s+r[ée]ception\s+de\s+facture\.?\s*/i, '').trim())
    .filter(Boolean)
    .join('\n');
}

function collectPdf(draw, { pageNumbers = true, ...options } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, ...options });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    if (pageNumbers) {
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
    if (logoPath) doc.image(logoPath, 48, 38, { fit: [92, 92], align: 'center', valign: 'center' });
    else doc.font('Helvetica-Bold').fontSize(17).fillColor(INK).text(text(issuer.association_name || 'Association'), 48, 56, { width: 210 });

    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK)
      .text(text(issuer.association_name || 'Association'), 300, 44, { width: 247, align: 'right' });
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY);
    drawMultiline(doc, issuer.association_address, 300, 63, 247, { align: 'right', height: 37, ellipsis: true });
    if (issuer.association_email) doc.text(issuer.association_email, 300, 102, { width: 247, align: 'right' });
    if (issuer.association_phone) doc.text(issuer.association_phone, 300, 115, { width: 247, align: 'right' });
    if (issuer.association_siret) doc.text(`SIRET : ${issuer.association_siret}`, 300, 128, { width: 247, align: 'right' });
    doc.moveTo(48, 145).lineTo(547, 145).lineWidth(2).strokeColor(RED).stroke();

    doc.font('Helvetica-Bold').fontSize(30).fillColor(INK).text('FACTURE', 48, 168, { width: 220 });
    doc.roundedRect(310, 161, 237, 70, 4).fill(LIGHT);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('NUMÉRO', 325, 174, { width: 95 });
    doc.text('DATE D’ÉMISSION', 430, 174, { width: 102, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(text(invoice.invoice_number), 325, 192, { width: 110 });
    doc.text(dateFr(invoice.issued_at), 430, 192, { width: 102, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(`Échéance : ${dateFr(invoice.due_date)}`, 325, 212, { width: 207 });

    doc.font('Helvetica-Bold').fontSize(8).fillColor(RED).text('FACTURÉ À', 310, 252, { width: 237 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(text(invoice.member_name), 310, 270, { width: 237 });
    doc.font('Helvetica').fontSize(9).fillColor(GRAY);
    drawMultiline(doc, invoice.member_address, 310, 290, 237, { height: 31, ellipsis: true });
    if (invoice.member_email) doc.text(invoice.member_email, 310, 326, { width: 237 });

    doc.font('Helvetica-Bold').fontSize(11).fillColor(INK)
      .text(`Cotisation annuelle - Saison ${invoice.season}`, 48, 356, { width: 499 });
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
      .text(`${text(issuer.association_name)} - ${text(invoice.member_name)}`, 48, 374, { width: 499 });

    const tableY = 403;
    doc.rect(48, tableY, 499, 29).fill(INK);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
    doc.text('QTÉ', 60, tableY + 10, { width: 38 });
    doc.text('DÉSIGNATION', 112, tableY + 10, { width: 260 });
    doc.text('PRIX UNITAIRE', 382, tableY + 10, { width: 72, align: 'right' });
    doc.text('MONTANT', 466, tableY + 10, { width: 67, align: 'right' });
    doc.rect(48, tableY + 29, 499, 64).fill('#FAF8F5');
    doc.font('Helvetica').fontSize(10).fillColor(INK).text('1', 60, tableY + 50, { width: 38 });
    doc.font('Helvetica-Bold').text('Adhésion à l’association', 112, tableY + 44, { width: 250 });
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY).text(typeLabel(invoice.billing_type), 112, tableY + 61, { width: 250 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(money(invoice.amount_ht), 382, tableY + 50, { width: 72, align: 'right' });
    doc.text(money(invoice.amount_ht), 466, tableY + 50, { width: 67, align: 'right' });

    doc.roundedRect(337, 513, 210, 42, 4).fill(RED);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF').text('NET À PAYER', 351, 529, { width: 100 });
    doc.fontSize(13).text(money(invoice.amount_ht), 445, 527, { width: 88, align: 'right' });

    doc.roundedRect(48, 576, 499, 38, 4).fill('#FBEDEC');
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(RED).text(VAT_EXEMPTION, 62, 590, { width: 471 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('RÈGLEMENT', 48, 638);
    const paymentStatus = invoice.status === 'payee'
      ? `Facture réglée le ${dateFr(invoice.paid_at)} par ${paymentLabel(invoice.payment_method).toLowerCase()}.`
      : invoice.status === 'annulee'
        ? 'Facture annulée.'
        : `Paiement attendu avant le ${dateFr(invoice.due_date)} par virement ou chèque.`;
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY).text(paymentStatus, 48, 655, { width: 499 });
    const ribValues = [issuer.iban, issuer.bic, issuer.rib_account_holder, issuer.rib_bank_name,
      issuer.rib_bank_code, issuer.rib_branch_code, issuer.rib_account_number, issuer.rib_key];
    if (ribValues.some(Boolean)) {
      const ribY = 674;
      doc.roundedRect(48, ribY, 499, 74, 4).fill(LIGHT);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK).text('COORDONNÉES BANCAIRES', 60, ribY + 9, { width: 130 });
      const bankIdentity = [issuer.rib_account_holder, issuer.rib_bank_name].filter(Boolean).join(' - ');
      doc.font('Helvetica').fontSize(7).fillColor(GRAY).text(bankIdentity, 195, ribY + 9, { width: 338, align: 'right', ellipsis: true });

      const ribColumns = [
        ['Code banque', issuer.rib_bank_code, 78],
        ['Code guichet', issuer.rib_branch_code, 78],
        ['N° de compte', issuer.rib_account_number, 128],
        ['Clé RIB', issuer.rib_key, 58],
        ['BIC / SWIFT', issuer.bic, 109],
      ];
      let ribX = 60;
      ribColumns.forEach(([label, value, width]) => {
        doc.font('Helvetica').fontSize(6).fillColor(GRAY).text(label.toUpperCase(), ribX, ribY + 27, { width });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK).text(text(value), ribX, ribY + 38, { width, ellipsis: true });
        ribX += width;
      });
      doc.font('Helvetica').fontSize(6).fillColor(GRAY).text('IBAN', 60, ribY + 55, { width: 32 });
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK).text(text(issuer.iban), 92, ribY + 53, { width: 441, characterSpacing: 0.5, ellipsis: true });
    }

    const legalMentions = sanitizeLegalMentions(issuer.legal_mentions) || DEFAULT_PAYMENT_TERMS;
    doc.font('Helvetica').fontSize(7);
    const legalContinued = doc.heightOfString(legalMentions, { width: 499, lineGap: 1.2 }) > 28;
    doc.moveTo(48, 759).lineTo(547, 759).lineWidth(1).strokeColor('#D9D3CB').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GRAY).text('CONDITIONS DE RÈGLEMENT', 48, 769);
    doc.font('Helvetica').fontSize(7).fillColor(GRAY).text(
      legalContinued ? 'Les conditions complémentaires figurent en page suivante.' : legalMentions,
      48,
      782,
      { width: 499, height: 28, lineGap: 1.2 }
    );

    if (legalContinued) {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text('Conditions de règlement', 48, 54, { width: 499 });
      doc.moveTo(48, 84).lineTo(547, 84).lineWidth(2).strokeColor(RED).stroke();
      doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(legalMentions, 48, 108, { width: 499, lineGap: 3 });
    }
  }, { pageNumbers: false, info: { Title: `Facture ${invoice.invoice_number}`, Author: text(invoice.issuer_snapshot?.association_name) } });
}

export function buildPaidMembersPdf({ season, rows }) {
  return collectPdf((doc) => {
    const pageWidth = doc.page.width;
    const left = 36;
    const widths = [105, 210, 105, 90, 100, 159];
    const headers = ['Facture', 'Entreprise', 'Type', 'Date', 'Règlement', 'Montant'];
    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(`Adhésions réglées - ${season}`, left, 36, { lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(`${rows.length} membre${rows.length > 1 ? 's' : ''} à jour`, left, 64, { lineBreak: false });
      let x = left;
      doc.rect(left, 88, pageWidth - left * 2, 26).fill(INK);
      headers.forEach((header, index) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF').text(header.toUpperCase(), x + 4, 97, { width: widths[index] - 8, align: index === 5 ? 'right' : 'left' });
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
      ];
      let x = left;
      values.forEach((value, index) => {
        doc.font('Helvetica').fontSize(7.5).fillColor(INK).text(text(value), x + 4, y + 10, { width: widths[index] - 8, align: index === 5 ? 'right' : 'left', ellipsis: true });
        x += widths[index];
      });
      y += 29;
    });
    const total = rows.reduce((sum, row) => sum + Number(row.amount_ht), 0);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(`Total encaissé : ${money(total)}`, left, y + 18, { width: pageWidth - left * 2, align: 'right' });
  }, { size: 'A4', layout: 'landscape', margin: 36, info: { Title: `Adhésions réglées ${season}` } });
}

export async function buildPaidMembersWorkbook({ season, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SBC - Module facturation';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Adhésions payées', { views: [{ state: 'frozen', ySplit: 5 }] });
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `Adhésions réglées - Saison ${season}`;
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF1B1B1B' } };
  sheet.getCell('A2').value = 'Membres à jour';
  sheet.getCell('B2').value = rows.length;
  sheet.getCell('D2').value = 'Total encaissé';
  sheet.getCell('E2').value = { formula: rows.length ? `SUM(F6:F${5 + rows.length})` : '0' };
  sheet.getCell('E2').numFmt = '#,##0.00 [$EUR]';
  sheet.getRow(5).values = ['N° facture', 'Entreprise', 'Type', 'Date de règlement', 'Mode de règlement', 'Montant'];
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
    ]);
  });
  const lastDataRow = 5 + rows.length;
  if (rows.length) {
    sheet.autoFilter = { from: 'A5', to: `F${lastDataRow}` };
    for (let row = 6; row <= lastDataRow; row += 1) {
      sheet.getCell(`D${row}`).numFmt = 'dd/mm/yyyy';
      sheet.getCell(`F${row}`).numFmt = '#,##0.00 [$EUR]';
      if (row % 2 === 0) {
        sheet.getRow(row).eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF8F5' } }; });
      }
    }
  }
  const widths = [20, 34, 24, 20, 22, 18];
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
