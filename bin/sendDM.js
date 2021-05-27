const WebSocket = require('ws')
const axios = require('axios')

const ws = new WebSocket('ws://127.0.0.1:8081')
const url = 'http://127.0.0.1:8081'

// ws.on('open', function open() {
//   const message = {
//     event: 'PING',
//     payload: {}
//   }

//   ws.send(JSON.stringify(message))
//   console.log('sended')
// })

// ws.on('message', function incoming(data) {
//   console.log(data)
// })

const msg ={
  id: 8,
  type: "gift",
  uid: 777777,
  name: 'bli_777777',
  avatar: "",
  isGuardGift: true,
  price: 198,
  giftNumber: 1,
  totalPrice: 198,
  giftName: '舰长'
}
axios.post(`${url}/api/messages/examples/send`, {
  type: msg.type,
  data: msg
})