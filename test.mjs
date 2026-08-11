import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = () => readFile(new URL('./index.html', import.meta.url), 'utf8');
const css = () => readFile(new URL('./styles.css', import.meta.url), 'utf8');
const js = () => readFile(new URL('./script.js', import.meta.url), 'utf8');

test('homepage uses Hemanka as the sole brand name', async () => {
  const page = await html();
  assert.doesNotMatch(page, /house of hemanka/i);
  assert.match(page, /<title>HEMANKA — Modern Heirlooms<\/title>/);
});

test('homepage exposes the complete Hemanka editorial structure', async () => {
  const page = await html();
  for (const marker of ['HEMANKA', 'The Solstice Edit', 'New Arrivals', 'The Art of Making', 'Join the House']) {
    assert.match(page, new RegExp(marker, 'i'));
  }
});

test('homepage presents the verified founders and their roles', async () => {
  const page = await html();
  assert.match(page, /id="founders"/);
  assert.match(page, /Hemshikha Kadian/);
  assert.match(page, /Ankita Singh/);
  assert.match(page, /Lead Designers &amp; Illustrators/);
  assert.match(page, /https:\/\/www\.linkedin\.com\/in\/hemshikha0022\//);
});

test('homepage includes accessible navigation and commerce controls', async () => {
  const page = await html();
  assert.match(page, /aria-label="Main navigation"/);
  assert.match(page, /aria-label="Open menu"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /type="email"/);
});

test('interactive layer supports menu, cart, cursor and newsletter states', async () => {
  const source = await js();
  for (const behavior of ['menu-toggle', 'add-to-bag', 'custom-cursor', 'newsletter-form']) {
    assert.match(source, new RegExp(behavior));
  }
});

test('mobile layout provides touch-friendly controls and tablet/mobile breakpoints', async () => {
  const styles = await css();
  assert.match(styles, /@media\s*\(max-width:\s*1024px\)/);
  assert.match(styles, /@media\s*\(max-width:\s*600px\)/);
  assert.match(styles, /@media\s*\(pointer:\s*fine\)/);
  assert.match(styles, /min-height:\s*44px/);
  assert.match(styles, /100dvh/);
});

test('homepage includes functional search and bag drawers', async () => {
  const page = await html();
  assert.match(page, /class="[^"]*search-panel/);
  assert.match(page, /class="[^"]*bag-panel/);
  assert.match(page, /aria-controls="search-panel"/);
  assert.match(page, /aria-controls="bag-panel"/);
  assert.match(page, /class="[^"]*product-track/);
});

test('dynamic commerce persists bag state and manages accessible overlays', async () => {
  const source = await js();
  assert.match(source, /localStorage/);
  assert.match(source, /focusTrap/);
  assert.match(source, /remove-from-bag/);
  assert.match(source, /search-input/);
});

test('custom cursor hides after idle to avoid fixed-position capture artifacts', async () => {
  const source = await js();
  assert.match(source, /cursorIdleTimer/);
  assert.match(source, /classList\.remove\('visible'/);
});

test('toast is fully hidden outside its active notification state', async () => {
  const styles = await css();
  assert.match(styles, /\.toast\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(styles, /\.toast\.show\s*\{[^}]*visibility:\s*visible/s);
});

test('mobile overlays are isolated, viewport-fixed, and reset on startup', async () => {
  const [styles, source] = await Promise.all([css(), js()]);
  assert.match(styles, /\.utility-panel\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /\.utility-panel\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(styles, /\.utility-panel\.open\s*\{[^}]*pointer-events:\s*auto/s);
  assert.match(source, /resetOverlays/);
  assert.match(source, /dataset\.overlay/);
});

test('mobile footer fits the viewport and exposes usable touch targets', async () => {
  const styles = await css();
  assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*\.footer-wordmark\s*\{[^}]*font-size:\s*clamp\(/);
  assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*\.footer-links a\s*\{[^}]*min-height:\s*44px/);
  assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*\.footer-legal\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('shopping bag exposes explicit quantity controls and a clear action', async () => {
  const [page, source] = await Promise.all([html(), js()]);
  assert.match(page, /class="clear-bag"/);
  assert.match(source, /bag-quantity-control/);
  assert.match(source, /data-action="decrease"/);
  assert.match(source, /data-action="increase"/);
});

test('mobile utility drawers cover site chrome and expose dialog semantics', async () => {
  const [page, styles] = await Promise.all([html(), css()]);
  assert.match(page, /id="search-panel"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(page, /id="bag-panel"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(styles, /\.utility-panel\s*\{[^}]*z-index:\s*9\d/s);
  assert.match(styles, /\.panel-backdrop\s*\{[^}]*z-index:\s*8\d/s);
});

test('empty bag disables checkout and promotes a touch-friendly shopping action', async () => {
  const [styles, source] = await Promise.all([css(), js()]);
  assert.match(source, /checkoutButton\.disabled\s*=\s*bag\.length\s*===\s*0/);
  assert.match(styles, /\.checkout-button:disabled\s*\{/);
  assert.match(styles, /\.empty-state a\s*\{[^}]*min-height:\s*44px/s);
});

test('mobile hero keeps editorial type inside safe gutters and preserves word spacing', async () => {
  const [page, styles] = await Promise.all([html(), css()]);
  assert.match(page, /woman<br>\s+who carries/);
  assert.match(styles, /@media\s*\(max-width:\s*800px\)[\s\S]*\.hero h1\s*\{[^}]*left:\s*18px[^}]*right:\s*18px/s);
  assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*\.footer-wordmark\s*\{[^}]*font-size:\s*clamp\([^,]+,\s*19vw/s);
});

test('search drawer focuses the search field when opened', async () => {
  const source = await js();
  assert.match(source, /panel\s*===\s*searchPanel\s*\?\s*searchInput/);
});

test('scroll reveals do not override the craft panel centering transform', async () => {
  const source = await js();
  assert.match(source, /querySelectorAll\('[^']*\.craft-copy > \*[^']*'\)/);
  assert.doesNotMatch(source, /querySelectorAll\('[^']*(?:^|, )\.craft-copy(?:,|')/);
});
