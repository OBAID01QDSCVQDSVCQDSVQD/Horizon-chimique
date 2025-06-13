export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { connectToDatabase } from '@/lib/db';
import Garantie from '@/lib/db/models/garantie.model';
import User from '@/lib/db/models/user.model';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

type GarantieType = {
  _id: string;
  userId: string;
  company?: string;
  companyLogo?: string;
  name?: string;
  phone?: string;
  address?: string;
  surface?: Array<{ type: string; value: number }>;
  montant?: number;
  installDate?: string;
  duration?: number;
  
  notes?: string;
  maintenances?: Array<{ date: string }>;
  status: 'APPROVED' | 'NOT_APPROVED';
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// Helper to draw multi-line text and return new Y
function drawMultilineText(page: any, text: string, x: number, y: number, options: any) {
  const lines = text.split('\n');
  lines.forEach((line: string, idx: number) => {
    page.drawText(line, { ...options, x, y: y - idx * options.lineHeight });
  });
  return y - lines.length * options.lineHeight;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const garantie = await Garantie.findById(id).lean() as unknown as GarantieType;
    if (!garantie) {
      return new NextResponse('Garantie not found', { status: 404 });
    }
    const user = await User.findById(garantie.userId).lean();

    // إعداد PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ألوان
    const blue = rgb(0.0, 0.38, 0.8);
    const lightBlue = rgb(0.93, 0.96, 1);
    const green = rgb(0.0, 0.6, 0.3);
    const lightGreen = rgb(0.93, 1, 0.93);
    const red = rgb(0.8, 0.2, 0.2);
    const lightRed = rgb(1, 0.96, 0.96);

    // --- إعداد بيانات الهيدر ---
    const company = user?.company || "SDK BATIMENT";
    const headerFields = [
      user?.address ? `Adresse: ${user.address}` : null,
      user?.phone ? `Tél: ${user.phone}` : null,
      user?.matriculeFiscale ? `MF: ${user.matriculeFiscale}` : null,
      user?.website ? `Site web: ${user.website}` : null,
    ].filter(Boolean) as string[];

    // إعدادات الخط والارتفاع
    const headerFontSize = 12;
    const headerLineHeight = 18;
    const headerPadding = 18;

    // حساب ارتفاع الهيدر تلقائياً
    const headerHeight = headerFields.length * headerLineHeight + headerPadding * 2 + 30; // 30 لاسم الشركة

    // --- رسم الهيدر الأزرق ---
    page.drawRectangle({ x: 0, y: 842 - headerHeight, width: 595, height: headerHeight, color: blue });

    // تحديد مسار اللوجو من بيانات المستخدم أو استخدم لوجو افتراضي
    let logoImage = undefined;
    try {
      if (user?.companyLogo?.startsWith('http')) {
        const response = await fetch(user.companyLogo);
        const logoBytes = Buffer.from(await response.arrayBuffer());
        // جرب PNG أولاً ثم JPG إذا فشل
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      } else if (user?.companyLogo?.startsWith('data:image')) {
        const base64Data = user.companyLogo.split(',')[1];
        if (user.companyLogo.startsWith('data:image/png')) {
          logoImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
        } else {
          logoImage = await pdfDoc.embedJpg(Buffer.from(base64Data, 'base64'));
        }
      } else if (user?.companyLogo) {
        const logoPath = path.join(process.cwd(), 'public', user.companyLogo.replace(/^\/+/, ''));
        const logoBytes = await fs.readFile(logoPath);
        try {
          logoImage = await pdfDoc.embedPng(logoBytes);
        } catch {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (e) {
      console.error('Logo error:', e);
    }

    // fallback إذا لم يوجد لوجو
    if (!logoImage) {
      try {
        const defaultLogoPath = path.join(process.cwd(), 'public', 'icones/logo.png');
        const defaultLogoBytes = await fs.readFile(defaultLogoPath);
        logoImage = await pdfDoc.embedPng(defaultLogoBytes);
      } catch (e) {
        logoImage = undefined;
      }
    }

    // رسم اللوجو في الهيدر (يمين وبحجم كبير)
    if (logoImage) {
      const logoWidth = 120; // حجم كبير
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      page.drawImage(logoImage, {
        x: 595 - logoWidth - 40, // 40px هامش من اليمين
        y: 842 - headerHeight + (headerHeight - logoHeight) / 2,
        width: logoWidth,
        height: logoHeight,
      });
    }

    // اسم الشركة في الأعلى وبالوسط
    const companyWidth = fontBold.widthOfTextAtSize(company, 22);
    page.drawText(company, {
      x: (595 - companyWidth) / 2,
      y: 842 - headerPadding - 10,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // رسم كل سطر من معلومات الشركة تحت اسم الشركة
    let headerY = 842 - headerPadding - 40;
    headerFields.forEach((field) => {
      page.drawText(field, {
        x: 40,
        y: headerY,
        size: headerFontSize,
        font,
        color: rgb(1, 1, 1)
      });
      headerY -= headerLineHeight;
    });

    // --- العنوان الرئيسي أسفل الهيدر مباشرة ---
    const title = `Certificat de Garantie`;
    const titleWidth = fontBold.widthOfTextAtSize(title, 22);
    page.drawText(title, {
      x: (595 - titleWidth) / 2,
      y: 842 - headerHeight - 20,
      size: 22,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // --- Start Y position ---
    let currentY = 842 - headerHeight - 50; // استخدم هذا كبداية لباقي الصفحة

    // --- إعداد بيانات المستفيد ---
    const surfaces = Array.isArray(garantie.surface) && garantie.surface.length
      ? garantie.surface.map(s => {
          const value = s?.value !== undefined && s?.value !== null ? s.value : '';
          const type = s?.type || '';
          return value && type ? `${value} ${type}` : value || type || '';
        })
      : [];

    const infoFields: [string, string][] = [
      [`Nom:`, garantie.name || ''],
      [`Téléphone:`, garantie.phone || ''],
      [`Adresse:`, garantie.address || ''],
      ['Surface concernée:', surfaces.join(', ')],
      [`Montant total:`, garantie.montant ? `${garantie.montant} DT` : ''],
      [`Date d'exécution:`, formatDate(garantie.installDate)],
      [`Système appliqué:`, `Les travaux ont été réalisés avec le système HORIZON CHIMIQUE, conformément aux normes en vigueur et aux règles de l'art, garantissant une étanchéité durable et performante.`],
      [`Durée de garantie:`, `10 ans (13/06/2025 - 13/06/2035)`],
    ];

    // تعديل دالة wrapText لتكون أكثر أماناً
    function wrapText(text: string | undefined | null, maxWidth: number, font: any, fontSize: number) {
      if (!text) return [''];
      if (!font || typeof font.widthOfTextAtSize !== 'function') {
        console.error('Invalid font object:', font);
        return [String(text)];
      }
      
      const words = String(text).split(' ');
      let lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        try {
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        } catch (error) {
          console.error('Error calculating text width:', error);
          lines.push(testLine);
          currentLine = '';
        }
      });
      
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    // --- رسم عنوان القسم ---
    const infoTitle = 'Informations du bénéficiaire';
    const infoTitleFontSize = 14;
    const infoFontSize = 12;
    const infoLineHeight = 18;
    const fieldSpacing = 6; // المسافة بين كل حقل والذي يليه
    let y = currentY;

    // حساب عدد الأسطر الفعلي لكل الحقول
    let totalLines = 1; // عنوان القسم
    infoFields.forEach(([label, value]) => {
      const valueLines = wrapText(value, 350, font, infoFontSize);
      totalLines += Math.max(1, valueLines.length);
    });

    // حساب ارتفاع الصندوق بدقة
    const infoBoxHeight = totalLines * infoLineHeight + 50; // 30 = مسافة العنوان + padding

    // ظل خفيف
    page.drawRectangle({
      x: 34,
      y: y - infoBoxHeight - 4,
      width: 535,
      height: infoBoxHeight,
      color: rgb(0.8, 0.85, 0.95),
      opacity: 0.4
    });

    // الكادر الرئيسي
    page.drawRectangle({
      x: 30,
      y: y - infoBoxHeight,
      width: 535,
      height: infoBoxHeight,
      color: lightBlue,
      
     
     
    });

    // رسم العنوان
    page.drawText(infoTitle, {
      x: 40,
      y: y - 20,
      size: infoTitleFontSize,
      font: fontBold,
      color: rgb(0.0, 0.38, 0.8)
    });

    // أضف مسافة بعد العنوان
    y = y - 20 - 15;

    // 1. احسب عرض أطول عنوان
    const labelStartX = 40;
    const maxLabelWidth = Math.max(
      ...infoFields.map(([label]) => fontBold.widthOfTextAtSize(label, infoFontSize))
    );
    const valueStartX = labelStartX + maxLabelWidth + 30;

    // رسم الحقول (label + value) كما في كودك
    infoFields.forEach(([label, value]) => {
      const valueLines = wrapText(value, 380, font, infoFontSize);

      // السطر الأول: label + أول سطر من القيمة
      page.drawText(label, {
        x: labelStartX,
        y,
        size: infoFontSize,
        font: fontBold,
        color: rgb(0,0,0)
      });
      page.drawText(valueLines[0], {
        x: valueStartX,
        y,
        size: infoFontSize,
        font,
        color: rgb(0,0,0)
      });

      // الأسطر الإضافية للقيمة (بدون label)
      for (let i = 1; i < valueLines.length; i++) {
        page.drawText(valueLines[i], {
          x: valueStartX,
          y: y - i * infoLineHeight,
          size: infoFontSize,
          font,
          color: rgb(0,0,0)
        });
      }

      // نزّل y بعدد كل الأسطر + مسافة إضافية للفصل
      y -= Math.max(1, valueLines.length) * infoLineHeight + fieldSpacing;
    });

    currentY = y - 20;

    // --- Box 2: Obligations ---
    const maintenanceDates = Array.isArray(garantie.maintenances)
      ? garantie.maintenances.map(m => formatDate(m.date)).filter(Boolean)
      : [];

    let obligationsText = `Le bénéficiaire ${garantie.name || ''} s'engage à réaliser, à ses frais, un entretien périodique de l'étanchéité aux`;
    if (maintenanceDates.length) {
      obligationsText += '\n' + maintenanceDates.join('\n');
    }
    const obligationsLines = obligationsText.split('\n');
    const obligationsBoxLineHeight = 16;
    const obligationsBoxPadding = 16;
    const obligationsBoxHeight = obligationsLines.length * obligationsBoxLineHeight + obligationsBoxPadding * 2 + 10;

    // رسم الكادر بدون بوردر
    page.drawRectangle({
      x: 30,
      y: currentY - obligationsBoxHeight,
      width: 535,
      height: obligationsBoxHeight,
      color: lightRed
    });

    // عنوان القسم
    page.drawText('Obligations du bénéficiaire', {
      x: labelStartX,
      y: currentY - 20,
      size: 14,
      font: fontBold,
      color: red
    });

    // التفاف النص فقط على السطر الأول
    const mainObligationLine = obligationsLines[0];
    const mainObligationWrapped = wrapText(mainObligationLine, 470, font, 12);

    let yObl = currentY - 40;

    // رسم النص الرئيسي (قد يكون أكثر من سطر)
    mainObligationWrapped.forEach((line) => {
      page.drawText(line, {
        x: labelStartX,
        y: yObl,
        size: 12,
        font,
        color: rgb(0,0,0)
      });
      yObl -= obligationsBoxLineHeight;
    });

    // رسم التواريخ كل واحد في سطر منفصل
    for (let i = 1; i < obligationsLines.length; i++) {
      page.drawText(obligationsLines[i], {
        x: labelStartX,
        y: yObl,
        size: 12,
        font,
        color: rgb(0,0,0)
      });
      yObl -= obligationsBoxLineHeight;
    }

    currentY -= obligationsBoxHeight + 20;

    // --- Box 3: Avantage exclusif ---
    const advantageTitle = 'Avantage exclusif';
    const advantageText = garantie.notes || '';

    // تحقق من وجود نص
    if (advantageText.trim()) {  // تحقق من أن النص ليس فارغاً أو يحتوي على مسافات فقط
      const advantageLines = advantageText.split('\n');
      const advantageWrapped = advantageLines.flatMap(line => 
        wrapText(line, 470, font, 12)
      );

      const advantageBoxLineHeight = 16;
      const advantageBoxPadding = 16;
      const advantageBoxHeight = advantageWrapped.length * advantageBoxLineHeight + advantageBoxPadding * 2 + 10;

      // ظل خفيف
      page.drawRectangle({
        x: 34,
        y: currentY - advantageBoxHeight - 4,
        width: 535,
        height: advantageBoxHeight,
        color: rgb(0.85, 0.95, 0.85),
        opacity: 0.4
      });

      // الكادر الرئيسي بدون بوردر
      page.drawRectangle({
        x: 30,
        y: currentY - advantageBoxHeight,
        width: 535,
        height: advantageBoxHeight,
        color: lightGreen
      });

      // عنوان القسم
      page.drawText(advantageTitle, {
        x: labelStartX,
        y: currentY - 20,
        size: 14,
        font: fontBold,
        color: green
      });

      // رسم النص
      let textY = currentY - 40;
      advantageWrapped.forEach((line) => {
        page.drawText(line, {
          x: labelStartX,
          y: textY,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        });
        textY -= advantageBoxLineHeight;
      });

      // تحديث currentY فقط إذا تم إضافة الكارت
      currentY -= advantageBoxHeight + 20;
    }

    // --- Footer ---
    page.drawRectangle({ x: 0, y: 0, width: 595, height: 40, color: blue });
    page.drawText('SDK BATIMENT', { x: 40, y: 15, size: 12, font: fontBold, color: rgb(1,1,1) });
    page.drawText(`${user?.address || ''}`, { x: 180, y: 15, size: 10, font, color: rgb(1,1,1) });
    page.drawText(`Tél: ${user?.phone || ''}`, { x: 400, y: 15, size: 10, font, color: rgb(1,1,1) });

    const pdfBytes = await pdfDoc.save();

    // تنظيف اسم المستفيد ليكون صالحاً كاسم ملف
    const cleanName = (garantie.name || 'sans-nom')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // استبدال كل الرموز غير المسموح بها بشرطة
      .replace(/-+/g, '-')        // استبدال الشرطات المتتالية بشرطة واحدة
      .replace(/^-|-$/g, '');     // إزالة الشرطات من البداية والنهاية

    // إنشاء اسم الملف بدون الـ id
    const fileName = `garantie-${cleanName}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
 