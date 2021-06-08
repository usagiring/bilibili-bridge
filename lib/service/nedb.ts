import Datastore from 'nedb'
import fs from 'fs'
import path from 'path'
import global from './global'
import { dateFormat } from './util'

const USER_DATA_PATH = global.get('USER_DATA_PATH') || 'db'

const userDB = new Datastore({ filename: `${USER_DATA_PATH}/user`, autoload: true })
const commentDB = new Datastore({ filename: `${USER_DATA_PATH}/comment`, autoload: true })
const interactDB = new Datastore({ filename: `${USER_DATA_PATH}/interact`, autoload: true })
const giftDB = new Datastore({ filename: `${USER_DATA_PATH}/gift`, autoload: true })
const lotteryDB = new Datastore({ filename: `${USER_DATA_PATH}/lottery`, autoload: true })

giftDB.ensureIndex({
  fieldName: 'uid',
})
giftDB.ensureIndex({
  fieldName: 'roomId',
})
giftDB.ensureIndex({
  fieldName: 'sendAt',
})

interactDB.ensureIndex({
  fieldName: 'uid',
})
interactDB.ensureIndex({
  fieldName: 'roomId',
})
interactDB.ensureIndex({
  fieldName: 'sendAt',
})

commentDB.ensureIndex({
  fieldName: 'uid',
})
commentDB.ensureIndex({
  fieldName: 'roomId',
})
commentDB.ensureIndex({
  fieldName: 'sendAt',
})

userDB.ensureIndex({
  fieldName: 'uid',
  unique: true,
})

// userDB.ensureIndex({
//   fieldName: 'createdAt',
//   expireAfterSeconds: 604800 // 用户数据缓存 7天
// })

export function executor(cursor) {
  return new Promise((resolve, reject) => {
    cursor.exec((err, docs) => {
      if (err) reject(err)
      resolve(docs)
    })
  })
}

export interface QueryOptions {
  skip?: number
  limit?: number
  sort?: any
  projection?: any
}

function wrapper(db) {
  return {
    insert: (data): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.insert(data, (err, newDocs) => {
          if (err) reject(err)
          resolve(newDocs)
        })
      })
    },
    find: (query, options: QueryOptions = {}): Promise<any> => {
      const { skip, limit, sort, projection } = options as any
      return new Promise((resolve, reject) => {
        let cursor = db.find(query)
        if (projection) {
          cursor = cursor.projection(projection)
        }
        if (sort) {
          cursor = cursor.sort(sort)
        }
        if (skip) {
          cursor = cursor.skip(skip)
        }
        if (limit) {
          cursor = cursor.limit(limit)
        }
        cursor.exec((err, docs) => {
          if (err) reject(err)
          resolve(docs)
        })
      })
    },
    count: (query): Promise<number> => {
      return new Promise((resolve, reject) => {
        db.count(query, (err, count) => {
          if (err) reject(err)
          resolve(count as number)
        })
      })
    },
    findOne: (query): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.findOne(query, (err, doc) => {
          if (err) reject(err)
          resolve(doc)
        })
      })
    },
    update: (query, data, options = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.update(query, data, options, (err, numAffected, affectedDocuments, upsert) => {
          if (err) reject(err)
          resolve(affectedDocuments)
        })
      })
    },
    remove: (query, options = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.remove(query, options, (err, numRemoved) => {
          if (err) reject(err)
          resolve(numRemoved)
        })
      })
    },
    deleteMany: (query, options = { multi: true }): Promise<any> => {
      return new Promise((resolve, reject) => {
        db.remove(query, options, (err, numRemoved) => {
          if (err) reject(err)
          resolve(numRemoved)
        })
      })
    }
  }
}

export function backup(names: string[]) {
  if (!names.length) return
  const now = dateFormat(new Date(), "YYYYMMDD-HHmmss")
  // 是否先压缩一次？
  // commentDB.persistence.compactDatafile()
  const BACKUP_DIR = path.join(USER_DATA_PATH, `backup-${now}`)
  fs.mkdirSync(BACKUP_DIR)
  if (names.includes('comment')) {
    fs.copyFileSync(`${USER_DATA_PATH}/comment`, `${BACKUP_DIR}/comment`)
  }
  if (names.includes('gift')) {
    fs.copyFileSync(`${USER_DATA_PATH}/gift`, `${BACKUP_DIR}/gift`)
  }
  if (names.includes('interact')) {
    fs.copyFileSync(`${USER_DATA_PATH}/interact`, `${BACKUP_DIR}/interact`)
  }
  if (names.includes('lottery')) {
    fs.copyFileSync(`${USER_DATA_PATH}/lottery`, `${BACKUP_DIR}/lottery`)
  }
}

export function deleteDB(names) {
  if (names.includes('comment')) {
    fs.unlinkSync(`${USER_DATA_PATH}/comment`)
  }
  if (names.includes('gift')) {
    fs.unlinkSync(`${USER_DATA_PATH}/gift`)
  }
  if (names.includes('interact')) {
    fs.unlinkSync(`${USER_DATA_PATH}/interact`)
  }
  if (names.includes('lottery')) {
    fs.unlinkSync(`${USER_DATA_PATH}/lottery`)
  }
  if (names.includes('user')) {
    fs.unlinkSync(`${USER_DATA_PATH}/user`)
  }
}

const userDBWrapper = wrapper(userDB)
const commentDBWrapper = wrapper(commentDB)
const giftDBWrapper = wrapper(giftDB)
const interactDBWrapper = wrapper(interactDB)
// const otherDBWrapper = wrapper(otherDB)
const lotteryDBWrapper = wrapper(lotteryDB)

export {
  userDBWrapper as userDB,
  commentDBWrapper as commentDB,
  giftDBWrapper as giftDB,
  interactDBWrapper as interactDB,
  // otherDBWrapper as otherDB,
  lotteryDBWrapper as lotteryDB
}
