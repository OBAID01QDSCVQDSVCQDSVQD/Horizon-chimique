import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/lib/db/models/catalogue.model';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import User from '@/lib/db/models/user.model';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// دالة لمعالجة النص العربي مع الحفاظ على تنسيق TipTap
const processArabicHTMLContent = (text: string): string => {
  if (!text) return '';
  
  // تنظيف أساسي مع الحفاظ على التنسيق
  let processedText = text
    // تحويل HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    // إزالة الأحرف الغريبة والرموز غير المدعومة مع الحفاظ على HTML
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\u00A0-\u00FF\n\r\t<>\/="']/g, '')
    // تنظيف أساسي للمسافات الزائدة
    .replace(/\s+/g, ' ')
    .trim();
    
  return processedText;
};

// دالة للنص العربي العادي (للاستخدام في الأماكن التي لا تدعم HTML)
const cleanArabicText = (text: string): string => {
  if (!text) return '';
  
  // إزالة HTML tags مع الحفاظ على المحتوى
  let cleanText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>|<\/ul>/gi, '')
    .replace(/<ol[^>]*>|<\/ol>/gi, '')
    .replace(/<strong[^>]*>|<\/strong>/gi, '')
    .replace(/<b[^>]*>|<\/b>/gi, '')
    .replace(/<em[^>]*>|<\/em>/gi, '')
    .replace(/<i[^>]*>|<\/i>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    // إزالة الأحرف الغريبة والرموز غير المدعومة
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007E\u00A0-\u00FF\n\r\t]/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
    
  return cleanText;
};

// دالة لإنشاء HTML للعربية مع الحفاظ على تنسيق TipTap
const generateArabicHTML = (catalogue: any): string => {
  const title = processArabicHTMLContent(catalogue.title_ar || catalogue.title || 'فيش تقني');
  const shortDesc = processArabicHTMLContent(catalogue.shortdesc_ar || '');
  
  // دالة للتحقق من أن المحتوى ليس فارغاً
  const isContentEmpty = (content: string): boolean => {
    if (!content) return true;
    
    // تنظيف شامل للمحتوى
    const cleanContent = content
      // إزالة HTML tags الشائعة الفارغة
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .replace(/<br[^>]*\/?>/gi, '')
      .replace(/<hr[^>]*\/?>/gi, '')
      .replace(/<span[^>]*>\s*<\/span>/gi, '')
      // إزالة جميع HTML tags
      .replace(/<[^>]*>/g, '')
      // إزالة HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      // إزالة المسافات والأسطر الفارغة
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '')
      .trim();
      
    return cleanContent === '' || cleanContent.length === 0;
  };
  
  const sections = [
    { label: 'المعلومات', field: 'description_ar', content: processArabicHTMLContent(catalogue.description_ar || '') },
    { label: 'مجال التطبيق', field: 'domaine_ar', content: processArabicHTMLContent(catalogue.domaine_ar || '') },
    { label: 'الخصائص والمزايا', field: 'proprietes_ar', content: processArabicHTMLContent(catalogue.proprietes_ar || '') },
    { label: 'تحضير السطح', field: 'preparation_ar', content: processArabicHTMLContent(catalogue.preparation_ar || '') },
    { label: 'شروط التطبيق', field: 'conditions_ar', content: processArabicHTMLContent(catalogue.conditions_ar || '') },
    { label: 'التطبيق', field: 'application_ar', content: processArabicHTMLContent(catalogue.application_ar || '') },
    { label: 'الاستهلاك', field: 'consommation_ar', content: processArabicHTMLContent(catalogue.consommation_ar || '') },
    { label: 'تنظيف المعدات', field: 'nettoyage_ar', content: processArabicHTMLContent(catalogue.nettoyage_ar || '') },
    { label: 'التخزين', field: 'stockage_ar', content: processArabicHTMLContent(catalogue.stockage_ar || '') },
    { label: 'تعليمات السلامة', field: 'consignes_ar', content: processArabicHTMLContent(catalogue.consignes_ar || '') },
  ].filter(section => !isContentEmpty(section.content));

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none';">
    <title>${title} - ${Date.now()}</title>
    <!-- Generated at: ${new Date().toISOString()} -->
    <script>
        // حماية فورية ضد الإعلانات
        (function() {
            const style = document.createElement('style');
            style.textContent = \`
                [class*="ai-toolbar"], [id*="ai-toolbar"], 
                [class*="toolbar"]:not([class*="print"]):not([id*="print"]), 
                [class*="banner"], [class*="advertisement"], [class*="promo"], 
                [class*="ad-"], [id*="ad-"], iframe:not(.pdf-iframe), 
                embed:not(.pdf-embed), object:not(.pdf-object),
                .pdf-close-btn, button[style*="top: 85px"][style*="left: 25px"] { 
                    display: none !important; 
                    visibility: hidden !important; 
                    opacity: 0 !important; 
                    position: absolute !important; 
                    left: -9999px !important; 
                    width: 0 !important; 
                    height: 0 !important; 
                    overflow: hidden !important; 
                }
            \`;
            document.head.appendChild(style);
        })();
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: white;
            color: #333;
            line-height: 1.8;
            padding: 40px;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            font-size: 14px;
            /* تحسين ترميز النص العربي */
            unicode-bidi: bidi-override;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .header {
            text-align: center;
            margin-bottom: 35px;
            background: linear-gradient(135deg,rgb(106, 0, 0) 0%,rgb(179, 0, 36) 50%,rgb(255, 84, 84) 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(139, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
            z-index: 2;
            position: relative;
        }
        
        .header-logo {
            position: absolute !important;
            left: 30px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 9999 !important;
            width: auto !important;
            height: auto !important;
            max-width: 150px !important;
            max-height: 50px !important;
            min-width: 80px !important;
            min-height: 30px !important;
            border-radius: 8px !important;
            border: 2px solid rgba(255, 255, 255, 0.8) !important;
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(3px) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 3px 8px !important;
        }
        
        .header-logo img {
            max-width: 90px !important;
            max-height: 50px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            object-position: center !important;
            border-radius: 6px !important;
            display: block !important;
        }
        
        .header-logo-placeholder {
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: 32px !important;
            font-weight: bold !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100% !important;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg,rgb(104, 1, 1), rgb(179, 0, 36), rgb(255, 84, 84), rgb(139, 0, 0));
            background-size: 400% 400%;
            animation: gradientShift 4s ease infinite;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .title {
            font-size: 32px;
            font-weight: 800;
            color: white;
            margin-bottom: 15px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
            letter-spacing: 0.5px;
        }
        
        .subtitle {
            font-size: 16px;
            color: rgba(255,255,255,0.9);
            font-weight: 500;
            position: relative;
            z-index: 2;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            letter-spacing: 0.3px;
        }
        
        .short-desc {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%);
            padding: 25px 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            font-size: 15px;
            color: #2c3e50;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            hyphens: auto;
            text-align: justify;
            position: relative;
            border: 1px solid #e9ecef;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            line-height: 1.7;
        }
        
        .short-desc::before {
            content: '';
            position: absolute;
            top: -8px;
            right: 20px;
            background: linear-gradient(135deg, #003366, #0066cc);
            color: white;
            padding: 0;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            box-shadow: 0 2px 8px rgba(0,51,102,0.3);
        }
        
        .short-desc::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #003366, #0066cc, #4da6ff);
            border-radius: 12px 12px 0 0;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
            position: relative;
        }
        
        .section-title {
            background: linear-gradient(135deg, #003366 0%, #0066cc 50%, #4da6ff 100%);
            color: white;
            padding: 16px 25px;
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 0;
            border-radius: 10px 10px 0 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            letter-spacing: 0.3px;
            position: relative;
            overflow: hidden;
        }
        
        .section-title::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shine 3s infinite;
        }
        
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .section-content {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            padding: 20px 25px;
            border-radius: 0 0 10px 10px;
            font-size: 14px;
            line-height: 1.8;
            color: #2c3e50;
            border: 1px solid #e9ecef;
            border-top: none;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            hyphens: auto;
            text-align: justify;
            word-break: break-word;
            /* إضافة خصائص خاصة للنص العربي */
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            -ms-hyphens: auto;
            /* دعم أفضل للنصوص الطويلة */
            max-width: 100%;
            overflow-wrap: anywhere;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            position: relative;
        }
        
        .section-content::before {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #003366, #0066cc, #4da6ff);
            border-radius: 0 0 10px 0;
        }
        
        /* تحسين النص العربي */
        .section-content p {
            margin-bottom: 10px;
            word-spacing: 0.1em;
            letter-spacing: 0.02em;
        }
        
        /* دعم تنسيق TipTap للعربية */
        .section-content h1, .section-content h2, .section-content h3, 
        .section-content h4, .section-content h5, .section-content h6 {
            font-weight: bold;
            margin: 15px 0 10px 0;
            color: #003366;
            line-height: 1.4;
            text-align: right;
        }
        
        .section-content h1 { font-size: 20px; }
        .section-content h2 { font-size: 18px; }
        .section-content h3 { font-size: 16px; }
        .section-content h4 { font-size: 15px; }
        .section-content h5 { font-size: 14px; }
        .section-content h6 { font-size: 13px; }
        
        .section-content ul, .section-content ol {
            margin: 10px 0;
            padding-right: 25px;
            text-align: right;
        }
        
        .section-content ul li {
            list-style-type: disc;
            margin-bottom: 5px;
            line-height: 1.6;
            text-align: right;
        }
        
        .section-content ol li {
            list-style-type: arabic-indic;
            margin-bottom: 5px;
            line-height: 1.6;
            text-align: right;
        }
        
        .section-content strong, .section-content b {
            font-weight: bold;
            color: #003366;
        }
        
        .section-content em, .section-content i {
            font-style: italic;
        }
        
        .section-content u {
            text-decoration: underline;
        }
        
        .section-content blockquote {
            border-right: 4px solid #0066cc;
            padding-right: 15px;
            margin: 15px 0;
            font-style: italic;
            color: #555;
            text-align: right;
        }
        
        .section-content code {
            background-color: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            direction: ltr;
            display: inline-block;
        }
        
        .section-content pre {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            direction: ltr;
            text-align: left;
        }
        
        .section-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            direction: rtl;
        }
        
        .section-content table th,
        .section-content table td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: right;
        }
        
        .section-content table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #003366;
        }
        
        .section-content a {
            color: #0066cc;
            text-decoration: underline;
        }
        
        .section-content hr {
            border: none;
            border-top: 2px solid #dee2e6;
            margin: 20px 0;
        }
        
        .footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            text-align: center !important;
            font-size: 12px !important;
            color: white !important;
            padding: 15px !important;
            background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%) !important;
            z-index: 99999 !important;
            box-shadow: 0 -4px 16px rgba(139, 0, 0, 0.2) !important;
            /* حماية الفوتر من الإزالة */
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: 60px !important;
            min-height: 60px !important;
            max-height: 60px !important;
            width: 100% !important;
            direction: rtl !important;
            /* إضافات لضمان الظهور */
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            /* منع أي تداخل */
            clear: both !important;
            float: none !important;
            margin: 0 !important;
            border: none !important;
            outline: none !important;
            /* حماية إضافية من الإخفاء */
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            /* منع التلاعب بالفوتر */
            transform: none !important;
            transition: none !important;
            animation: none !important;
            /* ضمان الظهور فوق كل شيء */
            top: auto !important;
        }
        
        .footer-content {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            padding: 0 20px !important;
            height: 100% !important;
            direction: rtl !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .footer-section {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            font-weight: 600 !important;
            color: white !important;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
            visibility: visible !important;
            opacity: 1 !important;
            direction: rtl !important;
        }
        
        .footer-icon {
            font-size: 16px !important;
            margin-left: 5px !important;
            color: white !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        @media print {
            /* إخفاء جميع الإعلانات والعناصر الخارجية وأزرار الإغلاق في الطباعة */
            [class*="ai-toolbar"], 
            [id*="ai-toolbar"],
            [class*="toolbar"]:not([class*="print"]):not([id*="print"]),
            [class*="banner"],
            [class*="advertisement"],
            [class*="promo"],
            [class*="ad-"],
            [id*="ad-"],
            iframe:not(.pdf-iframe),
            embed:not(.pdf-embed),
            object:not(.pdf-object),
            .pdf-close-btn,
            button[style*="position: fixed"][style*="top: 85px"],
            button[onclick*="instructions.style.display"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                left: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
            }
            
            body {
                padding: 20px;
                padding-bottom: 60px; /* مساحة للفوتر */
                font-size: 12px;
            }
            
            .footer {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 60px !important;
                min-height: 60px !important;
                background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 11px !important;
                color: white !important;
                z-index: 99999 !important;
                /* ضمان ظهور الفوتر في كل صفحة */
                page-break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-shadow: 0 -4px 16px rgba(139, 0, 0, 0.2) !important;
                /* حماية الفوتر في الطباعة */
                visibility: visible !important;
                opacity: 1 !important;
                width: 100% !important;
                direction: rtl !important;
                text-align: center !important;
            }
            
            .footer-content {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                width: 100% !important;
                padding: 0 20px !important;
            }
            
            .footer-section {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                font-weight: 600 !important;
                color: white !important;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
            }
            
            .footer-icon {
                font-size: 14px !important;
                margin-left: 5px !important;
            }
            
            .section-content {
                font-size: 12px;
                line-height: 1.6;
                margin-bottom: 20px; /* مسافة إضافية قبل الفوتر */
            }
            
            .section {
                page-break-inside: avoid;
                margin-bottom: 25px;
            }
            
            /* تحسين الطباعة للنص العربي */
            * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            /* ضمان عدم تداخل المحتوى مع الفوتر */
            @page {
                margin-bottom: 70px;
            }
        }
        
        /* إخفاء الإعلانات والعناصر الخارجية وأزرار الإغلاق */
        [class*="ai-toolbar"], 
        [id*="ai-toolbar"],
        [class*="toolbar"]:not([class*="print"]):not([id*="print"]),
        [class*="popup"]:not([class*="print"]):not([id*="print"]),
        [class*="modal"]:not(.pdf-modal):not([class*="print"]):not([id*="print"]),
        [class*="overlay"]:not(.pdf-overlay):not([class*="print"]):not([id*="print"]),
        [class*="banner"],
        [class*="advertisement"],
        [class*="promo"],
        .pdf-close-btn,
        button[style*="position: fixed"][style*="top: 85px"],
        button[onclick*="instructions.style.display"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
        }

        /* تحسين عرض النص على الشاشات المختلفة */
        @media screen and (max-width: 768px) {
            body {
                padding: 20px;
                width: 100%;
            }
            .section-content {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="title">${title}</div>
            <div class="subtitle">البطاقة التقنية / Fiche Technique</div>
        </div>
    </div>
    
    ${!isContentEmpty(shortDesc) ? `<div class="short-desc">${shortDesc}</div>` : ''}
    
    ${sections.map(section => `
        <div class="section">
            <div class="section-title">${section.label}</div>
            <div class="section-content">${section.content}</div>
        </div>
    `).join('')}
    
    <div class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <span class="footer-icon">🌐</span>
                <span>horizon-chimique.tn</span>
            </div>
            <div class="footer-section">
                <span class="footer-icon">📄</span>
                <span>البطاقة التقنية - ${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="footer-section">
                <span class="footer-icon">📞</span>
                <span>00216520033</span>
            </div>
        </div>
    </div>
    
    <script>
        // إزالة الإعلانات والعناصر الخارجية مع حماية الفوتر
        function removeAds() {
            const selectors = [
                '[class*="ai-toolbar"]',
                '[id*="ai-toolbar"]', 
                '[class*="toolbar"]',
                '[class*="popup"]',
                '[class*="modal"]:not(.pdf-modal)',
                '[class*="overlay"]:not(.pdf-overlay)',
                '[class*="banner"]',
                '[class*="advertisement"]',
                '[class*="promo"]',
                '[class*="ad-"]',
                '[id*="ad-"]'
            ];
            
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        // حماية الفوتر من الحذف
                        if (el && el.parentNode && !el.classList.contains('footer') && 
                            !el.classList.contains('footer-content') && 
                            !el.classList.contains('footer-section')) {
                            el.parentNode.removeChild(el);
                        }
                    });
                } catch (e) {
                    console.log('تم تنظيف العنصر:', selector);
                }
            });
            
            // التأكد من وجود الفوتر
            const footer = document.querySelector('.footer');
            if (footer) {
                footer.style.display = 'flex';
                footer.style.visibility = 'visible';
                footer.style.opacity = '1';
            }
        }
        
        // دالة لضمان ظهور الفوتر العربي مع حماية قوية
        function ensureArabicFooter() {
            const footer = document.querySelector('.footer');
            if (footer) {
                // تطبيق جميع الخصائص بقوة
                footer.style.setProperty('display', 'flex', 'important');
                footer.style.setProperty('visibility', 'visible', 'important');
                footer.style.setProperty('opacity', '1', 'important');
                footer.style.setProperty('position', 'fixed', 'important');
                footer.style.setProperty('bottom', '0', 'important');
                footer.style.setProperty('left', '0', 'important');
                footer.style.setProperty('right', '0', 'important');
                footer.style.setProperty('top', 'auto', 'important');
                footer.style.setProperty('z-index', '99999', 'important');
                footer.style.setProperty('background', 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%)', 'important');
                footer.style.setProperty('color', 'white', 'important');
                footer.style.setProperty('padding', '15px', 'important');
                footer.style.setProperty('font-size', '12px', 'important');
                footer.style.setProperty('text-align', 'center', 'important');
                footer.style.setProperty('direction', 'rtl', 'important');
                footer.style.setProperty('height', '60px', 'important');
                footer.style.setProperty('width', '100%', 'important');
                footer.style.setProperty('margin', '0', 'important');
                footer.style.setProperty('border', 'none', 'important');
                footer.style.setProperty('outline', 'none', 'important');
                footer.style.setProperty('transform', 'none', 'important');
                footer.style.setProperty('transition', 'none', 'important');
                footer.style.setProperty('animation', 'none', 'important');
                
                // منع إزالة الفوتر
                footer.setAttribute('data-protected', 'true');
                footer.classList.add('protected-footer');
            }
        }
        
        // تشغيل التنظيف عند تحميل الصفحة
        document.addEventListener('DOMContentLoaded', function() {
            removeAds();
            ensureArabicFooter();
        });
        
        // تشغيل التنظيف والفوتر كل ثانية للتأكد
        setInterval(function() {
            removeAds();
            ensureArabicFooter();
        }, 1000);
        
        // تشغيل التنظيف قبل الطباعة
        window.addEventListener('beforeprint', function() {
            removeAds();
            ensureArabicFooter();
            // إزالة أزرار الإغلاق فقط
            const closeButtons = document.querySelectorAll('button');
            closeButtons.forEach(btn => {
                if ((btn.innerHTML.includes('×') || btn.innerHTML.includes('✖')) && 
                    btn.style.position === 'fixed' && 
                    btn.style.top === '85px') {
                    btn.style.display = 'none';
                    btn.style.visibility = 'hidden';
                    btn.style.opacity = '0';
                }
            });
            // إزالة إضافية للعناصر المخفية
            setTimeout(function() {
                removeAds();
                ensureArabicFooter();
            }, 100);
        });
        
        // تشغيل التنظيف عند النقر على طباعة
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                removeAds();
            }
        });
        
        // تشغيل التنظيف والفوتر فوراً
        removeAds();
        ensureArabicFooter();
        
        // دالة إضافية لضمان الفوتر
        function forceFooterDisplay() {
            const footer = document.querySelector('.footer');
            if (footer) {
                // إزالة أي تداخل محتمل
                footer.style.setProperty('display', 'flex', 'important');
                footer.style.setProperty('visibility', 'visible', 'important');
                footer.style.setProperty('opacity', '1', 'important');
                footer.style.setProperty('position', 'fixed', 'important');
                footer.style.setProperty('bottom', '0', 'important');
                footer.style.setProperty('left', '0', 'important');
                footer.style.setProperty('right', '0', 'important');
                footer.style.setProperty('z-index', '99999', 'important');
                footer.style.setProperty('background', 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%)', 'important');
                footer.style.setProperty('color', 'white', 'important');
                footer.style.setProperty('height', '60px', 'important');
                footer.style.setProperty('width', '100%', 'important');
            }
        }
        
        // حماية الفوتر العربي من الإزالة
        function protectArabicFooter() {
            const footer = document.querySelector('.footer');
            if (footer && !footer.hasAttribute('data-protected')) {
                // إعادة إنشاء الفوتر إذا تم حذفه
                const newFooter = footer.cloneNode(true);
                footer.parentNode.appendChild(newFooter);
                ensureArabicFooter();
            } else if (!footer) {
                // إعادة إنشاء الفوتر بالكامل إذا لم يعد موجوداً
                const footerHTML = \`
                <div class="footer">
                    <div class="footer-content">
                        <div class="footer-section">
                            <span class="footer-icon">🌐</span>
                            <span>horizon-chimique.tn</span>
                        </div>
                        <div class="footer-section">
                            <span class="footer-icon">📄</span>
                            <span>البطاقة التقنية - \${new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="footer-section">
                            <span class="footer-icon">📞</span>
                            <span>00216520033</span>
                        </div>
                    </div>
                </div>\`;
                document.body.insertAdjacentHTML('beforeend', footerHTML);
                ensureArabicFooter();
            }
        }

        // تنظيف شامل كل 500ms للتأكد التام
        setInterval(function() {
            removeAds();
            protectArabicFooter();
            ensureArabicFooter();
            forceFooterDisplay();
            
            // إزالة أي عناصر جديدة قد تظهر
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const className = el.className || '';
                const id = el.id || '';
                if (className.includes('toolbar') || className.includes('ai-') || 
                    id.includes('toolbar') || id.includes('ai-') ||
                    className.includes('popup') || className.includes('modal')) {
                    // تأكد أنه ليس الفوتر
                    if (!el.classList.contains('footer') && 
                        !el.classList.contains('footer-content') && 
                        !el.classList.contains('footer-section') &&
                        !el.hasAttribute('data-protected')) {
                        try {
                            el.remove();
                        } catch(e) {}
                    }
                }
            });
            
            // إزالة أزرار الإغلاق المحددة فقط
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                if ((btn.innerHTML.includes('×') || btn.innerHTML.includes('✖')) && 
                    btn.style.position === 'fixed' && 
                    btn.style.top === '85px' && 
                    btn.style.left === '25px') {
                    btn.style.display = 'none !important';
                    btn.style.visibility = 'hidden !important';
                    btn.style.opacity = '0 !important';
                    try {
                        btn.remove();
                    } catch(e) {}
                }
            });
        }, 500);
        
        // تشغيل فوري إضافي
        setTimeout(function() {
            forceFooterDisplay();
        }, 100);
    </script>
</body>
</html>`;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  
  try {
    await connectDB();
    const catalogue = await Catalogue.findById(id);
    
    if (!catalogue) {
      return NextResponse.json(
        { error: 'الفيش التقني غير موجود' },
        { status: 404 }
      );
    }

    const htmlContent = generateArabicHTML(catalogue);
    
    // إرجاع HTML للمعاينة أو التحويل في المتصفح
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Language': 'ar',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}"`,
      },
    });

  } catch (error) {
    console.error('خطأ في إنشاء PDF العربي:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء PDF العربي' },
      { status: 500 }
    );
  }
} 