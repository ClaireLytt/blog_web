#!/usr/bin/env node
/**
 * CLI smoke test — launches a real browser (Playwright/Chromium), clicks
 * through every user-facing feature of the site and reports pass/fail.
 *
 * Usage:
 *   npm run test:ui                   # builds nothing; serves existing dist/ via astro preview
 *   node tests/smoke.mjs --url http://localhost:4321   # test an already-running server
 *   node tests/smoke.mjs --headed   # watch the browser while it clicks
 *
 * Exit code 0 = all checks passed, 1 = at least one failure.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const urlFlag = args.indexOf('--url');
const externalUrl = urlFlag !== -1 ? args[urlFlag + 1] : null;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    passed++;
    console.log(`  ${green('✓')} ${name} ${dim(`(${Date.now() - t0}ms)`)}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  ${red('✗')} ${name}`);
    console.log(dim(`      ${String(err.message || err).split('\n')[0]}`));
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------- server
let server = null;
let baseUrl = externalUrl;

async function startPreview() {
  const port = 4399;
  baseUrl = `http://localhost:${port}`;
  server = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
  });
  // wait until the server answers
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('astro preview did not start within 30s — run `npm run build` first?');
}

// ---------------------------------------------------------------- main
const run = async () => {
  if (!externalUrl) {
    console.log(dim('Starting astro preview (serves dist/ — run `npm run build` first)...'));
    await startPreview();
  }
  console.log(dim(`Testing ${baseUrl}\n`));

  const browser = await chromium.launch({ headless: !headed });
  const page = await browser.newPage();

  // -------------------------------------------------- home (EN)
  // -------------------------------------------------- conductor gate (entry game)
  // Must run first: the gate overlays the home page until played or skipped.
  // Automated browsers only see it with ?game=1 (navigator.webdriver escape
  // hatch) — real visitors get it on every page load.
  section('Conductor gate (entry game)');
  await check('gate shows on page load and locks scroll', async () => {
    await page.goto(baseUrl + '/?game=1');
    await page.waitForSelector('.con-gate', { timeout: 3000 });
    const overflow = await page.evaluate(() => document.body.style.overflow);
    if (overflow !== 'hidden') throw new Error(`scroll not locked: "${overflow}"`);
  });
  await check('staff renders three unlit notes and the counter', async () => {
    const n = await page.locator('.con-note').count();
    if (n !== 3) throw new Error(`expected 3 notes, found ${n}`);
    const lit = await page.locator('.con-note.lit').count();
    if (lit !== 0) throw new Error(`${lit} notes lit before playing`);
    const count = await page.textContent('.con-count');
    if (!/0\/3/.test(count)) throw new Error(`counter = "${count}"`);
  });
  await check('holding and waving plays (baton grows, bars canvas live)', async () => {
    await page.mouse.move(200, 500);
    await page.mouse.down();
    await page.waitForTimeout(150);
    const on = await page.locator('.con-dot.con-dot-on').count();
    if (on !== 1) throw new Error('baton did not light up while holding');
    await page.mouse.move(200, 200, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    const off = await page.locator('.con-dot.con-dot-on').count();
    if (off !== 0) throw new Error('baton stayed lit after release');
  });
  await check('sweeping through the notes lights them and finishes', async () => {
    const boxes = [];
    for (const note of await page.locator('.con-note').all()) {
      boxes.push(await note.boundingBox());
    }
    await page.mouse.move(boxes[0].x - 60, boxes[0].y + 10);
    await page.mouse.down();
    for (const b of boxes) {
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
      await page.waitForTimeout(120);
    }
    await page.mouse.up();
    const lit = await page.locator('.con-note.lit').count();
    if (lit !== 3) throw new Error(`only ${lit}/3 notes lit after the sweep`);
    // finale: overture replay, then the gate dismisses itself
    await page.waitForSelector('.con-gate', { state: 'detached', timeout: 9000 });
    const overflow = await page.evaluate(() => document.body.style.overflow);
    if (overflow === 'hidden') throw new Error('scroll still locked after the finale');
  });
  await check('gate shows again on every reload', async () => {
    await page.goto(baseUrl + '/?game=1');
    await page.waitForSelector('.con-gate', { timeout: 3000 });
    await page.click('.con-close'); // leave the main page clean for later checks
    await page.waitForSelector('.con-gate', { state: 'detached', timeout: 3000 });
  });
  await check('mute button toggles', async () => {
    const p2 = await browser.newPage();
    await p2.goto(baseUrl + '/zh?game=1');
    await p2.waitForSelector('.con-mute', { timeout: 3000 });
    await p2.click('.con-mute');
    const mutedOn = (await p2.locator('.con-mute.con-muted').count()) === 1;
    await p2.click('.con-mute');
    const mutedOff = (await p2.locator('.con-mute.con-muted').count()) === 0;
    if (!mutedOn || !mutedOff) throw new Error('mute toggle classes did not switch');
    await p2.close();
  });
  await check('skip button (x) dismisses the gate', async () => {
    const p2 = await browser.newPage();
    await p2.goto(baseUrl + '/zh?game=1');
    await p2.waitForSelector('.con-gate', { timeout: 3000 });
    await p2.click('.con-close');
    await p2.waitForSelector('.con-gate', { state: 'detached', timeout: 3000 });
    await p2.close();
  });
  await check('gate never shows under reduced motion', async () => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const p3 = await ctx.newPage();
    await p3.goto(baseUrl + '/?game=1');
    await p3.waitForTimeout(400);
    const n = await p3.locator('.con-gate').count();
    await ctx.close();
    if (n !== 0) throw new Error('gate shown despite prefers-reduced-motion');
  });
  await check('gate stays out of the way of automated checks', async () => {
    await page.goto(baseUrl + '/');
    await page.waitForTimeout(300);
    const n = await page.locator('.con-gate').count();
    if (n !== 0) throw new Error('gate shown without ?game=1 under webdriver');
  });

  section('Home (EN)');
  await check('page loads with correct title', async () => {
    const res = await page.goto(baseUrl + '/');
    if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
    const title = await page.title();
    if (!/Yantong Li/.test(title)) throw new Error(`unexpected title: ${title}`);
  });
  await check('hero eyebrow + rule render', async () => {
    await page.waitForSelector('.hero-eyebrow', { timeout: 3000 });
    await page.waitForSelector('.hero-rule', { timeout: 3000 });
  });
  await check('typing animation is running', async () => {
    const a = await page.textContent('#typing');
    await page.waitForTimeout(600);
    const b = await page.textContent('#typing');
    if (a === b) throw new Error('typing text did not change after 600ms');
  });
  await check('ambient background layer present', async () => {
    const count = await page.locator('.ambient .ambient-blob').count();
    if (count !== 2) throw new Error(`expected 2 blobs, found ${count}`);
  });
  await check('post cards fade in on scroll', async () => {
    await page.locator('.post-card').first().scrollIntoViewIfNeeded();
    await page.waitForSelector('.post-list .fade-in.visible', { timeout: 3000 });
  });

  // -------------------------------------------------- navigation clicks
  section('Navigation (click-through)');
  await check('click "Read the Blog" button → /blog', async () => {
    await page.goto(baseUrl + '/');
    await page.click('.btn-primary');
    await page.waitForURL('**/blog', { timeout: 5000 });
  });
  await check('click a post card → article page renders', async () => {
    await page.click('.post-card');
    await page.waitForSelector('.article-header h1, article h1', { timeout: 5000 });
    const prose = await page.locator('.prose, article').count();
    if (prose === 0) throw new Error('no article body found');
  });
  await check('click nav "About" → about page', async () => {
    await page.click('.nav-links a[href="/about"]');
    await page.waitForURL('**/about', { timeout: 5000 });
  });
  await check('contact list renders from contacts.json', async () => {
    const n = await page.locator('.contact-list li').count();
    if (n === 0) throw new Error('contact list is empty');
  });
  await check('click nav "Home" → back to home', async () => {
    await page.click('.nav-links a[href="/"]');
    await page.waitForURL(baseUrl + '/', { timeout: 5000 });
  });

  // -------------------------------------------------- language switch
  section('Language switcher (click-through)');
  await check('click 中文 on home → /zh', async () => {
    await page.goto(baseUrl + '/');
    await page.click('.lang-switch');
    await page.waitForURL('**/zh', { timeout: 5000 });
    const h1 = await page.textContent('h1');
    if (!/你好/.test(h1)) throw new Error(`zh hero not shown: ${h1}`);
  });
  await check('click EN on /zh → back to /', async () => {
    await page.click('.lang-switch');
    await page.waitForURL(baseUrl + '/', { timeout: 5000 });
  });
  await check('article lang switch links to its translation', async () => {
    await page.goto(baseUrl + '/blog');
    await page.click('.post-card');
    await page.waitForSelector('.lang-switch', { timeout: 5000 });
    const href = await page.getAttribute('.lang-switch', 'href');
    if (!href || !href.startsWith('/zh/blog/')) throw new Error(`unexpected switch href: ${href}`);
    await page.click('.lang-switch');
    await page.waitForURL('**/zh/blog/**', { timeout: 5000 });
  });
  await check('zh nav links work (博客 / 关于我 / 首页)', async () => {
    await page.goto(baseUrl + '/zh');
    await page.click('.nav-links a[href="/zh/blog"]');
    await page.waitForURL('**/zh/blog', { timeout: 5000 });
    await page.click('.nav-links a[href="/zh/about"]');
    await page.waitForURL('**/zh/about', { timeout: 5000 });
    await page.click('.nav-links a[href="/zh"]');
    await page.waitForURL('**/zh', { timeout: 5000 });
  });

  // -------------------------------------------------- animations
  section('Animations');
  await check('page entrance animation on main', async () => {
    await page.goto(baseUrl + '/');
    const name = await page
      .locator('main.container')
      .evaluate((el) => getComputedStyle(el).animationName);
    if (!/pageIn/.test(name)) throw new Error(`animation-name = ${name}`);
  });
  await check('hero children have staggered entrance', async () => {
    const delays = await page
      .locator('.hero > *')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationDelay));
    const distinct = new Set(delays);
    if (distinct.size < 3) throw new Error(`delays not staggered: ${delays.join(', ')}`);
  });
  await check('film grain layer present', async () => {
    const content = await page.evaluate(
      () => getComputedStyle(document.body, '::before').backgroundImage
    );
    if (!/svg/.test(content)) throw new Error('body::before has no grain texture');
  });
  await check('reading progress bar fills on scroll', async () => {
    await page.goto(baseUrl + '/blog');
    await page.click('.post-card');
    // starts at scaleX(0) → Playwright treats it as hidden; wait for attach only
    await page.waitForSelector('#read-progress', { state: 'attached', timeout: 5000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const t = await page
      .locator('#read-progress')
      .evaluate((el) => getComputedStyle(el).transform);
    // scaleX(1) → matrix(1, 0, 0, 1, 0, 0); scaleX(0) → matrix(0, ...)
    const scaleX = parseFloat(t.replace('matrix(', ''));
    if (!(scaleX > 0.5)) throw new Error(`progress barely moved: ${t}`);
  });
  await check('hero dot-grid backdrop present', async () => {
    await page.goto(baseUrl + '/');
    const bg = await page
      .locator('.hero')
      .evaluate((el) => getComputedStyle(el, '::before').backgroundImage);
    if (!/radial-gradient/.test(bg)) throw new Error('hero::before has no dot grid');
  });
  await check('name shimmer animation running', async () => {
    const name = await page
      .locator('.hero .shimmer')
      .evaluate((el) => getComputedStyle(el).animationName);
    if (!/shimmer/.test(name)) throw new Error(`animation-name = ${name}`);
  });
  await check('terminal card types its lines', async () => {
    const term = page.locator('.term');
    await term.scrollIntoViewIfNeeded();
    // typing starts via IntersectionObserver; wait for the first prompt
    await page.waitForSelector('.term-body .t-prompt', { timeout: 5000 });
    const before = (await page.textContent('.term-body')).length;
    await page.waitForTimeout(1200);
    const after = (await page.textContent('.term-body')).length;
    if (!(after > before)) throw new Error('terminal text did not grow (not typing)');
  });
  await check('terminal renders instantly under reduced motion', async () => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const p2 = await ctx.newPage();
    await p2.goto(baseUrl + '/');
    const prompts = await p2.locator('.term-body .t-prompt').count();
    if (prompts < 3) throw new Error(`expected >=3 prompts immediately, found ${prompts}`);
    await ctx.close();
  });
  await check('post card spotlight follows the pointer', async () => {
    await page.goto(baseUrl + '/blog');
    const card = page.locator('.post-card').first();
    const box = await card.boundingBox();
    await page.mouse.move(box.x + 30, box.y + 20);
    await page.waitForTimeout(150);
    const mx1 = await card.evaluate((el) => el.style.getPropertyValue('--mx'));
    await page.mouse.move(box.x + box.width - 30, box.y + 30);
    await page.waitForTimeout(150);
    const mx2 = await card.evaluate((el) => el.style.getPropertyValue('--mx'));
    if (!mx1 || mx1 === mx2) throw new Error(`--mx did not track pointer: ${mx1} -> ${mx2}`);
  });
  await check('404 number is animated', async () => {
    await page.goto(baseUrl + '/no-such-page-xyz');
    const name = await page
      .locator('.notfound-num')
      .evaluate((el) => getComputedStyle(el).animationName);
    if (!/notfoundDrift/.test(name)) throw new Error(`animation-name = ${name}`);
  });

  // -------------------------------------------------- micro-interactions
  section('Micro-interactions');
  await check('button arrow nudges on hover', async () => {
    await page.goto(baseUrl + '/');
    const arrow = page.locator('.btn-primary .btn-arrow');
    await page.hover('.btn-primary');
    await page.waitForTimeout(300);
    const transform = await arrow.evaluate((el) => getComputedStyle(el).transform);
    if (transform === 'none') throw new Error('arrow transform not applied on hover');
  });
  await check('active nav link is underlined', async () => {
    await page.goto(baseUrl + '/blog');
    await page.waitForSelector('.nav-links a.active[href="/blog"]', { timeout: 3000 });
    const t = await page
      .locator('.nav-links a.active')
      .evaluate((el) => getComputedStyle(el, '::after').transform);
    const scaleX = parseFloat(t.replace('matrix(', ''));
    if (!(scaleX > 0.9)) throw new Error(`active underline not expanded: ${t}`);
  });
  await check('nav underline slides out on hover', async () => {
    await page.mouse.move(0, 300); // park the mouse away from the nav first
    await page.waitForTimeout(400);
    const link = page.locator('.nav-links a[href="/about"]');
    const before = await link.evaluate(
      (el) => parseFloat(getComputedStyle(el, '::after').transform.replace('matrix(', '')) || 0
    );
    await link.hover();
    await page.waitForTimeout(400);
    const after = await link.evaluate(
      (el) => parseFloat(getComputedStyle(el, '::after').transform.replace('matrix(', '')) || 0
    );
    if (!(after > before)) throw new Error(`underline scaleX ${before} → ${after}`);
  });
  await check('post card arrow floats in on hover', async () => {
    await page.goto(baseUrl + '/blog');
    await page.mouse.move(0, 0); // park the mouse off the card first
    await page.waitForTimeout(350);
    const card = page.locator('.post-card').first();
    const before = await card.evaluate((el) =>
      parseFloat(getComputedStyle(el, '::after').opacity)
    );
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await page.waitForTimeout(450);
    const after = await card.evaluate((el) =>
      parseFloat(getComputedStyle(el, '::after').opacity)
    );
    if (!(after > before)) throw new Error(`arrow opacity ${before} → ${after}`);
  });
  await check('tag chip lifts on hover', async () => {
    const tag = page.locator('.post-meta .tag').first();
    if ((await tag.count()) === 0) return; // no tags on any post — skip
    await tag.hover();
    await page.waitForTimeout(300);
    const t = await tag.evaluate((el) => getComputedStyle(el).transform);
    if (t === 'none') throw new Error('tag transform not applied on hover');
  });
  await check('logo cursor blinks on hover', async () => {
    const logo = page.locator('.nav-logo');
    await logo.hover();
    await page.waitForTimeout(300);
    const opacity = await logo.evaluate((el) =>
      parseFloat(getComputedStyle(el, '::after').opacity)
    );
    if (!(opacity > 0.5)) throw new Error(`cursor opacity = ${opacity}`);
  });

  // -------------------------------------------------- feeds, SEO, errors
  section('Feeds / SEO / error page');
  for (const [name, path, pattern] of [
    ['RSS feed (EN)', '/rss.xml', /<rss/],
    ['RSS feed (ZH)', '/zh/rss.xml', /<rss/],
    ['sitemap', '/sitemap-index.xml', /<sitemapindex/],
    ['robots.txt', '/robots.txt', /Sitemap:/i],
  ]) {
    await check(`${name} is served`, async () => {
      const res = await fetch(baseUrl + path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      if (!pattern.test(body)) throw new Error(`body does not match ${pattern}`);
    });
  }
  await check('hreflang alternates present on home', async () => {
    await page.goto(baseUrl + '/');
    const n = await page.locator('link[rel="alternate"][hreflang]').count();
    if (n < 3) throw new Error(`expected ≥3 hreflang links, found ${n}`);
  });
  await check('404 page renders for unknown URL', async () => {
    const res = await page.goto(baseUrl + '/no-such-page-xyz');
    if (res.status() !== 404) throw new Error(`expected 404, got ${res.status()}`);
    const body = await page.textContent('body');
    if (!/404/.test(body)) throw new Error('404 page has no 404 text');
  });

  // -------------------------------------------------- a11y / reduced motion
  section('Accessibility');
  await check('reduced-motion: typing is static, no animations', async () => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const p2 = await ctx.newPage();
    await p2.goto(baseUrl + '/');
    const a = await p2.textContent('#typing');
    await p2.waitForTimeout(600);
    const b = await p2.textContent('#typing');
    if (a !== b) throw new Error('typing still animates under prefers-reduced-motion');
    await ctx.close();
  });
  await check('no console errors on home + blog + article', async () => {
    const errors = [];
    const p3 = await browser.newPage();
    p3.on('pageerror', (e) => errors.push(e.message));
    p3.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await p3.goto(baseUrl + '/');
    await p3.goto(baseUrl + '/blog');
    await p3.click('.post-card');
    await p3.waitForLoadState('load');
    await p3.close();
    if (errors.length) throw new Error(errors.join(' | '));
  });

  await browser.close();

  // -------------------------------------------------- summary
  console.log('\n' + '─'.repeat(48));
  console.log(`  ${green(`${passed} passed`)}${failed ? `   ${red(`${failed} failed`)}` : ''}`);
  if (failed) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ${red('✗')} ${f.name}\n    ${dim(String(f.err.message || f.err))}`);
  }
  return failed === 0 ? 0 : 1;
};

run()
  .then((code) => {
    if (server) server.kill();
    process.exit(code);
  })
  .catch((err) => {
    console.error(red(`\nFatal: ${err.message || err}`));
    if (server) server.kill();
    process.exit(1);
  });
