import { FastifyInstance } from 'fastify';
import { UserHandlers } from '../handlers/userHandlers';
import { API_ROUTES } from '../types';

/**
 * 注册用户相关路由
 * @param fastify - Fastify实例
 * @param handlers - 用户路由处理器
 */
export function registerUserRoutes(fastify: FastifyInstance, handlers: UserHandlers): void {
  // 用户注册路由
  fastify.post(API_ROUTES.REGISTER, {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'roomId'],
        properties: {
          username: { type: 'string', minLength: 1 },
          roomId: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: handlers.handleRegister.bind(handlers),
  });

  // 获取用户信息路由
  fastify.get(`${API_ROUTES.REGISTER}/:userId`, {
    schema: {
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: handlers.handleGetUser.bind(handlers),
  });

  // 获取所有用户路由
  fastify.get(API_ROUTES.REGISTER, {
    handler: handlers.handleGetAllUsers.bind(handlers),
  });
}
