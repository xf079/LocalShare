export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  mediaStream?: MediaStream;
}

export interface Message {
  type: 'text' | 'file' | 'system';
  content: string | ArrayBuffer;
  sender: string;
  timestamp: number;
  fileName?: string;
  fileSize?: number;
}

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  sender: string;
  receiver: string;
}

export interface MediaConstraints {
  audio: boolean;
  video: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  mediaConstraints: MediaConstraints;
} 