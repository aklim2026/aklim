import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { TechnicienStats, ClientFullDetails, AppSettings, Installation, Paiement, RapportData } from '../types';

/**
 * Export data to Excel (.xlsx) with clean formatting
 */
export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName = 'Données'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Helper to truncate text to fit a specific millimeter width in jsPDF
 */
function truncateTextToWidth(doc: jsPDF, text: string, maxWidthMm: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidthMm) return text;
  let truncated = text;
  while (truncated.length > 3 && doc.getTextWidth(truncated + '...') > maxWidthMm) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Helper to draw a modern corporate header on any PDF document with guaranteed non-overlapping layout
 */
function drawCorporateHeader(
  doc: jsPDF,
  settings: AppSettings,
  docTitle: string,
  docSubTitle: string,
  docRef: string,
  docDate: string
) {
  // Main Header Background (Deep Slate #0F172A)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Bottom Stripe (Vibrant Royal Blue #2563EB)
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 36, 210, 1.6, 'F');

  // Available width for Left Brand info: 14mm to 124mm = 110mm max
  const leftMaxWidth = 110;

  // 1. Enterprise Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const companyName = (settings.nomentreprise || 'CLIMTRACK MAROC').toUpperCase();
  doc.text(truncateTextToWidth(doc, companyName, leftMaxWidth), 14, 12);

  // 2. Subtitle / Tagline
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  const slogan = settings.slogan || "Installation, Contrat et Maintenance de Systèmes de Climatisation";
  doc.text(truncateTextToWidth(doc, slogan, leftMaxWidth), 14, 17.5);

  // 3. Contact Phone & Email
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  const telStr = settings.telephone || settings.telephoneentreprise || '+212 5 22 00 00 00';
  const mailStr = settings.email || settings.emailentreprise || 'contact@climtrack.ma';
  const line3 = `Tél : ${telStr}   |   Email : ${mailStr}`;
  doc.text(truncateTextToWidth(doc, line3, leftMaxWidth), 14, 23.5);

  // 4. Address & ICE
  const adrStr = settings.adresse || settings.adresseentreprise || settings.ville || 'Casablanca, Maroc';
  const iceStr = settings.ice ? `   |   ICE : ${settings.ice}` : '';
  const line4 = `Adresse : ${adrStr}${iceStr}`;
  doc.text(truncateTextToWidth(doc, line4, leftMaxWidth), 14, 29);

  // RIGHT DOCUMENT BADGE CARD (Cleanly framed and isolated at x=128..196)
  const cardX = 128;
  const cardY = 5.5;
  const cardW = 68;
  const cardH = 25.5;

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(51, 65, 85); // slate-700
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'S');

  // Title inside card
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(docTitle, cardX + 4, cardY + 6);

  // Subtitle / Period inside card
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(docSubTitle, cardX + 4, cardY + 11.5);

  // Reference Code
  doc.setFontSize(6.8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFont('helvetica', 'bold');
  doc.text(`Réf : ${docRef}`, cardX + 4, cardY + 17);

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Édité le : ${docDate}`, cardX + 4, cardY + 22);
}

/**
 * Helper to add standard running footers and page numbering to all pages
 */
function addDocumentPageFooters(doc: jsPDF, settings: AppSettings, customDocName = 'Document Officiel') {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const companyName = settings.nomentreprise || 'ClimTrack';

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Separator line above footer
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(14, 286, 196, 286);

    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`${companyName} • ${customDocName} • Document Confidentiel`, 14, 291);

    const pageText = `Page ${i} sur ${pageCount}`;
    doc.text(pageText, 196 - doc.getTextWidth(pageText), 291);
  }
}

/**
 * EXPORT: RAPPORT D'ACTIVITÉ & BILAN PÉRIODIQUE (PRO & ULTRA CLEAN)
 */
export function exportRapportPDF(
  rapport: RapportData,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateNow = new Date().toLocaleDateString('fr-FR');
  const refCode = `RAP-${rapport.dateDebut.replace(/-/g, '')}-${rapport.dateFin.replace(/-/g, '')}`;

  // 1. Top Executive Header
  drawCorporateHeader(
    doc,
    settings,
    "RAPPORT D'ACTIVITÉ & BILAN",
    `Du ${formatDate(rapport.dateDebut)} au ${formatDate(rapport.dateFin)}`,
    refCode,
    dateNow
  );

  let currentY = 44;

  // 2. Section: Indicateurs Clés de Performance (KPIs)
  doc.setFillColor(37, 99, 235); // Blue marker
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("1. SYNTHÈSE GLOBALE & INDICATEURS CLÉS (KPIs)", 20, currentY + 4);

  currentY += 8;

  // 6 KPI Scorecard Bento Boxes
  const cardWidth = 28.5;
  const cardHeight = 22;
  const gap = 2.2;
  const startX = 14;

  const totalFacture = (rapport.stats.totalEncaisse || 0) + (rapport.stats.soldeRestantTotal || 0);
  const tauxRecouvrement = totalFacture > 0
    ? Math.min(100, Math.round(((rapport.stats.totalEncaisse || 0) / totalFacture) * 100))
    : 100;

  const kpiList = [
    {
      title: 'CLIENTS',
      val: `${rapport.stats.totalClients}`,
      sub: 'Enregistrés',
      color: [79, 70, 229], // Indigo
    },
    {
      title: 'TECHNICIENS',
      val: `${rapport.stats.totalTechniciens}`,
      sub: 'Effectifs actifs',
      color: [15, 23, 42], // Slate
    },
    {
      title: 'CLIMATISEURS',
      val: `${rapport.stats.totalClimatiseursInstalles}`,
      sub: 'Unités posées',
      color: [37, 99, 235], // Blue
    },
    {
      title: 'INTERVENTIONS',
      val: `${rapport.stats.totalInterventions}`,
      sub: 'Chantiers & SAV',
      color: [217, 119, 6], // Amber
    },
    {
      title: 'TOTAL ENCAISSÉ',
      val: formatCurrency(rapport.stats.totalEncaisse, settings.devise),
      sub: `Taux : ${tauxRecouvrement}%`,
      color: [5, 150, 105], // Emerald
    },
    {
      title: 'SOLDE RESTANT',
      val: formatCurrency(rapport.stats.soldeRestantTotal, settings.devise),
      sub: 'À recouvrer',
      color: [220, 38, 38], // Red/Amber
    },
  ];

  kpiList.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + gap);

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');

    // Subtle border
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

    // Colored top accent line
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, currentY, cardWidth, 1.4, 0.8, 0.8, 'F');

    // Title
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.title, x + 2.5, currentY + 5.5);

    // Value (dynamically sized to fit)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    const maxValW = cardWidth - 5;
    let fontSize = 8.5;
    doc.setFontSize(fontSize);
    while (fontSize > 6.5 && doc.getTextWidth(kpi.val) > maxValW) {
      fontSize -= 0.5;
      doc.setFontSize(fontSize);
    }
    doc.text(kpi.val, x + 2.5, currentY + 12.5);

    // Subtitle
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(kpi.sub, x + 2.5, currentY + 18.5);
  });

  currentY += cardHeight + 4.5;

  // Financial recap bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(14, currentY, 182, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, 182, 10, 1.5, 1.5, 'S');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("BILAN FINANCIER PÉRIODE :", 18, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const finSummary = `Total Facturé : ${formatCurrency(totalFacture, settings.devise)}    |    Encaissé : ${formatCurrency(rapport.stats.totalEncaisse, settings.devise)} (${tauxRecouvrement}%)    |    Solde Restant : ${formatCurrency(rapport.stats.soldeRestantTotal, settings.devise)}`;
  doc.text(finSummary, 62, currentY + 6.5);

  currentY += 15;

  // 3. Section: Performance par Technicien
  doc.setFillColor(79, 70, 229); // Indigo marker
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("2. PERFORMANCE & RENDEMENT PAR TECHNICIEN", 20, currentY + 4);

  currentY += 7;

  // Techniciens Table
  const totalEncaisseAllTechs = rapport.parTechnicien.reduce((s, t) => s + (t.encaisse || 0), 0) || 1;
  const techRows = rapport.parTechnicien.map((t, index) => {
    const partCA = Math.round(((t.encaisse || 0) / totalEncaisseAllTechs) * 100);
    return [
      `#${index + 1}`,
      t.nom,
      t.matricule,
      `${t.clients}`,
      `${t.clims}`,
      `${t.interventions}`,
      formatCurrency(t.encaisse, settings.devise),
      `${partCA} %`,
    ];
  });

  const totalClientsTech = rapport.parTechnicien.reduce((s, t) => s + (t.clients || 0), 0);
  const totalClimsTech = rapport.parTechnicien.reduce((s, t) => s + (t.clims || 0), 0);
  const totalIntsTech = rapport.parTechnicien.reduce((s, t) => s + (t.interventions || 0), 0);
  const totalEncTech = rapport.parTechnicien.reduce((s, t) => s + (t.encaisse || 0), 0);

  const techFoot = [
    [
      '',
      'TOTAL GÉNÉRAL',
      '-',
      `${totalClientsTech}`,
      `${totalClimsTech}`,
      `${totalIntsTech}`,
      formatCurrency(totalEncTech, settings.devise),
      '100 %',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'Technicien', 'Matricule', 'Clients', 'Clims Posés', 'Interventions', 'Encaissé', 'Part CA']],
    body: techRows.length > 0 ? techRows : [['-', 'Aucun technicien', '-', '0', '0', '0', '0 DH', '0%']],
    foot: techFoot,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 42 },
      2: { fontStyle: 'normal', cellWidth: 24, textColor: [100, 116, 139] },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 22 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 26 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 45;

  // Check if we need a page break for Quartier section & Signatures
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // 4. Section: Répartition par Quartier
  doc.setFillColor(5, 150, 105); // Emerald marker
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("3. RÉPARTITION GÉOGRAPHIQUE & CHIFFRE D'AFFAIRES PAR QUARTIER", 20, currentY + 4);

  currentY += 7;

  const totalCAQuartiers = rapport.parQuartier.reduce((s, q) => s + (q.chiffreAffaires || 0), 0) || 1;
  const qRows = rapport.parQuartier.map((q, index) => {
    const partCA = Math.round(((q.chiffreAffaires || 0) / totalCAQuartiers) * 100);
    return [
      `#${index + 1}`,
      q.nom,
      `${q.clients}`,
      `${q.installations}`,
      formatCurrency(q.chiffreAffaires, settings.devise),
      `${partCA} %`,
    ];
  });

  const totalClientsQ = rapport.parQuartier.reduce((s, q) => s + (q.clients || 0), 0);
  const totalInstQ = rapport.parQuartier.reduce((s, q) => s + (q.installations || 0), 0);
  const totalCAQ = rapport.parQuartier.reduce((s, q) => s + (q.chiffreAffaires || 0), 0);

  const qFoot = [
    [
      '',
      'TOTAL PAR ZONES',
      `${totalClientsQ}`,
      `${totalInstQ}`,
      formatCurrency(totalCAQ, settings.devise),
      '100 %',
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'Quartier / Zone d\'Intervention', 'Clients Enregistrés', 'Clims Installés', 'Chiffre d\'Affaires', 'Part Marché']],
    body: qRows.length > 0 ? qRows : [['-', 'Aucune donnée géographique', '0', '0', '0 DH', '0%']],
    foot: qFoot,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 118, 110], // teal-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 62 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', fontStyle: 'bold', textColor: [5, 150, 105], cellWidth: 26 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 34 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : currentY + 45;

  // Add new page if not enough room for signatures
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Signatures & Official Validation Block
  doc.setFillColor(30, 41, 59); // Slate marker
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("4. VALIDATION DU BILAN & VISAS OFFICIELS", 20, currentY + 4);

  currentY += 8;

  const signBoxWidth = 88;
  const signBoxHeight = 32;

  // Box 1: Responsable Technique
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, signBoxWidth, signBoxHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, signBoxWidth, signBoxHeight, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Responsable Technique & Exploitation :", 18, currentY + 6.5);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Date : ____ / ____ / 2026", 18, currentY + 12);
  doc.text("Mention : Lu et approuvé", 18, currentY + 17);
  doc.text("Signature :", 18, currentY + 23);

  // Box 2: Direction Générale & Cachet
  const box2X = 14 + signBoxWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, currentY, signBoxWidth, signBoxHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(box2X, currentY, signBoxWidth, signBoxHeight, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Direction Générale & Cachet Entreprise :", box2X + 4, currentY + 6.5);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Date : ____ / ____ / 2026", box2X + 4, currentY + 12);
  doc.text("Mention : Certifié conforme aux opérations", box2X + 4, currentY + 17);
  doc.text("Cachet & Signature :", box2X + 4, currentY + 23);

  // Add standard footers & page numbers
  addDocumentPageFooters(doc, settings, "Rapport Périodique d'Activité");

  doc.save(`Rapport_Activite_${rapport.dateDebut}_${rapport.dateFin}.pdf`);
}

/**
 * EXPORT: FICHE DE SUIVI ET PERFORMANCE TECHNICIEN (PRO DESIGN)
 */
export function exportTechnicienPDF(
  stats: TechnicienStats,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const tech = stats.technicien;
  const dateNow = new Date().toLocaleDateString('fr-FR');
  const refCode = `TECH-${tech.matricule}`;

  // Header
  drawCorporateHeader(
    doc,
    settings,
    "FICHE TECHNICIEN & RENDEMENT",
    `${tech.prenom} ${tech.nom} (${tech.matricule})`,
    refCode,
    dateNow
  );

  let currentY = 44;

  // Technicien Identity Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${tech.prenom} ${tech.nom}`, 20, currentY + 6.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Matricule : ${tech.matricule}   |   Téléphone : ${tech.telephone || 'N/A'}   |   Zone d'affectation : ${tech.zone || 'Toutes zones'}`, 20, currentY + 12.5);
  doc.text(`Statut : ${tech.statut}   |   Quartiers couverts : ${stats.quartiersVisites.join(', ') || 'N/A'}`, 20, currentY + 17.5);

  currentY += 28;

  // KPIs
  const cardWidth = 43.5;
  const cardHeight = 18;
  const gap = 2.5;

  const kpis = [
    { label: 'CLIENTS VISITÉES', val: `${stats.totalClientsVisites}`, color: [79, 70, 229] },
    { label: 'CLIMS INSTALLÉS', val: `${stats.totalClimatiseursInstalles}`, color: [37, 99, 235] },
    { label: 'INTERVENTIONS', val: `${stats.totalInterventions}`, color: [217, 119, 6] },
    { label: 'TOTAL ENCAISSÉ', val: formatCurrency(stats.montantTotalEncaisse, settings.devise), color: [5, 150, 105] },
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (cardWidth + gap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFillColor(k.color[0], k.color[1], k.color[2]);
    doc.roundedRect(x, currentY, cardWidth, 1.2, 0.8, 0.8, 'F');

    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text(k.label, x + 3, currentY + 5.5);

    doc.setFontSize(8.5);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.val, x + 3, currentY + 12.5);
  });

  currentY += cardHeight + 8;

  // Table of installations
  doc.setFillColor(37, 99, 235);
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("HISTORIQUE DES CHANTIERS & INSTALLATIONS", 20, currentY + 4);

  currentY += 7;

  const tableData = stats.installations.map(inst => [
    formatDate(inst.dateinstallation),
    `${inst.clientnom || ''} (${inst.clientkinya || ''})`,
    inst.clienttelephone || '-',
    inst.clientquartier || '-',
    `${inst.marque} ${inst.puissance} (x${inst.quantite})`,
    inst.numerobon,
    formatCurrency(inst.prix, settings.devise),
    inst.statut,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Client', 'Téléphone', 'Quartier', 'Équipement', 'N° Bon', 'Montant', 'Statut']],
    body: tableData.length > 0 ? tableData : [['-', 'Aucune installation', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  addDocumentPageFooters(doc, settings, `Fiche Technicien - ${tech.nom}`);
  doc.save(`Fiche_Technicien_${tech.nom}_${tech.matricule}.pdf`);
}

/**
 * EXPORT: DOSSIER CLIENT & HISTORIQUE (PRO DESIGN)
 */
export function exportClientPDF(
  details: ClientFullDetails,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const c = details.client;
  const dateNow = new Date().toLocaleDateString('fr-FR');
  const refCode = `CLI-${c.id.slice(0, 6).toUpperCase()}`;

  drawCorporateHeader(
    doc,
    settings,
    "DOSSIER & HISTORIQUE CLIENT",
    `${c.nom} (${c.kinya})`,
    refCode,
    dateNow
  );

  let currentY = 44;

  // Client Details Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${c.nom} (${c.kinya})`, 20, currentY + 6.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Téléphone : ${c.telephone}   |   Quartier : ${c.quartiernom}   |   Adresse : ${c.adresse || 'N/A'}`, 20, currentY + 12);
  doc.text(`N° de Bon : ${c.numerobon || 'N/A'}   |   N° Contrat : ${c.numerocontrat || 'N/A'}   |   Technicien référent : ${c.techniciennom || 'N/A'}`, 20, currentY + 17);

  // Financial Recap Strip inside client card
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Total Facturé : ${formatCurrency(details.totalFacture, settings.devise)}   |   Total Payé : ${formatCurrency(details.totalPaye, settings.devise)}   |   Solde Restant : ${formatCurrency(details.soldeRestant, settings.devise)}`,
    20,
    currentY + 22.5
  );

  currentY += 32;

  // Installations Table
  doc.setFillColor(37, 99, 235);
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("INSTALLATIONS & ÉQUIPEMENTS", 20, currentY + 4);

  currentY += 7;

  const instData = details.installations.map(i => [
    formatDate(i.dateinstallation),
    `${i.marque} ${i.puissance}`,
    `${i.quantite}`,
    i.numerobon,
    i.numerocontrat,
    formatCurrency(i.prix, settings.devise),
    i.statut,
    i.techniciennom || '-',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Climatiseur', 'Qté', 'N° Bon', 'N° Contrat', 'Prix', 'Statut', 'Technicien']],
    body: instData.length > 0 ? instData : [['-', 'Aucune installation', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : currentY + 35;

  // Payments Table
  doc.setFillColor(5, 150, 105);
  doc.rect(14, currentY, 3, 5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("HISTORIQUE DES PAIEMENTS & ENCAISSEMENTS", 20, currentY + 4);

  currentY += 7;

  const payData = details.paiements.map(p => [
    formatDate(p.date),
    p.numerobon || '-',
    formatCurrency(p.montant, settings.devise),
    p.modepaiement,
    p.techniciennom || '-',
    p.observation || '-',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'N° Bon', 'Montant', 'Mode', 'Encaissé par', 'Observation']],
    body: payData.length > 0 ? payData : [['-', '-', '0 DH', '-', '-', 'Aucun règlement']],
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 7.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  addDocumentPageFooters(doc, settings, `Dossier Client - ${c.nom}`);
  doc.save(`Fiche_Client_${c.nom}_${c.telephone}.pdf`);
}

/**
 * EXPORT: BON D'INSTALLATION & DE CONTRAT OFFICIEL (PRO DESIGN)
 */
export function exportInstallationBonPDF(
  inst: Installation,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateNow = formatDate(inst.dateinstallation);
  const refCode = `${inst.numerobon}`;

  drawCorporateHeader(
    doc,
    settings,
    "BON D'INSTALLATION & CONTRAT",
    `Réf Bon : ${inst.numerobon}`,
    refCode,
    dateNow
  );

  let currentY = 44;

  // 2 Side by side boxes for Client & Technician
  const boxWidth = 88;
  const boxHeight = 34;

  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 2, 2, 'S');
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(14, currentY, boxWidth, 1.2, 0.8, 0.8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("CLIENT BÉNÉFICIAIRE", 18, currentY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Nom : ${inst.clientnom || ''} (${inst.clientkinya || ''})`, 18, currentY + 12);
  doc.text(`Téléphone : ${inst.clienttelephone || '-'}`, 18, currentY + 17.5);
  doc.text(`Quartier : ${inst.clientquartier || '-'}`, 18, currentY + 23);
  doc.text(`N° de Contrat : ${inst.numerocontrat}`, 18, currentY + 28.5);

  // Tech Box
  const box2X = 14 + boxWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 2, 2, 'S');
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(box2X, currentY, boxWidth, 1.2, 0.8, 0.8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("TECHNICIEN & INTERVENTION", box2X + 4, currentY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Nom : ${inst.techniciennom || '-'}`, box2X + 4, currentY + 12);
  doc.text(`Matricule : ${inst.technicienmatricule || '-'}`, box2X + 4, currentY + 17.5);
  doc.text(`Statut Chantier : ${inst.statut}`, box2X + 4, currentY + 23);
  doc.text(`Date Pose : ${formatDate(inst.dateinstallation)}`, box2X + 4, currentY + 28.5);

  currentY += boxHeight + 7;

  // Equipment table
  autoTable(doc, {
    startY: currentY,
    head: [['Équipement / Climatiseur', 'Type', 'Puissance', 'Qté', 'Prix Convenu', 'Acompte Payé', 'Solde Restant']],
    body: [
      [
        `${inst.marque} ${inst.modele || ''}`,
        inst.typeclimatiseur,
        inst.puissance,
        `${inst.quantite}`,
        formatCurrency(inst.prix, settings.devise),
        formatCurrency(inst.montantpaye || 0, settings.devise),
        formatCurrency(Math.max(0, (inst.prix || 0) - (inst.montantpaye || 0)), settings.devise),
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 28;

  // Task & Observations
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Travaux réalisés & Détails de l'intervention :", 18, currentY + 6.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(inst.tacherealisee || 'Pose de l\'unité intérieure/extérieure, raccordement frigorifique, tirage au vide et mise en service.', 18, currentY + 13);

  if (inst.prixtachesuppl) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Montant Travaux Suppl : ${formatCurrency(inst.prixtachesuppl, settings.devise)}`, 18, currentY + 19);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  }

  if (inst.observation) {
    const yOffset = inst.prixtachesuppl ? 24 : 19.5;
    doc.text(`Observation : ${inst.observation}`, 18, currentY + yOffset);
  }

  currentY += 34;

  // Signatures
  const signWidth = 88;
  const signHeight = 30;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, signWidth, signHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, signWidth, signHeight, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Visa & Signature du Technicien :", 18, currentY + 6);

  const sign2X = 14 + signWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(sign2X, currentY, signWidth, signHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(sign2X, currentY, signWidth, signHeight, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Bon pour Accord & Signature du Client :", sign2X + 4, currentY + 6);

  addDocumentPageFooters(doc, settings, `Bon d'Installation ${inst.numerobon}`);
  doc.save(`Bon_Installation_${inst.numerobon}.pdf`);
}

/**
 * EXPORT: REÇU DE PAIEMENT OFFICIEL (PRO DESIGN)
 */
export function exportPaiementRecuPDF(
  p: Paiement,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateNow = formatDate(p.date);
  const refCode = `REC-${p.numerobon || p.id.slice(0, 6).toUpperCase()}`;

  drawCorporateHeader(
    doc,
    settings,
    "REÇU DE RÈGLEMENT OFFICIEL",
    `Reçu N° ${refCode}`,
    refCode,
    dateNow
  );

  let currentY = 46;

  // Main Receipt Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 60, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 60, 2, 2, 'S');
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(14, currentY, 182, 1.4, 0.8, 0.8, 'F');

  // Amount Highlight
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`MONTANT ENCAISSÉ : ${formatCurrency(p.montant, settings.devise)}`, 22, currentY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Reçu de (Client) : ${p.clientnom || '-'}`, 22, currentY + 21);
  doc.text(`Mode de Règlement : ${p.modepaiement}`, 22, currentY + 28);
  doc.text(`N° de Bon associé : ${p.numerobon || 'N/A'}`, 22, currentY + 35);
  doc.text(`Encaissé par (Technicien) : ${p.techniciennom || '-'}`, 22, currentY + 42);
  if (p.observation) {
    doc.text(`Référence / Observation : ${p.observation}`, 22, currentY + 49);
  }

  currentY += 68;

  // Stamp Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(110, currentY, 86, 30, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(110, currentY, 86, 30, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Cachet & Signature Entreprise :", 114, currentY + 6.5);

  addDocumentPageFooters(doc, settings, `Reçu de Règlement ${refCode}`);
  doc.save(`Recu_Paiement_${p.numerobon || p.id}.pdf`);
}
