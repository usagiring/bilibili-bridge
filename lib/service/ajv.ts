import Ajv from 'ajv'

const ajv = new Ajv({ coerceTypes: true })

ajv.addKeyword({
  keyword: 'separator',
  modifying: true,
  compile: (separator: string) => {
    console.log(separator, 'separator')
    return function coerceArray(data: any, dataCxt?: any) {
      console.log(data, dataCxt)
      if (typeof data === 'string' && data.includes(separator)) {
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