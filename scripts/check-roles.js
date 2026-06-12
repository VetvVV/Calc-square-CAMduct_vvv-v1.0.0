const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const Module = require('module');

const rootDir = path.resolve(__dirname, '..');
const defaultNodeModules = [
  path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules'),
  path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '.pnpm', 'node_modules'),
  path.join(rootDir, 'node_modules')
];

for (const dir of defaultNodeModules) {
  if (dir && fs.existsSync(dir) && !process.env.NODE_PATH?.includes(dir)) {
    process.env.NODE_PATH = process.env.NODE_PATH ? `${process.env.NODE_PATH};${dir}` : dir;
  }
}

Module._initPaths();

function argValue(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

function normalizeBaseUrl(value) {
  if (value) {
    const url = new URL(value);
    if (!url.pathname.endsWith('.html')) {
      url.pathname = url.pathname.replace(/\/?$/, '/home.html');
    }
    return url.href;
  }

  return pathToFileURL(path.join(rootDir, 'home.html')).href;
}

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function isVisibleInPage(page, selector) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }, selector);
}

async function isVisibleInFrame(frame, selector) {
  return frame.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }, selector);
}

async function countInFrame(frame, selector) {
  return frame.evaluate((sel) => document.querySelectorAll(sel).length, selector);
}

function roleUrl(baseUrl, role) {
  const url = new URL(baseUrl);
  url.searchParams.set('role', role);
  url.searchParams.set('v', `role-check-${Date.now()}`);
  return url.href;
}

function mark(ok) {
  return ok ? 'OK  ' : 'FAIL';
}

async function openRectangularModule(page) {
  await page.waitForSelector('#atlasFrame', { timeout: 10000 });
  const atlasFrame = page.frameLocator('#atlasFrame');
  const ductLink = atlasFrame
    .locator('a[href*="modules/rectangular/duct/module.html"], a[href*="rectangular/duct/module.html"]')
    .first();

  await ductLink.click({ timeout: 10000 });
  const iframeHandle = await page.waitForSelector('.module-frame', { timeout: 10000 });
  const moduleFrame = await iframeHandle.contentFrame();
  if (!moduleFrame) {
    throw new Error('module iframe was not created');
  }
  await moduleFrame.waitForSelector('#out', { timeout: 10000 });
  await page.waitForTimeout(250);
  return moduleFrame;
}

async function checkRole(page, baseUrl, role) {
  const expected = {
    projectVisible: role !== 'guest',
    techVisible: role === 'admin',
    limitVisible: role === 'guest',
    addVisible: role !== 'guest'
  };

  const expectedBuild = argValue('build') || process.env.CHECK_EXPECTED_BUILD || null;

  await page.goto(roleUrl(baseUrl, role), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.build-marker', { timeout: 10000 });

  const buildText = (await page.locator('.build-marker').textContent()).trim();
  const buildVisible = expectedBuild ? buildText === expectedBuild : /^build\s+/.test(buildText);
  const projectVisible = await isVisibleInPage(page, '.project-panel');

  const moduleFrame = await openRectangularModule(page);

  const techSelector = '#detailsToggle, #locksToggle, #detailsBlock, #locks, #holes, .details-panel, details, small';
  const techCount = await countInFrame(moduleFrame, techSelector);
  const techVisible = techCount > 0;

  const limitVisible = await isVisibleInFrame(moduleFrame, '#calcControls');
  const addVisible = await countInFrame(moduleFrame, '.add-project-button') > 0;

  if (role === 'admin') {
    const details = moduleFrame.locator('#detailsToggle').first();
    if (await details.count()) await details.click();

    const locks = moduleFrame.locator('#locksToggle').first();
    if (await locks.count()) await locks.click();

    await page.waitForTimeout(250);
  }

  const scrollState = await page.evaluate(() => {
    const panel = document.querySelector('.atlas-panel');
    const frame = document.querySelector('.module-frame');
    if (!panel || !frame) return { ok: false, state: 'missing' };
    const compact = panel.classList.contains('calculator-compact');
    const expanded = panel.classList.contains('calculator-expanded');
    return {
      ok: compact || expanded,
      state: expanded ? 'expanded' : compact ? 'compact' : 'none'
    };
  });

  const checks = [
    ['build marker', buildVisible, expectedBuild ? `${buildText} (expected ${expectedBuild})` : buildText],
    ['project visibility', projectVisible === expected.projectVisible, projectVisible ? 'visible' : 'hidden'],
    ['technical blocks', techVisible === expected.techVisible, techVisible ? `${techCount} nodes` : 'none'],
    ['guest limit', limitVisible === expected.limitVisible, limitVisible ? 'visible' : 'hidden'],
    ['add to project', addVisible === expected.addVisible, addVisible ? 'visible' : 'hidden'],
    ['scroll state', role === 'admin' ? scrollState.state === 'expanded' : scrollState.ok, scrollState.state]
  ];

  const failed = checks.filter(([, ok]) => !ok);
  return { role, checks, ok: failed.length === 0 };
}

async function main() {
  let playwright;
  try {
    playwright = require('playwright');
  } catch (error) {
    console.error('Cannot load Playwright.');
    console.error('Run through check-roles.bat, or install Playwright for your Node.js.');
    console.error(error.message);
    process.exit(1);
  }

  const baseUrl = normalizeBaseUrl(argValue('base') || process.env.CHECK_BASE_URL);
  const expectedBuild = argValue('build') || process.env.CHECK_EXPECTED_BUILD || null;
  const executablePath = argValue('browser') || findBrowserExecutable();
  const launchOptions = { headless: true };
  if (executablePath) launchOptions.executablePath = executablePath;

  const browser = await playwright.chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1600, height: 560 } });
  const roles = ['guest', 'user', 'client', 'admin'];
  const results = [];

  try {
    console.log(`Base: ${baseUrl}`);
    if (expectedBuild) console.log(`Expected build: ${expectedBuild}`);
    console.log('');

    for (const role of roles) {
      const result = await checkRole(page, baseUrl, role);
      results.push(result);
      console.log(`[${result.ok ? 'OK' : 'FAIL'}] role=${role}`);
      for (const [name, ok, detail] of result.checks) {
        console.log(`  ${mark(ok)} ${name}: ${detail}`);
      }
      console.log('');
    }
  } finally {
    await browser.close();
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    console.error(`Role check failed: ${failed.map((item) => item.role).join(', ')}`);
    process.exit(1);
  }

  console.log('All role checks passed.');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
