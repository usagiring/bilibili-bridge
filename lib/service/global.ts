import { get, merge, pick } from 'lodash'
class Global {
  options: any = {}
  inner: any = {}

  all() {
    const allKeys = Object.keys(this.options)
    return pick(this.options, allKeys)
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

  //TODO 以后再改吧
  getInner(key: string) {
    return get(this.inner, key)
  }

  setInner(path: string, data) {
    const paths = path.split('.')
    const last = paths.pop()

    let part = this.inner
    for (const cursor of paths) {
      if (!part[cursor]) { part[cursor] = {} }
      part = part[cursor]
    }
    part[last] = data
    return data
    // return Object.assign(this.options, { [key]: data })
  }
}

export default new Global()