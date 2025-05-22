import { User, RegisterRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户服务类
 * 负责管理用户注册、查找和删除等操作
 */
export class UserService {
  /** 用户存储映射表 */
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  /**
   * 注册新用户
   * @param request - 用户注册请求，包含用户名和房间ID
   * @returns 注册成功的用户信息
   */
  register(request: RegisterRequest): User {
    const user: User = {
      id: uuidv4(),
      username: request.username,
      roomId: request.roomId,
      ws: null,
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * 根据用户ID查找用户
   * @param userId - 用户ID
   * @returns 用户信息，如果未找到则返回undefined
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * 删除用户
   * @param userId - 要删除的用户ID
   * @returns 是否成功删除
   */
  deleteUser(userId: string): boolean {
    return this.users.delete(userId);
  }

  /**
   * 获取所有用户列表
   * @returns 用户信息数组
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 更新用户WebSocket连接
   * @param userId - 用户ID
   * @param ws - WebSocket连接
   * @returns 是否成功更新
   */
  updateUserWebSocket(userId: string, ws: WebSocket): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.ws = ws;
    this.users.set(userId, user);
    return true;
  }

  /**
   * 更新用户房间ID
   * @param userId - 用户ID
   * @param roomId - 新的房间ID
   * @returns 是否成功更新
   */
  updateUserRoom(userId: string, roomId: string | null): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.roomId = roomId;
    this.users.set(userId, user);
    return true;
  }
}
