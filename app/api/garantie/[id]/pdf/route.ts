export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { connectToDatabase } from '@/lib/db';
import Garantie from '@/lib/db/models/garantie.model';
import User from '@/lib/db/models/user.model';

type GarantieType = {
  _id: string;
  userId: string;
  company?: string;
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

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const garantie = await Garantie.findById(id).exec();
    if (!garantie) {
      return new NextResponse('Garantie not found', { status: 404 });
    }

    const garantieData = garantie.toObject();
    const user = await User.findById(garantieData.userId).lean();
    const companyName = user?.company || '';
    const companyLogo = user?.companyLogo || '';
    const companyAddress = user?.address || '';
    const companyPhone = user?.phone || '';

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Example title
    const title = `Certificat de Garantie`;
    const titleWidth = fontBold.widthOfTextAtSize(title, 20);
    page.drawText(title, {
      x: (595 - titleWidth) / 2,
      y: 780,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    // Add other Garantie data as needed...
    page.drawText(`Nom: ${garantieData.name || ''}`, { x: 50, y: 740, size: 12, font });
    page.drawText(`Adresse: ${garantieData.address || ''}`, { x: 50, y: 720, size: 12, font });
    page.drawText(`Montant: ${garantieData.montant || ''} DT`, { x: 50, y: 700, size: 12, font });
    page.drawText(`Date d'exécution: ${formatDate(garantieData.installDate)}`, { x: 50, y: 680, size: 12, font });

    // Example footer
    page.drawText(companyName, { x: 50, y: 50, size: 12, font });
    if (companyPhone) {
      page.drawText(`Tél: ${companyPhone}`, { x: 250, y: 50, size: 10, font });
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="garantie-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
