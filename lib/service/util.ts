import dayjs from 'dayjs'

export const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const dateFormat = (date, formatter = "YYYY-MM-DD HH:mm:ss") => dayjs(date).format(formatter)

/** 解析 Cookie 字符串为键值对象 */
export const parseCookie = (str: string): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const pair of str.split(';')) {
    const idx = pair.indexOf('=')
    if (idx > 0) result[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
  }
  return result
}

export const parseQueryRegexp = (query: any) => {
  if (typeof query === 'string') {
    return
  }
  if (Array.isArray(query)) {
    return
  }
  for (const key in query) {
    if (Array.isArray(query[key])) {
      (query[key] as any[]).forEach(element => {
        parseQueryRegexp(element)
      })
    }
    if (typeof query[key] === 'object') {
      parseQueryRegexp(query[key])
    }
    if (typeof query[key] === 'string' && key === '$regex') {
      query[key] = new RegExp(query[key] as string)
    }
  }
}

export const parseNumber = (number) => Number.isSafeInteger(number) ? Number(Number(number).toFixed(0)) : Number(Number(number).toFixed(1))

export const transformColorNumber2String = (number) => `#${number.toString(16).padStart(6, '0')}`