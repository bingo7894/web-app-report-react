// ═══════════════════════════════════════════════════════════════════
//  pdf.js — PDF Generation via Browser Native Print
//  Uses window.print() for perfect Thai text rendering
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate PDF using the browser's native print dialog.
 * 
 * Why not html2pdf.js?
 *   html2pdf uses html2canvas internally, which renders text
 *   character-by-character — this destroys Thai glyph composition
 *   and produces garbled/unreadable text. window.print() uses the
 *   browser's native text engine = perfect Thai rendering.
 * 
 * The @media print CSS in style.css handles:
 *   - Hiding all UI except #reportPrintView
 *   - Fitting content to a single A4 page
 *   - Proper font sizing and spacing
 * 
 * @returns {Promise<{ pdfBase64: string|null, filename: string|null }>}
 */
export async function generatePDF() {
    // Ensure all web fonts are loaded before printing
    await document.fonts.ready;

    // Small delay for browser to finish any pending paints
    await new Promise(r => setTimeout(r, 200));

    // Open the browser print dialog
    // User can choose "Save as PDF" in the print destination
    window.print();

    // window.print() does not produce a base64 string — 
    // the PDF is handled entirely by the browser/OS
    return { pdfBase64: null, filename: null };
}
