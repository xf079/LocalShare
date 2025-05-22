import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebRTCService } from '../services/webrtc/WebRTCService';
import { SignalingService } from '../services/webrtc/SignalingService';
import type { Message, WebRTCConfig } from '../types/webrtc';
import type { SignalingMessage } from '../types/signaling';
import { useChatStore } from '../store/chatStore';
import './ChatRoom.css';

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  mediaConstraints: {
    audio: true,
    video: true
  }
};

export const ChatRoom: React.FC = () => {
  const navigate = useNavigate();
  const {
    messages,
    peers,
    remoteStreams,
    addMessage,
    addPeer,
    removePeer,
    addRemoteStream,
    removeRemoteStream,
    clearMessages,
    clearPeers,
    clearRemoteStreams
  } = useChatStore();
  
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const signalingServiceRef = useRef<SignalingService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    
    // 初始化 WebRTC 服务
    webrtcServiceRef.current = new WebRTCService(userId, defaultConfig);
    
    // 初始化信令服务
    signalingServiceRef.current = new SignalingService(
      userId,
      defaultConfig,
      'ws://localhost:8080' // 替换为实际的信令服务器地址
    );

    // 设置信令服务回调
    signalingServiceRef.current.onMessage(handleSignalingMessage);
    signalingServiceRef.current.onPeerJoined(handlePeerJoined);
    signalingServiceRef.current.onPeerLeft(handlePeerLeft);

    // 初始化本地媒体流
    initializeLocalStream();

    return () => {
      webrtcServiceRef.current?.closeAllConnections();
      signalingServiceRef.current?.close();
      clearMessages();
      clearPeers();
      clearRemoteStreams();
    };
  }, []);

  const initializeLocalStream = async () => {
    try {
      const stream = await webrtcServiceRef.current?.initializeLocalStream(defaultConfig.mediaConstraints);
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('初始化本地媒体流失败:', error);
    }
  };

  const handleSignalingMessage = async (message: SignalingMessage) => {
    if (!webrtcServiceRef.current) return;

    switch (message.type) {
      case 'offer':
        if (message.peerId && message.offer) {
          const answer = await webrtcServiceRef.current.handleOffer(message.peerId, message.offer);
          signalingServiceRef.current?.send({
            type: 'answer',
            peerId: message.peerId,
            answer
          });
        }
        break;
      case 'answer':
        if (message.peerId && message.answer) {
          await webrtcServiceRef.current.handleAnswer(message.peerId, message.answer);
        }
        break;
      case 'ice-candidate':
        if (message.peerId && message.candidate) {
          const peerConnection = webrtcServiceRef.current.getPeerConnection(message.peerId);
          if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
        }
        break;
    }
  };

  const handlePeerJoined = async (peerId: string) => {
    if (!webrtcServiceRef.current) return;

    addPeer(peerId);
    
    // 创建对等连接
    await webrtcServiceRef.current.createPeerConnection(peerId);
    
    // 创建并发送提议
    const offer = await webrtcServiceRef.current.createOffer(peerId);
    signalingServiceRef.current?.send({
      type: 'offer',
      peerId,
      offer
    });
  };

  const handlePeerLeft = (peerId: string) => {
    if (!webrtcServiceRef.current) return;

    webrtcServiceRef.current.closeConnection(peerId);
    removePeer(peerId);
    removeRemoteStream(peerId);
  };

  const sendMessage = (content: string) => {
    if (!webrtcServiceRef.current) return;

    const message: Message = {
      type: 'text',
      content,
      sender: webrtcServiceRef.current.getUserId(),
      timestamp: Date.now()
    };

    peers.forEach(peerId => {
      webrtcServiceRef.current?.sendMessage(peerId, message);
    });

    addMessage(message);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !webrtcServiceRef.current) return;

    peers.forEach(peerId => {
      webrtcServiceRef.current?.sendFile(peerId, file);
    });
  };

  return (
    <div className="chat-room">
      <div className="header">
        <h2>聊天室</h2>
        <button onClick={() => navigate('/')} className="leave-button">
          离开
        </button>
      </div>

      <div className="video-container">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="local-video"
        />
        {Array.from(remoteStreams.entries()).map(([peerId]) => (
          <video
            key={peerId}
            ref={el => {
              if (el) {
                remoteVideosRef.current.set(peerId, el);
              }
            }}
            autoPlay
            playsInline
            className="remote-video"
          />
        ))}
      </div>

      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <span className="sender">{message.sender}</span>
            <span className="content">
              {typeof message.content === 'string' ? message.content : '二进制数据'}
            </span>
          </div>
        ))}
      </div>

      <div className="controls">
        <input
          type="file"
          onChange={handleFileUpload}
          className="file-input"
        />
        <input
          type="text"
          placeholder="输入消息..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="message-input"
        />
      </div>
    </div>
  );
}; 