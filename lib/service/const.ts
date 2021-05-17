export const EVENTS = {
  PING: 'PING',
  UPDATE_SETTING: 'UPDATE_SETTING',
  REPLACE_SETTING: 'REPLACE_SETTING',
  MERGE_SETTING: 'MERGE_SETTING',
  NINKI: 'NINKI', // 人气
  DANMAKU: 'DANMAKU',
  GET_GIFT_CONFIG: 'GET_GIFT_CONFIG'
}

export const CMDS = {
  GIFT_CONFIG: 'GIFT_CONFIG',
  NINKI: 'NINKI',
  COMMENT: 'COMMENT',
  INTERACT: 'INTERACT',
  SUPER_CHAT: 'SUPER_CHAT',
  GIFT: 'GIFT',
  LIVE: 'LIVE',
  PREPARING: 'PREPARING',
  SETTING: 'SETTING',
  ROOM_REAL_TIME_MESSAGE_UPDATE: 'ROOM_REAL_TIME_MESSAGE_UPDATE'
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