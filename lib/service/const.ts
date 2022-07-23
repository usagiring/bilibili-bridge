export const EVENTS = {
  PING: 'PING',
  NINKI: 'NINKI', // 人气
  DANMAKU: 'DANMAKU',
  GET_GIFT_CONFIG: 'GET_GIFT_CONFIG',
  MESSAGE: 'MESSAGE',
  AUTO_REPLY: 'AUTO_REPLY',
  DANMAKU_COMMAND: 'DANMAKU_COMMAND',
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
  ROOM_REAL_TIME_MESSAGE_UPDATE: 'ROOM_REAL_TIME_MESSAGE_UPDATE',
  MESSAGE_CLEAR: 'MESSAGE_CLEAR',
  EXAMPLE_COMMENT: 'EXAMPLE_COMMENT',
  EXAMPLE_INTERACT: 'EXAMPLE_INTERACT',
  EXAMPLE_GIFT: 'EXAMPLE_GIFT',
  EXAMPLE_SUPER_CHAT: 'EXAMPLE_SUPER_CHAT',
  EXAMPLE_MESSAGE_CLEAR: 'EXAMPLE_MESSAGE_CLEAR',
  ANCHOR_LOT_START: 'ANCHOR_LOT_START',
  ANCHOR_LOT_AWARD: 'ANCHOR_LOT_AWARD',
  ANCHOR_LOT_END: 'ANCHOR_LOT_END',
  EXAMPLE_MESSAGE_RESTORE: 'EXAMPLE_MESSAGE_RESTORE',
  DANMAKU_COMMAND_RESULT: 'DANMAKU_COMMAND_RESULT',
  WATCHED_CHANGE: 'WATCHED_CHANGE',
  ASR_SENTENCE_BEGIN: 'ASR_SENTENCE_BEGIN',
  ASR_SENTENCE_END: 'ASR_SENTENCE_END',
  ASR_SENTENCE_CHANGE: 'ASR_SENTENCE_CHANGE',
}

export const BILI_CMDS = {
  PREPARING: 'PREPARING',
  INTERACT_WORD: 'INTERACT_WORD',
  DANMU_MSG: 'DANMU_MSG',
  SEND_GIFT: 'SEND_GIFT',
  LIVE: 'LIVE',
  ROOM_REAL_TIME_MESSAGE_UPDATE: 'ROOM_REAL_TIME_MESSAGE_UPDATE',
  ANCHOR_LOT_START: 'ANCHOR_LOT_START',
  ANCHOR_LOT_AWARD: 'ANCHOR_LOT_AWARD',
  ANCHOR_LOT_END: 'ANCHOR_LOT_END',
  WATCHED_CHANGE: 'WATCHED_CHANGE',
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