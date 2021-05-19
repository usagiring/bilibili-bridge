import { backup, deleteDB } from '../service/nedb'

const routes = [
  {
    verb: 'post',
    uri: '/dbs/backup',
    middlewares: [dbBackup],
    validator: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }}
      }
    }
  },
  {
    verb: 'post',
    uri: '/dbs/clear',
    middlewares: [dbClear],
    validator: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }}
      }
    }
  }
]

async function dbBackup(ctx) {
  const { names } = ctx.__body
  backup(names)
  ctx.body = {
    message: 'ok'
  }
}

async function dbClear(ctx) {
  const { names } = ctx.__body
  deleteDB(names)
  ctx.body = {
    message: 'ok'
  }
}

export default routes