import { NextRequest, NextResponse } from 'next/server';
import productsData from '@/data/products.json';

const products = productsData.products;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({
      products: products.map(p => ({
        id: p.id, name: p.name, maker: p.maker, optimalTime: p.optimalTime,
      })),
    });
  }

  const matched = products.filter(p => {
    const searchStr = `${p.name} ${p.maker} ${p.keywords.join(' ')}`.toLowerCase();
    return searchStr.includes(query);
  });

  return NextResponse.json({
    products: matched.map(p => ({
      id: p.id, name: p.name, maker: p.maker, optimalTime: p.optimalTime,
    })),
  });
}
