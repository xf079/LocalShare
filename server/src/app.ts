import fastify from 'fastify';
import { UserService } from './services/userService';
import { RoomService } from './services/roomService';
import { SignalingService } from './services/signalingService';
import { UserHandlers } from './handlers/userHandlers';
import { WebSocketHandlers } from './handlers/wsHandlers';
import { registerUserRoutes } from './routes/userRoutes';
import { registerWebSocketRoutes } from './routes/wsRoutes';
import { SERVER_CONFIG } from './types';

/**
 * 应用程序类
 * 负责初始化和启动服务器
 */
class App {
  /** Fastify应用实例 */
  private app: ReturnType<typeof fastify>;
  /** 用户服务实例 */
  private userService: UserService;
  /** 房间服务实例 */
  private roomService: RoomService;
  /** 信令服务实例 */
  private signalingService: SignalingService;
  /** 用户路由处理器实例 */
  private userHandlers: UserHandlers;
  /** WebSocket路由处理器实例 */
  private wsHandlers: WebSocketHandlers;

  /**
   * 构造函数
   * 初始化所有服务和处理器
   */
  constructor() {
    this.app = fastify({
      logger: true,
    });

    // 初始化服务
    this.userService = new UserService();
    this.roomService = new RoomService();
    this.signalingService = new SignalingService(this.roomService);

    // 初始化处理器
    this.userHandlers = new UserHandlers(this.userService);
    this.wsHandlers = new WebSocketHandlers(this.userService, this.signalingService);
  }

  /**
   * 启动服务器
   * @returns Promise<void>
   */
  async start(): Promise<void> {
    try {
      // 注册路由
      this.setupRoutes();

      // 启动服务器
      await this.app.listen({ port: SERVER_CONFIG.PORT, host: '0.0.0.0' });
      console.log(`服务器已启动，监听端口 ${SERVER_CONFIG.PORT}`);
    } catch (error) {
      console.error('服务器启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 设置路由
   * 注册所有HTTP和WebSocket路由
   */
  private setupRoutes(): void {
    // 注册用户路由
    registerUserRoutes(this.app, this.userHandlers);

    // 注册WebSocket路由
    registerWebSocketRoutes(this.app, this.wsHandlers);
  }
}

const app = new App();
app.start();
