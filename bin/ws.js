const WebSocket = require('ws')
const axios = require('axios')

const ws = new WebSocket('ws://127.0.0.1:3000')

ws.on('open', function open() {
  const message = {
    event: 'PING',
    payload: {}
  }

  ws.send(JSON.stringify(message))
  console.log('sended')
})

ws.on('message', function incoming(data) {
  console.log(data)
})

axios.post('http://127.0.0.1:3000/api/rooms/5050/connect')
  .then(res => {
    console.log(res.data)
  })

// axios.post('http://127.0.0.1:3000/api/rooms/5050/disconnect')
//   .then(res => {
//     console.log(res.data)
//   })

