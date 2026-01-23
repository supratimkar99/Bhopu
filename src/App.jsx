import SoundPlayer from './SoundPlayer';
import memes from './memes';

function App() {

  return (
    <div className="gallery">
      {Object.entries(memes).map(([key, meme]) => (
        <SoundPlayer
          key={key}
          clickSound={meme.sound}
          memeImage={meme.image}
          altText={meme.altText}
        />
      ))}
    </div>
  )
}

export default App
