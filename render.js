const puppeteer = require("puppeteer");
const fs = require("fs");
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

module.exports = renderOdontograma;
