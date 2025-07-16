"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiDownload, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Pencil, Trash2, FileText, Smile, X } from 'lucide-react';
import TiptapEditor from '@/components/TiptapEditor';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Catalogue {
  _id: { $oid: string } | string;
  // الحقول الفرنسية (الافتراضية)
  title: string;
  shortdesc: string;
  description: string;
  domaine: string;
  proprietes: string;
  preparation: string;
  conditions: string;
  application: string;
  consommation: string;
  nettoyage: string;
  stockage: string;
  consignes: string;
  
  // الحقول الإنجليزية
  title_en?: string;
  shortdesc_en?: string;
  description_en?: string;
  domaine_en?: string;
  proprietes_en?: string;
  preparation_en?: string;
  conditions_en?: string;
  application_en?: string;
  consommation_en?: string;
  nettoyage_en?: string;
  stockage_en?: string;
  consignes_en?: string;
  
  // الحقول العربية
  title_ar?: string;
  shortdesc_ar?: string;
  description_ar?: string;
  domaine_ar?: string;
  proprietes_ar?: string;
  preparation_ar?: string;
  conditions_ar?: string;
  application_ar?: string;
  consommation_ar?: string;
  nettoyage_ar?: string;
  stockage_ar?: string;
  consignes_ar?: string;
  
  createdAt: string;
  updatedAt: string;
}

export default function AdminCataloguesPage() {
  // CSS مخصص لتحسين التمرير
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #c1c1c1 #f1f1f1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { data: session } = useSession();
  const router = useRouter();
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCatalogue, setEditingCatalogue] = useState<Catalogue | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [formData, setFormData] = useState({
    // الفرنسية (الافتراضية)
    title: '',
    shortdesc: '',
    description: '',
    domaine: '',
    proprietes: '',
    preparation: '',
    conditions: '',
    application: '',
    consommation: '',
    nettoyage: '',
    stockage: '',
    consignes: '',
    
    // الإنجليزية
    title_en: '',
    shortdesc_en: '',
    description_en: '',
    domaine_en: '',
    proprietes_en: '',
    preparation_en: '',
    conditions_en: '',
    application_en: '',
    consommation_en: '',
    nettoyage_en: '',
    stockage_en: '',
    consignes_en: '',
    
    // العربية
    title_ar: '',
    shortdesc_ar: '',
    description_ar: '',
    domaine_ar: '',
    proprietes_ar: '',
    preparation_ar: '',
    conditions_ar: '',
    application_ar: '',
    consommation_ar: '',
    nettoyage_ar: '',
    stockage_ar: '',
    consignes_ar: '',
  });
  
  const [activeTab, setActiveTab] = useState<'fr' | 'en' | 'ar'>('fr');
  const [isTranslating, setIsTranslating] = useState(false);
  const [viewingCatalogue, setViewingCatalogue] = useState<Catalogue | null>(null);
  
  // Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentEmojiField, setCurrentEmojiField] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCatalogues(pagination.page);
  }, [pagination.page]);

  // Emoji picker functions
  const insertEmoji = (emoji: any) => {
    if (!currentEmojiField) return;
    
    const currentContent = (formData as any)[currentEmojiField] || '';
    const newContent = currentContent + emoji.native;
    
    setFormData(prev => ({
      ...prev,
      [currentEmojiField]: newContent
    }));
    
    setShowEmojiPicker(false);
    setCurrentEmojiField(null);
  };

  const openEmojiPicker = (fieldName: string) => {
    setCurrentEmojiField(fieldName);
    setShowEmojiPicker(true);
  };

  // Click outside to close emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setCurrentEmojiField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const fetchCatalogues = async (page = 1) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());
      
      const response = await fetch(`/api/catalogues?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des fiches techniques');
      const data = await response.json();
      
      console.log('Fetched catalogues with translations:', data.catalogues?.map((c: any) => ({
        id: c._id,
        title: c.title,
        title_en: c.title_en,
        title_ar: c.title_ar,
        hasEnglish: !!c.title_en,
        hasArabic: !!c.title_ar
      })));
      
      setCatalogues(data.catalogues || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la récupération des fiches techniques');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCatalogue
        ? `/api/catalogues/${editingCatalogue._id}`
        : '/api/catalogues';
      const method = editingCatalogue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');

      toast.success(
        editingCatalogue
          ? 'Fiche Technique mise à jour avec succès'
          : 'Fiche Technique créée avec succès'
      );
      setIsDialogOpen(false);
      fetchCatalogues(pagination.page);
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde de la fiche technique');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche technique ?')) return;

    try {
      const response = await fetch(`/api/catalogues/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      toast.success('Fiche Technique supprimée avec succès');
      fetchCatalogues(pagination.page);
    } catch (error) {
      console.error('Erreur:', error);
              toast.error('Erreur lors de la suppression de la fiche technique');
    }
  };

  const handleEdit = (catalogue: Catalogue) => {
    console.log('handleEdit called with catalogue:', catalogue);
    console.log('English fields:', {
      title_en: catalogue.title_en,
      description_en: catalogue.description_en,
      shortdesc_en: catalogue.shortdesc_en
    });
    console.log('Arabic fields:', {
      title_ar: catalogue.title_ar,
      description_ar: catalogue.description_ar,
      shortdesc_ar: catalogue.shortdesc_ar
    });
    setEditingCatalogue(catalogue);
    setFormData({
      // الفرنسية
      title: catalogue.title || '',
      shortdesc: catalogue.shortdesc || '',
      description: catalogue.description || '',
      domaine: catalogue.domaine || '',
      proprietes: catalogue.proprietes || '',
      preparation: catalogue.preparation || '',
      conditions: catalogue.conditions || '',
      application: catalogue.application || '',
      consommation: catalogue.consommation || '',
      nettoyage: catalogue.nettoyage || '',
      stockage: catalogue.stockage || '',
      consignes: catalogue.consignes || '',
      
      // الإنجليزية
      title_en: catalogue.title_en || '',
      shortdesc_en: catalogue.shortdesc_en || '',
      description_en: catalogue.description_en || '',
      domaine_en: catalogue.domaine_en || '',
      proprietes_en: catalogue.proprietes_en || '',
      preparation_en: catalogue.preparation_en || '',
      conditions_en: catalogue.conditions_en || '',
      application_en: catalogue.application_en || '',
      consommation_en: catalogue.consommation_en || '',
      nettoyage_en: catalogue.nettoyage_en || '',
      stockage_en: catalogue.stockage_en || '',
      consignes_en: catalogue.consignes_en || '',
      
      // العربية
      title_ar: catalogue.title_ar || '',
      shortdesc_ar: catalogue.shortdesc_ar || '',
      description_ar: catalogue.description_ar || '',
      domaine_ar: catalogue.domaine_ar || '',
      proprietes_ar: catalogue.proprietes_ar || '',
      preparation_ar: catalogue.preparation_ar || '',
      conditions_ar: catalogue.conditions_ar || '',
      application_ar: catalogue.application_ar || '',
      consommation_ar: catalogue.consommation_ar || '',
      nettoyage_ar: catalogue.nettoyage_ar || '',
      stockage_ar: catalogue.stockage_ar || '',
      consignes_ar: catalogue.consignes_ar || '',
    });
    setIsDialogOpen(true);
  };

  // دالة الترجمة التلقائية
  const translateField = async (fieldName: string, fromLang: string, toLang: string) => {
    const sourceField = fromLang === 'fr' ? fieldName : `${fieldName}_${fromLang}`;
    const targetField = toLang === 'fr' ? fieldName : `${fieldName}_${toLang}`;
    
    const sourceText = (formData as any)[sourceField];
    if (!sourceText || !sourceText.trim()) {
      toast.error('Le texte source est vide');
      return;
    }
    
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          fromLang,
          toLang,
          context: fieldName
        }),
      });
      
      if (!response.ok) throw new Error('فشل في الترجمة');
      
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        [targetField]: data.translatedText
      }));
      
              toast.success(`${fieldName} traduit avec succès`);
    } catch (error) {
      console.error('خطأ في الترجمة:', error);
              toast.error('Échec de la traduction');
    } finally {
      setIsTranslating(false);
    }
  };

  // دالة لتنظيف HTML tags من النص
  const stripHtml = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '')
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
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  };

  const resetForm = () => {
    setFormData({
      // الفرنسية (الافتراضية)
      title: '',
      shortdesc: '',
      description: '',
      domaine: '',
      proprietes: '',
      preparation: '',
      conditions: '',
      application: '',
      consommation: '',
      nettoyage: '',
      stockage: '',
      consignes: '',
      
      // الإنجليزية
      title_en: '',
      shortdesc_en: '',
      description_en: '',
      domaine_en: '',
      proprietes_en: '',
      preparation_en: '',
      conditions_en: '',
      application_en: '',
      consommation_en: '',
      nettoyage_en: '',
      stockage_en: '',
      consignes_en: '',
      
      // العربية
      title_ar: '',
      shortdesc_ar: '',
      description_ar: '',
      domaine_ar: '',
      proprietes_ar: '',
      preparation_ar: '',
      conditions_ar: '',
      application_ar: '',
      consommation_ar: '',
      nettoyage_ar: '',
      stockage_ar: '',
      consignes_ar: '',
    });
    setEditingCatalogue(null);
    setShowEmojiPicker(false);
    setCurrentEmojiField(null);
  };

  // Emoji button component
  const EmojiButton = ({ fieldName, className = "" }: { fieldName: string, className?: string }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => openEmojiPicker(fieldName)}
      className={`p-2 hover:bg-blue-100 text-gray-500 hover:text-blue-500 transition ${className}`}
      title="إضافة إيموجي"
    >
      <Smile className="w-4 h-4" />
    </Button>
  );

  // إضافة دالة لتحميل PDF للفرنسية والإنجليزية
  const downloadPDF = async (catalogueId: string, title: string, lang: string = 'fr') => {
    try {
      // فتح نافذة جديدة مع HTML
      const htmlUrl = `/api/catalogues/${catalogueId}/pdf?lang=${lang}`;
      const newWindow = window.open(htmlUrl, '_blank', 'width=900,height=700');
      
      if (newWindow) {
        // انتظار تحميل المحتوى
        newWindow.onload = () => {
          // إضافة زر طباعة في النافذة الجديدة
          const printButton = newWindow.document.createElement('button');
          printButton.innerHTML = lang === 'fr' ? '🖨️ Imprimer / Télécharger PDF' : '🖨️ Print / Download PDF';
          printButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: #003366;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Inter', 'Roboto', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,51,102,0.3);
            transition: all 0.3s ease;
          `;
          
          printButton.onmouseover = () => {
            printButton.style.background = '#004080';
            printButton.style.transform = 'translateY(-2px)';
          };
          
          printButton.onmouseout = () => {
            printButton.style.background = '#003366';
            printButton.style.transform = 'translateY(0)';
          };
          
          printButton.onclick = () => {
            // إخفاء الأزرار والتعليمات قبل الطباعة
            printButton.style.display = 'none';
            instructions.style.display = 'none';
            
            // طباعة مع تأخير قصير
            setTimeout(() => {
              newWindow.print();
              
              // إظهار الأزرار مرة أخرى بعد الطباعة
              setTimeout(() => {
                printButton.style.display = 'block';
                instructions.style.display = 'block';
              }, 1000);
            }, 100);
          };
          
          newWindow.document.body.appendChild(printButton);
          
          // إضافة تعليمات محسنة
          const instructions = newWindow.document.createElement('div');
          const instructionsText = lang === 'fr' ? 
            `<div style="color: #003366; font-weight: 700; margin-bottom: 12px; font-size: 15px;">
               📋 Instructions de téléchargement:
             </div>
             <div style="color: #555;">
               <div style="margin-bottom: 8px;">1️⃣ Cliquez sur "Imprimer / Télécharger PDF"</div>
               <div style="margin-bottom: 8px;">2️⃣ Dans la fenêtre d'impression, choisissez <strong>"Enregistrer au format PDF"</strong></div>
               <div style="margin-bottom: 8px;">3️⃣ Sélectionnez l'emplacement et cliquez <strong>"Enregistrer"</strong></div>
               <div style="margin-top: 12px; padding: 8px; background: #e3f2fd; border-radius: 5px; font-size: 12px;">
                 💡 <strong>Conseil:</strong> Le texte sera affiché avec une police claire et un formatage parfait
               </div>
             </div>` :
            `<div style="color: #003366; font-weight: 700; margin-bottom: 12px; font-size: 15px;">
               📋 Download Instructions:
             </div>
             <div style="color: #555;">
               <div style="margin-bottom: 8px;">1️⃣ Click "Print / Download PDF"</div>
               <div style="margin-bottom: 8px;">2️⃣ In the print window, choose <strong>"Save as PDF"</strong></div>
               <div style="margin-bottom: 8px;">3️⃣ Select location and click <strong>"Save"</strong></div>
               <div style="margin-top: 12px; padding: 8px; background: #e3f2fd; border-radius: 5px; font-size: 12px;">
                 💡 <strong>Tip:</strong> Text will display with clear fonts and perfect formatting
               </div>
             </div>`;
             
          instructions.innerHTML = `
            <div style="
              position: fixed;
              top: 80px;
              right: 20px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              padding: 20px;
              border-radius: 10px;
              border: 2px solid #003366;
              font-family: 'Inter', 'Roboto', Arial, sans-serif;
              font-size: 13px;
              max-width: 320px;
              z-index: 1000;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              line-height: 1.6;
            ">
              ${instructionsText}
            </div>
          `;
          newWindow.document.body.appendChild(instructions);
          
          // إضافة زر إغلاق للتعليمات
          const closeBtn = newWindow.document.createElement('button');
          closeBtn.innerHTML = '×';
          closeBtn.style.cssText = `
            position: fixed;
            top: 85px;
            left: 25px;
            z-index: 1001;
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 8px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            width: 25px;
            height: 25px;
            line-height: 1;
          `;
          
          closeBtn.onclick = () => {
            instructions.style.display = 'none';
            closeBtn.style.display = 'none';
          };
          
          newWindow.document.body.appendChild(closeBtn);
        };
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  // إضافة دالة لتحميل PDF العربي
  const downloadArabicPDF = async (catalogueId: string, title: string) => {
    try {
      // فتح نافذة جديدة مع HTML العربي
      const htmlUrl = `/api/catalogues/${catalogueId}/pdf-arabic`;
      const newWindow = window.open(htmlUrl, '_blank', 'width=900,height=700');
      
      if (newWindow) {
        // انتظار تحميل المحتوى
        newWindow.onload = () => {
          // إضافة زر طباعة في النافذة الجديدة
          const printButton = newWindow.document.createElement('button');
          printButton.innerHTML = '🖨️ طباعة / تحميل PDF';
          printButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: #003366;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,51,102,0.3);
            transition: all 0.3s ease;
          `;
          
          printButton.onmouseover = () => {
            printButton.style.background = '#004080';
            printButton.style.transform = 'translateY(-2px)';
          };
          
          printButton.onmouseout = () => {
            printButton.style.background = '#003366';
            printButton.style.transform = 'translateY(0)';
          };
          
          printButton.onclick = () => {
            // إخفاء الأزرار والتعليمات قبل الطباعة
            printButton.style.display = 'none';
            instructions.style.display = 'none';
            
            // طباعة مع تأخير قصير
            setTimeout(() => {
              newWindow.print();
              
              // إظهار الأزرار مرة أخرى بعد الطباعة
              setTimeout(() => {
                printButton.style.display = 'block';
                instructions.style.display = 'block';
              }, 1000);
            }, 100);
          };
          
          newWindow.document.body.appendChild(printButton);
          
          // إضافة تعليمات محسنة
          const instructions = newWindow.document.createElement('div');
          instructions.innerHTML = `
            <div style="
              position: fixed;
              top: 80px;
              right: 20px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              padding: 20px;
              border-radius: 10px;
              border: 2px solid #003366;
              font-family: 'Noto Sans Arabic', Arial, sans-serif;
              font-size: 13px;
              max-width: 320px;
              z-index: 1000;
              box-shadow: 0 4px 16px rgba(0,0,0,0.1);
              line-height: 1.6;
            ">
              <div style="color: #003366; font-weight: 700; margin-bottom: 12px; font-size: 15px;">
                📋 تعليمات التحميل:
              </div>
              <div style="color: #555;">
                <div style="margin-bottom: 8px;">1️⃣ اضغط على زر "طباعة / تحميل PDF"</div>
                <div style="margin-bottom: 8px;">2️⃣ في نافذة الطباعة، اختر <strong>"حفظ كـ PDF"</strong></div>
                <div style="margin-bottom: 8px;">3️⃣ حدد مكان الحفظ واضغط <strong>"حفظ"</strong></div>
                <div style="margin-top: 12px; padding: 8px; background: #e3f2fd; border-radius: 5px; font-size: 12px;">
                  💡 <strong>نصيحة:</strong> النص العربي سيظهر بخط جميل ومنسق مع دعم كامل للرجوع للسطر
                </div>
              </div>
            </div>
          `;
          newWindow.document.body.appendChild(instructions);
          
          // إضافة زر إغلاق للتعليمات
          const closeBtn = newWindow.document.createElement('button');
          closeBtn.innerHTML = '✖️';
          closeBtn.style.cssText = `
            position: fixed;
            top: 85px;
            left: 25px;
            z-index: 1001;
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 8px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 10px;
            width: 25px;
            height: 25px;
          `;
          
          closeBtn.onclick = () => {
            instructions.style.display = 'none';
            closeBtn.style.display = 'none';
          };
          
          newWindow.document.body.appendChild(closeBtn);
        };
      }
    } catch (error) {
      console.error('خطأ في تحميل PDF العربي:', error);
      alert('حدث خطأ في تحميل PDF العربي');
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fiche Technique</CardTitle>
            <CardDescription>
              Gérez les fiches techniques de produits
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Fiche Technique
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCatalogue ? 'Modifier la Fiche Technique' : 'Nouvelle Fiche Technique'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                {/* Language Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('fr')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'fr'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('en')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-base ${
                      activeTab === 'en'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🇬🇧 Anglais
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ar')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'ar'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🇹🇳 العربية
                  </button>
                </div>

                {/* Content for each language */}
                {activeTab === 'fr' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contenu en Français</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="title" className="text-right">Titre</label>
                  <Input
                    id="title"
                    value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="shortdesc" className="block text-left">Courte Description</label>
                        <EmojiButton fieldName="shortdesc" />
                      </div>
                      <TiptapEditor
                        content={formData.shortdesc}
                        onChange={(newContent) => setFormData({ ...formData, shortdesc: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-left">Description</label>
                        <EmojiButton fieldName="description" />
                      </div>
                      <TiptapEditor
                        content={formData.description}
                        onChange={(newContent) => setFormData({ ...formData, description: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="domaine" className="block text-left">Domaine</label>
                        <EmojiButton fieldName="domaine" />
                      </div>
                      <TiptapEditor
                        content={formData.domaine}
                        onChange={(newContent) => setFormData({ ...formData, domaine: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="proprietes" className="block text-left">Caractéristiques et Avantages</label>
                        <EmojiButton fieldName="proprietes" />
                      </div>
                      <TiptapEditor
                        content={formData.proprietes}
                        onChange={(newContent) => setFormData({ ...formData, proprietes: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="preparation" className="block text-left">Préparation du support</label>
                        <EmojiButton fieldName="preparation" />
                      </div>
                      <TiptapEditor
                        content={formData.preparation}
                        onChange={(newContent) => setFormData({ ...formData, preparation: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="conditions" className="block text-left">Conditions d'application</label>
                        <EmojiButton fieldName="conditions" />
                      </div>
                      <TiptapEditor
                        content={formData.conditions}
                        onChange={(newContent) => setFormData({ ...formData, conditions: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="application" className="block text-left">Application</label>
                        <EmojiButton fieldName="application" />
                      </div>
                      <TiptapEditor
                        content={formData.application}
                        onChange={(newContent) => setFormData({ ...formData, application: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="consommation" className="block text-left">Consommation</label>
                        <EmojiButton fieldName="consommation" />
                      </div>
                      <TiptapEditor
                        content={formData.consommation}
                        onChange={(newContent) => setFormData({ ...formData, consommation: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="nettoyage" className="block text-left">Nettoyage du Matériel</label>
                        <EmojiButton fieldName="nettoyage" />
                      </div>
                      <TiptapEditor
                        content={formData.nettoyage}
                        onChange={(newContent) => setFormData({ ...formData, nettoyage: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="stockage" className="block text-left">Stockage</label>
                        <EmojiButton fieldName="stockage" />
                      </div>
                      <TiptapEditor
                        content={formData.stockage}
                        onChange={(newContent) => setFormData({ ...formData, stockage: newContent })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="consignes" className="block text-left">Consignes de sécurité</label>
                        <EmojiButton fieldName="consignes" />
                      </div>
                      <TiptapEditor
                        content={formData.consignes}
                        onChange={(newContent) => setFormData({ ...formData, consignes: newContent })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'en' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Contenu Anglais</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Auto-translate all fields from French to English
                          const fields = ['title', 'shortdesc', 'description', 'domaine', 'proprietes', 'preparation', 'conditions', 'application', 'consommation', 'nettoyage', 'stockage', 'consignes'];
                          fields.forEach(field => translateField(field, 'fr', 'en'));
                        }}
                        disabled={isTranslating}
                      >
                        {isTranslating ? 'Traduction en cours...' : '🔄 Traduction automatique depuis le français'}
                      </Button>
                    </div>
                                         <div className="grid grid-cols-4 items-center gap-4">
                       <label className="text-right">Titre</label>
                       <div className="col-span-3 flex gap-2">
                         <Input
                           value={formData.title_en}
                           onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                           className="flex-1"
                         />
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => translateField('title', 'fr', 'en')}
                           disabled={isTranslating}
                         >
                           🔄
                         </Button>
                       </div>
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Courte Description</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="shortdesc_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('shortdesc', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.shortdesc_en}
                         onChange={(newContent) => setFormData({ ...formData, shortdesc_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Description</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="description_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('description', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.description_en}
                         onChange={(newContent) => setFormData({ ...formData, description_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Domaine d'application</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="domaine_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('domaine', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.domaine_en}
                         onChange={(newContent) => setFormData({ ...formData, domaine_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Caractéristiques et Avantages</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="proprietes_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('proprietes', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.proprietes_en}
                         onChange={(newContent) => setFormData({ ...formData, proprietes_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Préparation du support</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="preparation_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('preparation', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.preparation_en}
                         onChange={(newContent) => setFormData({ ...formData, preparation_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Conditions d'application</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="conditions_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('conditions', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.conditions_en}
                         onChange={(newContent) => setFormData({ ...formData, conditions_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Application</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="application_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('application', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.application_en}
                         onChange={(newContent) => setFormData({ ...formData, application_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Consommation</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="consommation_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('consommation', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.consommation_en}
                         onChange={(newContent) => setFormData({ ...formData, consommation_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Nettoyage des équipements</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="nettoyage_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('nettoyage', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.nettoyage_en}
                         onChange={(newContent) => setFormData({ ...formData, nettoyage_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Stockage</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="stockage_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('stockage', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.stockage_en}
                         onChange={(newContent) => setFormData({ ...formData, stockage_en: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-left">Consignes de sécurité</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="consignes_en" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('consignes', 'fr', 'en')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.consignes_en}
                         onChange={(newContent) => setFormData({ ...formData, consignes_en: newContent })}
                       />
                     </div>
                  </div>
                )}

                {activeTab === 'ar' && (
                  <div className="space-y-4" dir="rtl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">المحتوى العربي</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Auto-translate all fields from French to Arabic
                          const fields = ['title', 'shortdesc', 'description', 'domaine', 'proprietes', 'preparation', 'conditions', 'application', 'consommation', 'nettoyage', 'stockage', 'consignes'];
                          fields.forEach(field => translateField(field, 'fr', 'ar'));
                        }}
                        disabled={isTranslating}
                      >
                        {isTranslating ? 'جاري الترجمة...' : '🔄 ترجمة تلقائية من الفرنسية'}
                      </Button>
                    </div>
                                         <div className="grid grid-cols-4 items-center gap-4">
                       <label className="text-right">العنوان</label>
                       <div className="col-span-3 flex gap-2">
                         <Input
                           value={formData.title_ar}
                           onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                           className="flex-1"
                         />
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => translateField('title', 'fr', 'ar')}
                           disabled={isTranslating}
                         >
                           🔄
                         </Button>
                       </div>
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">الوصف المختصر</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="shortdesc_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('shortdesc', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.shortdesc_ar}
                         onChange={(newContent) => setFormData({ ...formData, shortdesc_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">الوصف</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="description_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('description', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.description_ar}
                         onChange={(newContent) => setFormData({ ...formData, description_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">مجال التطبيق</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="domaine_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('domaine', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.domaine_ar}
                         onChange={(newContent) => setFormData({ ...formData, domaine_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">الخصائص والمزايا</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="proprietes_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('proprietes', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.proprietes_ar}
                         onChange={(newContent) => setFormData({ ...formData, proprietes_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">تحضير السطح</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="preparation_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('preparation', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.preparation_ar}
                         onChange={(newContent) => setFormData({ ...formData, preparation_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">شروط التطبيق</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="conditions_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('conditions', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.conditions_ar}
                         onChange={(newContent) => setFormData({ ...formData, conditions_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">التطبيق</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="application_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('application', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.application_ar}
                         onChange={(newContent) => setFormData({ ...formData, application_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">الاستهلاك</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="consommation_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('consommation', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.consommation_ar}
                         onChange={(newContent) => setFormData({ ...formData, consommation_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">تنظيف المعدات</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="nettoyage_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('nettoyage', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.nettoyage_ar}
                         onChange={(newContent) => setFormData({ ...formData, nettoyage_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">التخزين</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="stockage_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('stockage', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.stockage_ar}
                         onChange={(newContent) => setFormData({ ...formData, stockage_ar: newContent })}
                       />
                     </div>
                     
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block text-right">تعليمات السلامة</label>
                         <div className="flex gap-2">
                           <EmojiButton fieldName="consignes_ar" />
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             onClick={() => translateField('consignes', 'fr', 'ar')}
                             disabled={isTranslating}
                           >
                             🔄
                           </Button>
                         </div>
                       </div>
                       <TiptapEditor
                         content={formData.consignes_ar}
                         onChange={(newContent) => setFormData({ ...formData, consignes_ar: newContent })}
                       />
                     </div>
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="fixed z-50"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 350,
                      maxWidth: '95vw',
                      borderRadius: 16,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      background: 'var(--background, #fff)'
                    }}
                  >
                    <Picker
                      data={data}
                      locale="fr"
                      theme="auto"
                      onEmojiSelect={insertEmoji}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> En cours...</span>
                    ) : (
                      editingCatalogue ? 'Mettre à jour' : 'Créer'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Courte Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogues.map((catalogue) => {
                  const catalogueId = typeof catalogue._id === 'object' && '$oid' in catalogue._id
                    ? catalogue._id.$oid
                    : String(catalogue._id);

                  return (
                    <TableRow key={catalogueId as string}>
                      <TableCell>{catalogue.title}</TableCell>
                      <TableCell>{stripHtml(catalogue.shortdesc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingCatalogue(catalogue)}
                          >
                            <FiEye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(catalogue)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(catalogueId)}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => downloadPDF(catalogueId, catalogue.title, 'fr')}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2"
                              title="Télécharger en français (HTML to PDF)"
                            >
                              FR
                            </button>
                            <button
                              onClick={() => downloadPDF(catalogueId, catalogue.title, 'en')}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-blue-500 text-white shadow-sm hover:bg-blue-600 h-9 px-2 py-2"
                              title="Télécharger en anglais (HTML to PDF)"
                            >
                              EN
                            </button>
                            <button
                              onClick={() => downloadArabicPDF(catalogueId, catalogue.title)}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-green-500 text-white shadow-sm hover:bg-green-600 h-9 px-2 py-2"
                              title="تحميل باللغة العربية (HTML to PDF)"
                            >
                              AR
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className="text-sm text-gray-600">
                Affichage {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                sur {pagination.total} fiches techniques
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCatalogues(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Précédent
                </Button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchCatalogues(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCatalogues(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingCatalogue} onOpenChange={() => setViewingCatalogue(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                            <DialogTitle className="text-xl font-bold text-gray-800">Détails de la Fiche Technique</DialogTitle>
              </DialogHeader>
              {viewingCatalogue && (
            <div className="grid gap-4 overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Titre</h3>
                <p className="text-gray-800">{viewingCatalogue.title}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Courte Description</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.shortdesc)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Description</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.description)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Domaine</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.domaine)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Caractéristiques et Avantages</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.proprietes)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Préparation</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.preparation)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Conditions</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.conditions)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Application</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.application)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Consommation</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.consommation)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Nettoyage</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.nettoyage)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Stockage</h3>
                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.stockage)}</p>
                  </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg text-blue-600 mb-2">Consignes</h3>
                                <p className="text-gray-800 whitespace-pre-line">{stripHtml(viewingCatalogue.consignes)}</p>
                  </div>
                  <div className="h-4"></div> {/* مساحة إضافية في النهاية */}
                  </div>
              )}
            </DialogContent>
          </Dialog>
    </div>
  );
} 