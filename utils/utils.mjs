import fs from 'node:fs'
import path from 'node:path'

export const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export const cleanFileName = (fileName) => {
    const validPattern = /[^a-zA-Z0-9_.-]/g

    const cleanName = fileName.replace(validPattern, '-').replaceAll('--', '-').toLowerCase()

    return cleanName
}

export const removeRef = (link) => {
    const linkParts = link.split(/[?|#]/)
    const [linkBase, linkParams] = linkParts

    let linkFiltred = ''

    if (linkParams) {
        const refers = ['r=cdkeys-cheap', 'af_id=cdkeyscheap', 'a_aid=cdkeys-cheap']

        linkFiltred = linkParams
            .split('&')
            .filter((link) => !refers.some((param) => link === param))
            .join('&')
    }

    return linkBase + '?' + linkFiltred
}

export const readGameListFile = () => {
    const filePath = 'game-list.txt'

    try {
        const data = fs.readFileSync(filePath, 'utf-8')
        const lines = data.split('\r\n')

        while (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop()
        }

        return lines
    } catch (error) {
        console.error('Error reading the game-list file:', error)
    }

    return []
}

export const createSearchData = async () => {
    const folder = './data'

    try {
        const files = await fs.promises.readdir(folder)
        const fileData = []

        for (const fileName of files) {
            if (path.extname(fileName) === '.json') {
                const file = path.join(folder, fileName);
                try {
                    const gameData = await fs.promises.readFile(file, 'utf-8');
                    const { data, offers } = JSON.parse(gameData);
                    const bestOffer = offers.reduce((betterOffer, currentOffer) => {
                        return currentOffer.price < betterOffer.price ? currentOffer : betterOffer;
                    });
                    const { name, image } = data;
                    const newData = {
                        name,
                        image,
                        offer: bestOffer
                    };
                    fileData.push(newData);
                } catch (error) {
                    console.error(`Error al procesar el archivo ${archivo}: ${error}`);
                }
            }
        }
        return fileData;
    } catch (err) {
        console.error(`Error al leer la carpeta ${folder}: ${err}`);
        return [];
    }
}