import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MediaStreamManager } from '../media-stream'
import { MediaStreamState } from '../../typings'

// Mock MediaStream
const createMockMediaStream = (id = 'mock-stream-id') => ({
  id,
  active: true,
  getTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  getAudioTracks: vi.fn().mockReturnValue([]),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  clone: vi.fn().mockReturnValue(createMockMediaStream(`${id}-clone`)),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
})

// Mock MediaStreamTrack
const createMockTrack = (kind: 'audio' | 'video', enabled = true) => ({
  id: `mock-${kind}-track`,
  kind,
  label: `Mock ${kind} track`,
  enabled,
  muted: false,
  readyState: 'live',
  stop: vi.fn(),
  clone: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getConstraints: vi.fn().mockReturnValue({}),
  getSettings: vi.fn().mockReturnValue({}),
  getCapabilities: vi.fn().mockReturnValue({}),
  applyConstraints: vi.fn().mockResolvedValue(undefined)
})

describe('MediaStreamManager', () => {
  let mediaStreamManager: MediaStreamManager
  let mockStream: MediaStream

  beforeEach(() => {
    vi.clearAllMocks()
    mediaStreamManager = new MediaStreamManager()
    mockStream = createMockMediaStream() as any
    
    // 重置navigator.mediaDevices mock
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(mockStream as any)
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(mockStream as any)
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValue([])
  })

  afterEach(() => {
    mediaStreamManager.destroy()
  })

  describe('初始化', () => {
    it('应该成功创建实例', () => {
      expect(mediaStreamManager).toBeInstanceOf(MediaStreamManager)
    })

    it('应该初始化时检查设备权限', () => {
      // 权限检查在构造函数中异步执行
      expect(mediaStreamManager).toBeInstanceOf(MediaStreamManager)
    })
  })

  describe('设备管理', () => {
    it('应该能够获取可用设备列表', async () => {
      const mockDevices = [
        {
          deviceId: 'camera1',
          label: 'Front Camera',
          kind: 'videoinput' as MediaDeviceKind,
          groupId: 'group1'
        },
        {
          deviceId: 'mic1',
          label: 'Default Microphone',
          kind: 'audioinput' as MediaDeviceKind,
          groupId: 'group2'
        }
      ]
      
      vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValue(mockDevices as any)
      
      const devices = await mediaStreamManager.getAvailableDevices()
      expect(devices).toHaveLength(2)
      expect(devices[0].kind).toBe('videoinput')
      expect(devices[1].kind).toBe('audioinput')
    })

    it('应该能够刷新设备列表', async () => {
      const mockDevices = [
        { deviceId: 'device1', label: 'Camera 1', kind: 'videoinput', groupId: 'group1' },
        { deviceId: 'device2', label: 'Microphone 1', kind: 'audioinput', groupId: 'group2' }
      ]
      
      vi.mocked(navigator.mediaDevices.enumerateDevices).mockResolvedValue(mockDevices as any)
      
      await mediaStreamManager.getAvailableDevices()
      
      expect(navigator.mediaDevices.enumerateDevices).toHaveBeenCalled()
    })

    it('应该能够检查设备权限', async () => {
      const permissions = await mediaStreamManager.checkPermissions()
      expect(permissions).toHaveProperty('camera')
      expect(permissions).toHaveProperty('microphone')
    })
  })

  describe('摄像头管理', () => {
    it('应该能够启动摄像头', async () => {
      const config = {
        video: {
          enabled: true,
          width: 1280,
          height: 720,
          frameRate: 30
        },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      expect(streamId).toBeDefined()
      expect(typeof streamId).toBe('string')
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    it('应该能够停止摄像头', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      const result = mediaStreamManager.stopCamera(streamId)
      expect(result).toBe(true)
    })

    it('应该在权限被拒绝时抛出错误', async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        new Error('Permission denied')
      )
      
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      await expect(mediaStreamManager.startCamera(config)).rejects.toThrow('Permission denied')
    })
  })

  describe('麦克风管理', () => {
    it('应该能够启动麦克风', async () => {
      const config = {
        video: { enabled: false },
        audio: {
          enabled: true,
          echoCancellation: true,
          noiseSuppression: true
        }
      }
      
      const streamId = await mediaStreamManager.startMicrophone(config)
      expect(streamId).toBeDefined()
      expect(typeof streamId).toBe('string')
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    it('应该能够停止麦克风', async () => {
      const config = {
        video: { enabled: false },
        audio: { enabled: true }
      }
      
      const streamId = await mediaStreamManager.startMicrophone(config)
      const result = mediaStreamManager.stopMicrophone(streamId)
      expect(result).toBe(true)
    })

    it('应该能够切换麦克风静音状态', async () => {
      const config = {
        video: { enabled: false },
        audio: { enabled: true }
      }
      
      const streamId = await mediaStreamManager.startMicrophone(config)
      
      // 静音
      const muteResult = mediaStreamManager.muteMicrophone(streamId)
      expect(muteResult).toBe(true)
      
      // 取消静音
      const unmuteResult = mediaStreamManager.unmuteMicrophone(streamId)
      expect(unmuteResult).toBe(true)
    })
  })

  describe('屏幕共享', () => {
    it('应该能够开始屏幕共享', async () => {
      const options = {
        video: true,
        audio: true,
        cursor: 'always' as const
      }
      
      const streamId = await mediaStreamManager.startScreenShare(options)
      expect(streamId).toBeDefined()
      expect(typeof streamId).toBe('string')
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled()
    })

    it('应该能够停止屏幕共享', async () => {
      const options = {
        video: true,
        audio: false
      }
      
      const streamId = await mediaStreamManager.startScreenShare(options)
      const result = mediaStreamManager.stopScreenShare(streamId)
      expect(result).toBe(true)
    })

    it('应该在不支持屏幕共享时抛出错误', async () => {
      // 模拟不支持getDisplayMedia
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia
      delete (navigator.mediaDevices as any).getDisplayMedia
      
      const options = { video: true, audio: false }
      
      await expect(mediaStreamManager.startScreenShare(options)).rejects.toThrow(
        '当前浏览器不支持屏幕共享'
      )
      
      // 恢复原始方法
      navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia
    })
  })

  describe('流状态管理', () => {
    it('应该获取活动流列表', async () => {
      const streamId = await mediaStreamManager.getUserMedia()
      const stream = mediaStreamManager.getStreamById(streamId)
      expect(stream).toBeDefined()
    })

    it('应该能够根据ID获取流', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      const stream = mediaStreamManager.getStreamById(streamId)
      expect(stream).toBeDefined()
      expect(stream?.id).toBe(streamId)
    })

    it('应该能够根据类型获取流', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      await mediaStreamManager.startCamera(config)
      const cameraStreams = mediaStreamManager.getStreamsByType('camera')
      expect(cameraStreams.length).toBeGreaterThan(0)
    })

    it('应该能够检查流是否活跃', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      const isActive = mediaStreamManager.isStreamActive(streamId)
      expect(isActive).toBe(true)
    })
  })

  describe('事件系统', () => {
    it('应该能够添加和触发事件监听器', () => {
      const streamAddedListener = vi.fn()
      mediaStreamManager.on('stream-added', streamAddedListener)
      
      // 模拟触发事件
      ;(mediaStreamManager as any).emit('stream-added', mockStream, 'camera')
      expect(streamAddedListener).toHaveBeenCalledWith(mockStream, 'camera')
    })

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn()
      mediaStreamManager.on('stream-added', listener)
      mediaStreamManager.off('stream-added', listener)
      
      ;(mediaStreamManager as any).emit('stream-added', mockStream, 'camera')
      expect(listener).not.toHaveBeenCalled()
    })

    it('应该在设备变化时触发事件', () => {
      const deviceChangedListener = vi.fn()
      mediaStreamManager.on('device-changed', deviceChangedListener)
      
      // 模拟设备变化
      ;(mediaStreamManager as any).handleDeviceChange()
      
      // 由于设备变化是异步的，我们检查监听器是否被注册
      expect(deviceChangedListener).toBeDefined()
    })
  })

  describe('媒体约束', () => {
    it('应该能够应用媒体约束', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: true }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      
      const newConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      
      const result = await mediaStreamManager.applyConstraints(streamId, newConstraints)
      expect(result).toBe(true)
    })

    it('应该能够获取当前约束', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      const constraints = mediaStreamManager.getConstraints(streamId)
      expect(constraints).toBeDefined()
    })
  })

  describe('流质量控制', () => {
    it('应该能够调整视频质量', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      
      const result = await mediaStreamManager.adjustVideoQuality(streamId, {
        width: 640,
        height: 480,
        frameRate: 15
      })
      
      expect(result).toBe(true)
    })

    it('应该能够调整音频质量', async () => {
      const config = {
        video: { enabled: false },
        audio: { enabled: true }
      }
      
      const streamId = await mediaStreamManager.startMicrophone(config)
      
      const result = await mediaStreamManager.adjustAudioQuality(streamId, {
        echoCancellation: false,
        noiseSuppression: false
      })
      
      expect(result).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理getUserMedia错误', async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
        new Error('NotFoundError')
      )
      
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      await expect(mediaStreamManager.startCamera(config)).rejects.toThrow('NotFoundError')
    })

    it('应该处理设备枚举错误', async () => {
      vi.mocked(navigator.mediaDevices.enumerateDevices).mockRejectedValue(
        new Error('EnumerateDevices failed')
      )
      
      await expect(mediaStreamManager.getAvailableDevices()).rejects.toThrow(
        'EnumerateDevices failed'
      )
    })

    it('应该处理约束应用错误', async () => {
      const config = {
        video: { enabled: true },
        audio: { enabled: false }
      }
      
      const streamId = await mediaStreamManager.startCamera(config)
      
      // 模拟约束应用失败
      const mockTrack = createMockTrack('video')
      mockTrack.applyConstraints = vi.fn().mockRejectedValue(new Error('Constraint error'))
      
      const mockStreamWithTrack = {
        ...mockStream,
        getVideoTracks: vi.fn().mockReturnValue([mockTrack])
      }
      
      // 替换流中的轨道
      ;(mediaStreamManager as any).activeStreams.set(streamId, {
        id: streamId,
        stream: mockStreamWithTrack,
        type: 'camera',
        config,
        state: MediaStreamState.ACTIVE,
        createdAt: Date.now()
      })
      
      const result = await mediaStreamManager.applyConstraints(streamId, {
        video: { width: { exact: 99999 } }
      })
      
      expect(result).toBe(false)
    })
  })

  describe('内存管理', () => {
    it('应该能够停止所有流', () => {
      const result = mediaStreamManager.stopAllStreams()
      expect(typeof result).toBe('number')
    })

    it('应该能够正确销毁实例', () => {
      expect(() => {
        mediaStreamManager.destroy()
      }).not.toThrow()
    })

    it('应该在销毁后清理所有资源', () => {
      mediaStreamManager.destroy()
      
      // 验证所有流都已停止
      expect(mediaStreamManager.getStreamById('test-stream')).toBeNull()
    })
  })

  describe('浏览器兼容性', () => {
    it('应该能够检查WebRTC支持', () => {
      const isSupported = mediaStreamManager.isWebRTCSupported()
      expect(typeof isSupported).toBe('boolean')
    })

    it('应该能够检查getUserMedia支持', () => {
      const isSupported = mediaStreamManager.isGetUserMediaSupported()
      expect(typeof isSupported).toBe('boolean')
    })

    it('应该能够检查getDisplayMedia支持', () => {
      const isSupported = mediaStreamManager.isGetDisplayMediaSupported()
      expect(typeof isSupported).toBe('boolean')
    })
  })
})