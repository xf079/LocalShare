/**
 * WebRTC工具库通用工具方法文件
 * 包含所有WebRTC相关的工具函数和辅助方法
 */

import { delay } from 'lodash-es'
import type {
  BrowserSupport,
  BrowserInfo,
  FormattedWebRTCStats,
  RetryConfig,
} from './typings'

// ============= WebRTC支持检测 =============

/**
 * 检查浏览器对WebRTC的支持情况
 * @returns {BrowserSupport} 浏览器支持信息
 */
export function checkWebRTCSupport(): BrowserSupport {
  const support: BrowserSupport = {
    rtcPeerConnection: false,
    getUserMedia: false,
    getDisplayMedia: false,
    dataChannels: false,
    webSocket: false,
  }

  // 检查RTCPeerConnection支持
  if (typeof RTCPeerConnection !== 'undefined') {
    support.rtcPeerConnection = true

    // 检查数据通道支持
    try {
      const pc = new RTCPeerConnection()
      const dc = pc.createDataChannel('test')
      support.dataChannels = true
      pc.close()
    } catch (e) {
      support.dataChannels = false
    }
  }

  // 检查getUserMedia支持
  if (navigator.mediaDevices?.getUserMedia instanceof Function) {
    support.getUserMedia = true
  }

  // 检查getDisplayMedia支持
  if (navigator.mediaDevices?.getDisplayMedia instanceof Function) {
    support.getDisplayMedia = true
  }

  // 检查WebSocket支持
  if (typeof WebSocket !== 'undefined') {
    support.webSocket = true
  }

  return support
}

/**
 * 获取浏览器信息
 * @returns {BrowserInfo} 浏览器信息
 */
export function getBrowserInfo(): BrowserInfo {
  const userAgent = navigator.userAgent
  let name = 'Unknown'
  let version = 'Unknown'

  // 检测浏览器类型和版本
  if (userAgent.includes('Chrome')) {
    name = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  } else if (userAgent.includes('Edge')) {
    name = 'Edge'
    const match = userAgent.match(/Edge\/(\d+)/)
    version = match ? match[1] : 'Unknown'
  }

  // 检测是否为移动设备
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    )

  return { name, version, isMobile }
}

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

// ============= WebRTC配置工具 =============

/**
 * 创建默认的RTCConfiguration
 * @returns {RTCConfiguration} 默认配置
 */
export function createDefaultRTCConfiguration(): RTCConfiguration {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  }
}

/**
 * 获取免费的STUN服务器列表
 * @returns {RTCIceServer[]} STUN服务器列表
 */
export function getFreeStunServers(): RTCIceServer[] {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
  ]
}

// ============= WebRTC统计信息工具 =============

/**
 * 格式化WebRTC统计信息
 * @param {RTCStatsReport} stats - 原始统计信息
 * @returns {FormattedWebRTCStats} 格式化后的统计信息
 */
export function formatWebRTCStats(stats: RTCStatsReport): FormattedWebRTCStats {
  const formatted: FormattedWebRTCStats = {
    connection: {},
    inbound: [],
    outbound: [],
    candidates: [],
  }

  stats.forEach((report) => {
    switch (report.type) {
      case 'peer-connection':
        formatted.connection = report
        break
      case 'inbound-rtp':
        formatted.inbound.push(report)
        break
      case 'outbound-rtp':
        formatted.outbound.push(report)
        break
      case 'candidate-pair':
      case 'local-candidate':
      case 'remote-candidate':
        formatted.candidates.push(report)
        break
    }
  })

  return formatted
}

/**
 * 计算网络质量评分
 * @param {RTCStatsReport} stats - WebRTC统计信息
 * @returns {number} 质量评分 (0-100)
 */
export function calculateNetworkQuality(stats: RTCStatsReport): number {
  let score = 100

  stats.forEach((report) => {
    if (report.type === 'inbound-rtp') {
      // 检查丢包率
      const packetsLost = report.packetsLost || 0
      const packetsReceived = report.packetsReceived || 0
      const totalPackets = packetsLost + packetsReceived

      if (totalPackets > 0) {
        const lossRate = packetsLost / totalPackets
        score -= lossRate * 50 // 丢包率影响评分
      }

      // 检查抖动
      const jitter = report.jitter || 0
      if (jitter > 0.1) {
        score -= Math.min(jitter * 100, 30) // 抖动影响评分
      }
    }

    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      // 检查RTT
      const rtt = report.currentRoundTripTime || 0
      if (rtt > 0.2) {
        score -= Math.min(rtt * 50, 20) // RTT影响评分
      }
    }
  })

  return Math.max(0, Math.min(100, score))
}

// ============= 通用工具函数 =============

/**
 * 生成唯一ID
 * @param {number} length - ID长度，默认为8
 * @returns {string} 唯一ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 重试执行函数
 * @param {Function} fn - 要执行的函数
 * @param {RetryConfig} config - 重试配置
 * @returns {Promise<T>} 执行结果
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = { maxAttempts: 3, delayMs: 1000 },
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === config.maxAttempts) {
        throw lastError
      }

      // 计算延迟时间
      let delayTime = config.delayMs
      if (config.exponentialBackoff) {
        delayTime = config.delayMs * Math.pow(2, attempt - 1)
      }

      delay(fn, delayTime)
    }
  }

  throw lastError!
}

// ============= 文件处理工具 =============

/**
 * 计算文件的MD5校验和
 * @param {ArrayBuffer} buffer - 文件数据
 * @returns {Promise<string>} MD5校验和
 */
export async function calculateMD5(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 将文件分割为块
 * @param {File} file - 要分割的文件
 * @param {number} chunkSize - 块大小（字节）
 * @returns {Promise<ArrayBuffer[]>} 文件块数组
 */
export async function splitFileIntoChunks(
  file: File,
  chunkSize: number,
): Promise<ArrayBuffer[]> {
  const chunks: ArrayBuffer[] = []
  let offset = 0

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize)
    const arrayBuffer = await chunk.arrayBuffer()
    chunks.push(arrayBuffer)
    offset += chunkSize
  }

  return chunks
}

/**
 * 从块重建文件
 * @param {ArrayBuffer[]} chunks - 文件块数组
 * @param {string} fileName - 文件名
 * @param {string} mimeType - MIME类型
 * @returns {File} 重建的文件
 */
export function reconstructFileFromChunks(
  chunks: ArrayBuffer[],
  fileName: string,
  mimeType: string,
): File {
  const blob = new Blob(chunks, { type: mimeType })
  return new File([blob], fileName, { type: mimeType })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 计算传输速度
 * @param {number} bytes - 传输的字节数
 * @param {number} timeMs - 传输时间（毫秒）
 * @returns {string} 格式化后的传输速度
 */
export function calculateTransferSpeed(bytes: number, timeMs: number): string {
  const bytesPerSecond = (bytes / timeMs) * 1000
  return formatFileSize(bytesPerSecond) + '/s'
}

// ============= 媒体流工具 =============

/**
 * 获取媒体设备列表
 * @returns {Promise<MediaDeviceInfo[]>} 设备列表
 */
export async function getMediaDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices
  } catch (error) {
    console.error('获取媒体设备失败:', error)
    return []
  }
}

/**
 * 检查媒体权限
 * @param {string} type - 权限类型 ('camera' | 'microphone')
 * @returns {Promise<boolean>} 是否有权限
 */
export async function checkMediaPermission(
  type: 'camera' | 'microphone',
): Promise<boolean> {
  try {
    const permissionName = type === 'camera' ? 'camera' : 'microphone'
    const permission = await navigator.permissions.query({
      name: permissionName as PermissionName,
    })
    return permission.state === 'granted'
  } catch (error) {
    console.error('检查媒体权限失败:', error)
    return false
  }
}

/**
 * 停止媒体流
 * @param {MediaStream} stream - 要停止的媒体流
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

/**
 * 获取媒体流的音频轨道
 * @param {MediaStream} stream - 媒体流
 * @returns {MediaStreamTrack[]} 音频轨道数组
 */
export function getAudioTracks(stream: MediaStream): MediaStreamTrack[] {
  return stream.getAudioTracks()
}

/**
 * 获取媒体流的视频轨道
 * @param {MediaStream} stream - 媒体流
 * @returns {MediaStreamTrack[]} 视频轨道数组
 */
export function getVideoTracks(stream: MediaStream): MediaStreamTrack[] {
  return stream.getVideoTracks()
}

// ============= 错误处理工具 =============

/**
 * WebRTC错误类型枚举
 */
export enum WebRTCErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  MEDIA_ACCESS_DENIED = 'MEDIA_ACCESS_DENIED',
  SIGNALING_ERROR = 'SIGNALING_ERROR',
  DATA_CHANNEL_ERROR = 'DATA_CHANNEL_ERROR',
  FILE_TRANSFER_ERROR = 'FILE_TRANSFER_ERROR',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
}

/**
 * WebRTC错误类
 */
export class WebRTCError extends Error {
  public readonly type: WebRTCErrorType
  public readonly originalError?: Error

  constructor(type: WebRTCErrorType, message: string, originalError?: Error) {
    super(message)
    this.name = 'WebRTCError'
    this.type = type
    this.originalError = originalError
  }
}

/**
 * 创建WebRTC错误
 * @param {WebRTCErrorType} type - 错误类型
 * @param {string} message - 错误消息
 * @param {Error} originalError - 原始错误
 * @returns {WebRTCError} WebRTC错误实例
 */
export function createWebRTCError(
  type: WebRTCErrorType,
  message: string,
  originalError?: Error,
): WebRTCError {
  return new WebRTCError(type, message, originalError)
}

// ============= 日志工具 =============

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 简单的日志记录器
 */
export class Logger {
  private level: LogLevel
  private prefix: string

  constructor(prefix: string = 'WebRTC', level: LogLevel = LogLevel.INFO) {
    this.prefix = prefix
    this.level = level
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.prefix}] ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.prefix}] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.prefix}] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.prefix}] ${message}`, ...args)
    }
  }
}

/**
 * 创建日志记录器
 * @param {string} prefix - 日志前缀
 * @param {LogLevel} level - 日志级别
 * @returns {Logger} 日志记录器实例
 */
export function createLogger(
  prefix: string = 'WebRTC',
  level: LogLevel = LogLevel.INFO,
): Logger {
  return new Logger(prefix, level)
}
