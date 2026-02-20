const puppeteer = require("puppeteer");
const path = require("path");

let browser;

async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
}

async function renderOdontograma(data) {
  await initBrowser();

  const page = await browser.newPage();

  await page.setViewport({
    width: 1400,
    height: 900,
    deviceScaleFactor: 2,
  });

  const templatePath = "file://" + path.join(__dirname, "template.html");

  await page.evaluateOnNewDocument((payload) => {
    window.__DATA__ = payload;
  }, data);

  await page.goto(templatePath, { waitUntil: "networkidle0" });

  await page.waitForFunction(() => window.__RENDER_DONE__ === true);

  const element = await page.$("#odontogramaArea");

  const imageBuffer = await element.screenshot({
    type: "png",
    omitBackground: false,
  });

  await page.close();

  return imageBuffer;
}

async function renderOdontogramasBatch(list, options = {}) {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return [];

  const concurrency = Math.max(1, Number(options.concurrency) || 3);
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) break;
      results[current] = await renderOdontograma(items[current]);
    }
  }

  const workers = [];
  const workerCount = Math.min(concurrency, items.length);
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

module.exports = {
  renderOdontograma,
  renderOdontogramasBatch,
};
