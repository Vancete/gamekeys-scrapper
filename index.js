//adding Puppeteer library
const fs = require("fs");
const pt = require("puppeteer");

pt.launch().then(async (browser) => {
  //browser new page
  const page = await browser.newPage();
  //set viewpoint of browser page
  await page.setViewport({ width: 1000, height: 500 });
  //launch URL
  await page.goto(process.argv[2]);

  const jsonElement = await page.$('script[type="application/ld+json"]');
  const jsonString = await page.evaluate(
    (element) => element.textContent,
    jsonElement
  );

  const jsonObject = JSON.parse(jsonString);

  console.log(jsonObject);

  fs.writeFile(
    `./data/${jsonObject.name.toLowerCase()}.json`,
    JSON.stringify(jsonObject),
    (error) => {
      if (error) {
        console.error("Error al guardar el archivo:", error);
      } else {
        console.log("El texto se ha guardado correctamente en el archivo.");
      }
    }
  );

  //browser close
  await browser.close();
});
