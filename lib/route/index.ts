import Router from '@koa/router'
import { version, name, description } from '../../package.json'
import settingAPIs from './setting'
import roomAPIs from './room'

const router = new Router()
const apiRouter = new Router()
apiRouter.get('/touch', (ctx) => { ctx.body = 'touch' });

[
  ...roomAPIs,
  ...settingAPIs
]
  .forEach(({ verb, middlewares, uri }) => {
    apiRouter[verb](uri, ...middlewares)
  })

router.use('/api', apiRouter.routes(), apiRouter.allowedMethods())
router.get('/', (ctx, next) => {
  ctx.body = {
    name,
    version,
    description
  }
})

export default router