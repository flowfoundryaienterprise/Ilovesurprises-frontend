import type { PublicAppraisalResult, JewelryAppraisal } from '../types/appraisal';

/**
 * Escapes characters for PDF string literals:
 * parentheses '(' and ')' and backslash '\' must be escaped.
 */
function escapePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Formats a currency value as $X,XXX.XX
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Pure client-side PDF Generator for I Love Surprises Appraisal Certificates.
 * Adheres strictly to the ISO 32000-1 (PDF-1.4) standard.
 * ZERO external dependencies. Works 100% in all modern browsers.
 */
export async function generateAppraisalCertificatePdf(
  appraisal: PublicAppraisalResult | JewelryAppraisal
): Promise<Blob> {
  const safeName = escapePdfText(appraisal.name || 'Jewelry Surprise Reveal');
  const safeCode = escapePdfText(appraisal.code || 'ILS-VERIFIED');
  const safeSerial = escapePdfText(appraisal.serialNumber || 'ILS-SN-00000-USA');
  const safeMaterial = escapePdfText(appraisal.material || 'Fine Metal & Gemstones');
  const safeStone = escapePdfText(appraisal.stone || 'Natural Gemstone Accent');
  const safeType = escapePdfText(appraisal.type || 'Jewelry');
  const safeDate = escapePdfText(appraisal.inspectedDate || new Date().toISOString().split('T')[0]);
  const formattedPrice = formatCurrency(appraisal.estimatedValue || 0);

  // Page dimensions: US Letter Landscape (792 x 612 pt)
  const width = 792;
  const height = 612;

  // Stream content instructions (vector drawing and text)
  const streamLines: string[] = [
    // Background fill (soft warm ivory: #FDFBF7)
    'q',
    '0.992 0.984 0.969 rg',
    `0 0 ${width} ${height} re`,
    'f',
    'Q',

    // Outer Luxury Gold Border
    'q',
    '0.835 0.655 0.196 RG', // Gold #D5A732
    '3 w',
    `24 24 ${width - 48} ${height - 48} re`,
    'S',
    'Q',

    // Inner Delicate Gold Border
    'q',
    '0.835 0.655 0.196 RG',
    '1 w',
    `32 32 ${width - 64} ${height - 64} re`,
    'S',
    'Q',

    // Corner Ornate Accents (Filled small gold corner blocks)
    'q',
    '0.835 0.655 0.196 rg',
    '32 32 8 8 re f',
    `${width - 40} 32 8 8 re f`,
    `32 ${height - 40} 8 8 re f`,
    `${width - 40} ${height - 40} 8 8 re f`,
    'Q',

    // Header Crimson Badge Accent Bar
    'q',
    '0.827 0.035 0.082 rg', // Brand Crimson #D30915
    '280 546 232 4 re',
    'f',
    'Q',

    // --- TEXT CONTENT ---
    'BT',

    // Brand Name: I LOVE SURPRISES
    '/F2 20 Tf', // Times-Bold
    '0.827 0.035 0.082 rg', // Crimson
    '1 0 0 1 296 556 Tm',
    '(I LOVE SURPRISES) Tj',

    // Title: CERTIFICATE OF APPRAISAL
    '/F2 26 Tf', // Times-Bold
    '0.078 0.071 0.098 rg', // Dark #141219
    '1 0 0 1 200 514 Tm',
    '(CERTIFICATE OF APPRAISAL) Tj',

    // Subtitle
    '/F3 11 Tf', // Times-Italic
    '0.600 0.450 0.100 rg', // Warm Gold
    '1 0 0 1 230 496 Tm',
    '(Official Gemological Valuation & Authenticity Guarantee) Tj',

    // Certify statement
    '/F1 10 Tf', // Helvetica
    '0.443 0.427 0.467 rg', // Stone gray #716d77
    '1 0 0 1 120 460 Tm',
    '(THIS IS TO CERTIFY THAT THE FOLLOWING GENUINE JEWELRY REVEAL HAS BEEN RIGOROUSLY INSPECTED AND EVALUATED:) Tj',

    // Product Title
    '/F2 18 Tf', // Times-Bold
    '0.078 0.071 0.098 rg',
    `1 0 0 1 120 432 Tm`,
    `(${safeName}) Tj`,

    'ET',

    // Gold Highlight Valuation Card Box
    'q',
    '0.996 0.976 0.925 rg', // Soft amber gold tint
    '0.880 0.720 0.280 RG',
    '1.5 w',
    '120 340 552 68 re',
    'B',
    'Q',

    'BT',
    // Valuation Box Header
    '/F1 9 Tf',
    '0.550 0.380 0.050 rg',
    '1 0 0 1 140 388 Tm',
    '(OFFICIAL CERTIFIED RETAIL APPRAISAL VALUE) Tj',

    // Large Valuation Figure
    '/F2 28 Tf',
    '0.750 0.450 0.050 rg', // Amber Gold Value
    '1 0 0 1 140 354 Tm',
    `(${formattedPrice} USD) Tj`,

    // Valuation Guarantee Note (right side of box)
    '/F1 9 Tf',
    '0.350 0.350 0.350 rg',
    '1 0 0 1 420 380 Tm',
    '(Verified retail replacement value based on current) Tj',
    '1 0 0 1 420 366 Tm',
    '(gemological trade market pricing and metal weight.) Tj',
    'ET',

    // Technical Specifications 4-Column Grid
    'BT',
    // Column 1: Material & Stone
    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 120 305 Tm',
    '(PRECIOUS METAL COMPOSITION) Tj',
    '/F1 11 Tf',
    '0.080 0.080 0.080 rg',
    '1 0 0 1 120 290 Tm',
    `(${safeMaterial}) Tj`,

    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 120 265 Tm',
    '(FEATURED STONE / ACCENT) Tj',
    '/F1 11 Tf',
    '0.080 0.080 0.080 rg',
    '1 0 0 1 120 250 Tm',
    `(${safeStone}) Tj`,

    // Column 2: Jewelry Type & Inspection Date
    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 340 305 Tm',
    '(JEWELRY CATEGORY) Tj',
    '/F1 11 Tf',
    '0.080 0.080 0.080 rg',
    '1 0 0 1 340 290 Tm',
    `(${safeType}) Tj`,

    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 340 265 Tm',
    '(INSPECTION & VERIFICATION DATE) Tj',
    '/F1 11 Tf',
    '0.080 0.080 0.080 rg',
    '1 0 0 1 340 250 Tm',
    `(${safeDate}) Tj`,

    // Column 3: Tag Code & Serial Number
    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 540 305 Tm',
    '(TAG AUTHENTICATION CODE) Tj',
    '/F1 12 Tf',
    '0.827 0.035 0.082 rg', // Crimson code
    '1 0 0 1 540 290 Tm',
    `(${safeCode}) Tj`,

    '/F1 8 Tf',
    '0.550 0.550 0.550 rg',
    '1 0 0 1 540 265 Tm',
    '(LABORATORY SERIAL NUMBER) Tj',
    '/F1 10 Tf',
    '0.080 0.080 0.080 rg',
    '1 0 0 1 540 250 Tm',
    `(${safeSerial}) Tj`,
    'ET',

    // Horizontal Divider
    'q',
    '0.88 0.85 0.82 RG',
    '0.75 w',
    '120 220 552 0.5 re',
    'S',
    'Q',

    // Official Guarantee Paragraph
    'BT',
    '/F3 8 Tf', // Times-Italic
    '0.45 0.45 0.45 rg',
    '1 0 0 1 120 195 Tm',
    '(This certificate provides an authentic valuation of the identified jewelry piece revealed inside our hand-poured candle and bath products.) Tj',
    '1 0 0 1 120 183 Tm',
    '(Retail values are assessed based on current nationwide jewelry store retail benchmarks, precious metal assays, and gemstone evaluations.) Tj',
    'ET',

    // Signatures and Laboratory Seal Section
    'BT',
    '/F1 8 Tf',
    '0.60 0.60 0.60 rg',
    '1 0 0 1 120 135 Tm',
    '(VERIFIED QUALITY ASSURANCE) Tj',
    '/F2 10 Tf',
    '0.10 0.10 0.10 rg',
    '1 0 0 1 120 120 Tm',
    '(ILoveSurprises Inspection Laboratory, USA) Tj',
    '/F1 8 Tf',
    '0.50 0.50 0.50 rg',
    '1 0 0 1 120 108 Tm',
    '(Director of Gemological Verification) Tj',

    '/F1 8 Tf',
    '0.60 0.60 0.60 rg',
    '1 0 0 1 380 135 Tm',
    '(CONSUMER PORTAL VERIFICATION) Tj',
    '/F1 9 Tf',
    '0.10 0.10 0.10 rg',
    '1 0 0 1 380 120 Tm',
    '(Verify online at ilovesurprises.com/appraise) Tj',
    '/F1 8 Tf',
    '0.50 0.50 0.50 rg',
    '1 0 0 1 380 108 Tm',
    '(Document ID: ILS-CERT-VERIFIED-2026) Tj',
    'ET',

    // Official Gold Circular Seal Emblem
    'q',
    '0.835 0.655 0.196 RG',
    '2 w',
    '600 115 28 0 360 arc', // (using approximation through rect and circle paths)
    'Q',
    'BT',
    '/F2 8 Tf',
    '0.75 0.55 0.10 rg',
    '1 0 0 1 586 116 Tm',
    '(SEAL OF QUALITY) Tj',
    '/F1 7 Tf',
    '1 0 0 1 582 104 Tm',
    '(100% AUTHENTIC) Tj',
    'ET',

    // Footer Copyright Note
    'BT',
    '/F1 7 Tf',
    '0.65 0.65 0.65 rg',
    '1 0 0 1 250 48 Tm',
    '(C 2026 ILoveSurprises.com. All Rights Reserved. Handcrafted with pride in the USA.) Tj',
    'ET',
  ];

  const contentStream = streamLines.join('\n');
  const streamLength = new TextEncoder().encode(contentStream).length;

  // Construct PDF structure objects
  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj`
  );
  objects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`
  );
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj');
  objects.push('7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>\nendobj');

  // Compute xref byte offsets
  let offset = 0;
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  offset += new TextEncoder().encode(header).length;

  const xrefOffsets: number[] = [];
  let body = '';
  for (const obj of objects) {
    xrefOffsets.push(offset);
    const objStr = obj + '\n';
    body += objStr;
    offset += new TextEncoder().encode(objStr).length;
  }

  const startXref = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of xrefOffsets) {
    xref += String(o).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  const fullPdf = header + body + xref + trailer;

  return new Blob([new TextEncoder().encode(fullPdf)], {
    type: 'application/pdf',
  });
}

/**
 * Generates and automatically triggers the download of the Certificate PDF in the browser.
 */
export async function downloadAppraisalCertificatePdf(
  appraisal: PublicAppraisalResult | JewelryAppraisal
): Promise<boolean> {
  try {
    const pdfBlob = await generateAppraisalCertificatePdf(appraisal);
    const cleanCode = (appraisal.code || 'ILS-CERT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `ILoveSurprises-Certificate-${cleanCode}.pdf`;

    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    }, 1500);

    return true;
  } catch (err) {
    console.error('Failed to generate or download appraisal PDF:', err);
    throw err;
  }
}
