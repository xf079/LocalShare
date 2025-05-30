/**
 * 媒体流相关类型定义
 * 包含媒体设备、流状态、配置等类型
 */

/**
 * 媒体设备信息接口
 */
export interface MediaDeviceInfo {
  /** 设备唯一标识符 */
  deviceId: string
  /** 设备显示名称 */
  label: string
  /** 设备类型(audioinput/videoinput/audiooutput) */
  kind: MediaDeviceKind
  /** 设备组标识符 */
  groupId: string
}

/**
 * 媒体流状态枚举
 */
export enum MediaStreamState {
  /** 媒体流未激活 */
  INACTIVE = 'inactive',
  /** 正在请求媒体流 */
  REQUESTING = 'requesting',
  /** 媒体流已激活 */
  ACTIVE = 'active',
  /** 媒体流错误 */
  ERROR = 'error',
}

/**
 * 屏幕共享选项
 */
export interface ScreenShareOptions {
  /** 是否包含视频 */
  video: boolean
  /** 是否包含音频 */
  audio: boolean
  /** 鼠标光标显示模式 */
  cursor?: 'always' | 'motion' | 'never'
  /** 显示表面类型 */
  displaySurface?: 'application' | 'browser' | 'monitor' | 'window'
}

/**
 * 媒体流事件接口
 */
export interface MediaStreamEvents {
  /** 媒体流添加事件 */
  'stream-added': (
    stream: MediaStream,
    type: 'camera' | 'microphone' | 'screen',
  ) => void
  /** 媒体流移除事件 */
  'stream-removed': (
    streamId: string,
    type: 'camera' | 'microphone' | 'screen',
  ) => void
  /** 设备变化事件 */
  'device-changed': (devices: MediaDeviceInfo[]) => void
  /** 权限被拒绝事件 */
  'permission-denied': (error: Error) => void
  /** 媒体流错误事件 */
  'stream-error': (error: Error) => void
  /** 媒体轨道结束事件 */
  'track-ended': (track: MediaStreamTrack) => void
}

/**
 * 媒体流配置接口
 */
export interface MediaStreamConfig {
  /** 视频配置 */
  video: {
    /** 是否启用视频 */
    enabled: boolean
    /** 视频宽度 */
    width?: number
    /** 视频高度 */
    height?: number
    /** 帧率 */
    frameRate?: number
    /** 摄像头方向(前置/后置) */
    facingMode?: 'user' | 'environment'
    /** 指定设备ID */
    deviceId?: string
  }
  /** 音频配置 */
  audio: {
    /** 是否启用音频 */
    enabled: boolean
    /** 是否启用回声消除 */
    echoCancellation?: boolean
    /** 是否启用噪声抑制 */
    noiseSuppression?: boolean
    /** 是否启用自动增益控制 */
    autoGainControl?: boolean
    /** 指定设备ID */
    deviceId?: string
  }
}

/**
 * 媒体约束接口
 */
export interface MediaConstraints {
  /** 音频约束 */
  audio?: boolean | MediaTrackConstraints
  /** 视频约束 */
  video?: boolean | MediaTrackConstraints
}

/**
 * 活动媒体流信息
 */
export interface ActiveStream {
  /** 流唯一标识符 */
  id: string
  /** 媒体流对象 */
  stream: MediaStream
  /** 流类型 */
  type: 'camera' | 'microphone' | 'screen'
  /** 流配置信息 */
  config: MediaStreamConfig
  /** 流状态 */
  state: MediaStreamState
  /** 创建时间戳 */
  createdAt: number
}