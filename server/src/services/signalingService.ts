import { SignalingMessage, Client } from '../types';
import { MessageType } from '../config/constants';
import { RoomService } from './roomService';
import { SERVER_CONFIG } from '../config/constants';

/**
 * 信令服务类
 * 负责处理WebRTC信令消息的转发和管理
 */
export class SignalingService {
  private roomService: RoomService;

  constructor(roomService: RoomService) {
    this.roomService = roomService;
  }

  handleMessage(client: Client, message: SignalingMessage): void {
    switch (message.type) {
      case MessageType.JOIN:
        this.handleJoin(client);
        break;
      case MessageType.SIGNAL:
        this.handleWebRTCMessage(message);
        break;
      default:
        console.warn('未知的消息类型:', message.type);
    }
  }

  private handleJoin(client: Client): void {
    this.roomService.joinRoom(SERVER_CONFIG.DEFAULT_ROOM_ID, client);
  }

  private handleWebRTCMessage(message: SignalingMessage): void {
    if (!message.to) {
      console.error('WebRTC 消息缺少对等节点ID');
      return;
    }

    const targetClient = this.roomService.getClient(message.to);
    if (targetClient) {
      this.roomService.sendToClient(targetClient, message);
    }
  }

  /**
   * 处理信令消息
   * @param message - 信令消息
   * @param clients - 客户端映射表
   * @returns 是否成功处理消息
   */
  handleSignalingMessage(message: SignalingMessage, clients: Map<string, Client>): boolean {
    const targetClient = clients.get(message.to);
    if (!targetClient) return false;

    try {
      targetClient.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('发送信令消息失败:', error);
      return false;
    }
  }

  /**
   * 广播消息给房间内的所有客户端
   * @param roomId - 房间ID
   * @param message - 要广播的消息
   * @param clients - 客户端映射表
   * @param excludeClientId - 要排除的客户端ID（可选）
   */
  broadcastToRoom(
    roomId: string,
    message: SignalingMessage,
    clients: Map<string, Client>,
    excludeClientId?: string
  ): void {
    clients.forEach(client => {
      if (client.roomId === roomId && client.id !== excludeClientId) {
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`向客户端 ${client.id} 广播消息失败:`, error);
        }
      }
    });
  }

  /**
   * 创建错误消息
   * @param from - 发送者ID
   * @param to - 接收者ID
   * @param roomId - 房间ID
   * @returns 错误消息对象
   */
  createErrorMessage(from: string, to: string, roomId: string): SignalingMessage {
    return {
      type: MessageType.ERROR,
      from,
      to,
      roomId,
    };
  }

  /**
   * 创建加入房间消息
   * @param from - 发送者ID
   * @param to - 接收者ID
   * @param roomId - 房间ID
   * @returns 加入房间消息对象
   */
  createJoinMessage(from: string, to: string, roomId: string): SignalingMessage {
    return {
      type: MessageType.JOIN,
      from,
      to,
      roomId,
    };
  }

  /**
   * 创建离开房间消息
   * @param from - 发送者ID
   * @param to - 接收者ID
   * @param roomId - 房间ID
   * @returns 离开房间消息对象
   */
  createLeaveMessage(from: string, to: string, roomId: string): SignalingMessage {
    return {
      type: MessageType.LEAVE,
      from,
      to,
      roomId,
    };
  }
}
