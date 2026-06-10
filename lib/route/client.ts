import { db } from '../service/db'
import { clients } from '../model/schema.sqlite'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import { DEFAULT_DM_STYLE } from '../service/const'

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
]

function register(ctx) {
  const { clientId } = ctx.__body
  const now = Date.now()

  // 如果传了 clientId，先查是否已存在
  if (clientId) {
    const existing = db
      .select()
      .from(clients)
      .where(eq(clients.clientId, clientId))
      .get()

    if (existing) {
      ctx.body = { message: 'ok', data: existing }
      return
    }
  }

  // 新建：生成 UUID 作为 clientId
  const id = clientId || crypto.randomUUID()
  db.insert(clients)
    .values({
      clientId: id,
      style: DEFAULT_DM_STYLE,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  const result = db
    .select()
    .from(clients)
    .where(eq(clients.clientId, id))
    .get()

  ctx.body = { message: 'ok', data: result }
}

export default routes
