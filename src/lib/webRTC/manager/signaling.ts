/**
 * 信令管理器 - 处理WebRTC信令交换的工具类
 * 支持WebSocket和其他信令传输方式
 * 提供房间管理和用户管理功能
 */

import {
  SignalingState,
  type SignalingEvents,
  type SignalingMessage,
  type SignalingConfig,
} from '../typings'

/**
 * 信令管理器类
 */
export class SignalingManager {
  private ws: WebSocket | null = null
  private config: SignalingConfig
  private currentUserId: string | null = null
  private currentRoomId: string | null = null
  private state: SignalingState = SignalingState.DISCONNECTED
  private eventListeners: Map<keyof SignalingEvents, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 1秒
  private heartbeatInterval: number | null = null
  private heartbeatTimeout = 30000 // 30秒

  constructor(config: SignalingConfig) {
    this.config = config
    this.initializeEventMaps()
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeEventMaps(): void {
    const eventTypes: (keyof SignalingEvents)[] = [
      'state-change',
      'message',
      'peer-joined',
      'peer-left',
      'offer',
      'answer',
      'ice-candidate',
      'error',
    ]

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, [])
    })
  }

  /**
   * 添加事件监听器
   */
  public on<T extends keyof SignalingEvents>(
    event: T,
    listener: SignalingEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  public off<T extends keyof SignalingEvents>(
    event: T,
    listener: SignalingEvents[T],
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
  private emit<T extends keyof SignalingEvents>(
    event: T,
    ...args: Parameters<SignalingEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => {
      try {
        ;(listener as any)(...args)
      } catch (error) {
        console.error(`Error in signaling event listener for ${event}:`, error)
      }
    })
  }

  /**
   * 检查WebSocket支持
   */
  public static isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined'
  }

  /**
   * 连接到信令服务器
   */
  public async connect(userId: string): Promise<void> {
    if (
      this.state === SignalingState.CONNECTED ||
      this.state === SignalingState.CONNECTING
    ) {
      return
    }

    if (!SignalingManager.isWebSocketSupported()) {
      throw new Error('WebSocket is not supported in this environment')
    }

    this.currentUserId = userId
    this.setState(SignalingState.CONNECTING)

    try {
      await this.createWebSocketConnection()
    } catch (error) {
      this.setState(SignalingState.ERROR)
      this.emit(
        'error',
        new Error(`Failed to connect to signaling server: ${error}`),
      )
      throw error
    }
  }

  /**
   * 创建WebSocket连接
   */
  private createWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 构建WebSocket URL，添加用户ID参数
        const url = new URL(this.config.signalingServerUrl)
        if (this.currentUserId) {
          url.searchParams.set('userId', this.currentUserId)
        }

        this.ws = new WebSocket(url.toString())

        // 连接打开事件
        this.ws.onopen = () => {
          console.log('Signaling server connected')
          this.setState(SignalingState.CONNECTED)
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        // 消息接收事件
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        // 连接关闭事件
        this.ws.onclose = (event) => {
          console.log(
            'Signaling server disconnected:',
            event.code,
            event.reason,
          )
          this.setState(SignalingState.DISCONNECTED)
          this.stopHeartbeat()

          // 如果不是主动关闭，尝试重连
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect()
          }
        }

        // 连接错误事件
        this.ws.onerror = (error) => {
          console.error('Signaling server error:', error)
          this.emit('error', new Error('WebSocket connection error'))
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message: SignalingMessage = JSON.parse(data)

      // 触发通用消息事件
      this.emit('message', message)

      // 根据消息类型触发特定事件
      switch (message.type) {
        case 'peer-joined':
          if (message.peerId) {
            this.emit('peer-joined', message.peerId)
          }
          break

        case 'peer-left':
          if (message.peerId) {
            this.emit('peer-left', message.peerId)
          }
          break

        case 'offer':
          if (message.offer && message.peerId) {
            this.emit('offer', message.offer, message.peerId)
          }
          break

        case 'answer':
          if (message.answer && message.peerId) {
            this.emit('answer', message.answer, message.peerId)
          }
          break

        case 'ice-candidate':
          if (message.candidate && message.peerId) {
            this.emit('ice-candidate', message.candidate, message.peerId)
          }
          break

        default:
          console.log('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse signaling message:', error)
      this.emit('error', new Error('Invalid signaling message format'))
    }
  }

  /**
   * 发送消息到信令服务器
   */
  private sendMessage(message: SignalingMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return false
    }

    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send signaling message:', error)
      this.emit('error', new Error(`Failed to send message: ${error}`))
      return false
    }
  }

  /**
   * 加入房间
   */
  public joinRoom(roomId: string): boolean {
    if (this.state !== SignalingState.CONNECTED) {
      this.emit('error', new Error('Not connected to signaling server'))
      return false
    }

    const message: SignalingMessage = {
      type: 'join',
      from: this.currentUserId || undefined,
      peerId: roomId,
    }

    const success = this.sendMessage(message)
    if (success) {
      this.currentRoomId = roomId
    }

    return success
  }

  /**
   * 离开当前房间
   */
  public leaveRoom(): boolean {
    if (!this.currentRoomId) {
      return true
    }

    const message: SignalingMessage = {
      type: 'peer-left',
      from: this.currentUserId || undefined,
      peerId: this.currentRoomId,
    }

    const success = this.sendMessage(message)
    if (success) {
      this.currentRoomId = null
    }

    return success
  }

  /**
   * 发送Offer
   */
  public sendOffer(peerId: string, offer: RTCSessionDescriptionInit): boolean {
    const message: SignalingMessage = {
      type: 'offer',
      from: this.currentUserId || undefined,
      peerId,
      offer,
    }

    return this.sendMessage(message)
  }

  /**
   * 发送Answer
   */
  public sendAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
  ): boolean {
    const message: SignalingMessage = {
      type: 'answer',
      from: this.currentUserId || undefined,
      peerId,
      answer,
    }

    return this.sendMessage(message)
  }

  /**
   * 发送ICE候选者
   */
  public sendIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit,
  ): boolean {
    const message: SignalingMessage = {
      type: 'ice-candidate',
      from: this.currentUserId || undefined,
      peerId,
      candidate,
    }

    return this.sendMessage(message)
  }

  /**
   * 设置连接状态
   */
  private setState(newState: SignalingState): void {
    if (this.state !== newState) {
      this.state = newState
      this.emit('state-change', newState)
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'))
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // 指数退避

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`,
    )

    setTimeout(() => {
      if (this.currentUserId) {
        this.connect(this.currentUserId).catch((error) => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat() // 确保没有重复的心跳

    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 发送ping消息
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.heartbeatTimeout)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.stopHeartbeat()

    if (this.ws) {
      // 发送离开房间消息
      if (this.currentRoomId) {
        this.leaveRoom()
      }

      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }

    this.setState(SignalingState.DISCONNECTED)
    this.currentUserId = null
    this.currentRoomId = null
    this.reconnectAttempts = 0
  }

  /**
   * 获取当前状态
   */
  public getState(): SignalingState {
    return this.state
  }

  /**
   * 获取当前用户ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUserId
  }

  /**
   * 获取当前房间ID
   */
  public getCurrentRoomId(): string | null {
    return this.currentRoomId
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.state === SignalingState.CONNECTED
  }

  /**
   * 设置重连配置
   */
  public setReconnectConfig(maxAttempts: number, delay: number): void {
    this.maxReconnectAttempts = maxAttempts
    this.reconnectDelay = delay
  }

  /**
   * 设置心跳超时时间
   */
  public setHeartbeatTimeout(timeout: number): void {
    this.heartbeatTimeout = timeout

    // 如果当前正在运行心跳，重新启动
    if (this.heartbeatInterval) {
      this.startHeartbeat()
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.disconnect()
    this.eventListeners.clear()
  }
}
