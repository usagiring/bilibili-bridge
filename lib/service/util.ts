import moment from 'moment'

export const wait = (ms: number) => setTimeout(Promise.resolve, ms)
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