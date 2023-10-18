import fs from 'node:fs'
import * as pt from 'puppeteer'
import { cleanFileName, readGameListFile, removeRef, createSearchData } from './utils/utils.mjs'

fs.mkdir('./data/search', (e) => {})
const gameList = readGameListFile()

const processGameList = async () => {
    for (const [index, game] of gameList.entries()) {
        await getGameInfo(game, index)
    }

    const searchData = await createSearchData()
    fs.writeFile('./data/search/search-data.json', JSON.stringify(searchData, 0, 4), (error) => {
        if (error) {
            console.error('Error al guardar el archivo:', error)
        } else {
            console.log('El texto se ha guardado correctamente en el archivo search-data')
        }
    })
}

const getGameInfo = async (game, index) => {
    let gameData = {}
    const browser = await pt.launch({ headless: 'new' })
    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 500 })

    try {
        /*
        Busca el juego extraido del game-list en el buscador de opencritic
        */
        await page.goto('https://opencritic.com/search')

        const searchSelector = 'input[name="searchStr"]'
        await page.$(searchSelector)
        await page.type(searchSelector, game.toLowerCase())
        await page.focus(searchSelector)
        await page.keyboard.press('Enter')
        await page.waitForSelector('.results-container > div a')
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
        await page.waitForSelector('#searchList > :first-child a')
        const firstElementInSearchList = await page.$eval('#searchList > :first-child a', (element) => element.href)

        console.log('Enlace del juego buscado obtenido de CDKeys', firstElementInSearchList)

        /*
          Obtiene los datos de las ofertas
        */
        await page.goto(firstElementInSearchList)

        try {
            const offers = await page.$$('.offersToFilter')
            const offersData = await Promise.all(
                offers.map(async (offer) => {
                    const priceElement = await offer.$('.offer__price')
                    const price = await priceElement.$eval('span', (span) => parseFloat(span.textContent.replace('€', '')))
    
                    const nameElement = await offer.$('.offer__heading')
                    const name = await nameElement.$eval('h3', (h3) => h3.textContent)
    
                    const platformElement = await offer.$('.offer__platform')
                    const platform = await platformElement.$eval('img', (img) => img.title)
    
                    const edition = await offer.$eval('.offer__edition', span => span.textContent)
    
                    const region = await offer.$eval('.offer__region', span => span.textContent)
    
                    const linkElement = await offer.$('.offer__store')
                    const link = await linkElement.$eval('a', (a) => a.href)
    
                    const linkFiltred = removeRef(link)
    
                    return { price, name, platform, edition, region, url: linkFiltred }
                })
            )
    
            gameData.offers = offersData   

            console.log(`Obtenidos ${offersData.length} enlaces de tiendas`)

        } catch {

            gameData.offers = [{price: 0}]

            console.log('No se han encontrado enlaces, guardado como juego gratuito')

        }

        const fileName = cleanFileName(gameName)
        fs.writeFile(`./data/${fileName}.json`, JSON.stringify(gameData, 0, 4), (error) => {
            if (error) {
                console.error('Error al guardar el archivo:', error)
            } else {
                console.log(`El texto se ha guardado correctamente en el archivo ${fileName}.`)
            }
        })
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await browser.close()
        
    }
}

processGameList()