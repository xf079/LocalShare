import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="home">
      <h1>WebRTC 聊天室</h1>
      <div className="actions">
        <Link to="/chat" className="button">
          加入聊天室
        </Link>
      </div>
    </div>
  );
}; 