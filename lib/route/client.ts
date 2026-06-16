import { db } from '../service/db'
import { clients } from '../model/schema.sqlite'
import { eq } from 'drizzle-orm'

import { createClient, getClient } from '../service/client'
import { set } from 'lodash'
import state, { Client } from '../service/state'

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
  const config = client.config || {}

  kvs.forEach(({ key, value }: { key: string, value: any }) => {
    set(config, key, value)
  })

  db.update(clients)
    .set({
      config,
      updatedAt: Date.now(),
    })
    .where(eq(clients.id, clientId))
    .run()

  ctx.body = { message: 'ok', data: config }
}

export default routes
