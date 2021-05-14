// import './app'
import global from './lib/service/global'

// 初始化配置
export default function (options) {
  global.replace(options)
  require('./app')
}