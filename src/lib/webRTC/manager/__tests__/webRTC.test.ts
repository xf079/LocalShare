import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebRTCManager } from '../webRTC'
import { ConnectionState, MediaType, FileTransferState } from '../../typings'

// Mock dependencies
vi.mock('../signaling', () => ({
  SignalingManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    joinRoom: vi.fn().mockResolvedValue(undefined),
    leaveRoom: vi.fn().mockResolvedValue(undefined),
    sendOffer: vi.fn().mockReturnValue(true),
    sendAnswer: vi.fn().mockReturnValue(true),
    sendIceCandidate: vi.fn().mockReturnValue(true),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    getCurrentUserId: vi.fn().mockReturnValue('user123'),
    getCurrentRoomId: vi.fn().mockReturnValue('room456')
  }))
}))

vi.mock('../media-stream', () => ({
  MediaStreamManager: vi.fn().mockImplementation(() => ({
    startCamera: vi.fn().mockResolvedValue(new MediaStream()),
    stopCamera: vi.fn(),
    startMicrophone: vi.fn().mockResolvedValue(new MediaStream()),
    stopMicrophone: vi.fn(),
    startScreenShare: vi.fn().mockResolvedValue(new MediaStream()),
    stopScreenShare: vi.fn(),
    getActiveStreams: vi.fn().mockReturnValue([]),
    on: vi.fn(),
    off: vi.fn()
  }))
}))

vi.mock('../file-transfer', () => ({
  FileTransferManager: vi.fn().mockImplementation(() => ({
    sendFile: vi.fn().mockResolvedValue('transfer123'),
    pauseTransfer: vi.fn(),
    resumeTransfer: vi.fn(),
    cancelTransfer: vi.fn(),
    getTransferProgress: vi.fn().mockReturnValue({ progress: 0.5, speed: 1024 }),
    on: vi.fn(),
    off: vi.fn()
  }))
}))

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  public connectionState: RTCPeerConnectionState = 'new'
  public iceConnectionState: RTCIceConnectionState = 'new'
  public signalingState: RTCSignalingState = 'stable'
  public localDescription: RTCSessionDescription | null = null
  public remoteDescription: RTCSessionDescription | null = null
  public onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null
  public onconnectionstatechange: ((event: Event) => void) | null = null
  public ondatachannel: ((event: RTCDataChannelEvent) => void) | null = null
  public ontrack: ((event: RTCTrackEvent) => void) | null = null

  private listeners: Map<string, Function[]> = new Map()
  private dataChannels: Map<string, MockRTCDataChannel> = new Map()

  constructor(public configuration?: RTCConfiguration) {}

  createOffer = vi.fn().mockResolvedValue({
    type: 'offer',
    sdp: 'mock-offer-sdp'
  })

  createAnswer = vi.fn().mockResolvedValue({
    type: 'answer',
    sdp: 'mock-answer-sdp'
  })

  setLocalDescription = vi.fn().mockResolvedValue(undefined)
  setRemoteDescription = vi.fn().mockResolvedValue(undefined)

  addIceCandidate = vi.fn().mockResolvedValue(undefined)

  createDataChannel = vi.fn().mockImplementation((label: string, options?: RTCDataChannelInit) => {
    const channel = new MockRTCDataChannel(label, options)
    this.dataChannels.set(label, channel)
    return channel
  })

  addTrack = vi.fn().mockReturnValue({
    sender: { track: null },
    receiver: { track: null },
    transceiver: { direction: 'sendrecv' }
  })

  removeTrack = vi.fn()

  getTransceivers = vi.fn().mockReturnValue([])
  getSenders = vi.fn().mockReturnValue([])
  getReceivers = vi.fn().mockReturnValue([])

  close = vi.fn(() => {
    this.connectionState = 'closed'
    this.dispatchEvent(new Event('connectionstatechange'))
  })

  addEventListener = vi.fn((type: string, listener: Function) => {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)
  })

  removeEventListener = vi.fn((type: string, listener: Function) => {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  })

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type) || []
    listeners.forEach(listener => listener(event))
    
    // 也调用on*属性
    if (event.type === 'icecandidate' && this.onicecandidate) {
      this.onicecandidate(event as RTCPeerConnectionIceEvent)
    } else if (event.type === 'connectionstatechange' && this.onconnectionstatechange) {
      this.onconnectionstatechange(event)
    } else if (event.type === 'datachannel' && this.ondatachannel) {
      this.ondatachannel(event as RTCDataChannelEvent)
    } else if (event.type === 'track' && this.ontrack) {
      this.ontrack(event as RTCTrackEvent)
    }
    
    return true
  }

  // 模拟连接状态变化
  simulateConnectionStateChange(state: RTCPeerConnectionState) {
    this.connectionState = state
    this.dispatchEvent(new Event('connectionstatechange'))
  }

  // 模拟ICE候选
  simulateIceCandidate(candidate?: RTCIceCandidate) {
    const event = new RTCPeerConnectionIceEvent('icecandidate', { candidate })
    this.dispatchEvent(event)
  }

  // 模拟接收数据通道
  simulateDataChannel(label: string) {
    const channel = new MockRTCDataChannel(label)
    const event = new RTCDataChannelEvent('datachannel', { channel: channel as any })
    this.dispatchEvent(event)
  }

  // 模拟接收媒体轨道
  simulateTrack(track: MediaStreamTrack, streams: MediaStream[]) {
    const event = new RTCTrackEvent('track', {
      track,
      streams,
      receiver: {} as RTCRtpReceiver,
      transceiver: {} as RTCRtpTransceiver
    })
    this.dispatchEvent(event)
  }
}

class MockRTCDataChannel {
  public readyState: RTCDataChannelState = 'connecting'
  public label: string
  public ordered: boolean
  public maxRetransmits: number | null
  public maxPacketLifeTime: number | null
  public protocol: string
  public negotiated: boolean
  public id: number | null = null
  public priority: RTCPriorityType = 'low'
  public bufferedAmount: number = 0
  public bufferedAmountLowThreshold: number = 0

  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: Event) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public onbufferedamountlow: ((event: Event) => void) | null = null

  private listeners: Map<string, Function[]> = new Map()

  constructor(label: string, options?: RTCDataChannelInit) {
    this.label = label
    this.ordered = options?.ordered ?? true
    this.maxRetransmits = options?.maxRetransmits ?? null
    this.maxPacketLifeTime = options?.maxPacketLifeTime ?? null
    this.protocol = options?.protocol ?? ''
    this.negotiated = options?.negotiated ?? false
    this.id = options?.id ?? null
    this.priority = options?.priority ?? 'low'

    // 模拟异步打开
    setTimeout(() => {
      this.readyState = 'open'
      this.dispatchEvent(new Event('open'))
    }, 10)
  }

  send = vi.fn((data: string | ArrayBuffer | Blob | ArrayBufferView) => {
    if (this.readyState !== 'open') {
      throw new Error('DataChannel is not open')
    }
  })

  close = vi.fn(() => {
    this.readyState = 'closing'
    setTimeout(() => {
      this.readyState = 'closed'
      this.dispatchEvent(new Event('close'))
    }, 10)
  })

  addEventListener = vi.fn((type: string, listener: Function) => {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)
  })

  removeEventListener = vi.fn((type: string, listener: Function) => {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  })

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type) || []
    listeners.forEach(listener => listener(event))
    
    // 也调用on*属性
    if (event.type === 'open' && this.onopen) {
      this.onopen(event)
    } else if (event.type === 'close' && this.onclose) {
      this.onclose(event)
    } else if (event.type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent)
    } else if (event.type === 'error' && this.onerror) {
      this.onerror(event)
    }
    
    return true
  }

  // 模拟接收消息
  simulateMessage(data: any) {
    const event = new MessageEvent('message', { data })
    this.dispatchEvent(event)
  }
}

describe('WebRTCManager', () => {
  let webRTCManager: WebRTCManager
  const testConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    signalingConfig: {
      serverUrl: 'ws://localhost:8080',
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      heartbeatInterval: 30000
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock RTCPeerConnection
    vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection)
    vi.stubGlobal('RTCSessionDescription', vi.fn().mockImplementation((init) => init))
    vi.stubGlobal('RTCIceCandidate', vi.fn().mockImplementation((init) => init))
    
    webRTCManager = new WebRTCManager(testConfig)
  })

  afterEach(() => {
    webRTCManager.destroy()
    vi.unstubAllGlobals()
  })

  describe('初始化', () => {
    it('应该使用提供的配置创建实例', () => {
      expect(webRTCManager).toBeInstanceOf(WebRTCManager)
    })

    it('应该能够检查WebRTC支持', () => {
      const isSupported = webRTCManager.isWebRTCSupported()
      expect(typeof isSupported).toBe('boolean')
    })

    it('应该能够获取支持的编解码器', () => {
      const codecs = webRTCManager.getSupportedCodecs()
      expect(Array.isArray(codecs)).toBe(true)
    })
  })

  describe('连接管理', () => {
    it('应该能够连接到信令服务器', async () => {
      await webRTCManager.connect('user123')
      
      expect(webRTCManager.isConnected()).toBe(true)
      expect(webRTCManager.getCurrentUserId()).toBe('user123')
    })

    it('应该能够断开连接', async () => {
      await webRTCManager.connect('user123')
      
      webRTCManager.disconnect()
      
      expect(webRTCManager.isConnected()).toBe(false)
    })

    it('应该能够加入房间', async () => {
      await webRTCManager.connect('user123')
      await webRTCManager.joinRoom('room456')
      
      expect(webRTCManager.getCurrentRoomId()).toBe('room456')
    })

    it('应该能够离开房间', async () => {
      await webRTCManager.connect('user123')
      await webRTCManager.joinRoom('room456')
      await webRTCManager.leaveRoom()
      
      expect(webRTCManager.getCurrentRoomId()).toBeNull()
    })
  })

  describe('对等连接管理', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够创建对等连接', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      
      expect(connection).toBeInstanceOf(MockRTCPeerConnection)
      expect(webRTCManager.getPeerConnection(peerId)).toBe(connection)
    })

    it('应该能够移除对等连接', async () => {
      const peerId = 'peer456'
      await webRTCManager.createPeerConnection(peerId)
      
      webRTCManager.removePeerConnection(peerId)
      
      expect(webRTCManager.getPeerConnection(peerId)).toBeNull()
    })

    it('应该能够获取所有对等连接', async () => {
      await webRTCManager.createPeerConnection('peer1')
      await webRTCManager.createPeerConnection('peer2')
      
      const connections = webRTCManager.getAllPeerConnections()
      
      expect(Object.keys(connections)).toHaveLength(2)
      expect(connections).toHaveProperty('peer1')
      expect(connections).toHaveProperty('peer2')
    })

    it('应该获取对等连接状态', () => {
      const peer = webRTCManager.getPeer(peerId)
      expect(peer).toBeUndefined() // 因为没有创建peer
    })
  })

  describe('媒体流管理', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够启动摄像头', async () => {
      const stream = await webRTCManager.startCamera()
      
      expect(stream).toBeInstanceOf(MediaStream)
    })

    it('应该能够停止摄像头', () => {
      expect(() => {
        webRTCManager.stopCamera()
      }).not.toThrow()
    })

    it('应该能够启动麦克风', async () => {
      const stream = await webRTCManager.startMicrophone()
      
      expect(stream).toBeInstanceOf(MediaStream)
    })

    it('应该能够停止麦克风', () => {
      expect(() => {
        webRTCManager.stopMicrophone()
      }).not.toThrow()
    })

    it('应该能够启动屏幕共享', async () => {
      const stream = await webRTCManager.startScreenShare()
      
      expect(stream).toBeInstanceOf(MediaStream)
    })

    it('应该能够停止屏幕共享', () => {
      expect(() => {
        webRTCManager.stopScreenShare()
      }).not.toThrow()
    })

    it('应该能够添加媒体流到对等连接', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      const stream = await webRTCManager.startCamera()
      
      webRTCManager.addStreamToPeer(peerId, stream)
      
      expect(connection.addTrack).toHaveBeenCalled()
    })

    it('应该能够从对等连接移除媒体流', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      const stream = await webRTCManager.startCamera()
      
      webRTCManager.addStreamToPeer(peerId, stream)
      webRTCManager.removeStreamFromPeer(peerId, stream)
      
      expect(connection.removeTrack).toHaveBeenCalled()
    })
  })

  describe('文件传输', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够发送文件', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const peerId = 'peer456'
      
      const transferId = await webRTCManager.sendFile(peerId, file)
      
      expect(typeof transferId).toBe('string')
    })

    it('应该能够暂停文件传输', () => {
      const transferId = 'transfer123'
      
      expect(() => {
        webRTCManager.pauseFileTransfer(transferId)
      }).not.toThrow()
    })

    it('应该能够恢复文件传输', () => {
      const transferId = 'transfer123'
      
      expect(() => {
        webRTCManager.resumeFileTransfer(transferId)
      }).not.toThrow()
    })

    it('应该能够取消文件传输', () => {
      const transferId = 'transfer123'
      
      expect(() => {
        webRTCManager.cancelFileTransfer(transferId)
      }).not.toThrow()
    })

    it('应该能够获取传输进度', () => {
      const transferId = 'transfer123'
      
      const progress = webRTCManager.getFileTransferProgress(transferId)
      
      expect(progress).toEqual({ progress: 0.5, speed: 1024 })
    })
  })

  describe('信令处理', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够创建并发送offer', async () => {
      const peerId = 'peer456'
      await webRTCManager.createPeerConnection(peerId)
      
      await webRTCManager.createOffer(peerId)
      
      // 验证offer被创建和发送
      const connection = webRTCManager.getPeerConnection(peerId) as MockRTCPeerConnection
      expect(connection.createOffer).toHaveBeenCalled()
      expect(connection.setLocalDescription).toHaveBeenCalled()
    })

    it('应该能够创建并发送answer', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      
      // 模拟接收到offer
      const offer = { type: 'offer' as const, sdp: 'mock-offer-sdp' }
      await webRTCManager.handleOffer(peerId, offer)
      
      expect(connection.setRemoteDescription).toHaveBeenCalled()
      expect(connection.createAnswer).toHaveBeenCalled()
      expect(connection.setLocalDescription).toHaveBeenCalled()
    })

    it('应该能够处理answer', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      
      const answer = { type: 'answer' as const, sdp: 'mock-answer-sdp' }
      await webRTCManager.handleAnswer(peerId, answer)
      
      expect(connection.setRemoteDescription).toHaveBeenCalled()
    })

    it('应该能够处理ICE候选', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      
      const candidate = {
        candidate: 'mock-candidate',
        sdpMLineIndex: 0,
        sdpMid: 'audio'
      }
      
      await webRTCManager.handleIceCandidate(peerId, candidate)
      
      expect(connection.addIceCandidate).toHaveBeenCalled()
    })
  })

  describe('数据通道', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够创建数据通道', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId)
      
      const channel = webRTCManager.createDataChannel(peerId, 'test-channel')
      
      expect(connection.createDataChannel).toHaveBeenCalledWith('test-channel', undefined)
      expect(channel).toBeInstanceOf(MockRTCDataChannel)
    })

    it('应该能够通过数据通道发送消息', async () => {
      const peerId = 'peer456'
      await webRTCManager.createPeerConnection(peerId)
      const channel = webRTCManager.createDataChannel(peerId, 'test-channel')
      
      // 等待通道打开
      await new Promise(resolve => setTimeout(resolve, 20))
      
      const message = { type: 'test', data: 'hello' }
      webRTCManager.sendDataChannelMessage(peerId, 'test-channel', message)
      
      expect(channel.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('应该能够关闭数据通道', async () => {
      const peerId = 'peer456'
      await webRTCManager.createPeerConnection(peerId)
      const channel = webRTCManager.createDataChannel(peerId, 'test-channel')
      
      webRTCManager.closeDataChannel(peerId, 'test-channel')
      
      expect(channel.close).toHaveBeenCalled()
    })
  })

  describe('事件系统', () => {
    it('应该能够添加和移除事件监听器', () => {
      const listener = vi.fn()
      
      webRTCManager.on('peer-connected', listener)
      webRTCManager.off('peer-connected', listener)
      
      // 触发事件
      ;(webRTCManager as any).emit('peer-connected', 'peer456')
      
      expect(listener).not.toHaveBeenCalled()
    })

    it('应该在对等连接状态变化时触发事件', async () => {
      const stateChangeListener = vi.fn()
      webRTCManager.on('connection-state-change', stateChangeListener)
      
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId) as MockRTCPeerConnection
      
      // 模拟连接状态变化
      connection.simulateConnectionStateChange('connected')
      
      expect(stateChangeListener).toHaveBeenCalledWith(
        peerId,
        ConnectionState.CONNECTED,
        ConnectionState.NEW
      )
    })

    it('应该在接收到媒体流时触发事件', async () => {
      const streamListener = vi.fn()
      webRTCManager.on('remote-stream', streamListener)
      
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId) as MockRTCPeerConnection
      
      // 模拟接收媒体轨道
      const mockTrack = { kind: 'video' } as MediaStreamTrack
      const mockStream = new MediaStream([mockTrack])
      connection.simulateTrack(mockTrack, [mockStream])
      
      expect(streamListener).toHaveBeenCalledWith(peerId, mockStream, MediaType.VIDEO)
    })
  })

  describe('统计信息', () => {
    beforeEach(async () => {
      await webRTCManager.connect('user123')
    })

    it('应该能够获取连接统计信息', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId) as MockRTCPeerConnection
      
      // Mock getStats
      connection.getStats = vi.fn().mockResolvedValue(new Map())
      
      const stats = await webRTCManager.getConnectionStats(peerId)
      
      expect(connection.getStats).toHaveBeenCalled()
      expect(stats).toBeInstanceOf(Map)
    })

    it('应该能够获取所有连接的统计信息', async () => {
      await webRTCManager.createPeerConnection('peer1')
      await webRTCManager.createPeerConnection('peer2')
      
      const allStats = await webRTCManager.getAllConnectionStats()
      
      expect(Object.keys(allStats)).toHaveLength(2)
      expect(allStats).toHaveProperty('peer1')
      expect(allStats).toHaveProperty('peer2')
    })
  })

  describe('配置管理', () => {
    it('应该能够更新ICE服务器配置', () => {
      const newIceServers = [{ urls: 'stun:stun.example.com:3478' }]
      
      webRTCManager.updateIceServers(newIceServers)
      
      const config = webRTCManager.getConfiguration()
      expect(config.iceServers).toEqual(newIceServers)
    })

    it('应该能够获取当前配置', () => {
      const config = webRTCManager.getConfiguration()
      
      expect(config).toHaveProperty('iceServers')
      expect(config).toHaveProperty('signalingConfig')
    })
  })

  describe('错误处理', () => {
    it('应该处理对等连接创建错误', async () => {
      // Mock RTCPeerConnection构造函数抛出错误
      vi.stubGlobal('RTCPeerConnection', vi.fn().mockImplementation(() => {
        throw new Error('Failed to create peer connection')
      }))
      
      await expect(webRTCManager.createPeerConnection('peer456')).rejects.toThrow(
        'Failed to create peer connection'
      )
    })

    it('应该处理offer创建错误', async () => {
      const peerId = 'peer456'
      const connection = await webRTCManager.createPeerConnection(peerId) as MockRTCPeerConnection
      
      // Mock createOffer抛出错误
      connection.createOffer.mockRejectedValue(new Error('Failed to create offer'))
      
      await expect(webRTCManager.createOffer(peerId)).rejects.toThrow(
        'Failed to create offer'
      )
    })

    it('应该处理数据通道发送错误', async () => {
      const peerId = 'peer456'
      await webRTCManager.createPeerConnection(peerId)
      const channel = webRTCManager.createDataChannel(peerId, 'test-channel') as MockRTCDataChannel
      
      // Mock send抛出错误
      channel.send.mockImplementation(() => {
        throw new Error('Failed to send message')
      })
      
      // 等待通道打开
      await new Promise(resolve => setTimeout(resolve, 20))
      
      expect(() => {
        webRTCManager.sendDataChannelMessage(peerId, 'test-channel', { test: 'data' })
      }).not.toThrow() // 应该捕获错误而不是抛出
    })
  })

  describe('内存管理', () => {
    it('应该能够正确销毁实例', () => {
      expect(() => {
        webRTCManager.destroy()
      }).not.toThrow()
    })

    it('应该在销毁后清理所有资源', async () => {
      await webRTCManager.connect('user123')
      await webRTCManager.createPeerConnection('peer456')
      
      webRTCManager.destroy()
      
      expect(webRTCManager.isConnected()).toBe(false)
      expect(Object.keys(webRTCManager.getAllPeerConnections())).toHaveLength(0)
    })

    it('应该在销毁时关闭所有对等连接', async () => {
      const connection1 = await webRTCManager.createPeerConnection('peer1') as MockRTCPeerConnection
      const connection2 = await webRTCManager.createPeerConnection('peer2') as MockRTCPeerConnection
      
      webRTCManager.destroy()
      
      expect(connection1.close).toHaveBeenCalled()
      expect(connection2.close).toHaveBeenCalled()
    })
  })

  describe('浏览器兼容性', () => {
    it('应该能够检查WebRTC支持', () => {
      const isSupported = webRTCManager.isWebRTCSupported()
      expect(typeof isSupported).toBe('boolean')
    })

    it('应该能够检查数据通道支持', () => {
      const isSupported = webRTCManager.isDataChannelSupported()
      expect(typeof isSupported).toBe('boolean')
    })

    it('应该能够获取浏览器信息', () => {
      const browserInfo = webRTCManager.getBrowserInfo()
      expect(browserInfo).toHaveProperty('name')
      expect(browserInfo).toHaveProperty('version')
    })
  })
})