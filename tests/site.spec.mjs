import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const FEATURED = ['dedupr', 'comfy-mobile-harness', 'torsync', 'soundtouch-alarm', 'torbox-webapp'];
const MORE = ['ppsa', 'routine-scheduler-flask', 'visoswap'];
const PRIVATE = ['comfy-mobile-harness', 'torbox-webapp'];
const PUBLIC = [...FEATURED, ...MORE].filter((s) => !PRIVATE.includes(s));
// Extra forbidden words live in a gitignored local file so they are never published.
const LOCAL_FORBIDDEN = new URL('./forbidden.local.json', import.meta.url);
const FORBIDDEN = ['mailto:', 'dose-calc', ...(existsSync(LOCAL_FORBIDDEN) ? JSON.parse(readFileSync(LOCAL_FORBIDDEN, 'utf8')) : [])];

test.beforeEach(async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBe(true);
  await expect(page.locator('.prompt')).toBeVisible();
});

test('hero shows prompt and GitHub link', async ({ page }) => {
  await expect(page.locator('.prompt')).toContainText('kaiser62@github:~$ whoami');
  await expect(page.locator('a[href="https://github.com/kaiser62"]').first()).toBeVisible();
});

test('featured and more sections contain exactly the curated projects', async ({ page }) => {
  const featured = await page.locator('#featured [data-slug]').evaluateAll((els) => els.map((e) => e.dataset.slug));
  const more = await page.locator('#more [data-slug]').evaluateAll((els) => els.map((e) => e.dataset.slug));
  expect(featured).toEqual(FEATURED);
  expect(more).toEqual(MORE);
});

for (const slug of PRIVATE) {
  test(`private project ${slug} has badge and no repo link`, async ({ page }) => {
    const item = page.locator(`[data-slug="${slug}"]`);
    await expect(item.locator('.badge-private')).toHaveCount(1);
    await expect(item.locator(`a[href*="github.com/kaiser62/${slug}"]`)).toHaveCount(0);
    await expect(item.locator('time')).toHaveCount(0);
  });
}

for (const slug of PUBLIC) {
  test(`public project ${slug} links to its repo`, async ({ page }) => {
    const item = page.locator(`[data-slug="${slug}"]`);
    await expect(item.locator(`a[href="https://github.com/kaiser62/${slug}"]`)).toHaveCount(1);
    await expect(item.locator('.badge-private')).toHaveCount(0);
    const t = item.locator('time[datetime]');
    await expect(t).toHaveCount(1);
    await expect(t).toHaveText(/^(today|\d+(d|w|mo|y) ago)$/);
  });
}

test('no identity leaks or excluded repos in markup', async ({ page }) => {
  const html = await page.content();
  for (const word of FORBIDDEN) expect(html, `found "${word}"`).not.toContain(word);
});

test('no horizontal scroll', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('theme toggle flips theme and persists across reload', async ({ page }) => {
  const before = await page.evaluate(
    () => document.documentElement.dataset.theme || 'dark',
  );
  await page.locator('#theme-toggle').click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).toBe(before === 'dark' ? 'light' : 'dark');
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});

test('dark is default even when OS prefers light', async ({ page }) => {
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(13, 17, 23)');
});

async function contrastRatios(page) {
  return await page.evaluate(() => {
    const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const bg = parse(getComputedStyle(document.body).backgroundColor);
    const out = {};
    for (const sel of ['body', '.muted', '.accent']) {
      const el = document.querySelector(sel);
      out[sel] = ratio(parse(getComputedStyle(el).color), bg);
    }
    return out;
  });
}

test('text meets WCAG AA contrast in dark mode', async ({ page }) => {
  const ratios = await contrastRatios(page);
  for (const [sel, r] of Object.entries(ratios)) expect(r, `${sel} contrast ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
});

test('text meets WCAG AA contrast in light mode', async ({ page }) => {
  await page.locator('#theme-toggle').click();
  const ratios = await contrastRatios(page);
  for (const [sel, r] of Object.entries(ratios)) expect(r, `${sel} contrast ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
});

