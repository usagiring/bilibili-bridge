class Global {
  options = {}

  all() {
    return this.options
  }

  get(key: string) {
    return this.options[key]
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
    return Object.assign(this.options, options)
  }
  replace(options) {
    this.options = options
  }
}

export default new Global()