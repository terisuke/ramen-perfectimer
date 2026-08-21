import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const publicDir = `${repoRoot}public/`;

const manifest = JSON.parse(
  readFileSync(`${publicDir}manifest.json`, 'utf-8')
) as {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
};

const layoutSource = readFileSync(`${repoRoot}src/app/layout.tsx`, 'utf-8');

describe('PWA manifest', () => {
  // インストール可能性に必要な最小欄。空文字も欠落として扱う。
  it.each([
    'name',
    'short_name',
    'start_url',
    'scope',
    'display',
    'background_color',
    'theme_color',
  ] as const)('declares a non-empty %s', (field) => {
    expect(manifest[field]).toBeTypeOf('string');
    expect(manifest[field]).not.toHaveLength(0);
  });

  it('requests standalone display', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('ships at least one icon', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  // icons: [] のままだと Chrome はインストール可能と判定しない。
  // 宣言だけで満足せず、実体が public/ にあることまで見る。
  it.each([['any'], ['maskable']])(
    'declares a %s-purpose icon whose file exists',
    (purpose) => {
      const icon = manifest.icons.find((entry) =>
        entry.purpose.split(/\s+/).includes(purpose)
      );
      expect(icon, `no icon with purpose "${purpose}"`).toBeDefined();
      expect(icon!.src.startsWith('/')).toBe(true);

      const asset = readFileSync(`${publicDir}${icon!.src.slice(1)}`, 'utf-8');
      expect(asset.length).toBeGreaterThan(0);
      expect(asset).toContain('<svg');
    }
  );
});

describe('manifest ↔ layout metadata', () => {
  // theme_color は manifest と layout.tsx の 2 箇所にある。
  // 片方だけ変えると、この検査が両方の観測値を出して落ちる。
  it('keeps theme_color identical on both sides', () => {
    const declared = manifest.theme_color;
    const enforced = layoutSource.match(/themeColor:\s*'([^']+)'/)?.[1];

    expect(
      enforced,
      'layout.tsx has no themeColor in its viewport export'
    ).toBeDefined();
    expect(
      enforced,
      `theme_color drifted: public/manifest.json=${declared} ` +
        `src/app/layout.tsx=${enforced}`
    ).toBe(declared);
  });

  it('links the manifest and the icon from layout metadata', () => {
    expect(layoutSource).toContain("manifest: '/manifest.json'");
    expect(layoutSource).toContain("icon: '/icon.svg'");
    expect(layoutSource).toContain("apple: '/icon.svg'");
  });
});
