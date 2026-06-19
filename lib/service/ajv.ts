import Ajv from 'ajv'

const ajv = new Ajv({ coerceTypes: true })

ajv.addKeyword({
  keyword: 'separator',
  modifying: true,
  compile: (separator: string) => {
    return function coerceArray(data: any, dataCxt?: any) {
      if (typeof data === 'string') {
        const { parentData, parentDataProperty } = dataCxt
        parentData[parentDataProperty] = data
          .split(separator)
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
      return true
    }
  },
})

export default ajv