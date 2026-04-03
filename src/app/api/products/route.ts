import { NextRequest, NextResponse } from 'next/server';
import productsData from '@/data/products.json';
import type { Product } from '@/lib/types';

const products = productsData.products as Product[];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        maker: product.maker,
        optimalTime: product.optimalTime,
      })),
    });
  }

  const matched = products.filter((product) => {
    const searchStr = `${product.name} ${product.maker} ${product.keywords.join(' ')}`.toLowerCase();
    return searchStr.includes(query);
  });

  return NextResponse.json({
    products: matched.map((product) => ({
      id: product.id,
      name: product.name,
      maker: product.maker,
      optimalTime: product.optimalTime,
    })),
  });
}
