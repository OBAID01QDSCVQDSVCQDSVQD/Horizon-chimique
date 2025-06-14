import { PDFDocument, rgb, PDFPage, StandardFonts, PDFImage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    console.log('Début de la génération du PDF');
    
    const pdfDoc = await PDFDocument.create();

    // Load fonts (once per request)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Load and embed logo (once per request)
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo HC light mode.png');
    console.log('Chemin du logo:', logoPath);
    if (!fs.existsSync(logoPath)) {
      throw new Error('Logo file not found at: ' + logoPath);
    }
    const logoBytes = await fs.promises.readFile(logoPath);
    console.log('Taille du fichier logo:', logoBytes.length, 'bytes');
    const logoImage = await pdfDoc.embedPng(logoBytes);

    const HEADER_HEIGHT = 200; // Define header height
    // Calculate logo dimensions to fit within header while maintaining aspect ratio
    const logoDesiredHeight = HEADER_HEIGHT * 0.8; // e.g., 80% of header height
    const logoDesiredWidth = (logoImage.width * logoDesiredHeight) / logoImage.height;

    // Function to draw the header on a given page
    const drawHeader = (
      currentPage: PDFPage,
      embeddedLogo: PDFImage,
      logoWidth: number,
      logoHeight: number,
      boldTxtFont: PDFFont,
      normalTxtFont: PDFFont
    ) => {
      // Header background rectangle (Dark Red)
      currentPage.drawRectangle({
        x: 0,
        y: currentPage.getHeight() - HEADER_HEIGHT,
        width: currentPage.getWidth(),
        height: HEADER_HEIGHT,
        color: rgb(0.6, 0, 0), // Dark Red color
      });

      const logoPaddingLeft = 30; // Padding from left edge of header
      // Vertically center logo in header
      const logoY = currentPage.getHeight() - HEADER_HEIGHT + (HEADER_HEIGHT - logoHeight) / 2;

      // Draw Logo
      currentPage.drawImage(embeddedLogo, {
        x: logoPaddingLeft,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });

      // Vertical line separator
      const lineX = logoPaddingLeft + logoWidth + 20; // 20px to the right of logo
      const lineTopY = currentPage.getHeight() - HEADER_HEIGHT * 0.2; // 20% from top of header
      const lineBottomY = currentPage.getHeight() - HEADER_HEIGHT * 0.8; // 80% from top of header
      currentPage.drawLine({
        start: { x: lineX, y: lineBottomY },
        end: { x: lineX, y: lineTopY },
        thickness: 1,
        color: rgb(1, 1, 1), // White line
      });

      // Text positioning
      const textX = lineX + 20; // 20px to the right of the line
      const titleFontSize = 24;
      const subtitleFontSize = 12;

      // Adjust vertical positions for text within header
      const titleY = currentPage.getHeight() - HEADER_HEIGHT + 55; // Approximate position for title
      const subtitleY = currentPage.getHeight() - HEADER_HEIGHT + 30; // Approximate position for subtitle

      // Draw Main Title
      currentPage.drawText('HORIETANCHE', {
        x: textX,
        y: titleY,
        font: boldTxtFont,
        size: titleFontSize,
        color: rgb(1, 1, 1), // White
      });

      // Draw Subtitle
      currentPage.drawText('With our flexible and scalable Volumes, you can add SSDaa', {
        x: textX,
        y: subtitleY,
        font: normalTxtFont,
        size: subtitleFontSize,
        color: rgb(1, 0, 0), // Changed to Red
      });
    };

    // Add the first page and draw header
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    drawHeader(page, logoImage, logoDesiredWidth, logoDesiredHeight, boldFont, normalFont);

    // TODO: If you add more pages later, make sure to call drawHeader for each new page.
    // Example:
    // const newPage = pdfDoc.addPage();
    // drawHeader(newPage, logoImage, logoDesiredWidth, logoDesiredHeight, boldFont, normalFont);

    const pdfBytes = await pdfDoc.save();
    console.log('PDF généré بنجاح, الحجم:', pdfBytes.length, 'بايت');
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalog-${id}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return new NextResponse('Error generating PDF: ' + (error as Error).message, { status: 500 });
  }
} 