import Router from '@koa/router'
import { version, name, description } from '../../package.json'
import ajv from '../service/ajv'
import { HTTP_ERRORS } from '../service/const'
import settingAPIs from './setting'
import roomAPIs from './room'
import giftAPIs from './gift'
import dataAPIs from './data'
import messageAPIs from './message'
import commentAPIs from './comment'
import interactAPIs from './interact'
import lotteryAPIs from './lottery'
import statisticAPIs from './statistic'
import asrAPIs from './asr'
import userAPIs from './user'

interface RouteInfo {
  verb: string
  middlewares: any[]
  uri: string
  validator?: any
}
const router = new Router()
const apiRouter = new Router()
apiRouter.get('/touch', (ctx) => {
  ctx.body = 'touch'
});

[
  ...roomAPIs,
  ...settingAPIs,
  ...giftAPIs,
  ...dataAPIs,
  ...messageAPIs,
  ...commentAPIs,
  ...interactAPIs,
  ...lotteryAPIs,
  ...statisticAPIs,
  ...asrAPIs,
  ...userAPIs,
]
  .forEach(({ verb, middlewares, uri, validator }: RouteInfo) => {
    if (validator) {
      middlewares.unshift(validatorMWWrapper(validator))
    }
    middlewares.unshift(composeBodyMW)

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

async function composeBodyMW(ctx, next) {
  ctx.__body = {
    ...ctx.params,
    ...ctx.request.query,
    ...ctx.request.body
  }
  await next()
}

function validatorMWWrapper(schema) {
  const validate = ajv.compile(schema)
  return async function validatorMW(ctx, next) {
    if (validate(ctx.__body)) {
      await next()
    } else {
      throw HTTP_ERRORS.PARAMS_ERROR
    }
  }
}

