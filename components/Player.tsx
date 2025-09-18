
import React from 'react';

interface PlayerProps {
  src: string;
  title: string;
}

const Player: React.FC<PlayerProps> = ({ src, title }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      <audio controls src={src} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default Player;
