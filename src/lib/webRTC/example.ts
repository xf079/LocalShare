/**
 * WebRTC工具类使用示例
 * 展示如何使用WebRTCManager、SignalingManager、FileTransferManager和MediaStreamManager
 */

import {
  WebRTCManager,
  SignalingManager,
  FileTransferManager,
  MediaStreamManager,
  checkWebRTCSupport,
} from './index'

import type { SignalingConfig, WebRTCConfig } from './typings'

/**
 * 完整的WebRTC应用示例类
 */
export class WebRTCExample {
  private webRTCManager: WebRTCManager | undefined
  private signalingManager: SignalingManager | undefined
  private fileTransferManager: FileTransferManager | undefined
  private mediaStreamManager: MediaStreamManager | undefined
  private localStreamId: string | null = null

  constructor() {
    // 检查浏览器支持
    const support = checkWebRTCSupport()
    console.log('WebRTC Support:', support)

    if (!support.rtcPeerConnection) {
      throw new Error('WebRTC is not supported in this browser')
    }

    // 初始化管理器
    this.initializeManagers()
  }

  /**
   * 初始化所有管理器
   */
  private initializeManagers(): void {
    // WebRTC配置
    const webRTCConfig: WebRTCConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      enableDataChannel: true,
      enableMedia: true,
    }

    // 信令服务器配置
    const signalingConfig: SignalingConfig = {
      signalingServerUrl: 'wss://your-signaling-server.com',
    }

    // 初始化管理器
    this.webRTCManager = new WebRTCManager(webRTCConfig)
    this.signalingManager = new SignalingManager(signalingConfig)
    this.fileTransferManager = new FileTransferManager({
      chunkSize: 64 * 1024, // 64KB
      maxConcurrentTransfers: 3,
      enableChecksum: true,
    })
    this.mediaStreamManager = new MediaStreamManager()

    // 设置事件监听器
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // WebRTC事件
    this.webRTCManager.on('connection-state-change', (state) => {
      console.log('Connection state changed:', state)
    })

    this.webRTCManager.on('data-channel-open', (channel) => {
      console.log('Data channel opened:', channel.label)
      // 设置文件传输管理器的数据通道
      this.fileTransferManager.setDataChannel(channel)
    })

    this.webRTCManager.on('remote-stream', (stream) => {
      console.log('Received remote stream:', stream.id)
      this.handleRemoteStream(stream)
    })

    this.webRTCManager.on('ice-candidate', (candidate) => {
      // 通过信令服务器发送ICE候选者
      this.signalingManager.sendIceCandidate('remote-peer-id', candidate)
    })

    // 信令事件
    this.signalingManager.on('offer', (offer, peerId) => {
      console.log('Received offer from:', peerId)
      this.handleOffer(offer, peerId)
    })

    this.signalingManager.on('answer', (answer, peerId) => {
      console.log('Received answer from:', peerId)
      this.handleAnswer(answer, peerId)
    })

    this.signalingManager.on('ice-candidate', (candidate, peerId) => {
      console.log('Received ICE candidate from:', peerId)
      this.webrtcManager.addIceCandidate(candidate)
    })

    this.signalingManager.on('peer-joined', (peerId) => {
      console.log('Peer joined:', peerId)
      this.initiateCall(peerId)
    })

    // 文件传输事件
    this.fileTransferManager.on('progress', (progress) => {
      console.log('Transfer progress:', progress)
      this.updateTransferProgress(progress)
    })

    this.fileTransferManager.on('completed', (fileId, file) => {
      console.log('File transfer completed:', fileId, file.name)
      this.handleFileReceived(file)
    })

    this.fileTransferManager.on('failed', (fileId, error) => {
      console.error('File transfer failed:', fileId, error)
    })

    // 媒体流事件
    this.mediaStreamManager.on('stream-added', (stream, type) => {
      console.log('Media stream added:', type, stream.id)
      if (type === 'camera') {
        this.handleLocalStream(stream)
      }
    })

    this.mediaStreamManager.on('permission-denied', (error) => {
      console.error('Media permission denied:', error)
      this.handlePermissionDenied()
    })
  }

  /**
   * 连接到信令服务器
   */
  public async connect(userId: string): Promise<void> {
    try {
      await this.signalingManager.connect(userId)
      console.log('Connected to signaling server')
    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
      throw error
    }
  }

  /**
   * 加入房间
   */
  public async joinRoom(roomId: string): Promise<void> {
    if (!this.signalingManager.isConnected()) {
      throw new Error('Not connected to signaling server')
    }

    const success = this.signalingManager.joinRoom(roomId)
    if (!success) {
      throw new Error('Failed to join room')
    }

    console.log('Joined room:', roomId)
  }

  /**
   * 开始本地媒体流
   */
  public async startLocalMedia(
    enableVideo = true,
    enableAudio = true,
  ): Promise<void> {
    try {
      this.localStreamId = await this.mediaStreamManager.getUserMedia({
        video: {
          enabled: enableVideo,
          width: 1280,
          height: 720,
          frameRate: 30,
        },
        audio: {
          enabled: enableAudio,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      console.log('Local media started:', this.localStreamId)
    } catch (error) {
      console.error('Failed to start local media:', error)
      throw error
    }
  }

  /**
   * 开始屏幕共享
   */
  public async startScreenShare(): Promise<void> {
    try {
      const screenStreamId = await this.mediaStreamManager.getDisplayMedia({
        video: true,
        audio: true,
      })

      const screenStream = this.mediaStreamManager.getStream(screenStreamId)
      if (screenStream) {
        // 替换视频轨道
        await this.webrtcManager.replaceTrack(
          screenStream.getVideoTracks()[0],
          'video',
        )
      }

      console.log('Screen sharing started:', screenStreamId)
    } catch (error) {
      console.error('Failed to start screen sharing:', error)
      throw error
    }
  }

  /**
   * 发起通话
   */
  private async initiateCall(peerId: string): Promise<void> {
    try {
      // 添加本地流到WebRTC连接
      if (this.localStreamId) {
        const localStream = this.mediaStreamManager.getStream(
          this.localStreamId,
        )
        if (localStream) {
          await this.webrtcManager.addLocalStream(localStream)
        }
      }

      // 创建并发送Offer
      const offer = await this.webrtcManager.createOffer()
      this.signalingManager.sendOffer(peerId, offer)

      console.log('Call initiated to:', peerId)
    } catch (error) {
      console.error('Failed to initiate call:', error)
    }
  }

  /**
   * 处理收到的Offer
   */
  private async handleOffer(
    offer: RTCSessionDescriptionInit,
    peerId: string,
  ): Promise<void> {
    try {
      // 添加本地流
      if (this.localStreamId) {
        const localStream = this.mediaStreamManager.getStream(
          this.localStreamId,
        )
        if (localStream) {
          await this.webrtcManager.addLocalStream(localStream)
        }
      }

      // 设置远程描述并创建Answer
      await this.webrtcManager.setRemoteDescription(offer)
      const answer = await this.webrtcManager.createAnswer()
      this.signalingManager.sendAnswer(peerId, answer)

      console.log('Handled offer from:', peerId)
    } catch (error) {
      console.error('Failed to handle offer:', error)
    }
  }

  /**
   * 处理收到的Answer
   */
  private async handleAnswer(
    answer: RTCSessionDescriptionInit,
    peerId: string,
  ): Promise<void> {
    try {
      await this.webrtcManager.setRemoteDescription(answer)
      console.log('Handled answer from:', peerId)
    } catch (error) {
      console.error('Failed to handle answer:', error)
    }
  }

  /**
   * 处理本地流
   */
  private handleLocalStream(stream: MediaStream): void {
    // 在这里可以将流绑定到video元素
    const videoElement = document.getElementById(
      'localVideo',
    ) as HTMLVideoElement
    if (videoElement) {
      videoElement.srcObject = stream
    }
  }

  /**
   * 处理远程流
   */
  private handleRemoteStream(stream: MediaStream): void {
    // 在这里可以将流绑定到video元素
    const videoElement = document.getElementById(
      'remoteVideo',
    ) as HTMLVideoElement
    if (videoElement) {
      videoElement.srcObject = stream
    }
  }

  /**
   * 发送文件
   */
  public async sendFile(file: File): Promise<string> {
    try {
      const fileId = await this.fileTransferManager.sendFile(file)
      console.log('File transfer started:', fileId, file.name)
      return fileId
    } catch (error) {
      console.error('Failed to send file:', error)
      throw error
    }
  }

  /**
   * 处理接收到的文件
   */
  private handleFileReceived(file: File): void {
    console.log('File received:', file.name, file.size)

    // 创建下载链接
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 更新传输进度
   */
  private updateTransferProgress(progress: any): void {
    // 在这里更新UI显示传输进度
    console.log(`Transfer progress: ${progress.percentage.toFixed(2)}%`)
  }

  /**
   * 处理权限被拒绝
   */
  private handlePermissionDenied(): void {
    // 在这里显示权限请求提示
    alert('需要摄像头和麦克风权限才能进行视频通话')
  }

  /**
   * 切换视频
   */
  public toggleVideo(): boolean {
    if (this.localStreamId) {
      return this.mediaStreamManager.toggleVideo(this.localStreamId)
    }
    return false
  }

  /**
   * 切换音频
   */
  public toggleAudio(): boolean {
    if (this.localStreamId) {
      return this.mediaStreamManager.toggleAudio(this.localStreamId)
    }
    return false
  }

  /**
   * 挂断通话
   */
  public hangup(): void {
    // 关闭WebRTC连接
    this.webrtcManager.close()

    // 停止本地媒体流
    if (this.localStreamId) {
      this.mediaStreamManager.stopStream(this.localStreamId)
      this.localStreamId = null
    }

    // 离开房间
    this.signalingManager.leaveRoom()

    console.log('Call ended')
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.hangup()
    this.signalingManager.disconnect()
    console.log('Disconnected')
  }

  /**
   * 获取连接统计信息
   */
  public async getConnectionStats(): Promise<any> {
    return await this.webrtcManager.getConnectionStats()
  }

  /**
   * 销毁所有资源
   */
  public destroy(): void {
    this.webrtcManager.destroy()
    this.signalingManager.destroy()
    this.fileTransferManager.destroy()
    this.mediaStreamManager.destroy()
  }
}

/**
 * 使用示例
 */
export async function exampleUsage(): Promise<void> {
  try {
    // 创建WebRTC应用实例
    const app = new WebRTCExample()

    // 连接到信令服务器
    await app.connect('user123')

    // 开始本地媒体
    await app.startLocalMedia(true, true)

    // 加入房间
    await app.joinRoom('room456')

    // 设置UI事件监听器
    document.getElementById('toggleVideo')?.addEventListener('click', () => {
      app.toggleVideo()
    })

    document.getElementById('toggleAudio')?.addEventListener('click', () => {
      app.toggleAudio()
    })

    document.getElementById('shareScreen')?.addEventListener('click', () => {
      app.startScreenShare()
    })

    document.getElementById('hangup')?.addEventListener('click', () => {
      app.hangup()
    })

    // 文件发送示例
    const fileInput = document.getElementById('fileInput') as HTMLInputElement
    fileInput?.addEventListener('change', (event) => {
      const files = (event.target as HTMLInputElement).files
      if (files && files.length > 0) {
        app.sendFile(files[0])
      }
    })

    console.log('WebRTC application initialized successfully')
  } catch (error) {
    console.error('Failed to initialize WebRTC application:', error)
  }
}

// 页面加载完成后自动运行示例
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // 可以在这里调用 exampleUsage() 来启动示例
    // exampleUsage();
  })
}
