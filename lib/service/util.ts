import moment from 'moment'

export const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const dateFormat = (date, formatter = "YYYY-MM-DD HH:mm:ss") => moment(date).format(formatter)

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