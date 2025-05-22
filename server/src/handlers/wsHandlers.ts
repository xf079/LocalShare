import * as fastifyWebsocket from '@fastify/websocket';
import { FastifyRequest } from 'fastify';
import { UserService } from '../services/userService';
import { SignalingService } from '../services/signalingService';
import { SERVER_CONFIG, WebSocketCloseCode, WS_QUERY_PARAMS } from '../config/constants';
import { Client } from '../types';

export class WebSocketHandlers {
  constructor(
    private userService: UserService,
    private signalingService: SignalingService
  ) {}

  handleConnection: fastifyWebsocket.WebsocketHandler = (ws: any, req: FastifyRequest) => {
    const userId = (req.query as Record<string, string>)[WS_QUERY_PARAMS.USER_ID];
    if (!userId) {
      ws.close(WebSocketCloseCode.MISSING_USER_ID, '缺少用户ID');
      return;
    }

    const user = this.userService.getUser(userId);
    if (!user) {
      ws.close(WebSocketCloseCode.USER_NOT_FOUND, '用户不存在');
      return;
    }

    console.log(`用户 ${user.username} 已连接`);

    const client: Client = {
      id: user.id,
      ws,
      roomId: SERVER_CONFIG.DEFAULT_ROOM_ID,
    };

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        this.signalingService.handleMessage(client, message);
      } catch (error) {
        console.error('处理消息错误:', error);
      }
    });

    ws.on('close', () => {
      // 处理客户端断开连接
      // TODO: 实现断开连接处理
    });
  };
}
