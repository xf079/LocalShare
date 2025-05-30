/**
 * 媒体流管理器 - 处理音视频流获取、管理和控制的工具类
 * 支持摄像头、麦克风、屏幕共享等媒体设备管理
 * 提供设备检测、权限管理、流质量控制等功能
 */

import {
  type MediaDeviceInfo,
  MediaStreamState,
  type ScreenShareOptions,
  type MediaStreamEvents,
  type MediaStreamConfig,
  type ActiveStream,
} from '../typings'

/**
 * 媒体流管理器类
 */
export class MediaStreamManager {
  private eventListeners: Map<keyof MediaStreamEvents, Function[]> = new Map()
  private activeStreams: Map<string, ActiveStream> = new Map()
  private availableDevices: MediaDeviceInfo[] = []
  private deviceChangeListener: (() => void) | null = null
  private permissionStatus: Map<string, PermissionState> = new Map()

  // 默认媒体配置
  private static readonly DEFAULT_CONFIG: MediaStreamConfig = {
    video: {
      enabled: true,
      width: 1280,
      height: 720,
      frameRate: 30,
      facingMode: 'user',
    },
    audio: {
      enabled: true,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }

  constructor() {
    this.initializeEventMaps()
    this.setupDeviceChangeListener()
    this.checkPermissions()
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeEventMaps(): void {
    const eventTypes: (keyof MediaStreamEvents)[] = [
      'stream-added',
      'stream-removed',
      'device-changed',
      'permission-denied',
      'stream-error',
      'track-ended',
    ]

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, [])
    })
  }

  /**
   * 添加事件监听器
   */
  public on<T extends keyof MediaStreamEvents>(
    event: T,
    listener: MediaStreamEvents[T],
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * 移除事件监听器
   */
  public off<T extends keyof MediaStreamEvents>(
    event: T,
    listener: MediaStreamEvents[T],
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
  private emit<T extends keyof MediaStreamEvents>(
    event: T,
    ...args: Parameters<MediaStreamEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => {
      try {
        ;(listener as any)(...args)
      } catch (error) {
        console.error(
          `Error in media stream event listener for ${event}:`,
          error,
        )
      }
    })
  }

  /**
   * 检查浏览器支持
   */
  public static checkBrowserSupport(): {
    getUserMedia: boolean
    getDisplayMedia: boolean
    enumerateDevices: boolean
  } {
    const hasGetUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    )
    const hasGetDisplayMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
    )
    const hasEnumerateDevices = !!(
      navigator.mediaDevices && navigator.mediaDevices.enumerateDevices
    )

    return {
      getUserMedia: hasGetUserMedia,
      getDisplayMedia: hasGetDisplayMedia,
      enumerateDevices: hasEnumerateDevices,
    }
  }

  /**
   * 设置设备变化监听器
   */
  private setupDeviceChangeListener(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      this.deviceChangeListener = () => {
        this.updateAvailableDevices()
      }

      navigator.mediaDevices.addEventListener(
        'devicechange',
        this.deviceChangeListener,
      )
    }
  }

  /**
   * 检查媒体权限
   */
  private async checkPermissions(): Promise<void> {
    if (!navigator.permissions) {
      console.warn('Permissions API not supported')
      return
    }

    try {
      const cameraPermission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      })
      const microphonePermission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })

      this.permissionStatus.set('camera', cameraPermission.state)
      this.permissionStatus.set('microphone', microphonePermission.state)

      // 监听权限变化
      cameraPermission.addEventListener('change', () => {
        this.permissionStatus.set('camera', cameraPermission.state)
      })

      microphonePermission.addEventListener('change', () => {
        this.permissionStatus.set('microphone', microphonePermission.state)
      })
    } catch (error) {
      console.warn('Failed to check permissions:', error)
    }
  }

  /**
   * 获取可用设备列表
   */
  public async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('enumerateDevices is not supported')
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.availableDevices = devices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label,
        kind: device.kind,
        groupId: device.groupId,
      }))

      return this.availableDevices
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      throw new Error(`Failed to get available devices: ${error}`)
    }
  }

  /**
   * 更新可用设备列表
   */
  private async updateAvailableDevices(): Promise<void> {
    try {
      const devices = await this.getAvailableDevices()
      this.emit('device-changed', devices)
    } catch (error) {
      console.error('Failed to update available devices:', error)
    }
  }

  /**
   * 获取用户媒体流（摄像头和麦克风）
   */
  public async getUserMedia(
    config?: Partial<MediaStreamConfig>,
  ): Promise<string> {
    const finalConfig = this.mergeConfig(config)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported')
    }

    const constraints: MediaStreamConstraints =
      this.buildMediaConstraints(finalConfig)
    const streamId = this.generateStreamId()

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // 创建活动流记录
      const activeStream: ActiveStream = {
        id: streamId,
        stream,
        type: 'camera',
        config: finalConfig,
        state: MediaStreamState.ACTIVE,
        createdAt: Date.now(),
      }

      this.activeStreams.set(streamId, activeStream)
      this.setupStreamTrackHandlers(stream, streamId)

      this.emit('stream-added', stream, 'camera')

      return streamId
    } catch (error) {
      console.error('Failed to get user media:', error)

      if (error instanceof Error) {
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          this.emit('permission-denied', error)
        } else {
          this.emit('stream-error', error)
        }
      }

      throw new Error(`Failed to get user media: ${error}`)
    }
  }

  /**
   * 获取屏幕共享流
   */
  public async getDisplayMedia(options?: ScreenShareOptions): Promise<string> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('getDisplayMedia is not supported')
    }

    const constraints: MediaStreamConstraints = {
      video:
        options?.video !== false
          ? ({
              cursor: options?.cursor || 'always',
              displaySurface: options?.displaySurface,
            } as any)
          : false,
      audio: options?.audio || false,
    }

    const streamId = this.generateStreamId()

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints)

      // 创建活动流记录
      const activeStream: ActiveStream = {
        id: streamId,
        stream,
        type: 'screen',
        config: MediaStreamManager.DEFAULT_CONFIG, // 屏幕共享使用默认配置
        state: MediaStreamState.ACTIVE,
        createdAt: Date.now(),
      }

      this.activeStreams.set(streamId, activeStream)
      this.setupStreamTrackHandlers(stream, streamId)

      this.emit('stream-added', stream, 'screen')

      return streamId
    } catch (error) {
      console.error('Failed to get display media:', error)

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          this.emit('permission-denied', error)
        } else {
          this.emit('stream-error', error)
        }
      }

      throw new Error(`Failed to get display media: ${error}`)
    }
  }

  /**
   * 构建媒体约束
   */
  private buildMediaConstraints(
    config: MediaStreamConfig,
  ): MediaStreamConstraints {
    const constraints: MediaStreamConstraints = {}

    if (config.video.enabled) {
      constraints.video = {
        width: config.video.width ? { ideal: config.video.width } : undefined,
        height: config.video.height
          ? { ideal: config.video.height }
          : undefined,
        frameRate: config.video.frameRate
          ? { ideal: config.video.frameRate }
          : undefined,
        facingMode: config.video.facingMode
          ? { ideal: config.video.facingMode }
          : undefined,
        deviceId: config.video.deviceId
          ? { exact: config.video.deviceId }
          : undefined,
      }

      // 清理undefined值
      Object.keys(constraints.video).forEach((key) => {
        if ((constraints.video as any)[key] === undefined) {
          delete (constraints.video as any)[key]
        }
      })
    }

    if (config.audio.enabled) {
      constraints.audio = {
        echoCancellation: config.audio.echoCancellation,
        noiseSuppression: config.audio.noiseSuppression,
        autoGainControl: config.audio.autoGainControl,
        deviceId: config.audio.deviceId
          ? { exact: config.audio.deviceId }
          : undefined,
      }

      // 清理undefined值
      Object.keys(constraints.audio).forEach((key) => {
        if ((constraints.audio as any)[key] === undefined) {
          delete (constraints.audio as any)[key]
        }
      })
    }

    return constraints
  }

  /**
   * 合并配置
   */
  private mergeConfig(config?: Partial<MediaStreamConfig>): MediaStreamConfig {
    if (!config) {
      return { ...MediaStreamManager.DEFAULT_CONFIG }
    }

    return {
      video: { ...MediaStreamManager.DEFAULT_CONFIG.video, ...config.video },
      audio: { ...MediaStreamManager.DEFAULT_CONFIG.audio, ...config.audio },
    }
  }

  /**
   * 设置流轨道事件处理器
   */
  private setupStreamTrackHandlers(
    stream: MediaStream,
    streamId: string,
  ): void {
    stream.getTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        console.log(`Track ended: ${track.kind}`)
        this.emit('track-ended', track)

        // 如果所有轨道都结束了，移除流
        const allTracksEnded = stream
          .getTracks()
          .every((t) => t.readyState === 'ended')
        if (allTracksEnded) {
          this.removeStream(streamId)
        }
      })
    })
  }

  /**
   * 停止媒体流
   */
  public stopStream(streamId: string): void {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      console.warn(`Stream not found: ${streamId}`)
      return
    }

    // 停止所有轨道
    activeStream.stream.getTracks().forEach((track) => {
      track.stop()
    })

    this.removeStream(streamId)
  }

  /**
   * 移除媒体流
   */
  private removeStream(streamId: string): void {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      return
    }

    activeStream.state = MediaStreamState.INACTIVE
    this.activeStreams.delete(streamId)

    this.emit('stream-removed', streamId, activeStream.type)
  }

  /**
   * 获取媒体流
   */
  public getStream(streamId: string): MediaStream | null {
    const activeStream = this.activeStreams.get(streamId)
    return activeStream ? activeStream.stream : null
  }

  /**
   * 获取所有活动流
   */
  public getAllStreams(): { id: string; stream: MediaStream; type: string }[] {
    return Array.from(this.activeStreams.values()).map((activeStream) => ({
      id: activeStream.id,
      stream: activeStream.stream,
      type: activeStream.type,
    }))
  }

  /**
   * 切换视频轨道状态
   */
  public toggleVideo(streamId: string, enabled?: boolean): boolean {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      return false
    }

    const videoTracks = activeStream.stream.getVideoTracks()
    if (videoTracks.length === 0) {
      return false
    }

    const newState = enabled !== undefined ? enabled : !videoTracks[0].enabled
    videoTracks.forEach((track) => {
      track.enabled = newState
    })

    return newState
  }

  /**
   * 切换音频轨道状态
   */
  public toggleAudio(streamId: string, enabled?: boolean): boolean {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      return false
    }

    const audioTracks = activeStream.stream.getAudioTracks()
    if (audioTracks.length === 0) {
      return false
    }

    const newState = enabled !== undefined ? enabled : !audioTracks[0].enabled
    audioTracks.forEach((track) => {
      track.enabled = newState
    })

    return newState
  }

  /**
   * 切换摄像头（前置/后置）
   */
  public async switchCamera(streamId: string): Promise<void> {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream || activeStream.type !== 'camera') {
      throw new Error('Invalid stream or not a camera stream')
    }

    const currentFacingMode = activeStream.config.video.facingMode
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'

    // 停止当前流
    this.stopStream(streamId)

    // 创建新的配置
    const newConfig = {
      ...activeStream.config,
      video: {
        ...activeStream.config.video,
        facingMode: newFacingMode,
      },
    }

    // 获取新的流
    await this.getUserMedia({
      ...newConfig,
      video: {
        ...newConfig.video,
        facingMode: newConfig.video.facingMode as 'user' | 'environment',
      },
    })
  }

  /**
   * 更改音频设备
   */
  public async changeAudioDevice(
    streamId: string,
    deviceId: string,
  ): Promise<void> {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      throw new Error('Stream not found')
    }

    // 停止当前流
    this.stopStream(streamId)

    // 创建新的配置
    const newConfig = {
      ...activeStream.config,
      audio: {
        ...activeStream.config.audio,
        deviceId,
      },
    }

    // 获取新的流
    await this.getUserMedia(newConfig)
  }

  /**
   * 更改视频设备
   */
  public async changeVideoDevice(
    streamId: string,
    deviceId: string,
  ): Promise<void> {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      throw new Error('Stream not found')
    }

    // 停止当前流
    this.stopStream(streamId)

    // 创建新的配置
    const newConfig = {
      ...activeStream.config,
      video: {
        ...activeStream.config.video,
        deviceId,
      },
    }

    // 获取新的流
    await this.getUserMedia(newConfig)
  }

  /**
   * 获取流统计信息
   */
  public getStreamStats(streamId: string): {
    videoTracks: number
    audioTracks: number
    videoEnabled: boolean
    audioEnabled: boolean
    duration: number
  } | null {
    const activeStream = this.activeStreams.get(streamId)
    if (!activeStream) {
      return null
    }

    const videoTracks = activeStream.stream.getVideoTracks()
    const audioTracks = activeStream.stream.getAudioTracks()

    return {
      videoTracks: videoTracks.length,
      audioTracks: audioTracks.length,
      videoEnabled: videoTracks.some((track) => track.enabled),
      audioEnabled: audioTracks.some((track) => track.enabled),
      duration: Date.now() - activeStream.createdAt,
    }
  }

  /**
   * 获取权限状态
   */
  public getPermissionStatus(
    type: 'camera' | 'microphone',
  ): PermissionState | undefined {
    return this.permissionStatus.get(type)
  }

  /**
   * 生成流ID
   */
  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 停止所有流
   */
  public stopAllStreams(): void {
    this.activeStreams.forEach((_, streamId) => {
      this.stopStream(streamId)
    })
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    // 停止所有流
    this.stopAllStreams()

    // 移除设备变化监听器
    if (
      this.deviceChangeListener &&
      navigator.mediaDevices &&
      navigator.mediaDevices.removeEventListener
    ) {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        this.deviceChangeListener,
      )
    }

    // 清理事件监听器
    this.eventListeners.clear()

    // 重置状态
    this.availableDevices = []
    this.permissionStatus.clear()
  }
}
