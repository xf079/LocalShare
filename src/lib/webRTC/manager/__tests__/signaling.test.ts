import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SignalingManager } from '../signaling'
import { SignalingState } from '../../typings'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  public readyState = MockWebSocket.CONNECTING
  public url: string
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null

  private listeners: Map<string, Function[]> = new Map()

  constructor(url: string) {
    this.url = url
    // 模拟异步连接
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.dispatchEvent(new Event('open'))
    }, 10)
  }

  send = vi.fn((data: string) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  })

  close = vi.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSING
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      this.dispatchEvent(new CloseEvent('close', { code: code || 1000, reason: reason || '' }))
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
      this.onclose(event as CloseEvent)
    } else if (event.type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent)
    } else if (event.type === 'error' && this.onerror) {
      this.onerror(event)
    }
    
    return true
  }

  // 模拟接收消息
  simulateMessage(data: any) {
    const event = new MessageEvent('message', {
      data: typeof data === 'string' ? data : JSON.stringify(data)
    })
    this.dispatchEvent(event)
  }

  // 模拟连接错误
  simulateError() {
    this.dispatchEvent(new Event('error'))
  }
}

describe('SignalingManager', () => {
  let signalingManager: SignalingManager
  let mockWebSocket: MockWebSocket
  const testConfig = {
    serverUrl: 'ws://localhost:8080',
    reconnectAttempts: 3,
    reconnectDelay: 1000,
    heartbeatInterval: 30000
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock WebSocket constructor
    vi.stubGlobal('WebSocket', vi.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url)
      return mockWebSocket
    }))
    
    signalingManager = new SignalingManager(testConfig)
  })

  afterEach(() => {
    signalingManager.disconnect()
    vi.unstubAllGlobals()
  })

  describe('初始化', () => {
    it('应该使用提供的配置创建实例', () => {
      expect(signalingManager).toBeInstanceOf(SignalingManager)
      expect(signalingManager.getState()).toBe(SignalingState.DISCONNECTED)
    })

    it('应该能够检查WebSocket支持', () => {
      const isSupported = signalingManager.isWebSocketSupported()
      expect(typeof isSupported).toBe('boolean')
    })
  })

  describe('连接管理', () => {
    it('应该能够连接到信令服务器', async () => {
      const connectPromise = signalingManager.connect('user123')
      
      // 等待连接完成
      await connectPromise
      
      expect(signalingManager.getState()).toBe(SignalingState.CONNECTED)
      expect(signalingManager.getCurrentUserId()).toBe('user123')
    })

    it('应该能够断开连接', async () => {
      await signalingManager.connect('user123')
      
      signalingManager.disconnect()
      
      expect(signalingManager.getState()).toBe(SignalingState.DISCONNECTED)
    })

    it('应该在连接失败时抛出错误', async () => {
      // 模拟WebSocket构造函数抛出错误
      vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => {
        throw new Error('Connection failed')
      }))
      
      await expect(signalingManager.connect('user123')).rejects.toThrow('Connection failed')
    })

    it('应该在重复连接时返回现有连接', async () => {
      await signalingManager.connect('user123')
      
      // 尝试再次连接
      const secondConnect = signalingManager.connect('user123')
      await expect(secondConnect).resolves.toBeUndefined()
    })
  })

  describe('房间管理', () => {
    beforeEach(async () => {
      await signalingManager.connect('user123')
    })

    it('应该能够加入房间', async () => {
      const joinPromise = signalingManager.joinRoom('room456')
      
      // 模拟服务器响应
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'room-joined',
          roomId: 'room456',
          userId: 'user123'
        })
      }, 10)
      
      await joinPromise
      
      expect(signalingManager.getCurrentRoomId()).toBe('room456')
    })

    it('应该能够离开房间', async () => {
      // 先加入房间
      const joinPromise = signalingManager.joinRoom('room456')
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'room-joined',
          roomId: 'room456',
          userId: 'user123'
        })
      }, 10)
      await joinPromise
      
      // 然后离开房间
      const leavePromise = signalingManager.leaveRoom()
      setTimeout(() => {
        mockWebSocket.simulateMessage({
          type: 'room-left',
          roomId: 'room456',
          userId: 'user123'
        })
      }, 10)
      await leavePromise
      
      expect(signalingManager.getCurrentRoomId()).toBeNull()
    })

    it('应该在未连接时拒绝加入房间', async () => {
      signalingManager.disconnect()
      
      await expect(signalingManager.joinRoom('room456')).rejects.toThrow(
        '信令服务器未连接'
      )
    })
  })

  describe('消息发送', () => {
    beforeEach(async () => {
      await signalingManager.connect('user123')
    })

    it('应该能够发送offer消息', () => {
      const offer = {
        type: 'offer' as const,
        sdp: 'mock-offer-sdp'
      }
      
      const result = signalingManager.sendOffer('peer456', offer)
      expect(result).toBe(true)
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'offer',
          targetId: 'peer456',
          offer
        })
      )
    })

    it('应该能够发送answer消息', () => {
      const answer = {
        type: 'answer' as const,
        sdp: 'mock-answer-sdp'
      }
      
      const result = signalingManager.sendAnswer('peer456', answer)
      expect(result).toBe(true)
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'answer',
          targetId: 'peer456',
          answer
        })
      )
    })

    it('应该能够发送ICE候选', () => {
      const candidate = {
        candidate: 'mock-candidate',
        sdpMLineIndex: 0,
        sdpMid: 'audio'
      }
      
      const result = signalingManager.sendIceCandidate('peer456', candidate)
      expect(result).toBe(true)
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'ice-candidate',
          targetId: 'peer456',
          candidate
        })
      )
    })

    it('应该能够发送自定义消息', () => {
      const customMessage = {
        type: 'custom-message',
        data: { test: 'data' }
      }
      
      const result = signalingManager.sendMessage(customMessage)
      expect(result).toBe(true)
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify(customMessage)
      )
    })

    it('应该在未连接时拒绝发送消息', () => {
      signalingManager.disconnect()
      
      const result = signalingManager.sendMessage({ type: 'test' })
      expect(result).toBe(false)
    })
  })

  describe('消息接收', () => {
    beforeEach(async () => {
      await signalingManager.connect('user123')
    })

    it('应该能够处理offer消息', () => {
      const offerListener = vi.fn()
      signalingManager.on('offer', offerListener)
      
      const offerMessage = {
        type: 'offer',
        fromId: 'peer456',
        offer: {
          type: 'offer',
          sdp: 'mock-offer-sdp'
        }
      }
      
      mockWebSocket.simulateMessage(offerMessage)
      
      expect(offerListener).toHaveBeenCalledWith(
        'peer456',
        offerMessage.offer
      )
    })

    it('应该能够处理answer消息', () => {
      const answerListener = vi.fn()
      signalingManager.on('answer', answerListener)
      
      const answerMessage = {
        type: 'answer',
        fromId: 'peer456',
        answer: {
          type: 'answer',
          sdp: 'mock-answer-sdp'
        }
      }
      
      mockWebSocket.simulateMessage(answerMessage)
      
      expect(answerListener).toHaveBeenCalledWith(
        'peer456',
        answerMessage.answer
      )
    })

    it('应该能够处理ICE候选消息', () => {
      const candidateListener = vi.fn()
      signalingManager.on('ice-candidate', candidateListener)
      
      const candidateMessage = {
        type: 'ice-candidate',
        fromId: 'peer456',
        candidate: {
          candidate: 'mock-candidate',
          sdpMLineIndex: 0,
          sdpMid: 'audio'
        }
      }
      
      mockWebSocket.simulateMessage(candidateMessage)
      
      expect(candidateListener).toHaveBeenCalledWith(
        'peer456',
        candidateMessage.candidate
      )
    })

    it('应该能够处理peer-joined消息', () => {
      const peerJoinedListener = vi.fn()
      signalingManager.on('peer-joined', peerJoinedListener)
      
      const peerJoinedMessage = {
        type: 'peer-joined',
        peerId: 'peer456',
        roomId: 'room123'
      }
      
      mockWebSocket.simulateMessage(peerJoinedMessage)
      
      expect(peerJoinedListener).toHaveBeenCalledWith('peer456', 'room123')
    })

    it('应该能够处理peer-left消息', () => {
      const peerLeftListener = vi.fn()
      signalingManager.on('peer-left', peerLeftListener)
      
      const peerLeftMessage = {
        type: 'peer-left',
        peerId: 'peer456',
        roomId: 'room123'
      }
      
      mockWebSocket.simulateMessage(peerLeftMessage)
      
      expect(peerLeftListener).toHaveBeenCalledWith('peer456', 'room123')
    })

    it('应该能够处理无效JSON消息', () => {
      const errorListener = vi.fn()
      signalingManager.on('error', errorListener)
      
      mockWebSocket.simulateMessage('invalid json')
      
      expect(errorListener).toHaveBeenCalled()
    })
  })

  describe('事件系统', () => {
    it('应该能够添加和移除事件监听器', () => {
      const listener = vi.fn()
      
      signalingManager.on('message', listener)
      signalingManager.off('message', listener)
      
      // 触发事件
      ;(signalingManager as any).emit('message', {})
      
      expect(listener).not.toHaveBeenCalled()
    })

    it('应该在状态变化时触发事件', async () => {
      const stateChangeListener = vi.fn()
      signalingManager.on('state-change', stateChangeListener)
      
      await signalingManager.connect('user123')
      
      expect(stateChangeListener).toHaveBeenCalledWith(
        SignalingState.CONNECTED,
        SignalingState.DISCONNECTED
      )
    })
  })

  describe('重连机制', () => {
    it('应该在连接断开时自动重连', async () => {
      await signalingManager.connect('user123')
      
      // 模拟连接断开
      mockWebSocket.simulateError()
      
      // 等待重连尝试
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 验证重连尝试
      expect(WebSocket).toHaveBeenCalledTimes(2) // 初始连接 + 重连
    })

    it('应该在达到最大重连次数后停止重连', async () => {
      const manager = new SignalingManager({
        ...testConfig,
        reconnectAttempts: 1
      })
      
      await manager.connect('user123')
      
      // 模拟多次连接失败
      for (let i = 0; i < 3; i++) {
        mockWebSocket.simulateError()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // 验证不会超过最大重连次数
      expect(WebSocket).toHaveBeenCalledTimes(2) // 初始连接 + 1次重连
    })
  })

  describe('心跳机制', () => {
    it('应该定期发送心跳消息', async () => {
      const manager = new SignalingManager({
        ...testConfig,
        heartbeatInterval: 100 // 100ms心跳间隔
      })
      
      await manager.connect('user123')
      
      // 等待心跳发送
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      )
    })
  })

  describe('状态管理', () => {
    it('应该获取当前状态', () => {
      const state = signalingManager.getState()
      expect(state).toBe(SignalingState.DISCONNECTED)
    })

    it('应该正确返回当前用户ID', async () => {
      expect(signalingManager.getCurrentUserId()).toBeNull()
      
      await signalingManager.connect('user123')
      expect(signalingManager.getCurrentUserId()).toBe('user123')
    })

    it('应该正确返回当前房间ID', () => {
      expect(signalingManager.getCurrentRoomId()).toBeNull()
    })

    it('应该正确检查连接状态', async () => {
      expect(signalingManager.isConnected()).toBe(false)
      
      await signalingManager.connect('user123')
      expect(signalingManager.isConnected()).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理WebSocket连接错误', async () => {
      const errorListener = vi.fn()
      signalingManager.on('error', errorListener)
      
      await signalingManager.connect('user123')
      
      // 模拟WebSocket错误
      mockWebSocket.simulateError()
      
      expect(errorListener).toHaveBeenCalled()
    })

    it('应该处理消息发送错误', async () => {
      await signalingManager.connect('user123')
      
      // 模拟发送失败
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed')
      })
      
      const result = signalingManager.sendMessage({ type: 'test' })
      expect(result).toBe(false)
    })

    it('应该处理无效的消息格式', () => {
      const errorListener = vi.fn()
      signalingManager.on('error', errorListener)
      
      // 模拟接收无效消息
      mockWebSocket.simulateMessage({ invalidMessage: true })
      
      // 不应该抛出错误，但可能触发错误事件
      expect(() => {
        mockWebSocket.simulateMessage({ invalidMessage: true })
      }).not.toThrow()
    })
  })

  describe('内存管理', () => {
    it('应该能够正确销毁实例', () => {
      expect(() => {
        signalingManager.destroy()
      }).not.toThrow()
    })

    it('应该在销毁后清理所有资源', () => {
      signalingManager.destroy()
      
      expect(signalingManager.getState()).toBe(SignalingState.DISCONNECTED)
      expect(signalingManager.getCurrentUserId()).toBeNull()
      expect(signalingManager.getCurrentRoomId()).toBeNull()
    })
  })
})