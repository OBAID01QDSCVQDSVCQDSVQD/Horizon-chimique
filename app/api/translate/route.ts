import { NextRequest, NextResponse } from 'next/server';

// تعيين timeout للدالة (مهم لـ Vercel)
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { text, fromLang, toLang, context } = await request.json();

    if (!text || !fromLang || !toLang) {
      return NextResponse.json(
        { error: 'النص واللغات مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من وجود مفتاح OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY غير موجود في متغيرات البيئة');
      console.error('متغيرات البيئة المتاحة:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
      return NextResponse.json(
        { error: 'مفتاح OpenAI غير مُعرَّف في الخادم' },
        { status: 500 }
      );
    }

    console.log('بدء الترجمة من', fromLang, 'إلى', toLang);
    console.log('API Key موجود:', apiKey ? 'نعم' : 'لا');

    // تحديد أسماء اللغات للـ prompt
    const langNames = {
      ar: 'العربية',
      fr: 'الفرنسية', 
      en: 'الإنجليزية'
    };

    const prompt = `
أنت مترجم محترف متخصص في النصوص التقنية لمواد البناء والكيماويات.

المهمة: ترجم النص التالي من ${langNames[fromLang as keyof typeof langNames]} إلى ${langNames[toLang as keyof typeof langNames]}

النص المراد ترجمته:
"${text}"

${context ? `السياق: هذا النص من قسم "${context}" في فيش تقني لمنتج كيماوي للبناء.` : ''}

شروط الترجمة:
1. احتفظ بالمصطلحات التقنية الدقيقة
2. اجعل الترجمة واضحة ومهنية
3. احتفظ بتنسيق HTML إذا وجد
4. لا تضيف تفسيرات إضافية
5. قدم الترجمة فقط بدون أي نص إضافي

الترجمة:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    console.log('OpenAI Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('لم يتم الحصول على ترجمة من OpenAI');
    }

    return NextResponse.json({ 
      translatedText,
      fromLang,
      toLang,
      originalText: text
    });

  } catch (error) {
    console.error('خطأ في الترجمة:', error);
    return NextResponse.json(
      { error: 'خطأ في خدمة الترجمة' },
      { status: 500 }
    );
  }
} 