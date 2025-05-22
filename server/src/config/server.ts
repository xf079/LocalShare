import fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';

/**
 * 设置Fastify插件
 * @param app - Fastify应用实例
 * @returns Promise<void>
 */
export async function setupPlugins(app: ReturnType<typeof fastify>): Promise<void> {
  // 注册CORS插件
  await app.register(cors, {
    origin: true, // 允许所有来源
    credentials: true, // 允许携带凭证
  });

  // 注册WebSocket插件
  await app.register(websocket, {
    options: {
      // WebSocket配置选项
      clientTracking: true, // 启用客户端跟踪
      perMessageDeflate: {
        // 消息压缩配置
        zlibDeflateOptions: {
          // 压缩级别
          level: 6,
        },
        zlibInflateOptions: {
          // 解压配置
          chunkSize: 1024 * 10, // 10KB
        },
        clientNoContextTakeover: true, // 客户端不保持上下文
        serverNoContextTakeover: true, // 服务器不保持上下文
        serverMaxWindowBits: 10, // 服务器最大窗口位数
        concurrencyLimit: 10, // 并发限制
        threshold: 1024, // 压缩阈值
      },
    },
  });
}
