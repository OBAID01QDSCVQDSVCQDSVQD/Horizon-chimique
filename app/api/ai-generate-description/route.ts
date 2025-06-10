import { NextRequest, NextResponse } from 'next/server'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received body:', body);
    const { name, features, images } = body;
    const prompt = `Rédige une description marketing professionnelle et attrayante en français pour un produit nommé "${name}"${features ? ` avec les caractéristiques suivantes : ${features}` : ''}. Utilise les images fournies pour enrichir la description. La description doit être courte, persuasive et adaptée à une boutique en ligne.`;

    // Prepare messages for GPT-4 Vision
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(Array.isArray(images) ? images.slice(0, 4).map((url: string) => ({ type: 'image_url', image_url: { url } })) : [])
        ]
      }
    ];

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: messages as any,
      max_tokens: 300,
    });
    const description = completion.data.choices[0].message?.content;
    return NextResponse.json({ description });
  } catch (err: any) {
    console.error('AI Description Error:', err);
    if (err?.response) {
      console.error('OpenAI API error response:', err.response.data);
    }
    return NextResponse.json({ description: '', error: err.message || 'Erreur inconnue', stack: err.stack }, { status: 500 });
  }
}
