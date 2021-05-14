export const EVENTS = {
  PING: 'PING',
  UPDATE_SETTING: 'UPDATE_SETTING',
  REPLACE_SETTING: 'REPLACE_SETTING',
  MERGE_SETTING: 'MERGE_SETTING',
  WS_MESSAGE: 'WS_MESSAGE',
  NINKI: 'NINKI', // 人气
  DANMAKU: 'DANMAKU'
}

export const ERRORS = {
  SYSTEM_ERROR: 'SYSTEM_ERROR'
}

export const COMMON_RESPONSE = {
  message: 'ok'
}

export const HTTP_ERRORS = {
  NOT_FOUND: {
    status: 404,
    message: 'NOT_FOUND'
  },
  PARAMS_ERROR: {
    status: 400,
    message: 'PARAMS_ERROR'
  }
}