import say from 'say'
import iconv from 'iconv-lite'

interface Options {
    voice?: string
    speed?: number
}

export default async function speak(text: string, options: Options = {}) {
    const { voice, speed = 1.0 } = options
    const encoded: any = iconv.encode(text, 'gbk')

    return new Promise((resolve, reject) => {
        say.speak(encoded, voice, speed, (err) => {
            if (err) reject(err)
            resolve(true)
            // console.log('Text has been spoken.')
        })
    })
}

export async function getInstalledVoices() {
    return new Promise((resolve, reject) => {
        say.getInstalledVoices((err, voices) => {
            if (err) {
                reject(err)
                return
            }
            resolve(voices)
        })
    })
}