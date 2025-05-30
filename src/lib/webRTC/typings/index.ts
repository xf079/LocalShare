/**
 * WebRTC类型定义统一导出文件
 * 重新导出所有模块的类型定义
 */

export {
  // 通用类型
  type Peer,
  type Message,
  type BrowserSupport,
  type BrowserInfo,
  type FormattedWebRTCStats,
  type RetryConfig,
  // WebRTC核心类型
  ConnectionState,
  type WebRTCEvents,
  type PeerConnectionConfig,
  type DataChannelConfig,
  type IceCandidateConfig,
  type ConnectionStats,
  type WebRTCConfig,
} from './common'


// 信令相关类型
export {
  SignalingState,
  type SignalingEvents,
  type RoomInfo,
  type SignalingMessage,
  type SignalingConfig,
} from './signaling'

// 文件传输相关类型
export {
  FileTransferStatus,
  type FileChunk,
  type TransferProgress,
  type FileTransferEvents,
  type FileTransferConfig,
  type FileTransfer,
  type TransferringFile,
} from './file-transfer'

// 媒体流相关类型
export {
  MediaStreamState,
  type MediaDeviceInfo,
  type ScreenShareOptions,
  type MediaStreamEvents,
  type MediaStreamConfig,
  type MediaConstraints,
  type ActiveStream,
} from './media-stream'
