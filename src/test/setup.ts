import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock WebRTC APIs
Object.defineProperty(window, 'RTCPeerConnection', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOffer: vi.fn().mockResolvedValue({}),
    createAnswer: vi.fn().mockResolvedValue({}),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    createDataChannel: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 'open'
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    connectionState: 'connected',
    iceConnectionState: 'connected',
    signalingState: 'stable'
  }))
})

Object.defineProperty(window, 'RTCSessionDescription', {
  writable: true,
  value: vi.fn().mockImplementation((init) => init)
})

Object.defineProperty(window, 'RTCIceCandidate', {
  writable: true,
  value: vi.fn().mockImplementation((init) => init)
})

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    getDisplayMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    enumerateDevices: vi.fn().mockResolvedValue([])
  }
})

// Mock WebSocket
Object.defineProperty(window, 'WebSocket', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  }))
})

// Mock File API
Object.defineProperty(window, 'File', {
  writable: true,
  value: vi.fn().mockImplementation((chunks, filename, options) => ({
    name: filename,
    size: chunks.reduce((acc, chunk) => acc + chunk.length, 0),
    type: options?.type || '',
    lastModified: Date.now(),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    slice: vi.fn().mockReturnValue(new Blob()),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue('')
  }))
})

// Mock FileReader
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    readAsArrayBuffer: vi.fn(),
    readAsText: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    result: null,
    error: null,
    readyState: 0
  }))
})

// Mock crypto.getRandomValues
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})