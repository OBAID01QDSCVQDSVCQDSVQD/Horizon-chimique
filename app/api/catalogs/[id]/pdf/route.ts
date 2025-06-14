import { PDFDocument, rgb, PDFPage, StandardFonts, PDFImage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authConfig from '@/auth.config';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/models/Catalogue';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ألوان الديزاين
const DARK_BLUE = rgb(0.07, 0.18, 0.32);
const LIGHT_BLUE = rgb(0.55, 0.80, 1);
const GRIS = rgb(0.93, 0.95, 0.97);
const WHITE = rgb(1, 1, 1);

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    console.log('Début de la génération du PDF');
    
    // التحقق من الجلسة
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // الاتصال بقاعدة البيانات وجلب بيانات الكتالوج
    await connectDB();
    const catalogue = await Catalogue.findById(id);
    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }
    
    // إعداد PDF
    const pdfDoc = await PDFDocument.create();
    const pageWidth = 595;  // A4 portrait
    const pageHeight = 842;
    const marginTop = 40;
    const marginBottom = 40;
    let y = pageHeight - marginTop;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- الهيدر ---
    page.drawRectangle({ x: 0, y: pageHeight - 120, width: pageWidth, height: 120, color: DARK_BLUE });
    try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo HC light mode.png');
      const logoBytes = await fs.promises.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, { x: 30, y: pageHeight - 100, width: 90, height: 60 });
    } catch (e) { /* تجاهل إذا لم يوجد شعار */ }
    page.drawText((catalogue.title || '').toUpperCase(), {
      x: 140,
      y: pageHeight - 60,
      size: 32,
      font,
      color: WHITE,
    });

    // عرض الشورت ديسكريبشن مع دعم الرجوع للسطر
    const shortDescLines = wrapText(catalogue.shortdesc || '', font, 15, pageWidth - 170);
    let shortDescY = pageHeight - 90;
    for (const line of shortDescLines) {
      page.drawText(line, {
        x: 140,
        y: shortDescY,
        size: 15,
        font,
        color: WHITE,
      });
      shortDescY -= 20; // المسافة بين السطور
    }
    y = shortDescY - 20; // تحديث موقع y لبدء الأقسام

    // --- الأقسام ---
    const sections = [
      { label: 'INFORMATION', value: catalogue.description },
      { label: "DOMAINES D'APPLICATIONS", value: catalogue.domaine },
      { label: 'CARACTÉRISTIQUES AVANTAGES', value: catalogue.proprietes },
      { label: 'PRÉPARATION DU SUPPORT', value: catalogue.preparation },
      { label: "CONDITIONS D'APPLICATION", value: catalogue.conditions },
      { label: 'APPLICATION', value: catalogue.application },
      { label: 'CONSOMMATION', value: catalogue.consommation },
      { label: 'NETTOYAGE', value: catalogue.nettoyage },
      { label: 'STOCKAGE ET CONDITIONNEMENT', value: catalogue.stockage },
      { label: 'CONSIGNES DE SÉCURITÉ', value: catalogue.consignes },
    ];

    let isBlue = true;
    for (const section of sections) {
      // إذا كان الحقل فارغًا أو نص فارغ، تجاهل هذا القسم
      if (!section.value || !String(section.value).trim()) continue;
      // إعداد العنوان (كل كلمة في سطر)
      const labelLines = section.label.split(' ');
      const labelLineHeight = 13;
      const labelBlockHeight = labelLines.length * labelLineHeight + 8;

      // إعداد الوصف
      const descFontSize = 11; // حجم خط الوصف الجديد
      const labelBoxWidth = 170;
      const padding = 20;
      const maxDescWidth = pageWidth - labelBoxWidth - 2 * padding;

      const lines = wrapText(section.value ? String(section.value) : '', font, descFontSize, maxDescWidth);
      const lineHeight = 15;
      const contentHeight = Math.max(labelBlockHeight, lines.length * lineHeight + 10);

      // إذا لم يتبق مساحة كافية، أضف صفحة جديدة
      if (y - contentHeight < marginBottom) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
      }

      // رسم خلفية العنوان
      page.drawRectangle({
        x: 0,
        y: y - contentHeight,
        width: labelBoxWidth,
        height: contentHeight,
        color: isBlue ? LIGHT_BLUE : DARK_BLUE,
      });
      // رسم خلفية الوصف
      page.drawRectangle({
        x: labelBoxWidth,
        y: y - contentHeight,
        width: pageWidth - labelBoxWidth,
        height: contentHeight,
        color: isBlue ? LIGHT_BLUE : GRIS,
      });

      // نص العنوان (كل كلمة في سطر، محاذاة يمين داخل مستطيل العنوان فقط)
      let labelY = y - 16;
      for (const word of labelLines) {
        const wordWidth = fontBold.widthOfTextAtSize(word, 11);
        page.drawText(word, {
          x: labelBoxWidth - 6 - wordWidth,
          y: labelY,
          size: 11,
          font: fontBold,
          color: isBlue ? DARK_BLUE : WHITE,
        });
        labelY -= labelLineHeight;
      }

      // نص الوصف (سطر سطر، محاذاة يمين داخل مستطيل الوصف فقط)
      let lineY = y - 16;
      for (const line of lines) {
        page.drawText(line, {
          x: labelBoxWidth + padding,
          y: lineY,
          size: descFontSize,
          font,
          color: isBlue ? DARK_BLUE : rgb(0.2,0.2,0.2),
        });
        lineY -= lineHeight;
      }

      y -= contentHeight;
      isBlue = !isBlue;
    }

    const pdfBytes = await pdfDoc.save();
    console.log('PDF généré بنجاح, الحجم:', pdfBytes.length, 'بايت');
    
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalog-${catalogue.title}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return new NextResponse('Error generating PDF: ' + (error as Error).message, { status: 500 });
  }
}

// Helper function to wrap text
function wrapText(text: string, font: any, fontSize: number, maxWidth: number) {
  if (!text) return [''];
  
  // إزالة الأحرف التي لا يدعمها ترميز WinAnsi (مثل علامة الصح)
  let sanitizedText = text.replace(/[^\x00-\x7F]/g, ' '); // إزالة الأحرف غير ASCII

  // إزالة جميع علامات HTML لضمان عرض النص العادي فقط
  sanitizedText = sanitizedText.replace(/<[^>]*>/g, '');

  const paragraphs = sanitizedText.split('\n');
  let lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push(''); // سطر فارغ بين الفقرات
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize
          ? font.widthOfTextAtSize(testLine, fontSize)
          : font.sizeAtHeight
            ? font.sizeAtHeight(fontSize) * testLine.length * 0.5
            : testLine.length * fontSize * 0.5;
      } catch {
        width = testLine.length * fontSize * 0.5;
      }
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
} 