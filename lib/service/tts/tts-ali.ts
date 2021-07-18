import axios from 'axios'
import { URLSearchParams } from 'url'
import global from '../global'
const APP_KEY = global.get('APP_KEY')
const APP_SECRET = global.get('APP_SECRET')
const RPCClient = require('@alicloud/pop-core').RPCClient

interface ttsOption {
    text: string
    speechRate?: number
    pitchRate?: number
    voice?: string
    volume?: number
    format?: string
}
const client = new RPCClient({
    accessKeyId: APP_KEY,
    accessKeySecret: APP_SECRET,
    endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
    apiVersion: '2019-02-28'
})

async function getToken() {
    // TODO: cache
    const { Token } = await client.request('CreateToken')
    return Token
}

const URL = 'nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts'
export async function tts(options: ttsOption) {
    //{ text, speechRate, pitchRate, voice, volume, format }
    const token = await getToken()
    const params = new URLSearchParams()
    params.set('token', token)
    for (const key in options) {
        params.set(key, options[key])
    }

    const res = await axios.get(`${URL}?${params.toString()}`)
    return res
}