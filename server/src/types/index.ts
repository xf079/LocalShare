interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp: string;
}

interface RTCIceCandidateInit {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}
/**
 * WebRTC 信令服务器类型定义
 */

/**
 * 用户信息接口
 */
export interface User {
  /** 用户唯一标识符 */
  id: string;
  /** 用户名 */
  username: string;
  /** 用户所在房间ID */
  roomId: string | null;
  /** 用户WebSocket连接 */
  ws: WebSocket | null;
}

/**
 * WebRTC 信令消息接口
 */
export interface SignalingMessage {
  /** 消息类型 */
  type: MessageType;
  /** 发送者ID */
  from: string;
  /** 接收者ID */
  to: string;
  /** 房间ID */
  roomId: string;
  /** WebRTC 会话描述（用于offer/answer） */
  offer?: RTCSessionDescriptionInit;
  /** WebRTC 会话描述（用于offer/answer） */
  answer?: RTCSessionDescriptionInit;
  /** WebRTC ICE候选者信息 */
  candidate?: RTCIceCandidateInit;
}
/**
 * WebSocket客户端接口
 */
export interface Client {
  /** 客户端ID */
  id: string;
  /** 客户端WebSocket连接 */
  ws: WebSocket;
  /** 客户端所在房间ID */
  roomId: string;
}

/**
 * 房间信息接口
 */
export interface Room {
  /** 房间ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 房间内的客户端列表 */
  clients: Map<string, Client>;
}

/**
 * 用户注册请求接口
 */
export interface RegisterRequest {
  /** 用户名 */
  username: string;
  /** 房间ID */
  roomId: string;
}

/**
/**
 * 消息类型枚举
 */
enum MessageType {
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
 */
export enum WebSocketCloseCode {
  /** 正常关闭 */
  NORMAL_CLOSURE = 1000,
  /** 离开房间 */
  LEAVING_ROOM = 4000,
  /** 服务器错误 */
  SERVER_ERROR = 1011,
}

/**
 * 服务器配置常量
 */
export const SERVER_CONFIG = {
  /** 服务器端口 */
  PORT: 3000,
  /** 心跳间隔（毫秒） */
  HEARTBEAT_INTERVAL: 30000,
  /** 心跳超时时间（毫秒） */
  HEARTBEAT_TIMEOUT: 60000,
} as const;

/**
 * API路由常量
 */
export const API_ROUTES = {
  /** 用户注册路由 */
  REGISTER: '/api/register',
  /** WebSocket连接路由 */
  WS: '/ws',
} as const;

/**
 * WebSocket查询参数常量
 */
export const WS_QUERY_PARAMS = {
  /** 用户ID参数 */
  USER_ID: 'userId',
  /** 房间ID参数 */
  ROOM_ID: 'roomId',
} as const;
