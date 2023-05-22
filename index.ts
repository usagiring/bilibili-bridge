import global from './lib/service/global'

// 初始化配置
function init(options) {
  global.replace(options)
  // app
  require('./app')
}

export default init