// import './app'
import state from './lib/service/state'

export default async function ({ 
  port,
  webPath, 
}: { 
  port?: number;
  webPath?: string
}) {
  state.port = port
  state.webPath = webPath

  await import('./app.js')
}