import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/products/route';
import productsData from '@/data/products.json';

const ALL_PRODUCTS = productsData.products;

interface ProductSummary {
  id: string;
  name: string;
  maker: string;
  optimalTime: number;
}

async function search(rawQuery?: string): Promise<ProductSummary[]> {
  const url = new URL('http://localhost/api/products');
  if (rawQuery !== undefined) {
    url.searchParams.set('q', rawQuery);
  }

  const response = await GET(new NextRequest(url));
  expect(response.status).toBe(200);

  const body = (await response.json()) as { products: ProductSummary[] };
  return body.products;
}

function productById(id: string) {
  const product = ALL_PRODUCTS.find(p => p.id === id);
  if (!product) throw new Error(`fixture missing: ${id}`);
  return product;
}

describe('GET /api/products — empty query axis', () => {
  it('returns every product when q is absent', async () => {
    const products = await search();
    expect(products).toHaveLength(ALL_PRODUCTS.length);
  });

  it('returns every product when q is present but empty', async () => {
    const products = await search('');
    expect(products).toHaveLength(ALL_PRODUCTS.length);
  });

  it('returns every product when q is only whitespace-free but blank after trim-less lookup', async () => {
    // The route treats '' as "no filter"; a non-empty query must actually filter.
    expect(await search('')).toHaveLength(ALL_PRODUCTS.length);
    expect((await search('存在しない商品名')).length).toBe(0);
  });
});

describe('GET /api/products — matched field axis', () => {
  it('matches on name', async () => {
    const products = await search('カップヌードル');
    expect(products.length).toBeGreaterThan(0);
    expect(products.every(p => p.name.includes('カップヌードル'))).toBe(true);
  });

  it('matches on maker even when the name does not contain the query', async () => {
    const query = 'まるか食品';
    const peyoung = productById('peyoung-sauce-yakisoba');

    // Guards the fixture: this query must be maker-only, otherwise the test
    // would still pass with `maker` dropped from the search string.
    expect(peyoung.maker).toContain(query);
    expect(peyoung.name).not.toContain(query);
    expect(peyoung.keywords.join(' ')).not.toContain(query);

    const products = await search(query);
    expect(products.map(p => p.id)).toContain('peyoung-sauce-yakisoba');
  });

  it('matches on keywords even when name and maker do not contain the query', async () => {
    const query = 'ノンフライ';
    const raoh = productById('raoh');

    // Fixture guard: keyword-only, so dropping `keywords` from the search
    // string is the only way this assertion can fail.
    expect(raoh.keywords.join(' ')).toContain(query);
    expect(raoh.name).not.toContain(query);
    expect(raoh.maker).not.toContain(query);

    const products = await search(query);
    expect(products.map(p => p.id)).toContain('raoh');
  });
});

describe('GET /api/products — case sensitivity axis', () => {
  it('finds an uppercase-stored product from a lowercase query', async () => {
    const qtta = productById('qtta-koku-shoyu');
    expect(qtta.name).toContain('QTTA'); // stored uppercase

    const products = await search('qtta'); // queried lowercase
    expect(products.map(p => p.id)).toContain('qtta-koku-shoyu');
  });

  it('finds a lowercase query and its uppercase form identically', async () => {
    const lower = await search('u.f.o.');
    const upper = await search('U.F.O.');
    expect(lower.map(p => p.id)).toEqual(upper.map(p => p.id));
    expect(lower.map(p => p.id)).toContain('ufo');
  });
});

describe('GET /api/products — no-match axis', () => {
  it('returns an empty list rather than all products for an unmatched query', async () => {
    const products = await search('存在しない商品名');
    expect(products).toEqual([]);
  });
});

// The route projects the response in two independent branches: the unfiltered
// early return and the filtered return. Both are asserted, otherwise removing
// the projection from just one branch leaves the suite green.
describe.each([
  { branch: 'unfiltered branch (no q)', query: undefined },
  { branch: 'filtered branch (q matches)', query: 'カップヌードル' },
])('GET /api/products — response projection, $branch', ({ query }) => {
  it('exposes only id, name, maker and optimalTime', async () => {
    const products = await search(query);
    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      expect(Object.keys(product).sort()).toEqual(['id', 'maker', 'name', 'optimalTime']);
    }
  });

  it('does not leak reason, keywords or category', async () => {
    const products = (await search(query)) as unknown as Record<string, unknown>[];
    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      expect(product.reason).toBeUndefined();
      expect(product.keywords).toBeUndefined();
      expect(product.category).toBeUndefined();
    }
  });
});

describe('GET /api/products — response value types', () => {
  it('preserves optimalTime as a number', async () => {
    const products = await search('カップヌードル');
    for (const product of products) {
      expect(typeof product.optimalTime).toBe('number');
      expect(Number.isFinite(product.optimalTime)).toBe(true);
    }
  });
});
