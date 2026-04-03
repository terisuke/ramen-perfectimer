import { NextRequest, NextResponse } from 'next/server';
import productsData from '@/data/products.json';

const products = productsData.products;
const productList = products.map(p => ({ id: p.id, name: p.name, maker: p.maker }));

interface IdentifyResult {
  productId: string;
  name: string;
  maker: string;
  optimalTime: number;
  reason: string;
  engine: 'gemma4' | 'gemini' | 'fallback';
}

async function identifyWithOllama(imageBase64: string): Promise<{ id: string | null; confidence: number } | null> {
  try {
    const systemPrompt = `あなたはカップラーメン専門の画像認識アシスタントです。
パッケージ写真から商品を特定し、以下のリストから一致するidを返してください。
見つからない場合は id: null としてください。

商品リスト:
${JSON.stringify(productList)}

出力形式: {"id": "product-id-or-null", "confidence": 0.0-1.0}
JSONのみを出力してください。`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma4:e2b',
        messages: [{ role: 'user', content: systemPrompt, images: [imageBase64] }],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) return null;

    const data = await response.json();
    const content: string = data.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return { id: parsed.id || null, confidence: Number(parsed.confidence) || 0 };
  } catch {
    return null;
  }
}

async function identifyWithGemini(imageBase64: string, mimeType: string): Promise<{ id: string | null; confidence: number } | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `あなたはカップラーメン専門の画像認識アシスタントです。
パッケージ写真から商品を特定し、以下のリストから一致するidを返してください。
見つからない場合は id: null としてください。

商品リスト:
${JSON.stringify(productList)}

出力形式: {"id": "product-id-or-null", "confidence": 0.0-1.0}
JSONのみを出力してください。`;

    const result = await model.generateContent([
      systemPrompt,
      { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
    ]);

    const content = result.response.text();
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return { id: parsed.id || null, confidence: Number(parsed.confidence) || 0 };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'NO_IMAGE', message: '画像を送信してください' },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const ollamaResult = await identifyWithOllama(base64);

    let identifiedId: string | null = null;
    let engine: 'gemma4' | 'gemini' | 'fallback' = 'gemma4';

    if (ollamaResult && ollamaResult.id && ollamaResult.confidence > 0.7) {
      identifiedId = ollamaResult.id;
      engine = 'gemma4';
    } else {
      const geminiResult = await identifyWithGemini(base64, mimeType);
      if (geminiResult && geminiResult.id && geminiResult.confidence > 0.7) {
        identifiedId = geminiResult.id;
        engine = 'gemini';
      }
    }

    if (!identifiedId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', suggestion: 'manual', message: 'カップラーメンのパッケージ写真を撮ってね' },
        { status: 404 }
      );
    }

    const product = products.find(p => p.id === identifiedId);
    if (!product) {
      return NextResponse.json(
        { error: 'NOT_FOUND', suggestion: 'manual', message: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    const result: IdentifyResult = {
      productId: product.id,
      name: product.name,
      maker: product.maker,
      optimalTime: product.optimalTime,
      reason: product.reason,
      engine,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Identification error:', error);
    return NextResponse.json(
      { error: 'RECOGNITION_FAILED', suggestion: 'manual' },
      { status: 500 }
    );
  }
}
