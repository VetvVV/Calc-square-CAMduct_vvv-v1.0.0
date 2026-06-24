/* Calc Square — scripts/check-roles.js
   Предпубликационная проверка (Playwright):
   1) метка сборки .build-marker (скрытая) совпадает с ожидаемой;
   2) состав ролевого UI по ролям guest/user/client/admin.
   Запуск (через check-roles.bat): node scripts/check-roles.js --build="build YYYY-MM-DD-HHMM"
   Код выхода: 0 — ок, 1 — провал. */
"use strict";
const out=(...a)=>process.stdout.write(a.join(" ")+"\n");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

function arg(name) {
  const pref = "--" + name + "=";
  const hit = process.argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length).trim() : "";
}

const ROOT = path.resolve(__dirname, "..");
const expectedBuild = arg("build");
const MODULE = arg("module") || "rectangular-transition";
const homeUrl = pathToFileURL(path.join(ROOT, "home.html")).href;
const calcBase = pathToFileURL(path.join(ROOT, "modules", "common", "calculator.html")).href;
const calcUrl = (role) => `${calcBase}?module=${MODULE}&role=${role}&lang=ru`;

/* ожидаемый ролевой UI (совпадает с поведением движка) */
const EXPECT = {
  guest:  { add: false, pdf: false },
  user:   { add: true,  pdf: false },
  client: { add: true,  pdf: false },
  admin:  { add: true,  pdf: false },
};

async function launchBrowser() {
  // используем уже установленный системный браузер, чтобы не требовать "npx playwright install"
  const attempts = [
    { channel: "chrome" },   // Google Chrome, если установлен
    { channel: "msedge" },   // Microsoft Edge — есть на любой Windows
    {},                      // запасной: скачанный Playwright-браузер
  ];
  let lastErr;
  for (const opts of attempts) {
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    "Не удалось запустить браузер (Chrome/Edge/Playwright). " +
    "Установите Edge/Chrome или выполните один раз: npx playwright install chromium. " +
    "Причина: " + (lastErr && lastErr.message)
  );
}

(async () => {
  let ok = true;
  out("Base:", homeUrl);
  if (expectedBuild) out("Expected build:", expectedBuild);

  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    /* 1) метка сборки — читаем ТЕКСТ, не ждём видимости (она hidden by design) */
    await page.goto(homeUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".build-marker", { state: "attached", timeout: 10000 });
    const norm = (x) => (x || "").replace(/\s+/g, " ").trim();
    const pageBuild = norm(await page.locator(".build-marker").first().textContent());
    if (expectedBuild && norm(pageBuild) !== norm(expectedBuild)) {
      out(`FAIL build-marker: page="${pageBuild}" expected="${expectedBuild}"`);
      ok = false;
    } else {
      out("OK build-marker:", pageBuild || "(пусто)");
    }

    /* 2) роли */
    for (const role of Object.keys(EXPECT)) {
      const fresh = await browser.newContext(); // чистый localStorage на каждую роль
      const rp = await fresh.newPage();
      try {
        await rp.goto(calcUrl(role), { waitUntil: "domcontentloaded" });
        await rp.waitForSelector("#area", { state: "attached", timeout: 10000 });
        const hasAdd = (await rp.locator("#addBtn").count()) > 0;
        const hasPdf = (await rp.locator("#pdfBtn").count()) > 0;
        const area = ((await rp.locator("#area").first().textContent()) || "").trim();
        const exp = EXPECT[role];
        const pass = hasAdd === exp.add && hasPdf === exp.pdf && /м²|ft²/.test(area);
        out(`role=${role}: add=${hasAdd}(${exp.add}) pdf=${hasPdf}(${exp.pdf}) area="${area}" -> ${pass ? "OK" : "FAIL"}`);
        if (!pass) ok = false;
      } finally {
        await fresh.close();
      }
    }
  } catch (e) {
    out("Check error:", e && e.message);
    ok = false;
  } finally {
    await browser.close();
  }
  process.exit(ok ? 0 : 1);
})();
