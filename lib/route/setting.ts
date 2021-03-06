import { pick } from 'lodash'
import { CMDS, HTTP_ERRORS } from '../service/const'
import global from '../service/global'
import wss from '../service/wss'
import speak, { getInstalledVoices } from '../service/tts/system'

const routes = [
  {
    verb: 'get',
    uri: '/settings',
    middlewares: [get],
    validator: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      }
    }
  },
  {
    verb: 'put',
    uri: '/settings/update',
    middlewares: [update]
  },
  {
    verb: 'put',
    uri: '/settings/merge',
    middlewares: [merge]
  },
  {
    verb: 'put',
    uri: '/settings/replace',
    middlewares: [replace]
  },

  {
    verb: 'get',
    uri: '/voices',
    middlewares: [getVoices]
  },
  {
    verb: 'post',
    uri: '/speak',
    middlewares: [playVoice],
    validator: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string' },
        voice: { type: 'string' },
        speed: { type: 'number' }
      }
    }
  }
]

async function get(ctx) {
  const { path } = ctx.__body
  const data = path ? global.get(path) : global.all()
  const res = {
    ...data,
    userCookie: null,
  }
  if (!data) throw HTTP_ERRORS.NOT_FOUND
  ctx.body = {
    message: 'ok',
    data: res
  }
}

function update(ctx) {
  const payload = ctx.__body
  const settings = global.update(payload)
  const res = {
    ...settings,
    userCookie: null,
  }
  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: res
  })
  ctx.body = {
    message: 'ok',
    data: res
  }
}

function merge(ctx) {
  const payload = ctx.__body
  const settings = global.merge(payload)
  const res = {
    ...settings,
    userCookie: null,
  }
  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: pick(res, Object.keys(payload))
  })
  ctx.body = {
    message: 'ok',
    data: res
  }
}

function replace(ctx) {
  const payload = ctx.__body
  const settings = global.replace(payload)
  const res = {
    ...settings,
    userCookie: null,
  }
  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: res
  })
  ctx.body = {
    message: 'ok',
    data: res
  }
}

async function getVoices(ctx) {
  const voices = await getInstalledVoices()
  ctx.body = {
    message: 'ok',
    data: voices
  }
}

async function playVoice(ctx) {
  const { text, voice, speed } = ctx.__body
  await speak(text, {
    voice,
    speed
  })
  ctx.body = {
    message: 'ok'
  }
}

export default routes