import state from './lib/service/state'

export default async function ({ 
  port,
  htmlPath, 
}: { 
  port: number;
  htmlPath: string
}) {
  state.port = port
  state.htmlPath = htmlPath

  await import('./app.js')
}