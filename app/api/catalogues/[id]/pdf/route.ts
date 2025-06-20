import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Catalogue from '@/lib/db/models/catalogue.model';
import User from '@/lib/db/models/user.model';

interface RouteContext {
  params: Promise<{ id: string }>;
}



// دالة للحصول على المحتوى حسب اللغة بدون أي معالجة
const getContentByLanguage = (catalogue: any, field: string, lang: string = 'fr'): string => {
  let content = '';
  
  if (lang === 'en') {
    content = catalogue[`${field}_en`] || catalogue[field] || '';
  } else if (lang === 'ar') {
    content = catalogue[`${field}_ar`] || catalogue[field] || '';
  } else {
    content = catalogue[field] || '';
  }
  
  return content || '';
};

// دالة للحصول على الترجمات
const getTranslations = (lang: string) => {
  const translations = {
    fr: {
      subtitle: 'Fiche Technique / Technical Sheet',
      information: 'Informations',
      domaine: 'Domaine d\'application',
      proprietes: 'Caractéristiques et Avantages',
      preparation: 'Préparation du support',
      conditions: 'Conditions d\'application',
      application: 'Application',
      consommation: 'Consommation',
      nettoyage: 'Nettoyage des équipements',
      stockage: 'Stockage',
      consignes: 'Consignes de sécurité',
      footer: 'Fiche Technique'
    },
    en: {
      subtitle: 'Technical Sheet / Fiche Technique',
      information: 'Information',
      domaine: 'Application Domain',
      proprietes: 'Characteristics & Advantages',
      preparation: 'Surface Preparation',
      conditions: 'Application Conditions',
      application: 'Application',
      consommation: 'Consumption',
      nettoyage: 'Equipment Cleaning',
      stockage: 'Storage',
      consignes: 'Safety Instructions',
      footer: 'Technical Sheet'
    },
    ar: {
      subtitle: 'البطاقة التقنية / Technical Sheet',
      information: 'معلومات',
      domaine: 'مجال التطبيق',
      proprietes: 'الخصائص والمزايا',
      preparation: 'تحضير السطح',
      conditions: 'شروط التطبيق',
      application: 'التطبيق',
      consommation: 'الاستهلاك',
      nettoyage: 'تنظيف المعدات',
      stockage: 'التخزين',
      consignes: 'تعليمات السلامة',
      footer: 'البطاقة التقنية'
    }
  };
  
  return translations[lang as keyof typeof translations] || translations.fr;
};

// دالة لإنشاء HTML
const generateHTML = (catalogue: any, lang: string = 'fr', userLogo?: string): string => {
  const title = getContentByLanguage(catalogue, 'title', lang);
  const shortDesc = getContentByLanguage(catalogue, 'shortdesc', lang);
  const t = getTranslations(lang);
  
  const sections = [
    { label: t.information, field: 'description', content: getContentByLanguage(catalogue, 'description', lang) },
    { label: t.domaine, field: 'domaine', content: getContentByLanguage(catalogue, 'domaine', lang) },
    { label: t.proprietes, field: 'proprietes', content: getContentByLanguage(catalogue, 'proprietes', lang) },
    { label: t.preparation, field: 'preparation', content: getContentByLanguage(catalogue, 'preparation', lang) },
    { label: t.conditions, field: 'conditions', content: getContentByLanguage(catalogue, 'conditions', lang) },
    { label: t.application, field: 'application', content: getContentByLanguage(catalogue, 'application', lang) },
    { label: t.consommation, field: 'consommation', content: getContentByLanguage(catalogue, 'consommation', lang) },
    { label: t.nettoyage, field: 'nettoyage', content: getContentByLanguage(catalogue, 'nettoyage', lang) },
    { label: t.stockage, field: 'stockage', content: getContentByLanguage(catalogue, 'stockage', lang) },
    { label: t.consignes, field: 'consignes', content: getContentByLanguage(catalogue, 'consignes', lang) },
  ].filter(section => {
    if (!section.content) return false;
    // إزالة HTML tags والمسافات للتحقق من وجود محتوى فعلي
    const textContent = section.content
      .replace(/<[^>]*>/g, '')  // إزالة HTML tags
      .replace(/&nbsp;/g, ' ')  // تحويل &nbsp; إلى مسافة
      .replace(/&[a-zA-Z0-9#]+;/g, '')  // إزالة HTML entities
      .trim();
    return textContent !== '' && textContent.length > 0;
  });

  const isRTL = lang === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';
  
  const fontFamily = isRTL 
    ? "'Noto Sans Arabic', 'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    : "'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  
  return `<!DOCTYPE html>
<html dir="${direction}" lang="${lang}">
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            direction: ${direction};
            text-align: ${isRTL ? 'right' : 'left'};
            background: white;
            color: #333;
            line-height: 1.8;
            padding: 40px;
            padding-bottom: 80px;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            font-size: 14px;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .header {
            text-align: center;
            margin-bottom: 35px;
            background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(139, 0, 0, 0.3);
            height: 100px;
        }
        
        .header-content {
            position: absolute !important;
            top: 50% !important;
            ${isRTL ? 'right: 20px !important; left: 130px !important;' : 'left: 130px !important; right: 20px !important;'}
            transform: translateY(-50%) !important;
            text-align: center !important;
            z-index: 2 !important;
            width: calc(100% - 150px) !important;
        }
        
        .header-logo {
            position: absolute !important;
            ${isRTL ? 'right: 20px !important;' : 'left: 20px !important;'}
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 9999 !important;
            width: auto !important;
            height: auto !important;
            max-width: 100px !important;
            max-height: 50px !important;
            min-width: 60px !important;
            min-height: 25px !important;
            border-radius: 8px !important;
            border: 2px solid rgba(255, 255, 255, 0.9) !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(5px) !important;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 3px 6px !important;
        }
        
        .header-logo img {
            max-width: 90px !important;
            max-height: 40px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            object-position: center !important;
            border-radius: 4px !important;
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
            background: linear-gradient(90deg, #8B0000, #DC143C, #FF6B6B, #8B0000);
            background-size: 400% 400%;
            animation: gradientShift 4s ease infinite;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .title {
            font-size: ${isRTL ? '20px' : '22px'} !important;
            font-weight: 800 !important;
            color: white !important;
            margin: 0 !important;
            margin-bottom: 5px !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3) !important;
            z-index: 2 !important;
            letter-spacing: ${isRTL ? '0px' : '0.1px'} !important;
            text-align: center !important;
            line-height: 1.1 !important;
            width: 100% !important;
            display: block !important;
        }
        
        .subtitle {
            font-size: ${isRTL ? '13px' : '14px'} !important;
            color: rgba(255,255,255,0.9) !important;
            font-weight: 500 !important;
            z-index: 2 !important;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2) !important;
            letter-spacing: ${isRTL ? '0px' : '0.2px'} !important;
            text-align: center !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
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
            text-align: ${isRTL ? 'right' : 'justify'};
            position: relative;
            border: 1px solid #e9ecef;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            line-height: 1.7;
            direction: ${direction};
        }
        
        .short-desc::before {
            content: '';
            position: absolute;
            top: -8px;
            left: 20px;
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
            text-align: ${isRTL ? 'right' : 'justify'};
            word-break: break-word;
            max-width: 100%;
            overflow-wrap: anywhere;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            position: relative;
            direction: ${direction};
        }
        
        .section-content::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #003366, #0066cc, #4da6ff);
            border-radius: 0 0 0 10px;
        }
        
        .section-content p {
            margin: 0;
            padding: 0;
            word-spacing: normal;
            letter-spacing: normal;
        }
        
        /* إزالة تنسيق العناوين - تظهر كما هي */
        .section-content h1, .section-content h2, .section-content h3, 
        .section-content h4, .section-content h5, .section-content h6 {
            font-weight: inherit;
            margin: 0;
            padding: 0;
            color: inherit;
            line-height: inherit;
            font-size: inherit;
        }
        
        .section-content ul, .section-content ol {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        
        .section-content ul li, .section-content ol li {
            list-style: none;
            list-style-type: none;
            margin: 0;
            padding: 0;
            line-height: inherit;
        }
        
        .section-content ul li::before, .section-content ol li::before {
            display: none !important;
            content: none !important;
        }
        
        .section-content strong, .section-content b {
            font-weight: inherit;
            color: inherit;
        }
        
        .section-content em, .section-content i {
            font-style: inherit;
        }
        
        .section-content u {
            text-decoration: inherit;
        }
        
        .section-content blockquote {
            border: none;
            padding: 0;
            margin: 0;
            font-style: inherit;
            color: inherit;
        }
        
        .section-content code {
            background: inherit;
            padding: 0;
            border: none;
            font-family: inherit;
            font-size: inherit;
        }
        
        .section-content pre {
            background: inherit;
            border: none;
            padding: 0;
            margin: 0;
            overflow: visible;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
        }
        
        .section-content table {
            width: auto;
            border-collapse: separate;
            margin: 0;
            border: none;
        }
        
        .section-content table th,
        .section-content table td {
            border: none;
            padding: 0;
            text-align: inherit;
        }
        
        .section-content table th {
            background: inherit;
            font-weight: inherit;
            color: inherit;
        }
        
        .section-content a {
            color: inherit;
            text-decoration: inherit;
        }
        
        .section-content hr {
            border: none;
            margin: 0;
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
            /* إضافة خصائص لضمان الظهور في PDF */
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
            /* ضمان عدم التداخل */
            margin: 0 !important;
            border: none !important;
            outline: none !important;
            /* ضمان الظهور فوق كل شيء */
            position: fixed !important;
            top: auto !important;
            bottom: 0 !important;
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 0 20px;
            direction: ${direction};
            ${isRTL ? 'flex-direction: row-reverse;' : ''}
        }
        
        .footer-section {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .footer-icon {
            font-size: 16px;
            margin-right: 5px;
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
                padding-bottom: 60px;
                font-size: 12px;
            }
            
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 55px;
                background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%);
                display: flex !important;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: white;
                z-index: 1000;
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                box-shadow: 0 -4px 16px rgba(139, 0, 0, 0.2);
                /* حماية الفوتر في الطباعة */
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .footer-content {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                width: 100% !important;
                padding: 0 20px !important;
                direction: ${direction} !important;
                ${isRTL ? 'flex-direction: row-reverse !important;' : ''}
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
                margin-right: 5px !important;
            }
            
            .section-content {
                font-size: 12px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            
            .section {
                page-break-inside: avoid;
                margin-bottom: 25px;
            }
            
            * {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            @page {
                margin: 20mm 20mm 80px 20mm;
                size: A4;
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
        ${userLogo 
          ? `<div class="header-logo">
               <img src="${userLogo}" alt="Company Logo" 
                    crossorigin="anonymous" 
                    referrerpolicy="no-referrer"
                    loading="eager"
                    style="display: block;"
                    onload="this.style.display='block'; console.log('شعار محمل بنجاح من:', this.src)" 
                    onerror="console.error('خطأ في تحميل الشعار من:', this.src); this.style.display='none';"/>
             </div>`
          : ``
        }
        <div class="header-content">
            <div class="title">${title || ''}</div>
            <div class="subtitle">${t.subtitle}</div>
        </div>
    </div>
    
    ${shortDesc && shortDesc.trim() !== '' ? `<div class="short-desc">${shortDesc}</div>` : ''}
    
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
                <span>${t.footer} - ${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="footer-section">
                <span class="footer-icon">📞</span>
                <span>${isRTL ? '٠٠٢١٦٥٢٠٠٣٣' : '00216520033'}</span>
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
        
        // دالة لضمان ظهور الفوتر مع حماية قوية
        function ensureFooter() {
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
            ensureFooter();
        });
        
        // تشغيل التنظيف والفوتر كل ثانية للتأكد
        setInterval(function() {
            removeAds();
            ensureFooter();
        }, 1000);
        
        // تشغيل فوراً
        setTimeout(function() {
            ensureFooter();
        }, 100);
        
        // تشغيل التنظيف قبل الطباعة
        window.addEventListener('beforeprint', function() {
            removeAds();
            ensureFooter();
            
            // التأكد من ظهور الفوتر في الطباعة
            var footer = document.querySelector('.footer');
            if (footer) {
                footer.style.cssText = 'position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; background: linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%) !important; color: white !important; padding: 15px !important; font-size: 12px !important; display: flex !important; justify-content: center !important; align-items: center !important; z-index: 99999 !important; height: 60px !important; width: 100% !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; page-break-inside: avoid !important; break-inside: avoid !important; visibility: visible !important; opacity: 1 !important;';
            }
            
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
                ensureFooter();
            }, 100);
        });
        
        // تشغيل التنظيف عند النقر على طباعة
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                removeAds();
            }
        });
        
        // تشغيل التنظيف فوراً
        removeAds();
        ensureFooter();
        
        // تأكيد ظهور الفوتر فوراً
        var footerCheck = document.querySelector('.footer');
        if (footerCheck) {
            footerCheck.style.position = 'fixed';
            footerCheck.style.bottom = '0';
            footerCheck.style.left = '0';
            footerCheck.style.right = '0';
            footerCheck.style.display = 'flex';
            footerCheck.style.visibility = 'visible';
            footerCheck.style.opacity = '1';
            footerCheck.style.zIndex = '99999';
            footerCheck.style.background = 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B6B 100%)';
            footerCheck.style.color = 'white';
            footerCheck.style.padding = '15px';
            footerCheck.style.fontSize = '12px';
            footerCheck.style.textAlign = 'center';
            footerCheck.style.height = '60px';
            footerCheck.style.width = '100%';
        }
        
        // حماية الفوتر من الإزالة
        function protectFooter() {
            const footer = document.querySelector('.footer');
            if (footer && !footer.hasAttribute('data-protected')) {
                // إعادة إنشاء الفوتر إذا تم حذفه
                const newFooter = footer.cloneNode(true);
                footer.parentNode.appendChild(newFooter);
                ensureFooter();
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
                            <span>Fiche Technique - \${new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div class="footer-section">
                            <span class="footer-icon">📞</span>
                            <span>00216520033</span>
                        </div>
                    </div>
                </div>\`;
                document.body.insertAdjacentHTML('beforeend', footerHTML);
                ensureFooter();
            }
        }

        // تنظيف شامل كل 500ms للتأكد التام
        setInterval(function() {
            removeAds();
            protectFooter();
            ensureFooter();
            
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
    </script>
</body>
</html>`;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'fr';
  
  try {
    await connectDB();
    const catalogue = await Catalogue.findById(id);
    
    if (!catalogue) {
      return NextResponse.json(
        { error: 'Fiche technique non trouvée' },
        { status: 404 }
      );
    }

        // جلب شعار المستخدم من قاعدة البيانات
    let userLogo = null; // لا نستخدم شعار احتياطي
    
    try {
      // البحث عن المستخدم الإداري الذي لديه شعار الشركة
      const adminUser = await User.findOne({ 
        role: 'ADMIN', 
        companyLogo: { $exists: true, $nin: [null, ''] }
      }).select('companyLogo');
      
      if (adminUser?.companyLogo) {
        // التحقق من أن الرابط يبدأ بـ https والتأكد من صحة الرابط
        if (adminUser.companyLogo.startsWith('https://') && 
            (adminUser.companyLogo.includes('cloudinary.com') || 
             adminUser.companyLogo.includes('res.cloudinary.com'))) {
          // إضافة معاملات Cloudinary لضمان التحميل السريع
          userLogo = adminUser.companyLogo.includes('?') 
            ? `${adminUser.companyLogo}&q_auto,f_auto,w_200,h_150,c_fit`
            : `${adminUser.companyLogo}?q_auto,f_auto,w_200,h_150,c_fit`;
          console.log('تم العثور على شعار المستخدم:', userLogo);
        } else {
          console.log('رابط الشعار غير صالح أو غير آمن:', adminUser.companyLogo);
        }
      } else {
        console.log('لم يتم العثور على مستخدم إداري مع شعار');
      }
    } catch (userError) {
      console.error('خطأ في جلب شعار المستخدم:', userError);
    }

    const htmlContent = generateHTML(catalogue, lang, userLogo || undefined);
    
    // إرجاع HTML للمعاينة أو التحويل في المتصفح
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Language': lang,
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}"`,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}