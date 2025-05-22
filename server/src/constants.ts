/**
 * WebSocket 消息类型枚举
 */
export enum MessageType {
  /** 加入房间 */
  JOIN = 'join',
  /** 对等节点加入 */
  PEER_JOINED = 'peer-joined',
  /** 对等节点离开 */
  PEER_LEFT = 'peer-left',
  /** WebRTC offer */
  OFFER = 'offer',
  /** WebRTC answer */
  ANSWER = 'answer',
  /** WebRTC ICE candidate */
  ICE_CANDIDATE = 'ice-candidate',
}

/**
 * WebSocket 关闭代码枚举
 */
export enum WebSocketCloseCode {
  /** 正常关闭 */
  NORMAL = 1000,
  /** 缺少用户ID */
  MISSING_USER_ID = 4000,
  /** 用户不存在 */
  USER_NOT_FOUND = 4001,
}

/**
 * 服务器配置常量
 */
export const SERVER_CONFIG = {
  /** 默认端口号 */
  DEFAULT_PORT: 8080,
  /** 默认房间ID */
  DEFAULT_ROOM_ID: 'default',
} as const;

/**
 * API 路由常量
 */
export const API_ROUTES = {
  /** 用户注册 */
  REGISTER: '/api/register',
  /** 获取所有用户 */
  USERS: '/api/users',
  /** WebSocket 路由 */
  WS: '/ws',
} as const;

/**
 * WebSocket 查询参数常量
 */
export const WS_QUERY_PARAMS = {
  /** 用户ID参数名 */
  USER_ID: 'userId',
} as const;
