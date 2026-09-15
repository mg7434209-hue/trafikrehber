const { test, expect } = require('@playwright/test');
const visitorNumber = page => page.locator('.visitor-counter strong');
const count = async request => (await (await request.get('/api/stats/visitors')).json()).total_visitors;
const tr = n => n.toLocaleString('tr-TR');

test('visitor persists across refreshes and tabs; another browser adds one', async ({ page, context, browser, request, baseURL }) => {
  const before = await count(request);
  await page.goto('/');
  await expect(visitorNumber(page)).toHaveText(tr(before + 1));
  await page.reload();
  await expect(visitorNumber(page)).toHaveText(tr(before + 1));
  const tab = await context.newPage(); await tab.goto('/blog');
  await expect(visitorNumber(tab)).toHaveText(tr(before + 1));
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage(); await otherPage.goto('/');
  await expect(visitorNumber(otherPage)).toHaveText(tr(before + 2));
  await other.close();
});

test('blocked browser storage reads the total without adding visits', async ({ page, request }) => {
  const before = await count(request);
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
  await page.goto('/'); await expect(visitorNumber(page)).toHaveText(tr(before));
  await page.reload(); await expect(visitorNumber(page)).toHaveText(tr(before));
});

test('counter failure is visible and retries when connection returns', async ({ page }) => {
  await page.route('**/api/stats/visit', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"Temporarily unavailable"}' }));
  await page.goto('/'); await expect(visitorNumber(page)).toHaveText('—');
  await expect(page.getByText('Sayaç şu an güncellenemiyor')).toBeVisible();
  await page.unroute('**/api/stats/visit');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(visitorNumber(page)).toHaveText(/1\.\d{3}/);
});

test('search, pagination, deep category routes and sanitized article content', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Rehberlerde ara').fill('Test rehber 0');
  await page.getByRole('button', { name: 'Ara', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Test rehber 0');
  await expect(page.getByRole('link', { name: /Test rehber 0/ })).toHaveCount(1);
  await page.goto('/blog'); await expect(page.locator('.guide-card')).toHaveCount(12);
  await page.getByRole('link', { name: 'Sonraki →' }).click();
  await expect(page.locator('.guide-card')).toHaveCount(2);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://www.cezarehberi.com/blog?page=2');
  await page.goto('/sigorta/trafik-sigortasi');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sigorta');
  await expect(page.getByRole('link', { name: /Test rehber 1/ }).first()).toBeVisible();
  await page.goto('/blog/test-rehber-0');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Test rehber 0');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('.article-content [onerror], .article-content script')).toHaveCount(0);
  await page.goto('/blog/missing');
  await expect(page.getByRole('heading', { name: /bulunamadı/i })).toBeVisible();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
});

test('Turkish fine search opens a preselected calculator with correct rounding', async ({ page }) => {
  await page.goto('/trafik-cezalari-2026');
  await page.getByLabel('İhlal veya madde kodu ara').fill('KIRMIZI');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('75,02');
  await page.getByRole('link', { name: 'Kırmızı ışık ihlali (test) için hesapla' }).click();
  await expect(page.getByLabel('Ceza türü')).not.toHaveValue('');
  await page.getByRole('button', { name: 'Ödeme örneğini hesapla' }).click();
  await expect(page.locator('.calculation-result')).toContainText('75,02');
});

test('petition preserves literal replacement characters and offers TXT download', async ({ page }) => {
  await page.goto('/dilekce-ornekleri/test-dilekce');
  await page.getByLabel('Ad Soyad', { exact: true }).fill('Deniz $&');
  await page.getByLabel('Araç Plakası', { exact: true }).fill('34 TEST 1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Metin Olarak İndir/ }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString('utf8')).toContain('Başvuran: Deniz $&');
});

test('mobile routes, menu keyboard behavior and chat fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/'); await page.getByRole('button', { name: 'Reddet', exact: true }).click();
  console.log('REVIEW_MOBILE:' + (await page.screenshot({ type: 'jpeg', quality: 60 })).toString('base64'));
  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await expect(page.getByRole('navigation', { name: 'Ana menü' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Menüyü aç' })).toBeFocused();
  for (const path of ['/', '/blog', '/trafik-cezalari-2026', '/araclar/ceza-hesapla', '/dilekce-ornekleri', '/dilekce-ornekleri/test-dilekce']) {
    await page.goto(path); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
  }
  await page.getByRole('button', { name: 'Rehber AI sohbetini aç' }).click();
  await expect(page.getByLabel('Mesajınız')).toBeFocused();
  const box = await page.locator('.chat-panel').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(375);
  expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(812);
  await page.keyboard.press('Escape'); await expect(page.locator('.chat-panel')).toHaveCount(0);
});

test('metadata, consent, sitemap proxy and missing assets', async ({ page, request }, testInfo) => {
  await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://www.cezarehberi.com/');
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reddet', exact: true }).click();
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await expect(page.locator('.guide-card')).toHaveCount(6);
  await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true });
  // A compact review image in CI logs also makes visual review possible without authenticated artifact downloads.
  console.log('REVIEW_IMAGE:' + (await page.screenshot({ type: 'jpeg', quality: 55 })).toString('base64'));
  await page.locator('.visitor-counter').scrollIntoViewIfNeeded();
  console.log('REVIEW_FOOTER:' + (await page.screenshot({ type: 'jpeg', quality: 60 })).toString('base64'));
  expect((await request.get('/static/js/not-found.js')).status()).toBe(404);
  expect(await (await request.get('/robots.txt')).text()).toContain('https://www.cezarehberi.com/sitemap.xml');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/blog/test-rehber-0');
  await page.goto('/admin'); await expect(page.getByRole('heading', { name: 'Admin Paneli' })).toBeVisible();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
});
