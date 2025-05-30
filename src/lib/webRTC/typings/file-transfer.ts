/**
 * 文件传输相关类型定义
 * 包含文件传输状态、进度、事件等类型
 */

/**
 * 文件传输状态枚举
 */
export enum FileTransferStatus {
  /** 等待传输 */
  PENDING = 'pending',
  /** 准备传输 */
  PREPARING = 'preparing',
  /** 正在传输 */
  TRANSFERRING = 'transferring',
  /** 传输暂停 */
  PAUSED = 'paused',
  /** 传输完成 */
  COMPLETED = 'completed',
  /** 传输失败 */
  FAILED = 'failed',
  /** 传输取消 */
  CANCELLED = 'cancelled',
}

/**
 * 文件块信息接口
 */
export interface FileChunk {
  /** 文件块唯一标识符 */
  id: string
  /** 文件块索引 */
  index: number
  /** 文件块数据 */
  data: ArrayBuffer
  /** 文件块大小(字节) */
  size: number
  /** 文件块校验和 */
  checksum?: string
}

/**
 * 文件传输进度信息
 */
export interface TransferProgress {
  /** 文件唯一标识符 */
  fileId: string
  /** 文件名称 */
  fileName: string
  /** 文件总大小(字节) */
  totalSize: number
  /** 已传输大小(字节) */
  transferredSize: number
  /** 传输进度百分比 */
  percentage: number
  /** 传输速度(字节/秒) */
  speed: number
  /** 剩余时间(秒) */
  remainingTime: number
  /** 传输状态 */
  status: FileTransferStatus
}

/**
 * 文件传输事件接口
 */
export interface FileTransferEvents {
  /** 传输进度更新事件 */
  'progress': (progress: TransferProgress) => void
  /** 传输完成事件 */
  'completed': (fileId: string, file: File) => void
  /** 传输失败事件 */
  'failed': (fileId: string, error: Error) => void
  /** 传输取消事件 */
  'cancelled': (fileId: string) => void
  /** 接收到文件块事件 */
  'chunk-received': (fileId: string, chunkIndex: number) => void
  /** 发送文件块事件 */
  'chunk-sent': (fileId: string, chunkIndex: number) => void
}

/**
 * 文件传输配置接口
 */
export interface FileTransferConfig {
  /** 文件块大小(字节，默认64KB) */
  chunkSize: number
  /** 最大并发传输数 */
  maxConcurrentTransfers: number
  /** 是否启用校验和验证 */
  enableChecksum: boolean
  /** 传输失败重试次数 */
  retryAttempts: number
  /** 重试延迟时间(毫秒) */
  retryDelay: number
}

/**
 * 文件传输信息接口
 */
export interface FileTransfer {
  /** 传输唯一标识符 */
  id: string
  /** 文件名称 */
  fileName: string
  /** 文件大小(字节) */
  fileSize: number
  /** 文件MIME类型 */
  fileType?: string
  /** 传输进度(0-100) */
  progress: number
  /** 传输状态 */
  status: FileTransferStatus
  /** 发送方标识 */
  sender: string
  /** 接收方标识 */
  receiver: string
  /** 传输开始时间戳 */
  startTime?: number
  /** 传输结束时间戳 */
  endTime?: number
  /** 错误信息 */
  error?: string
}

/**
 * 传输中的文件信息
 */
export interface TransferringFile {
  /** 文件传输唯一标识符 */
  id: string
  /** 原始文件对象 */
  file: File
  /** 文件块数组 */
  chunks: FileChunk[]
  /** 已接收的文件块映射 */
  receivedChunks: Map<number, FileChunk>
  /** 总文件块数量 */
  totalChunks: number
  /** 传输状态 */
  status: FileTransferStatus
  /** 传输开始时间戳 */
  startTime: number
  /** 最后进度更新时间戳 */
  lastProgressTime: number
  /** 已传输字节数 */
  transferredSize: number
  /** 重试次数 */
  retryCount: number
}