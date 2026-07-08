import { db } from '../service/db'
import { clients } from '../model/schema.sqlite'
import { eq } from 'drizzle-orm'
import { createClient, getClient } from '../service/client'
import { set, cloneDeep, pick } from 'lodash'
import state, { Client } from '../service/state'
import { sse } from '../service/sse'
import { CMD, DM_STYLE } from '../service/const'

const routes = [
  {
    verb: 'post',
    uri: '/client/register',
    middlewares: [ register ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
      },
    },
  },
  {
    verb: 'get',
    uri: '/client/config/info',
    middlewares: [ getConfig ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
      },
    },
  },
  {
    verb: 'post',
    uri: '/client/config/update',
    middlewares: [ updateConfig ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        kvs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              // value: { type: 'any' },
            },
          },
        },
      },
    },
  },
  {
    verb: 'post',
    uri: '/client/config/dm-style/restore',
    middlewares: [ restoreDMStyle ],
    validator: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
      },
    },
  },
]

function register(ctx) {
  const { clientId } = ctx.__body

  console.log('Registering client:', clientId)
  if (clientId) {
    const client = db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .get() as Client

    if (client) {
      state.clients.push(client)

      ctx.body = { message: 'ok', data: client }
      return
    }
  }

  const client = createClient()

  db.insert(clients)
    .values(client)
    .run()
  state.clients.push(client)

  ctx.body = { message: 'ok', data: client }
}

function getConfig(ctx) {
  const { clientId } = ctx.__body

  const client = getClient(clientId)

  if (!client) {
    ctx.body = { message: 'not found', data: null }
    return
  }

  ctx.body = { message: 'ok', data: client.config }
}

function updateConfig(ctx) {
  const { clientId, kvs } = ctx.__body

  const client = getClient(clientId)
  const config = client.config

  const rootKeySet = new Set()

  kvs.forEach(({ key, value }: { key: string, value: any }) => {
    set(config, key, value)

    rootKeySet.add(getRootKey(key))
  })

  db.update(clients)
    .set({
      config,
      updatedAt: Date.now(),
    })
    .where(eq(clients.id, clientId))
    .run()

  const rootKeys = [ ...rootKeySet ]

  const shouldSendSSEKeys = [
    { key: 'dmStyle', event: 'DM_STYLE' }, 
    { key: 'dmRawStyle', event: 'DM_RAW_STYLE' }, 
    { key: 'liveConfig', event: 'LIVE_CONFIG' }, 
  ]
  for (const k of shouldSendSSEKeys) {
    if (!rootKeySet.has(k.key)) continue
    sse.send({ clientId, event: CMD[k.event], data: config[k.key] })
  }

  ctx.body = { message: 'ok', data: pick(config, rootKeys) }
}

function getRootKey(path: string): string {
  // 'dmStyle.messageSlots[0].isShow' → 'dmStyle'
  return path.split('.')[0].split('[')[0]
}

function restoreDMStyle (ctx) {
  const { clientId } = ctx.__body

  const client = getClient(clientId)
  const config = client.config

  config.dmStyle = cloneDeep(DM_STYLE)

  db.update(clients)
    .set({
      config,
      updatedAt: Date.now(),
    })
    .where(eq(clients.id, clientId))
    .run()

  sse.send({ clientId, event: CMD.DM_STYLE, data: config.dmStyle })

  ctx.body = { message: 'ok', data: config }
}

export default routes
