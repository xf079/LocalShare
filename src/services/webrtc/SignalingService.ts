import type { WebRTCConfig } from '../../types/webrtc';
import type { SignalingMessage } from '../../types/signaling';

export class SignalingService {
  private ws: WebSocket;
  private config: WebRTCConfig;
  private userId: string;
  private onMessageCallback?: (message: SignalingMessage) => void;
  private onPeerJoinedCallback?: (peerId: string) => void;
  private onPeerLeftCallback?: (peerId: string) => void;

  constructor(userId: string, config: WebRTCConfig, signalingServerUrl: string) {
    this.userId = userId;
    this.config = config;
    this.ws = new WebSocket(signalingServerUrl);
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.ws.onopen = () => {
      console.log('信令服务器连接已建立');
      // 发送加入房间的消息
      this.send({
        type: 'join',
        userId: this.userId
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as SignalingMessage;
      this.handleSignalingMessage(message);
    };

    this.ws.onclose = () => {
      console.log('信令服务器连接已关闭');
    };

    this.ws.onerror = (error) => {
      console.error('信令服务器错误:', error);
    };
  }

  private handleSignalingMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'peer-joined':
        if (this.onPeerJoinedCallback && message.peerId) {
          this.onPeerJoinedCallback(message.peerId);
        }
        break;
      case 'peer-left':
        if (this.onPeerLeftCallback && message.peerId) {
          this.onPeerLeftCallback(message.peerId);
        }
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
        break;
      default:
        console.warn('未知的信令消息类型:', message.type);
    }
  }

  // 发送信令消息
  send(message: SignalingMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket 未连接');
    }
  }

  // 设置消息回调
  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  // 设置对等节点加入回调
  onPeerJoined(callback: (peerId: string) => void): void {
    this.onPeerJoinedCallback = callback;
  }

  // 设置对等节点离开回调
  onPeerLeft(callback: (peerId: string) => void): void {
    this.onPeerLeftCallback = callback;
  }

  // 关闭连接
  close(): void {
    this.ws.close();
  }
} 