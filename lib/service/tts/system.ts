import say from 'say'
import iconv from 'iconv-lite'

interface Options {
    voice?: string
}

export default function speak(text: string, options: Options = {}) {
    const { voice } = options
    const encoded: any = iconv.encode(text, 'gbk')

    return new Promise((resolve, reject) => {
        say.speak(encoded, voice, 1.0, (err) => {
            if (err) reject(err)
            resolve(true)
            // console.log('Text has been spoken.')
        })
    })
}