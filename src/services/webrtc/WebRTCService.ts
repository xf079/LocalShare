import type { PeerConnection, Message, FileTransfer, WebRTCConfig, MediaConstraints } from '../../types/webrtc';

export class WebRTCService {
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream?: MediaStream;
  private config: WebRTCConfig;
  private userId: string;

  constructor(userId: string, config: WebRTCConfig) {
    this.userId = userId;
    this.config = config;
  }

  // 获取用户 ID
  getUserId(): string {
    return this.userId;
  }

  // 获取对等连接
  getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(peerId)?.connection;
  }

  // 初始化本地媒体流
  async initializeLocalStream(constraints: MediaConstraints): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('获取媒体流失败:', error);
      throw error;
    }
  }

  // 创建对等连接
  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    // 添加本地媒体流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }

    // 创建数据通道
    const dataChannel = connection.createDataChannel('chat', {
      ordered: true
    });

    this.setupDataChannelHandlers(dataChannel, peerId);

    // 设置 ICE 候选处理
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // 发送 ICE 候选到信令服务器
        this.handleIceCandidate(peerId, event.candidate);
      }
    };

    // 处理远程媒体流
    connection.ontrack = (event) => {
      this.handleRemoteStream(peerId, event.streams[0]);
    };

    this.peerConnections.set(peerId, {
      id: peerId,
      connection,
      dataChannel
    });

    return connection;
  }

  // 创建并发送提议
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    const offer = await peerConnection.connection.createOffer();
    await peerConnection.connection.setLocalDescription(offer);
    return offer;
  }

  // 处理接收到的提议
  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.connection.createAnswer();
    await peerConnection.connection.setLocalDescription(answer);
    return answer;
  }

  // 处理接收到的应答
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // 发送消息
  sendMessage(peerId: string, message: Message): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection?.dataChannel || peerConnection.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not available');
    }

    peerConnection.dataChannel.send(JSON.stringify(message));
  }

  // 发送文件
  async sendFile(peerId: string, file: File): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection?.dataChannel || peerConnection.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not available');
    }

    const chunkSize = 16384; // 16KB chunks
    const fileReader = new FileReader();
    let offset = 0;

    fileReader.onload = (e) => {
      const chunk = e.target?.result;
      if (chunk instanceof ArrayBuffer) {
        peerConnection.dataChannel!.send(chunk);
        offset += chunk.byteLength;
        
        if (offset < file.size) {
          // 继续读取下一个块
          readNextChunk();
        }
      }
    };

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      fileReader.readAsArrayBuffer(slice);
    };

    // 发送文件信息
    const fileInfo: Message = {
      type: 'file',
      content: file.name,
      sender: this.userId,
      timestamp: Date.now(),
      fileName: file.name,
      fileSize: file.size
    };

    this.sendMessage(peerId, fileInfo);
    readNextChunk();
  }

  private setupDataChannelHandlers(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`与 ${peerId} 的数据通道已打开`);
    };

    dataChannel.onclose = () => {
      console.log(`与 ${peerId} 的数据通道已关闭`);
    };

    dataChannel.onerror = (error) => {
      console.error(`与 ${peerId} 的数据通道错误:`, error);
    };

    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };
  }

  private handleDataChannelMessage(peerId: string, data: string | ArrayBuffer): void {
    try {
      if (typeof data === 'string') {
        const message = JSON.parse(data);
        // 处理消息
        console.log('收到消息:', message);
      } else if (data instanceof ArrayBuffer) {
        // 处理二进制数据（文件块）
        console.log('收到文件块:', data.byteLength);
      }
    } catch (error) {
      console.error('处理数据通道消息错误:', error);
    }
  }

  private handleIceCandidate(peerId: string, candidate: RTCIceCandidate): void {
    // 实现发送 ICE 候选到信令服务器的逻辑
    console.log('发送 ICE 候选:', candidate);
  }

  private handleRemoteStream(peerId: string, stream: MediaStream): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.mediaStream = stream;
      // 触发远程流事件
      console.log('收到远程流:', stream);
    }
  }

  // 关闭连接
  closeConnection(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.connection.close();
      this.peerConnections.delete(peerId);
    }
  }

  // 关闭所有连接
  closeAllConnections(): void {
    this.peerConnections.forEach((peerConnection) => {
      peerConnection.connection.close();
    });
    this.peerConnections.clear();
  }
} 