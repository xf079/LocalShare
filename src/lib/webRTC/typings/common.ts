/**
 * 通用类型定义
 * 包含对等连接、消息、浏览器支持等通用类型
 */

import type { FileTransfer } from './file-transfer'
import type { MediaConstraints } from './media-stream'

/**
 * 对等连接信息接口
 */
export interface Peer {
  /** 对等方唯一标识符 */
  id: string
  /** WebRTC对等连接对象 */
  connection: RTCPeerConnection
  /** 数据通道对象 */
  dataChannel?: RTCDataChannel
  /** 媒体流对象 */
  mediaStream?: MediaStream
  /** 连接状态 */
  connectionState?: ConnectionState
  /** 最后活跃时间戳 */
  lastSeen?: number
}

/**
 * 消息接口
 */
export interface Message {
  /** 消息唯一标识符 */
  id: string
  /** 消息类型 */
  type: 'text' | 'file' | 'system'
  /** 消息内容 */
  content: string
  /** 消息时间戳 */
  timestamp: number
  /** 发送方ID */
  from: string
  /** 接收方ID */
  to?: string
  /** 发送者标识 */
  sender: string
  /** 接收者标识 */
  receiver?: string
  fileName?: string
  fileSize?: number
  /** 消息元数据 */
  metadata?: Record<string, any>
}

/**
 * 浏览器支持信息接口
 */
export interface BrowserSupport {
  /** 是否支持RTCPeerConnection */
  rtcPeerConnection: boolean
  /** 是否支持getUserMedia */
  getUserMedia: boolean
  /** 是否支持getDisplayMedia */
  getDisplayMedia: boolean
  /** 是否支持数据通道 */
  dataChannels: boolean
  /** 是否支持WebSocket */
  webSocket: boolean
}

/**
 * 浏览器信息接口
 */
export interface BrowserInfo {
  /** 浏览器名称 */
  name: string
  /** 浏览器版本 */
  version: string
  /** 是否为移动设备 */
  isMobile: boolean
}

/**
 * WebRTC统计信息格式化结果
 */
export interface FormattedWebRTCStats {
  /** 连接统计信息 */
  connection: any
  /** 入站流统计信息 */
  inbound: any[]
  /** 出站流统计信息 */
  outbound: any[]
  /** ICE候选者统计信息 */
  candidates: any[]
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxAttempts: number
  /** 重试延迟时间(毫秒) */
  delayMs: number
  /** 是否使用指数退避 */
  exponentialBackoff?: boolean
}

/**
 * WebRTC连接状态枚举
 */
export enum ConnectionState {
  /** 未连接状态 */
  DISCONNECTED = 'disconnected',
  /** 正在连接状态 */
  CONNECTING = 'connecting',
  /** 已连接状态 */
  CONNECTED = 'connected',
  /** 连接失败状态 */
  FAILED = 'failed',
  /** 连接已关闭状态 */
  CLOSED = 'closed',
}

/**
 * WebRTC事件类型定义
 */
export interface WebRTCEvents {
  /** 连接状态变化事件 */
  'connection-state-change': (state: ConnectionState, peerId: string) => void
  /** 对等连接已连接事件 */
  'peer-connected': (peerId: string) => void
  /** 对等连接已断开事件 */
  'peer-disconnected': (peerId: string) => void
  /** 接收到消息事件 */
  'message-received': (message: Message, peerId: string) => void
  /** 文件传输进度事件 */
  'file-transfer-progress': (transfer: FileTransfer) => void
  /** 接收到媒体流事件 */
  'media-stream-received': (stream: MediaStream, peerId: string) => void
  /** 数据通道打开事件 */
  'data-channel-open': (peerId: string) => void
  /** 错误事件 */
  'error': (error: Error, peerId?: string) => void
}

/**
 * 对等连接配置接口
 */
export interface PeerConnectionConfig {
  /** ICE服务器列表 */
  iceServers: RTCIceServer[]
  /** ICE候选者池大小 */
  iceCandidatePoolSize?: number
  /** 捆绑策略 */
  bundlePolicy?: RTCBundlePolicy
  /** RTCP复用策略 */
  rtcpMuxPolicy?: RTCRtcpMuxPolicy
}

/**
 * 数据通道配置接口
 */
export interface DataChannelConfig {
  /** 是否保证数据包顺序 */
  ordered?: boolean
  /** 数据包最大生存时间(毫秒) */
  maxPacketLifeTime?: number
  /** 最大重传次数 */
  maxRetransmits?: number
  /** 使用的协议 */
  protocol?: string
  /** 是否预先协商 */
  negotiated?: boolean
  /** 通道ID */
  id?: number
}

/**
 * ICE候选者配置接口
 */
export interface IceCandidateConfig {
  /** 候选者字符串 */
  candidate: string
  /** SDP媒体行索引 */
  sdpMLineIndex?: number | null
  /** SDP媒体ID */
  sdpMid?: string | null
  /** 用户名片段 */
  usernameFragment?: string | null
}

/**
 * 连接统计信息接口
 */
export interface ConnectionStats {
  /** 接收的字节数 */
  bytesReceived: number
  /** 发送的字节数 */
  bytesSent: number
  /** 接收的数据包数 */
  packetsReceived: number
  /** 发送的数据包数 */
  packetsSent: number
  /** 时间戳 */
  timestamp: number
  /** 连接状态 */
  connectionState: ConnectionState
}

/**
 * WebRTC配置接口
 */
export interface WebRTCConfig {
  /** ICE服务器配置 */
  iceServers: RTCIceServer[]
  /** 媒体约束配置 */
  mediaConstraints?: MediaConstraints
  /** 是否启用数据通道 */
  enableDataChannel?: boolean
  /** 是否启用媒体流 */
  enableMedia?: boolean
  /** 数据通道配置 */
  dataChannelConfig?: DataChannelConfig
}
