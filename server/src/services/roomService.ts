import { v4 as uuidv4 } from 'uuid';
import { Room, Client, SignalingMessage } from '../types';
import { MessageType } from '../config/constants';
/**
 * 房间服务类
 * 负责管理房间的创建、删除和客户端连接等操作
 */
export class RoomService {
  /** 房间存储映射表 */
  private rooms: Map<string, Room>;
  private clients: Map<string, Client>;

  constructor() {
    this.rooms = new Map();
    this.clients = new Map();
  }

  /**
   * 创建新房间
   * @param name - 房间名称
   * @returns 创建的房间信息
   */
  createRoom(name: string): Room {
    const room: Room = {
      id: uuidv4(),
      name,
      clients: new Map(),
    };

    this.rooms.set(room.id, room);
    return room;
  }

  /**
   * 根据房间ID查找房间
   * @param roomId - 房间ID
   * @returns 房间信息，如果未找到则返回undefined
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 删除房间
   * @param roomId - 要删除的房间ID
   * @returns 是否成功删除
   */
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * 获取所有房间列表
   * @returns 房间信息数组
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 将客户端添加到房间
   * @param roomId - 房间ID
   * @param client - 要添加的客户端
   * @returns 是否成功添加
   */
  addClientToRoom(roomId: string, client: Client): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.clients.set(client.id, client);
    this.clients.set(client.id, client);
    return true;
  }

  /**
   * 从房间中移除客户端
   * @param roomId - 房间ID
   * @param clientId - 要移除的客户端ID
   * @returns 是否成功移除
   */
  removeClientFromRoom(roomId: string, clientId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.clients.delete(clientId);
    this.clients.delete(clientId);
    return true;
  }

  /**
   * 获取房间内的所有客户端
   * @param roomId - 房间ID
   * @returns 客户端数组，如果房间不存在则返回空数组
   */
  getRoomClients(roomId: string): Client[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.clients.values());
  }

  /**
   * 检查房间是否存在
   * @param roomId - 房间ID
   * @returns 房间是否存在
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * 检查客户端是否在房间中
   * @param roomId - 房间ID
   * @param clientId - 客户端ID
   * @returns 客户端是否在房间中
   */
  hasClientInRoom(roomId: string, clientId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    return room.clients.has(clientId);
  }

  joinRoom(roomId: string, client: Client): void {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        name: 'default',
        clients: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    room.clients.set(client.id, client);
    this.clients.set(client.id, client);

    // 通知房间中的其他用户
    room.clients.forEach(otherClient => {
      if (otherClient.id !== client.id) {
        // 通知新用户加入
        this.sendToClient(otherClient, {
          type: MessageType.JOIN,
          from: client.id,
          to: otherClient.id,
          roomId,
        });

        // 通知新用户现有用户
        this.sendToClient(client, {
          type: MessageType.JOIN,
          from: otherClient.id,
          to: client.id,
          roomId,
        });
      }
    });
  }

  leaveRoom(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (room) {
      room.clients.delete(clientId);
      this.clients.delete(clientId);

      // 通知房间中的其他用户
      room.clients.forEach(otherClient => {
        this.sendToClient(otherClient, {
          type: MessageType.LEAVE,
          from: clientId,
          to: otherClient.id,
          roomId: client.roomId,
        });
      });

      // 如果房间为空，删除房间
      if (room.clients.size === 0) {
        this.rooms.delete(room.id);
      }
    }
  }

  sendToClient(client: Client, message: SignalingMessage): void {
    client.ws.send(JSON.stringify(message));
  }

  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }
}
