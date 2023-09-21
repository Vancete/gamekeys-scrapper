import fs from 'node:fs'
import * as pt from 'puppeteer'
import { timeout, cleanFileName, readGameListFile } from './utils/utils.mjs'

const gameList = readGameListFile()

async function getGameInfo(game, index) {
    let gameData = {}
    const browser = await pt.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 500 })

    try {
        await page.goto('https://opencritic.com/search')

        /*
          Busca el juego extraido del game-list en el buscador de opencritic
        */
        const searchSelector = 'input[name="searchStr"]'
        await page.$(searchSelector)
        await page.type(searchSelector, game.toLowerCase())
        await page.focus(searchSelector)
        await page.keyboard.press('Enter')
        await timeout(2000)
        const firstElementInSearch = await page.$eval('.results-container > div a', (element) => element.href)

        console.log(`${index + 1}/${gameList.length}`)
        console.log('Encontrado el juego', game, firstElementInSearch)

        /*
          Obtiene los datos del juego desde opencritic
        */
        await page.goto(firstElementInSearch)

        const jsonElement = await page.$('script[type="application/ld+json"]')
        const jsonString = await page.evaluate((element) => element.textContent, jsonElement)

        const jsonObject = JSON.parse(jsonString)
        gameData.data = jsonObject
        const gameName = jsonObject.name

        console.log('Datos del juego extraidos', gameName)

        /*
          Busca el link en cdkeys a partir del nombre del juego
        */
        await page.goto('https://cdkeys.cheap/')

        const inputSelector = '.search-form__field'
        await page.$(inputSelector)
        await page.type(inputSelector, gameName.toLowerCase())
        await timeout(2000)
        await page.$('#searchList')
        const firstElementInSearchList = await page.$eval('#searchList > :first-child a', (element) => element.href)

        console.log('Enlace del juego buscado obtenido de CDKeys', firstElementInSearchList)

        /*
          Obtiene los links de las tiendas desde cdkeys
        */
        await page.goto(firstElementInSearchList)

        const linkElements = await page.$$eval('.offer__btn', (buttons) => {
            return buttons.map((button) => {
                return button.href
            })
        })

        gameData.links = linkElements

        console.log(`Obtenidos ${linkElements.length} enlaces de tiendas`)

        const fileName = cleanFileName(gameName)
        fs.writeFile(`./data/${fileName}.json`, JSON.stringify(gameData), (error) => {
            if (error) {
                console.error('Error al guardar el archivo:', error)
            } else {
                console.log('El texto se ha guardado correctamente en el archivo.')
            }
        })
    } catch {
        console.error('Error:', error)
    } finally {
        await browser.close()
    }
}

;(async () => {
    for (const [index, game] of gameList.entries()) {
        await getGameInfo(game, index)
    }
})()
