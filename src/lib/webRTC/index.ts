/**
 * WebRTC工具库统一入口文件
 * 提供完整的WebRTC功能，包括连接管理、信令服务、文件传输和媒体流管理
 */

// 导出管理器类
export { WebRTCManager } from './manager/webRTC'
export { SignalingManager } from './manager/signaling'
export { FileTransferManager } from './manager/file-transfer'
export { MediaStreamManager } from './manager/media-stream'

// 导出所有类型定义
export * from './typings'

// 导出所有工具函数
export * from './utils'

// ============= 版本信息 =============
export const VERSION = '1.0.0'
