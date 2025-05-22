/**
 * 消息类型枚举
 * 定义WebRTC信令消息的类型
 */
export enum MessageType {
  /** 加入房间消息 */
  JOIN = 'join',
  /** 离开房间消息 */
  LEAVE = 'leave',
  /** 信令消息 */
  SIGNAL = 'signal',
  /** 错误消息 */
  ERROR = 'error',
}

/**
 * WebSocket关闭代码枚举
 * 定义WebSocket连接关闭的原因代码
 */
export enum WebSocketCloseCode {
  /** 正常关闭 */
  NORMAL_CLOSURE = 1000,
  /** 离开房间 */
  LEAVING_ROOM = 4000,
  /** 服务器错误 */
  SERVER_ERROR = 1011,
  /** 缺少用户ID */
  MISSING_USER_ID = 4400,
  /** 用户不存在 */
  USER_NOT_FOUND = 4401,
}

/**
 * 服务器配置常量
 * 定义服务器的基本配置参数
 */
export const SERVER_CONFIG = {
  /** 默认房间ID */
  DEFAULT_ROOM_ID: 'default',
  /** 服务器端口号 */
  PORT: 3000,
  /** 心跳检测间隔（毫秒） */
  HEARTBEAT_INTERVAL: 30000,
  /** 心跳超时时间（毫秒） */
  HEARTBEAT_TIMEOUT: 60000,
} as const;

/**
 * API路由常量
 * 定义服务器API的路由路径
 */
export const API_ROUTES = {
  /** 用户注册路由 */
  REGISTER: '/api/register',
  /** WebSocket连接路由 */
  WS: '/ws',
} as const;

/**
 * WebSocket查询参数常量
 * 定义WebSocket连接URL的查询参数名称
 */
export const WS_QUERY_PARAMS = {
  /** 用户ID参数 */
  USER_ID: 'userId',
  /** 房间ID参数 */
  ROOM_ID: 'roomId',
} as const;
