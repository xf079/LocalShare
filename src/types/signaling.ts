export interface SignalingMessage {
  type: 'join' | 'peer-joined' | 'peer-left' | 'offer' | 'answer' | 'ice-candidate';
  userId?: string;
  peerId?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface SignalingConfig {
  signalingServerUrl: string;
} 