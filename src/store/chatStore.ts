import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  peers: string[];
  remoteStreams: Map<string, MediaStream>;
  addMessage: (message: Message) => void;
  addPeer: (peerId: string) => void;
  removePeer: (peerId: string) => void;
  addRemoteStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteStream: (peerId: string) => void;
  clearMessages: () => void;
  clearPeers: () => void;
  clearRemoteStreams: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  peers: [],
  remoteStreams: new Map(),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addPeer: (peerId) =>
    set((state) => ({
      peers: [...state.peers, peerId],
    })),

  removePeer: (peerId) =>
    set((state) => ({
      peers: state.peers.filter((id) => id !== peerId),
    })),

  addRemoteStream: (peerId, stream) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.set(peerId, stream);
      return { remoteStreams: newStreams };
    }),

  removeRemoteStream: (peerId) =>
    set((state) => {
      const newStreams = new Map(state.remoteStreams);
      newStreams.delete(peerId);
      return { remoteStreams: newStreams };
    }),

  clearMessages: () => set({ messages: [] }),
  clearPeers: () => set({ peers: [] }),
  clearRemoteStreams: () => set({ remoteStreams: new Map() }),
})); 