import { pick } from 'lodash'
import { CMDS, HTTP_ERRORS } from '../service/const'
import global from '../service/global'
import wss from '../service/wss'
import speak, { getInstalledVoices } from '../service/tts/system'

const routes = [
  {
    verb: 'get',
    uri: '/setting',
    middlewares: [get],
    validator: {
      type: 'object',
      properties: {
        key: { type: 'string' }
      }
    }
  },
  {
    verb: 'put',
    uri: '/setting',
    middlewares: [updateV2],
    validator: {
      type: 'object',
      properties: {
        upsert: {
          type: 'object',
          properties: {

          }
        },
        remove: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        replace: {
          type: 'object',
          properties: {

          }
        }
      }
    }
  },
  // {
  //   verb: 'put',
  //   uri: '/setting/update',
  //   middlewares: [update]
  // },
  // {
  //   verb: 'put',
  //   uri: '/setting/merge',
  //   middlewares: [merge]
  // },
  // {
  //   verb: 'put',
  //   uri: '/setting/replace',
  //   middlewares: [replace]
  // },

  // {
  //   verb: 'get',
  //   uri: '/voice',
  //   middlewares: [getVoices]
  // },
  // {
  //   verb: 'post',
  //   uri: '/speak',
  //   middlewares: [playVoice],
  //   validator: {
  //     type: 'object',
  //     required: ['text'],
  //     properties: {
  //       text: { type: 'string' },
  //       voice: { type: 'string' },
  //       speed: { type: 'number' }
  //     }
  //   }
  // }
]

async function get(ctx) {
  const { key } = ctx.__body
  const data = key ? global.get(key) : global.all()
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

function updateV2(ctx) {
  const { upsert, replace, remove } = ctx.__body 

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