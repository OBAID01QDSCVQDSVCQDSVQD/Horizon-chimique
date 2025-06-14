import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authConfig from '@/auth.config';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/models/Catalogue';
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFImage, PDFFont } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// الألوان
const DARK_BLUE = rgb(0.07, 0.18, 0.32); // اللون الأزرق الداكن الأصلي
const DARK_RED = rgb(0.5, 0.0, 0.0); // اللون الأحمر الغامق الجديد للهيدر
const LIGHT_RED = rgb(0.6, 0.1, 0.1); // لون أحمر أفتح قليلا للتدرج
const LIGHT_BLUE = rgb(0.55, 0.80, 1);
const GRIS = rgb(0.93, 0.95, 0.97);
const WHITE = rgb(1, 1, 1);

const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
  if (!text) return [''];

  // إزالة الأحرف التي لا يدعمها ترميز WinAnsi
  let sanitizedText = text.replace(/[^\x00-\x7F]/g, ' ');

  // معالجة العناوين
  sanitizedText = sanitizedText.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '$1\n');
  sanitizedText = sanitizedText.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '$1\n');
  sanitizedText = sanitizedText.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '$1\n');

  // معالجة القوائم
  sanitizedText = sanitizedText.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
  });
  sanitizedText = sanitizedText.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
  });

  // إزالة باقي علامات HTML
  sanitizedText = sanitizedText.replace(/<[^>]*>/g, '');
  
  // معالجة الكيانات HTML
  sanitizedText = sanitizedText.replace(/&nbsp;/g, ' ');
  sanitizedText = sanitizedText.replace(/&amp;/g, '&');
  sanitizedText = sanitizedText.replace(/&lt;/g, '<');
  sanitizedText = sanitizedText.replace(/&gt;/g, '>');
  sanitizedText = sanitizedText.replace(/&quot;/g, '"');
  
  const lines: string[] = [];
  const paragraphs = sanitizedText.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectDB();
    const catalogue = await Catalogue.findById(id);
    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const pageWidth = 595;  // A4 portrait
    const pageHeight = 842; // A4 height
    const margins = { left: 40, right: 40, top: 40, bottom: 40 }; // تعريف الهوامش
    const footerHeight = 40; // ارتفاع الفوتر الجديد (أصغر) - تم تعريفه هنا ليصبح متاحًا عالميًا
    const paddingAfterHeader = 40; // إضافة padding بعد الهيدر

    // دالة لرسم الهيدر
    const drawHeader = async (page: PDFPage, pdfDoc: PDFDocument, catalogue: any, font: PDFFont, fontBold: PDFFont, pageWidth: number, pageHeight: number, headerHeight: number) => {
      // رسم الخلفية المتدرجة
      const numSteps = 50; // عدد الخطوات للتدرج
      for (let i = 0; i < numSteps; i++) {
        const ratio = i / (numSteps - 1);
        const interpolatedColor = rgb(
          DARK_RED.red * (1 - ratio) + LIGHT_RED.red * ratio,
          DARK_RED.green * (1 - ratio) + LIGHT_RED.green * ratio,
          DARK_RED.blue * (1 - ratio) + LIGHT_RED.blue * ratio
        );
        page.drawRectangle({
          x: 0,
          y: pageHeight - headerHeight + (headerHeight / numSteps) * i,
          width: pageWidth,
          height: headerHeight / numSteps,
          color: interpolatedColor,
        });
      }

      // إضافة خط فاصل أبيض في الأسفل
      page.drawLine({
        start: { x: 0, y: pageHeight - headerHeight },
        end: { x: pageWidth, y: pageHeight - headerHeight },
        thickness: 2,
        color: WHITE,
      });

      try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo HC light mode.png');
        const logoBytes = await fs.readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);
        
        const originalWidth = logoImage.width;
        const originalHeight = logoImage.height;
        
        const maxHeight = 60; // أقصى ارتفاع للوجو
        const scale = maxHeight / originalHeight;
        const scaledWidth = originalWidth * scale;
        
        const logoX = 30;
        const headerContentTopMargin = 20; // الهامش من أعلى مستطيل الهيدر

        // حساب إحداثي Y السفلي للوجو
        const logoYForDrawImage = pageHeight - headerContentTopMargin - maxHeight;

        page.drawImage(logoImage, { 
          x: logoX, 
          y: logoYForDrawImage, 
          width: scaledWidth,
          height: maxHeight
        });

        const textHorizontalPadding = 20; // المسافة بين اللوجو والنص
        const textStartX = logoX + scaledWidth + textHorizontalPadding;

        const titleFontSize = 32;
        // حساب إحداثي Y الأساسي لعنوان الكتالوج، مع محاذاة الجزء العلوي منه مع الجزء العلوي للوجو
        const titleYBaseline = pageHeight - headerContentTopMargin - titleFontSize;
        
        page.drawText((catalogue.title || '').toUpperCase(), {
          x: textStartX,
          y: titleYBaseline,
          size: titleFontSize,
          font: fontBold, // استخدام الخط العريض هنا
          color: WHITE,
        });

        const shortDescFontSize = 15;
        const gapBetweenTitleAndShortDesc = 10;

        // حساب إحداثي Y الأساسي لأول سطر من الوصف المختصر
        let shortDescCurrentY = titleYBaseline - titleFontSize - gapBetweenTitleAndShortDesc;
        
        const availableTextWidth = pageWidth - textStartX - margins.right;
        const shortDescLinesAdjusted = wrapText(catalogue.shortdesc || '', font, shortDescFontSize, availableTextWidth);
        
        for (const line of shortDescLinesAdjusted) {
          page.drawText(line, {
            x: textStartX,
            y: shortDescCurrentY,
            size: shortDescFontSize,
            font,
            color: WHITE,
          });
          shortDescCurrentY -= 20; // مسافة بين السطور (20 بكسل لكل سطر)
        }
      } catch (e) { /* تجاهل إذا لم يوجد شعار */ }
    };

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let pageNumber = 1; // رقم الصفحة الحالي

    // دالة لرسم الفوتر
    const drawFooter = async (page: PDFPage, currentPageNumber: number, pageWidth: number, pageHeight: number, margins: any, font: PDFFont) => {
      const footerY = margins.bottom; // بداية الفوتر من الأسفل (الهامش السفلي)

      // رسم مستطيل خلفية للفوتر
      page.drawRectangle({
        x: 0, 
        y: footerY, 
        width: pageWidth, 
        height: footerHeight,
        color: GRIS, // لون رمادي خفيف
      });

      // معلومات الشركة على اليسار
      const companyInfoStartX = margins.left;
      const topTextY = footerY + footerHeight - 15; // لتحديد بداية السطر العلوي للنص
      const bottomTextY = footerY + footerHeight - 30; // لتحديد بداية السطر السفلي للنص
      
      // السطر الأول: الموقع ورقم الهاتف بجانب بعضهما
      page.drawText('www.horizon-chimique.tn', {
        x: companyInfoStartX,
        y: topTextY,
        size: 9,
        font: font,
        color: DARK_BLUE,
      });

      const phoneText = '+216 31 520 033';
      const websiteWidth = font.widthOfTextAtSize('www.horizon-chimique.tn', 9);
      const gapBetweenTexts = 20; // مسافة بين النصين
      const phoneX = companyInfoStartX + websiteWidth + gapBetweenTexts;

      page.drawText(phoneText, {
        x: phoneX,
        y: topTextY,
        size: 9,
        font: font,
        color: DARK_BLUE,
      });
      
      // السطر الثاني: العنوان
      page.drawText('Route Attar Mornaguia La Manouba Tunisie', {
        x: companyInfoStartX,
        y: bottomTextY,
        size: 9,
        font: font,
        color: DARK_BLUE,
      });

      // رقم الصفحة على اليمين
      const pageNumberText = `Page ${currentPageNumber}`;
      const pageNumberTextWidth = font.widthOfTextAtSize(pageNumberText, 9);
      const pageNumberX = pageWidth - margins.right - pageNumberTextWidth;
      const pageNumberY = footerY + (footerHeight / 2) - (9 / 2); // لمركزة رقم الصفحة عمودياً

      page.drawText(pageNumberText, {
        x: pageNumberX,
        y: pageNumberY,
        size: 9,
        font: font,
        color: DARK_BLUE,
      });
    };

    // حساب ارتفاع الهيدر لكي نستخدمه في تحديد بداية المحتوى
    const shortDescLinesInitial = wrapText(catalogue.shortdesc || '', font, 15, pageWidth - (30 + 60 + 20) - margins.right);
    const initialHeaderHeight = 120 + (shortDescLinesInitial.length * 20);

    await drawHeader(page, pdfDoc, catalogue, font, fontBold, pageWidth, pageHeight, initialHeaderHeight);
    let y = pageHeight - initialHeaderHeight - paddingAfterHeader; // بدء من تحت الهيدر الجديد مع البادينغ

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
      // مع الأخذ في الاعتبار ارتفاع الفوتر الجديد (footerHeight)
      if (y - contentHeight < margins.bottom + footerHeight + 10) { // 10 بكسل هامش أمان
        await drawFooter(page, pageNumber, pageWidth, pageHeight, margins, font); // رسم الفوتر للصفحة الحالية
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNumber++; // زيادة رقم الصفحة
        // رسم الهيدر في الصفحة الجديدة
        await drawHeader(page, pdfDoc, catalogue, font, fontBold, pageWidth, pageHeight, initialHeaderHeight);
        y = pageHeight - initialHeaderHeight - paddingAfterHeader; // إعادة تعيين y للصفحة الجديدة
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

    // رسم الفوتر للصفحة الأخيرة بعد الانتهاء من جميع الأقسام
    await drawFooter(page, pageNumber, pageWidth, pageHeight, margins, font);

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="catalogue-${catalogue.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}