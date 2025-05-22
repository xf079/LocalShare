import { FastifyInstance } from 'fastify';
import { WebSocketHandlers } from '../handlers/wsHandlers';
import { API_ROUTES } from '../config/constants';

export const registerWebSocketRoutes = (
  app: FastifyInstance,
  handlers: WebSocketHandlers
): void => {
  app.get(API_ROUTES.WS, { websocket: true }, handlers.handleConnection.bind(handlers));
};
