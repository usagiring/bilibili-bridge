import state from './lib/service/state'

export default async function (port: number) {
  state.port = port

  await import('./app.js')
}