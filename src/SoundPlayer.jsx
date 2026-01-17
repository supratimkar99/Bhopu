import React from 'react';
import useSound from 'use-sound';

const SoundPlayer = ({
    clickSound,
    memeImage,
    altText,
}) => {
    const [play] = useSound(clickSound, { volume: 1.0 });

  return (
    <img onClick={play} src={memeImage} alt={altText} style={{ cursor: 'pointer' }} />
  );
}

export default SoundPlayer;