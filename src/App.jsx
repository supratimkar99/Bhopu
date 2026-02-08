// App.jsx
import { useState, useRef, useEffect } from 'react';
import SoundPlayer from './SoundPlayer';
import memes from './memes';
import { preloadGifs } from './preloadGifs';
import { trackVisit } from './analytics/trackVisit';

function App() {
  const [lastClicked, setLastClicked] = useState(null);
  const [activeGifKey, setActiveGifKey] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    preloadGifs();
    trackVisit();
  }, []);

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