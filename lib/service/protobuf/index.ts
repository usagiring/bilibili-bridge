import path from 'path'
import protobuf from 'protobufjs'
import state from '../state'

const toObjectOpts = {
  longs: String,
  enums: String,
  bytes: String,
} as const

protobuf.load(path.join(__dirname, 'dm.proto'))
  .then(root => {
    const dmType = root.lookupType("DM")

    state.dmV2Decoder = (dmV2) => {
      const buffer = Buffer.from(dmV2, 'base64')
      const message = dmType.decode(buffer)
      const object = dmType.toObject(message, toObjectOpts)

      return object
    }

    const interactType = root.lookupType("Interact")
    state.interactDecoder = (interact: string) => {
      const buffer = Buffer.from(interact, 'base64')
      const message = interactType.decode(buffer)
      const object = interactType.toObject(message, toObjectOpts)
      return object
    }
  })
