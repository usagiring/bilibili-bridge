import { pick } from 'lodash'
import { CMDS, HTTP_ERRORS } from '../service/const'
import state from '../service/state'
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
        keys: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    verb: 'put',
    uri: '/setting',
    middlewares: [update],
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
  const { keys } = ctx.__body
  const data = keys?.length ? state.getByKeys(keys) : state.all()
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
  const { upsert, replace, remove } = ctx.__body
  let result: any = {}

  if (upsert) {
    result = state.upsert(upsert)
  }

  if (remove?.length) {
    state.remove(remove)
  }

  if (replace) {
    result = state.replace(replace)
  }

  delete result.userCookie

  wss.broadcast({
    cmd: CMDS.SETTING,
    payload: result
  })

  ctx.body = {
    message: 'ok',
    data: result
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