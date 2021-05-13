const options = {}
function test(path, data) {
  const paths = path.split('.')
  const last = paths.pop()

  let part = options
  for (const cursor of paths) {
    if (!part[cursor]) { part[cursor] = {} }
    part = part[cursor]
  }
  part[last] = data
  return data
}

test('a.b.c', { d: 1 })
console.log(JSON.stringify(options))