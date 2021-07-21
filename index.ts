import global from './lib/service/global'

// 初始化配置
function init(options) {
  global.replace(options)
  // app
  require('./app')
}

export default init

const isTest = process.argv[2] === 'test'

const testConfig = {
  
}

if (isTest) {
  init(testConfig)
}