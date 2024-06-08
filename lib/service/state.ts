import _ from 'lodash'

class State {
  config: any = {}

  all() {
    const allKeys = Object.keys(this.config)
    return _.pick(this.config, allKeys)
  }

  get(key: string) {
    return _.get(this.config, key)
  }

  set(path: string, data) {
    // const paths = path.split('.')
    // const last = paths.pop()

    // let part = this.config
    // for (const cursor of paths) {
    //   if (!part[cursor]) { part[cursor] = {} }
    //   part = part[cursor]
    // }
    // part[last] = data
    // return data
    // return Object.assign(this.options, { [key]: data })

    _.set(this.config, path, data)

    return true
  }

  getByKeys(keys: string[]) {
    return _.pick(this.config, keys)
  }

  unset(path: string) {
    _.unset(this.config, path)
    return true
  }

  replace(options) {
    this.config = {}
    return this.upsert(options)
  }

  upsert(options) {
    for (const key in options) {
      this.set(key, options[key])
    }

    return options
  }

  remove(keys) {
    for (const key of keys) {
      this.unset(key)
    }
  }
}

export default new State()