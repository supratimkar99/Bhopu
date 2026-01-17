// import { useState } from 'react'
import './App.css'
import SoundPlayer from './SoundPlayer';
import FAAASound from './assets/faaa.mp3';
import FAAAImage from './assets/images.jpeg';

function App() {

  return (
    <>
      <SoundPlayer
        clickSound={FAAASound}
        memeImage={FAAAImage}
        altText="FAAAAAAAAAAAA"
      />
    </>
  )
}

export default App
