/**
 * WebRTC管理器 - 封装WebRTC相关功能的工具类
 * 提供点对点连接、数据传输、媒体流处理等功能
 * 兼容主流浏览器，不依赖第三方库
 */

import {
  type Peer,
  type Message,
  type FileTransfer,
  type MediaConstraints,
  type WebRTCConfig,
  type WebRTCEvents,
  ConnectionState,
  FileTransferStatus,
} from '../typings'

/**
 * WebRTC管理器类
 */
export class WebRTCManager {
  private peers: Map<string, Peer> = new Map()
  private localStream: MediaStream | null = null
  private config: WebRTCConfig
  private eventListeners: Map<keyof WebRTCEvents, Function[]> = new Map()
  private fileTransfers: Map<string, FileTransfer> = new Map()

  // 默认配置
  private static readonly DEFAULT_CONFIG: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
    mediaConstraints: {
      audio: true,
      video: true,
    },
  }

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = { ...WebRTCManager.DEFAULT_CONFIG, ...config }
    this.initializeEventMaps()
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeEventMaps(): void {
    const eventTypes: (keyof WebRTCEvents)[] = [
      'connection-state-change',
      'peer-connected',
      'peer-disconnected',
      'message-received',
      'file-transfer-progress',
      'media-stream-received',
      'data-channel-open',
      'error',
    ]

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, [])
    })
  }

  /**
   * 添加事件监听器
   */
  public on<T extends keyof WebRTCEvents>(
    event: T,
    listener: WebRTCEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  public off<T extends keyof WebRTCEvents>(
    event: T,
    listener: WebRTCEvents[T],
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
  private emit<T extends keyof WebRTCEvents>(
    event: T,
    ...args: Parameters<WebRTCEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => {
      try {
        ;(listener as any)(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * 检查WebRTC支持
   */
  public static isSupported(): boolean {
    return !!(
      window.RTCPeerConnection &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    )
  }

  /**
   * 获取用户媒体流
   */
  public async getUserMedia(
    constraints?: MediaConstraints,
  ): Promise<MediaStream> {
    try {
      const mediaConstraints = constraints || this.config.mediaConstraints

      // 兼容性处理
      const getUserMedia =
        navigator.mediaDevices?.getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia

      if (!getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }

      this.localStream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints)
      return this.localStream
    } catch (error) {
      this.emit('error', new Error(`Failed to get user media: ${error}`))
      throw error
    }
  }

  /**
   * 创建新的对等连接
   */
  public async createPeerConnection(peerId: string): Promise<Peer> {
    try {
      // 兼容性处理
      const RTCPeerConnection =
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection

      if (!RTCPeerConnection) {
        throw new Error('RTCPeerConnection is not supported in this browser')
      }

      const connection = new RTCPeerConnection({
        iceServers: this.config.iceServers,
      })

      const peer: Peer = {
        id: peerId,
        connection,
      }

      // 设置连接状态监听
      connection.onconnectionstatechange = () => {
        const state = this.mapConnectionState(connection.connectionState)
        this.emit('connection-state-change', state, peerId)

        if (state === ConnectionState.CONNECTED) {
          this.emit('peer-connected', peerId)
        } else if (
          state === ConnectionState.CLOSED ||
          state === ConnectionState.FAILED
        ) {
          this.emit('peer-disconnected', peerId)
          this.removePeer(peerId)
        }
      }

      // ICE候选者处理
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          // 这里应该通过信令服务器发送ICE候选者
          // 具体实现依赖于信令服务器的接口
          console.log('ICE candidate:', event.candidate)
        }
      }

      // 接收远程媒体流
      connection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          peer.mediaStream = event.streams[0]
          this.emit('media-stream-received', event.streams[0], peerId)
        }
      }

      // 数据通道处理
      connection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, peerId)
      }

      // 添加本地媒体流（如果存在）
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          connection.addTrack(track, this.localStream!)
        })
      }

      this.peers.set(peerId, peer)
      return peer
    } catch (error) {
      this.emit(
        'error',
        new Error(`Failed to create peer connection: ${error}`),
        peerId,
      )
      throw error
    }
  }

  /**
   * 创建数据通道
   */
  public createDataChannel(
    peerId: string,
    label: string = 'data',
  ): RTCDataChannel | null {
    const peer = this.peers.get(peerId)
    if (!peer) {
      this.emit('error', new Error('Peer not found'), peerId)
      return null
    }

    try {
      const dataChannel = peer.connection.createDataChannel(label, {
        ordered: true,
      })

      peer.dataChannel = dataChannel
      this.setupDataChannel(dataChannel, peerId)

      return dataChannel
    } catch (error) {
      this.emit(
        'error',
        new Error(`Failed to create data channel: ${error}`),
        peerId,
      )
      return null
    }
  }

  /**
   * 设置数据通道事件处理
   */
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      this.emit('data-channel-open', peerId)
    }

    dataChannel.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data)
        this.emit('message-received', message, peerId)

        // 处理文件传输进度
        if (message.type === 'file') {
          this.handleFileTransferMessage(message, peerId)
        }
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    dataChannel.onerror = (error) => {
      this.emit('error', new Error(`Data channel error: ${error}`), peerId)
    }

    dataChannel.onclose = () => {
      console.log(`Data channel closed for peer ${peerId}`)
    }
  }

  /**
   * 发送文本消息
   */
  public sendMessage(peerId: string, content: string): boolean {
    const peer = this.peers.get(peerId)
    if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
      this.emit('error', new Error('Data channel not available'), peerId)
      return false
    }

    try {
      const message: Message = {
        type: 'text',
        content,
        sender: 'local',
        timestamp: Date.now(),
        id: '',
        from: '',
        fileName: '',
        fileSize: 0
      }

      peer.dataChannel.send(JSON.stringify(message))
      return true
    } catch (error) {
      this.emit('error', new Error(`Failed to send message: ${error}`), peerId)
      return false
    }
  }

  /**
   * 发送文件
   */
  public async sendFile(peerId: string, file: File): Promise<string | null> {
    const peer = this.peers.get(peerId)
    if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
      this.emit('error', new Error('Data channel not available'), peerId)
      return null
    }

    try {
      const transferId = this.generateTransferId()
      const fileTransfer: FileTransfer = {
        id: transferId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: FileTransferStatus.PENDING,
        sender: 'local',
        receiver: peerId,
      }

      this.fileTransfers.set(transferId, fileTransfer)

      // 发送文件信息
      const fileInfo: Message = {
        type: 'file',
        content: transferId,
        sender: 'local',
        timestamp: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        id: '',
        from: ''
      }

      peer.dataChannel.send(JSON.stringify(fileInfo))

      // 分块发送文件
      await this.sendFileInChunks(peer.dataChannel, file, transferId)

      return transferId
    } catch (error) {
      this.emit('error', new Error(`Failed to send file: ${error}`), peerId)
      return null
    }
  }

  /**
   * 分块发送文件
   */
  private async sendFileInChunks(
    dataChannel: RTCDataChannel,
    file: File,
    transferId: string,
  ): Promise<void> {
    const chunkSize = 16384 // 16KB chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let sentChunks = 0

    const fileTransfer = this.fileTransfers.get(transferId)
    if (fileTransfer) {
      fileTransfer.status = FileTransferStatus.TRANSFERRING
    }

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const arrayBuffer = await chunk.arrayBuffer()

      // 等待数据通道缓冲区有空间
      while (dataChannel.bufferedAmount > 16777216) {
        // 16MB buffer limit
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      dataChannel.send(arrayBuffer)
      sentChunks++

      // 更新进度
      if (fileTransfer) {
        fileTransfer.progress = (sentChunks / totalChunks) * 100
        this.emit('file-transfer-progress', fileTransfer)
      }
    }

    if (fileTransfer) {
      fileTransfer.status = FileTransferStatus.COMPLETED
      fileTransfer.progress = 100
      this.emit('file-transfer-progress', fileTransfer)
    }
  }

  /**
   * 处理文件传输消息
   */
  private handleFileTransferMessage(message: Message, peerId: string): void {
    // 这里可以实现文件接收逻辑
    // 具体实现取决于应用需求
    console.log('File transfer message received:', message)
  }

  /**
   * 创建Offer
   */
  public async createOffer(
    peerId: string,
  ): Promise<RTCSessionDescriptionInit | null> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      this.emit('error', new Error('Peer not found'), peerId)
      return null
    }

    try {
      const offer = await peer.connection.createOffer()
      await peer.connection.setLocalDescription(offer)
      return offer
    } catch (error) {
      this.emit('error', new Error(`Failed to create offer: ${error}`), peerId)
      return null
    }
  }

  /**
   * 创建Answer
   */
  public async createAnswer(
    peerId: string,
  ): Promise<RTCSessionDescriptionInit | null> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      this.emit('error', new Error('Peer not found'), peerId)
      return null
    }

    try {
      const answer = await peer.connection.createAnswer()
      await peer.connection.setLocalDescription(answer)
      return answer
    } catch (error) {
      this.emit('error', new Error(`Failed to create answer: ${error}`), peerId)
      return null
    }
  }

  /**
   * 设置远程描述
   */
  public async setRemoteDescription(
    peerId: string,
    description: RTCSessionDescriptionInit,
  ): Promise<boolean> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      this.emit('error', new Error('Peer not found'), peerId)
      return false
    }

    try {
      await peer.connection.setRemoteDescription(description)
      return true
    } catch (error) {
      this.emit(
        'error',
        new Error(`Failed to set remote description: ${error}`),
        peerId,
      )
      return false
    }
  }

  /**
   * 添加ICE候选者
   */
  public async addIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<boolean> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      this.emit('error', new Error('Peer not found'), peerId)
      return false
    }

    try {
      await peer.connection.addIceCandidate(candidate)
      return true
    } catch (error) {
      this.emit(
        'error',
        new Error(`Failed to add ICE candidate: ${error}`),
        peerId,
      )
      return false
    }
  }

  /**
   * 获取连接统计信息
   */
  public async getConnectionStats(
    peerId: string,
  ): Promise<RTCStatsReport | null> {
    const peer = this.peers.get(peerId)
    if (!peer) {
      return null
    }

    try {
      return await peer.connection.getStats()
    } catch (error) {
      this.emit(
        'error',
        new Error(`Failed to get connection stats: ${error}`),
        peerId,
      )
      return null
    }
  }

  /**
   * 移除对等连接
   */
  public removePeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (peer) {
      // 关闭数据通道
      if (peer.dataChannel) {
        peer.dataChannel.close()
      }

      // 关闭连接
      peer.connection.close()

      // 停止媒体流
      if (peer.mediaStream) {
        peer.mediaStream.getTracks().forEach((track) => track.stop())
      }

      this.peers.delete(peerId)
    }
  }

  /**
   * 关闭所有连接
   */
  public closeAllConnections(): void {
    this.peers.forEach((_, peerId) => {
      this.removePeer(peerId)
    })

    // 停止本地媒体流
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }

  /**
   * 获取所有对等连接
   */
  public getPeers(): Map<string, Peer> {
    return new Map(this.peers)
  }

  /**
   * 获取特定对等连接
   */
  public getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId)
  }

  /**
   * 获取本地媒体流
   */
  public getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * 映射连接状态
   */
  private mapConnectionState(state: RTCPeerConnectionState): ConnectionState {
    switch (state) {
      case 'connecting':
        return ConnectionState.CONNECTING
      case 'connected':
        return ConnectionState.CONNECTED
      case 'disconnected':
        return ConnectionState.DISCONNECTED
      case 'failed':
        return ConnectionState.FAILED
      case 'closed':
        return ConnectionState.CLOSED
      default:
        return ConnectionState.DISCONNECTED
    }
  }

  /**
   * 生成传输ID
   */
  private generateTransferId(): string {
    return `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.closeAllConnections()
    this.eventListeners.clear()
    this.fileTransfers.clear()
  }
}
