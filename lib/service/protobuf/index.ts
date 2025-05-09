import path from 'path'
import protobuf from 'protobufjs'
import runtime from '../runtime'

protobuf.load(path.join(__dirname, 'dm.proto'))
  .then(root => {
    const dm = root.lookupType("DM")

    runtime.set('dmV2Decoder', (dmV2) => {
      const buffer = Buffer.from(dmV2, 'base64')
      const message = dm.decode(buffer)
      const object = dm.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        // see ConversionOptions
      })

      return object
    })
  })