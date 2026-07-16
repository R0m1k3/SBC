import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RED = '#C1272D';
const INK = '#1B1B1B';
const GRAY = '#6E675F';
const LIGHT = '#F4F1EC';
const WHITE = '#FFFFFF';

const logoCandidates = [
  fileURLToPath(new URL('../public/assets/logo.jpg', import.meta.url)),
  fileURLToPath(new URL('../../web/public/assets/logo.jpg', import.meta.url)),
];
const logoPath = logoCandidates.find(existsSync);

const value = (input) => String(input ?? '').trim();
const statusLabel = (member, season) => member.valide ? `Validé ${season}` : 'À renouveler';

function collectPdf(draw, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 36,
      ...options,
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    doc.end();
  });
}

export function buildMembersPdf({ season, rows, association = {} }) {
  const associationName = value(association.association_name) || 'Association';
  const activeCount = rows.filter((row) => row.valide).length;
  const generatedAt = new Date().toLocaleDateString('fr-FR');
  const widths = [130, 100, 120, 135, 170, 65, 49];
  const headers = ['Entreprise', 'Dirigeant', 'Activité', 'Coordonnées', 'Adresse', 'Site', 'Statut'];
  const rowHeight = 43;

  return collectPdf((doc) => {
    const left = 36;
    const tableWidth = widths.reduce((sum, width) => sum + width, 0);
    let pageNumber = 0;

    const drawHeader = () => {
      pageNumber += 1;
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(WHITE);
      const showLogo = Boolean(logoPath && pageNumber === 1);
      if (showLogo) doc.image(logoPath, left, 22, { fit: [48, 48] });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(RED)
        .text(associationName.toUpperCase(), showLogo ? 96 : left, 27, { width: 330, lineBreak: false, ellipsis: true });
      doc.font('Helvetica-Bold').fontSize(20).fillColor(INK)
        .text('Liste des membres', showLogo ? 96 : left, 41, { width: 330, lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(GRAY)
        .text(`Saison ${season} - Édité le ${generatedAt}`, 495, 29, { width: 311, align: 'right', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(INK)
        .text(`${rows.length} membres - ${activeCount} valides`, 495, 45, { width: 311, align: 'right', lineBreak: false });
      doc.moveTo(left, 76).lineTo(left + tableWidth, 76).lineWidth(2).strokeColor(RED).stroke();

      let x = left;
      doc.rect(left, 91, tableWidth, 27).fill(INK);
      headers.forEach((header, index) => {
        doc.font('Helvetica-Bold').fontSize(7).fillColor(WHITE)
          .text(header.toUpperCase(), x + 5, 101, { width: widths[index] - 10, lineBreak: false, ellipsis: true });
        x += widths[index];
      });
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(7.5).fillColor('#8A8279')
        .text(`Page ${pageNumber}`, left, doc.page.height - 22, { width: tableWidth, align: 'right', lineBreak: false });
      doc.page.margins.bottom = bottomMargin;
      return 118;
    };

    let y = drawHeader();
    rows.forEach((member, index) => {
      if (y + rowHeight > 555) {
        doc.addPage();
        y = drawHeader();
      }
      if (index % 2 === 0) doc.rect(left, y, tableWidth, rowHeight).fill('#FAF8F5');

      const activity = [value(member.categorie), value(member.secteur)].filter(Boolean).join('\n');
      const contact = [value(member.email), value(member.tel)].filter(Boolean).join('\n');
      const cells = [
        value(member.nom),
        value(member.dirigeant),
        activity,
        contact,
        value(member.adresse),
        value(member.site),
        statusLabel(member, season),
      ];

      let x = left;
      cells.forEach((cell, cellIndex) => {
        const isName = cellIndex === 0;
        const isStatus = cellIndex === 6;
        doc.font(isName || isStatus ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(isStatus ? 6.7 : 7.2)
          .fillColor(isStatus ? (member.valide ? '#2C7A4B' : RED) : INK)
          .text(cell || '-', x + 5, y + 7, {
            width: widths[cellIndex] - 10,
            height: rowHeight - 12,
            lineGap: 1.5,
            ellipsis: true,
          });
        x += widths[cellIndex];
      });
      y += rowHeight;
    });
  }, { info: { Title: `Liste des membres ${season}`, Author: associationName } });
}

export async function buildMembersWorkbook({ season, rows, association = {} }) {
  const associationName = value(association.association_name) || 'Association';
  const activeCount = rows.filter((row) => row.valide).length;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = associationName;
  workbook.created = new Date();
  workbook.subject = `Liste des membres - Saison ${season}`;

  const sheet = workbook.addWorksheet('Membres', {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.mergeCells('A1:I1');
  sheet.getCell('A1').value = `${associationName} - Liste des membres`;
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF1B1B1B' } };
  sheet.getCell('A2').value = `Saison ${season}`;
  sheet.getCell('C2').value = 'Nombre de membres';
  sheet.getCell('D2').value = rows.length;
  sheet.getCell('F2').value = 'Membres valides';
  sheet.getCell('G2').value = activeCount;

  const headerRow = sheet.getRow(5);
  headerRow.values = ['Entreprise', 'Catégorie', 'Secteur', 'Dirigeant', 'Adresse', 'E-mail', 'Téléphone', 'Site internet', 'Statut'];
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B1B1B' } };
    cell.alignment = { vertical: 'middle' };
  });

  rows.forEach((member, index) => {
    const row = sheet.addRow([
      value(member.nom),
      value(member.categorie),
      value(member.secteur),
      value(member.dirigeant),
      value(member.adresse),
      value(member.email),
      value(member.tel),
      value(member.site),
      statusLabel(member, season),
    ]);
    row.height = 31;
    row.alignment = { vertical: 'top', wrapText: true };
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF8F5' } };
      });
    }
    row.getCell(9).font = { bold: true, color: { argb: member.valide ? 'FF2C7A4B' : 'FFC1272D' } };
  });

  const lastRow = 5 + rows.length;
  if (rows.length) sheet.autoFilter = { from: 'A5', to: `I${lastRow}` };
  [28, 22, 24, 24, 42, 32, 18, 28, 20].forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.properties.defaultRowHeight = 20;
  sheet.pageMargins = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
