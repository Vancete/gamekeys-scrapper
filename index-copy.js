//adding Puppeteer library
const fs = require("fs");
const pt = require("puppeteer");

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

pt.launch().then(async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 500 });
  await page.goto(process.argv[2]);

  let gameData = {};

  /*
    Obtiene los datos del juego desde opencritic
  */
  const jsonElement = await page.$('script[type="application/ld+json"]');
  const jsonString = await page.evaluate(
    (element) => element.textContent,
    jsonElement
  );

  const jsonObject = JSON.parse(jsonString);
  gameData.data = jsonObject;

  const gameName = jsonObject.name;

  /*
    Busca el link en cdkeys a partir del nombre del juego
  */
  await page.goto("https://cdkeys.cheap/");

  const inputSelector = ".search-form__field";
  await page.$(inputSelector);
  await page.type(inputSelector, gameName.toLowerCase());
  await timeout(2000);
  await page.$("#searchList");
  const firstElementInSearchList = await page.$eval(
    "#searchList > :first-child a",
    (element) => element.href
  );

  /*
    Obtiene los links de las tiendas desde cdkeys
  */
  await page.goto(firstElementInSearchList);

  const linkElements = await page.$$eval(".offer__btn", (buttons) => {
    return buttons.map((button) => {
      return button.href;
    });
  });

  gameData.links = linkElements;

  fs.writeFile(
    `./data/${gameName.replaceAll(" ", "-").toLowerCase()}.json`,
    JSON.stringify(gameData),
    (error) => {
      if (error) {
        console.error("Error al guardar el archivo:", error);
      } else {
        console.log("El texto se ha guardado correctamente en el archivo.");
      }
    }
  );

  await browser.close();
});
