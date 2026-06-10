import path from 'path'
import protobuf from 'protobufjs'
import state from '../state'

protobuf.load(path.join(__dirname, 'dm.proto'))
  .then(root => {
    const dm = root.lookupType("DM")

    state.dmV2Decoder = (dmV2) => {
      const buffer = Buffer.from(dmV2, 'base64')
      const message = dm.decode(buffer)
      const object = dm.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        // see ConversionOptions
      })

      return object
    }
  })