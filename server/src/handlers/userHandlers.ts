import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterRequest } from '../types';
import { UserService } from '../services/userService';

/**
 * 用户路由处理器类
 * 负责处理用户相关的HTTP请求
 */
export class UserHandlers {
  /** 用户服务实例 */
  private userService: UserService;

  /**
   * 构造函数
   * @param userService - 用户服务实例
   */
  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * 处理用户注册请求
   * @param request - Fastify请求对象
   * @param reply - Fastify响应对象
   */
  async handleRegister(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const user = this.userService.register(request.body);
      reply.code(201).send(user);
    } catch (error) {
      console.error('用户注册失败:', error);
      reply.code(500).send({ error: '用户注册失败' });
    }
  }

  /**
   * 处理获取用户信息请求
   * @param request - Fastify请求对象
   * @param reply - Fastify响应对象
   */
  async handleGetUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const user = this.userService.getUser(request.params.userId);
      if (!user) {
        reply.code(404).send({ error: '用户不存在' });
        return;
      }
      reply.send(user);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      reply.code(500).send({ error: '获取用户信息失败' });
    }
  }

  /**
   * 处理获取所有用户请求
   * @param request - Fastify请求对象
   * @param reply - Fastify响应对象
   */
  async handleGetAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const users = this.userService.getAllUsers();
      reply.send(users);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      reply.code(500).send({ error: '获取用户列表失败' });
    }
  }
}
