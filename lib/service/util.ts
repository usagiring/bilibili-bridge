import moment from 'moment'

export const wait = (ms: number) => setTimeout(Promise.resolve, ms)
export const dateFormat = (date, formatter = "YYYY-MM-DD HH:mm:ss") => moment(date).format(formatter)