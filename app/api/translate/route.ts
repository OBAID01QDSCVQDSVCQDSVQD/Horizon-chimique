import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, fromLang, toLang, context } = await request.json();

    if (!text || !fromLang || !toLang) {
      return NextResponse.json(
        { error: 'النص واللغات مطلوبة' },
        { status: 400 }
      );
    }

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
        temperature: 0.3, // قليل للحصول على ترجمة متسقة
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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