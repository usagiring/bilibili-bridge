import global from './lib/service/state'

// 初始化配置
function init(options) {
  global.replace(options)
  // app
  require('./app')
}

export default init