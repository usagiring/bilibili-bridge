import { db } from '../service/db'
import { clients } from '../model/schema.sqlite'
import { eq } from 'drizzle-orm'

import { createClient, getClient, omitInstance } from '../service/client'
import { set } from 'lodash'

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
        KVs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
    },
  },
]

function register(ctx) {
  const { clientId } = ctx.__body

  if (clientId) {
    const existing = db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .get()

    if (existing) {
      ctx.body = { message: 'ok', data: existing }
      return
    }
  }

  const client = createClient()

  db.insert(clients)
    .values(client)
    .run()

  ctx.body = { message: 'ok', data: client }
}

function getConfig(ctx) {
  const { clientId } = ctx.__body

  const client = getClient(clientId)

  if (!client) {
    ctx.body = { message: 'not found', data: null }
    return
  }

  ctx.body = { message: 'ok', data: omitInstance(client) }
}

function updateConfig(ctx) {
  const { clientId, KVs } = ctx.__body

  const client = omitInstance(getClient(clientId))

  KVs.forEach(({ key, value }: { key: string, value: any }) => {
    set(client, key, value)
  })

  db.update(clients)
    .set({
      ...client,
      updatedAt: Date.now(),
    })
    .where(eq(clients.id, clientId))
    .run()

  ctx.body = { message: 'ok', data: client }
}

export default routes
