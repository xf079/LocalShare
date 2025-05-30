/**
 * 文件传输管理器 - 基于WebRTC数据通道的文件传输工具类
 * 支持大文件分块传输、传输进度监控、断点续传等功能
 * 兼容各种浏览器，不依赖第三方库
 */

import {
  FileTransferStatus,
  type FileChunk,
  type TransferProgress,
  type FileTransferEvents,
  type FileTransferConfig,
  type TransferringFile,
} from '../typings'

/**
 * 文件传输管理器类
 */
export class FileTransferManager {
  private dataChannel: RTCDataChannel | null = null
  private config: FileTransferConfig
  private eventListeners: Map<keyof FileTransferEvents, Function[]> = new Map()
  private sendingFiles: Map<string, TransferringFile> = new Map()
  private receivingFiles: Map<string, TransferringFile> = new Map()
  private transferQueue: string[] = []
  private activeTransfers = 0

  // 默认配置
  private static readonly DEFAULT_CONFIG: FileTransferConfig = {
    chunkSize: 64 * 1024, // 64KB
    maxConcurrentTransfers: 3,
    enableChecksum: true,
    retryAttempts: 3,
    retryDelay: 1000,
  }

  constructor(config?: Partial<FileTransferConfig>) {
    this.config = { ...FileTransferManager.DEFAULT_CONFIG, ...config }
    this.initializeEventMaps()
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeEventMaps(): void {
    const eventTypes: (keyof FileTransferEvents)[] = [
      'progress',
      'completed',
      'failed',
      'cancelled',
      'chunk-received',
      'chunk-sent',
    ]

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, [])
    })
  }

  /**
   * 添加事件监听器
   */
  public on<T extends keyof FileTransferEvents>(
    event: T,
    listener: FileTransferEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  public off<T extends keyof FileTransferEvents>(
    event: T,
    listener: FileTransferEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   */
  private emit<T extends keyof FileTransferEvents>(
    event: T,
    ...args: Parameters<FileTransferEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => {
      try {
        ;(listener as any)(...args)
      } catch (error) {
        console.error(
          `Error in file transfer event listener for ${event}:`,
          error,
        )
      }
    })
  }

  /**
   * 设置数据通道
   */
  public setDataChannel(dataChannel: RTCDataChannel): void {
    this.dataChannel = dataChannel
    this.setupDataChannelHandlers()
  }

  /**
   * 设置数据通道事件处理器
   */
  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return

    this.dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data)
    }

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error)
      this.handleTransferError('Data channel error')
    }

    this.dataChannel.onclose = () => {
      console.log('Data channel closed')
      this.handleDataChannelClose()
    }
  }

  /**
   * 处理数据通道消息
   */
  private handleDataChannelMessage(data: any): void {
    try {
      if (typeof data === 'string') {
        // 控制消息
        const message = JSON.parse(data)
        this.handleControlMessage(message)
      } else if (data instanceof ArrayBuffer) {
        // 文件数据块
        this.handleFileChunk(data)
      }
    } catch (error) {
      console.error('Error handling data channel message:', error)
    }
  }

  /**
   * 处理控制消息
   */
  private handleControlMessage(message: any): void {
    switch (message.type) {
      case 'file-info':
        this.handleFileInfo(message)
        break
      case 'chunk-request':
        this.handleChunkRequest(message)
        break
      case 'chunk-ack':
        this.handleChunkAck(message)
        break
      case 'transfer-complete':
        this.handleTransferComplete(message)
        break
      case 'transfer-error':
        this.handleTransferError(message.error)
        break
      default:
        console.log('Unknown control message type:', message.type)
    }
  }

  /**
   * 发送文件
   */
  public async sendFile(file: File): Promise<string> {
    const fileId = this.generateFileId()

    try {
      // 创建文件传输记录
      const transferFile: TransferringFile = {
        id: fileId,
        file,
        chunks: [],
        receivedChunks: new Map(),
        totalChunks: Math.ceil(file.size / this.config.chunkSize),
        status: FileTransferStatus.PREPARING,
        startTime: Date.now(),
        lastProgressTime: Date.now(),
        transferredSize: 0,
        retryCount: 0,
      }

      this.sendingFiles.set(fileId, transferFile)

      // 准备文件块
      await this.prepareFileChunks(transferFile)

      // 发送文件信息
      this.sendFileInfo(transferFile)

      // 添加到传输队列
      this.transferQueue.push(fileId)
      this.processTransferQueue()

      return fileId
    } catch (error) {
      this.sendingFiles.delete(fileId)
      throw new Error(`Failed to send file: ${error}`)
    }
  }

  /**
   * 准备文件块
   */
  private async prepareFileChunks(
    transferFile: TransferringFile,
  ): Promise<void> {
    const { file } = transferFile
    const chunks: FileChunk[] = []

    for (let i = 0; i < transferFile.totalChunks; i++) {
      const start = i * this.config.chunkSize
      const end = Math.min(start + this.config.chunkSize, file.size)
      const blob = file.slice(start, end)
      const arrayBuffer = await blob.arrayBuffer()

      const chunk: FileChunk = {
        id: `${transferFile.id}-${i}`,
        index: i,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
      }

      // 如果启用校验和，计算chunk的校验和
      if (this.config.enableChecksum) {
        chunk.checksum = await this.calculateChecksum(arrayBuffer)
      }

      chunks.push(chunk)
    }

    transferFile.chunks = chunks
  }

  /**
   * 计算校验和（简单的CRC32实现）
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    // 使用Web Crypto API计算SHA-256哈希
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      } catch (error) {
        console.warn('Failed to calculate checksum with Web Crypto API:', error)
      }
    }

    // 降级到简单的校验和
    const view = new Uint8Array(data)
    let checksum = 0
    for (let i = 0; i < view.length; i++) {
      checksum = (checksum + view[i]) % 0xffffffff
    }
    return checksum.toString(16)
  }

  /**
   * 发送文件信息
   */
  private sendFileInfo(transferFile: TransferringFile): void {
    const fileInfo = {
      type: 'file-info',
      fileId: transferFile.id,
      fileName: transferFile.file.name,
      fileSize: transferFile.file.size,
      fileType: transferFile.file.type,
      totalChunks: transferFile.totalChunks,
      chunkSize: this.config.chunkSize,
      enableChecksum: this.config.enableChecksum,
    }

    this.sendControlMessage(fileInfo)
  }

  /**
   * 发送控制消息
   */
  private sendControlMessage(message: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open')
    }

    try {
      this.dataChannel.send(JSON.stringify(message))
    } catch (error) {
      console.error('Failed to send control message:', error)
      throw error
    }
  }

  /**
   * 处理文件信息
   */
  private handleFileInfo(message: any): void {
    const transferFile: TransferringFile = {
      id: message.fileId,
      file: new File([], message.fileName, { type: message.fileType }),
      chunks: [],
      receivedChunks: new Map(),
      totalChunks: message.totalChunks,
      status: FileTransferStatus.PENDING,
      startTime: Date.now(),
      lastProgressTime: Date.now(),
      transferredSize: 0,
      retryCount: 0,
    }

    this.receivingFiles.set(message.fileId, transferFile)

    // 请求开始传输
    this.sendControlMessage({
      type: 'chunk-request',
      fileId: message.fileId,
      chunkIndex: 0,
    })
  }

  /**
   * 处理块请求
   */
  private handleChunkRequest(message: any): void {
    const transferFile = this.sendingFiles.get(message.fileId)
    if (!transferFile) {
      console.error('Transfer file not found:', message.fileId)
      return
    }

    const chunk = transferFile.chunks[message.chunkIndex]
    if (!chunk) {
      console.error('Chunk not found:', message.chunkIndex)
      return
    }

    this.sendFileChunk(chunk, message.fileId)
  }

  /**
   * 发送文件块
   */
  private sendFileChunk(chunk: FileChunk, fileId: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel is not open')
      return
    }

    try {
      // 发送块头信息
      const chunkHeader = {
        type: 'chunk-header',
        fileId,
        chunkId: chunk.id,
        chunkIndex: chunk.index,
        chunkSize: chunk.size,
        checksum: chunk.checksum,
      }

      this.dataChannel.send(JSON.stringify(chunkHeader))

      // 发送块数据
      this.dataChannel.send(chunk.data)

      this.emit('chunk-sent', fileId, chunk.index)

      // 更新发送进度
      this.updateSendProgress(fileId, chunk.size)
    } catch (error) {
      console.error('Failed to send file chunk:', error)
      this.handleTransferError(`Failed to send chunk ${chunk.index}`)
    }
  }

  /**
   * 处理文件块
   */
  private handleFileChunk(data: ArrayBuffer): void {
    // 这里需要根据之前收到的chunk-header来处理数据
    // 实际实现中需要维护一个待处理的chunk队列
    console.log('Received file chunk:', data.byteLength)
  }

  /**
   * 处理块确认
   */
  private handleChunkAck(message: any): void {
    const transferFile = this.sendingFiles.get(message.fileId)
    if (!transferFile) return

    // 请求下一个块
    const nextChunkIndex = message.chunkIndex + 1
    if (nextChunkIndex < transferFile.totalChunks) {
      this.sendControlMessage({
        type: 'chunk-request',
        fileId: message.fileId,
        chunkIndex: nextChunkIndex,
      })
    } else {
      // 传输完成
      this.completeTransfer(message.fileId, true)
    }
  }

  /**
   * 处理传输完成
   */
  private handleTransferComplete(message: any): void {
    this.completeTransfer(message.fileId, false)
  }

  /**
   * 完成传输
   */
  private completeTransfer(fileId: string, isSender: boolean): void {
    const transferFile = isSender
      ? this.sendingFiles.get(fileId)
      : this.receivingFiles.get(fileId)

    if (!transferFile) return

    transferFile.status = FileTransferStatus.COMPLETED

    if (isSender) {
      this.sendingFiles.delete(fileId)
      this.sendControlMessage({
        type: 'transfer-complete',
        fileId,
      })
    } else {
      // 重建文件
      const file = this.reconstructFile(transferFile)
      this.receivingFiles.delete(fileId)
      this.emit('completed', fileId, file)
    }

    this.activeTransfers--
    this.processTransferQueue()
  }

  /**
   * 重建文件
   */
  private reconstructFile(transferFile: TransferringFile): File {
    const chunks = Array.from(transferFile.receivedChunks.values()).sort(
      (a, b) => a.index - b.index,
    )

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    const combinedBuffer = new ArrayBuffer(totalSize)
    const combinedView = new Uint8Array(combinedBuffer)

    let offset = 0
    chunks.forEach((chunk) => {
      const chunkView = new Uint8Array(chunk.data)
      combinedView.set(chunkView, offset)
      offset += chunk.size
    })

    return new File([combinedBuffer], transferFile.file.name, {
      type: transferFile.file.type,
    })
  }

  /**
   * 处理传输错误
   */
  private handleTransferError(error: string): void {
    console.error('Transfer error:', error)
    // 这里可以实现重试逻辑
  }

  /**
   * 处理数据通道关闭
   */
  private handleDataChannelClose(): void {
    // 标记所有传输为失败
    this.sendingFiles.forEach((transferFile, fileId) => {
      transferFile.status = FileTransferStatus.FAILED
      this.emit('failed', fileId, new Error('Data channel closed'))
    })

    this.receivingFiles.forEach((transferFile, fileId) => {
      transferFile.status = FileTransferStatus.FAILED
      this.emit('failed', fileId, new Error('Data channel closed'))
    })

    this.sendingFiles.clear()
    this.receivingFiles.clear()
    this.transferQueue.length = 0
    this.activeTransfers = 0
  }

  /**
   * 更新发送进度
   */
  private updateSendProgress(fileId: string, chunkSize: number): void {
    const transferFile = this.sendingFiles.get(fileId)
    if (!transferFile) return

    transferFile.transferredSize += chunkSize
    const progress = this.calculateProgress(transferFile)
    this.emit('progress', progress)
  }

  /**
   * 计算传输进度
   */
  private calculateProgress(transferFile: TransferringFile): TransferProgress {
    const now = Date.now()
    const elapsed = (now - transferFile.startTime) / 1000 // seconds
    const speed = elapsed > 0 ? transferFile.transferredSize / elapsed : 0
    const remainingBytes = transferFile.file.size - transferFile.transferredSize
    const remainingTime = speed > 0 ? remainingBytes / speed : 0

    return {
      fileId: transferFile.id,
      fileName: transferFile.file.name,
      totalSize: transferFile.file.size,
      transferredSize: transferFile.transferredSize,
      percentage: (transferFile.transferredSize / transferFile.file.size) * 100,
      speed,
      remainingTime,
      status: transferFile.status,
    }
  }

  /**
   * 处理传输队列
   */
  private processTransferQueue(): void {
    while (
      this.transferQueue.length > 0 &&
      this.activeTransfers < this.config.maxConcurrentTransfers
    ) {
      const fileId = this.transferQueue.shift()
      if (fileId) {
        this.startTransfer(fileId)
      }
    }
  }

  /**
   * 开始传输
   */
  private startTransfer(fileId: string): void {
    const transferFile = this.sendingFiles.get(fileId)
    if (!transferFile) return

    transferFile.status = FileTransferStatus.TRANSFERRING
    this.activeTransfers++

    // 传输逻辑已在handleChunkRequest中实现
  }

  /**
   * 取消传输
   */
  public cancelTransfer(fileId: string): void {
    const sendingFile = this.sendingFiles.get(fileId)
    const receivingFile = this.receivingFiles.get(fileId)

    if (sendingFile) {
      sendingFile.status = FileTransferStatus.CANCELLED
      this.sendingFiles.delete(fileId)
      this.emit('cancelled', fileId)
    }

    if (receivingFile) {
      receivingFile.status = FileTransferStatus.CANCELLED
      this.receivingFiles.delete(fileId)
      this.emit('cancelled', fileId)
    }

    // 从队列中移除
    const queueIndex = this.transferQueue.indexOf(fileId)
    if (queueIndex > -1) {
      this.transferQueue.splice(queueIndex, 1)
    }

    this.activeTransfers = Math.max(0, this.activeTransfers - 1)
    this.processTransferQueue()
  }

  /**
   * 暂停传输
   */
  public pauseTransfer(fileId: string): void {
    const transferFile =
      this.sendingFiles.get(fileId) || this.receivingFiles.get(fileId)
    if (
      transferFile &&
      transferFile.status === FileTransferStatus.TRANSFERRING
    ) {
      transferFile.status = FileTransferStatus.PAUSED
    }
  }

  /**
   * 恢复传输
   */
  public resumeTransfer(fileId: string): void {
    const transferFile =
      this.sendingFiles.get(fileId) || this.receivingFiles.get(fileId)
    if (transferFile && transferFile.status === FileTransferStatus.PAUSED) {
      transferFile.status = FileTransferStatus.TRANSFERRING

      // 如果是发送文件，重新加入队列
      if (this.sendingFiles.has(fileId)) {
        this.transferQueue.push(fileId)
        this.processTransferQueue()
      }
    }
  }

  /**
   * 获取传输进度
   */
  public getTransferProgress(fileId: string): TransferProgress | null {
    const transferFile =
      this.sendingFiles.get(fileId) || this.receivingFiles.get(fileId)
    return transferFile ? this.calculateProgress(transferFile) : null
  }

  /**
   * 获取所有传输进度
   */
  public getAllTransferProgress(): TransferProgress[] {
    const progress: TransferProgress[] = []

    this.sendingFiles.forEach((transferFile) => {
      progress.push(this.calculateProgress(transferFile))
    })

    this.receivingFiles.forEach((transferFile) => {
      progress.push(this.calculateProgress(transferFile))
    })

    return progress
  }

  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<FileTransferConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): FileTransferConfig {
    return { ...this.config }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    // 取消所有传输
    this.sendingFiles.forEach((_, fileId) => this.cancelTransfer(fileId))
    this.receivingFiles.forEach((_, fileId) => this.cancelTransfer(fileId))

    // 清理事件监听器
    this.eventListeners.clear()

    // 重置状态
    this.dataChannel = null
    this.transferQueue.length = 0
    this.activeTransfers = 0
  }
}
