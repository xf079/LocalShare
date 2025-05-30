/**
 * 信令相关类型定义
 * 包含信令状态、事件、消息等类型
 */

/**
 * 信令连接状态枚举
 */
export enum SignalingState {
  /** 信令服务器未连接 */
  DISCONNECTED = 'disconnected',
  /** 正在连接信令服务器 */
  CONNECTING = 'connecting',
  /** 信令服务器已连接 */
  CONNECTED = 'connected',
  /** 信令连接错误 */
  ERROR = 'error',
}

/**
 * 信令事件类型定义
 */
export interface SignalingEvents {
  /** 信令状态变化事件 */
  'state-change': (state: SignalingState) => void
  /** 接收到信令消息事件 */
  'message': (message: SignalingMessage) => void
  /** 对等方加入事件 */
  'peer-joined': (peerId: string) => void
  /** 对等方离开事件 */
  'peer-left': (peerId: string) => void
  /** 接收到offer事件 */
  'offer': (offer: RTCSessionDescriptionInit, peerId: string) => void
  /** 接收到answer事件 */
  'answer': (answer: RTCSessionDescriptionInit, peerId: string) => void
  /** 接收到ICE候选者事件 */
  'ice-candidate': (candidate: RTCIceCandidateInit, peerId: string) => void
  /** 信令错误事件 */
  'error': (error: Error) => void
}

/**
 * 房间信息接口
 */
export interface RoomInfo {
  /** 房间唯一标识符 */
  id: string
  /** 房间名称 */
  name: string
  /** 参与者ID列表 */
  participants: string[]
  /** 最大参与者数量 */
  maxParticipants: number
  /** 房间创建时间戳 */
  createdAt: number
}

/**
 * 信令消息接口
 */
export interface SignalingMessage {
  /** 消息类型 */
  type:
    | 'offer'        // WebRTC offer
    | 'answer'       // WebRTC answer
    | 'ice-candidate' // ICE候选者
    | 'join'         // 加入房间
    | 'leave'        // 离开房间
    | 'peer-joined'  // 对等方加入
    | 'peer-left'    // 对等方离开
    | 'ping'         // 心跳ping
    | 'pong'         // 心跳pong
  /** 消息数据 */
  data?: any
  /** 发送方ID */
  from?: string
  /** 接收方ID */
  to?: string
  /** 房间ID */
  roomId?: string
  /** 消息时间戳 */
  timestamp?: number
  /** 对等方ID */
  peerId?: string
  /** WebRTC offer数据 */
  offer?: RTCSessionDescriptionInit
  /** WebRTC answer数据 */
  answer?: RTCSessionDescriptionInit
  /** ICE候选者数据 */
  candidate?: RTCIceCandidateInit
}

/**
 * 信令配置接口
 */
export interface SignalingConfig {
  /** 信令服务器URL */
  signalingServerUrl: string
  /** 重连尝试次数 */
  reconnectAttempts?: number
  /** 重连延迟时间(毫秒) */
  reconnectDelay?: number
  /** 心跳间隔时间(毫秒) */
  heartbeatInterval?: number
}