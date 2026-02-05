import { useEffect } from 'react';
import useSound from 'use-sound';

const SoundPlayer = ({
  memeKey,
  clickSound,
  memeImage,
  altText,
  gif,
  lastClicked,
  activeGifKey,
  onMemeClick,
  duration
}) => {
  const [play, { stop }] = useSound(clickSound, { volume: 1.0 });

  const handleClick = () => {
    play();
    onMemeClick(memeKey, duration);
  };

  useEffect(() => {
    if (lastClicked !== memeKey) {
      stop();
    }
  }, [lastClicked, memeKey, stop]);

  return (
    <div className="meme-container">
      <img
        onClick={handleClick}
        src={activeGifKey === memeKey ? gif || memeImage : memeImage}
        alt={altText}
        className="meme-image"
      />
      {gif && <div className="gif-badge">GIF</div>}
    </div>
  );
};

export default SoundPlayer;