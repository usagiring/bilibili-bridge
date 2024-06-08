import _ from 'lodash'

class Runtime {
  ctx: {
    dmV2Decoder?: any
    connectionPoolMap?: {
      [x: string]: {
        roomId: string
        isConnected: boolean
        wsClient: any
        giftMap: any
      }
    }
  } = {}

  get(key: string) {
    return _.get(this.ctx, key)
  }

  set(path: string, data) {
    // const paths = path.split('.')
    // const last = paths.pop()

    // let part = this.inner
    // for (const cursor of paths) {
    //   if (!part[cursor]) { part[cursor] = {} }
    //   part = part[cursor]
    // }
    // part[last] = data
    // return data
    // return Object.assign(this.options, { [key]: data })

    _.set(this.ctx, path, data)
    return true
  }

  unset(path: string) {
    _.unset(this.ctx, path)
    return true
  }
}

export default new Runtime()