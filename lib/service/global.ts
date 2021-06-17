import { get, merge, pick } from 'lodash'
class Global {
  options: any = {}

  all() {
    return this.options
  }

  get(key: string) {
    return get(this.options, key)
  }

  set(path: string, data) {
    const paths = path.split('.')
    const last = paths.pop()

    let part = this.options
    for (const cursor of paths) {
      if (!part[cursor]) { part[cursor] = {} }
      part = part[cursor]
    }
    part[last] = data
    return data
    // return Object.assign(this.options, { [key]: data })
  }

  merge(options) {
    return merge(this.options, options)
  }

  replace(options) {
    this.options = options
    return this.options
  }

  update(options) {
    for (const key in options) {
      this.options[key] = options[key]
    }
    return pick(this.options, Object.keys(options))
  }
}

export default new Global()