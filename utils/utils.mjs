import fs from 'node:fs'

export const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export const cleanFileName = (fileName) => {
    // Define a regular expression that allows only alphanumeric characters, underscores, and periods.
    const validPattern = /[^a-zA-Z0-9_.-]/g

    // Replace invalid characters with an underscore "_" in this case.
    const cleanName = fileName.replace(validPattern, '-').toLowerCase()

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
