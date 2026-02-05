// App.jsx
import { useState, useRef } from 'react';
import SoundPlayer from './SoundPlayer';
import memes from './memes';

function App() {
  const [lastClicked, setLastClicked] = useState(null);
  const [activeGifKey, setActiveGifKey] = useState(null);
  const timeoutRef = useRef(null);

  const handleClick = (key, duration) => {
    setLastClicked(key);
    setActiveGifKey(key);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for gif reset
    timeoutRef.current = setTimeout(() => {
      setActiveGifKey(null);
    }, duration || 2000);
  };

  return (
    <>
      <header className="header">
        <h1 className="header-title">MEH-MEH <span className="header-copyright">by Supratim</span></h1>
      </header>
      <div className="gallery">
        {Object.entries(memes).map(([key, meme]) => (
          <SoundPlayer
            key={key}
            memeKey={key}
            clickSound={meme.sound}
            memeImage={meme.image}
            altText={meme.altText}
            gif={meme.gif}
            lastClicked={lastClicked}
            activeGifKey={activeGifKey}
            onMemeClick={handleClick}
            duration={meme.duration}
          />
        ))}
      </div>
    </>
  )
}

export default App;