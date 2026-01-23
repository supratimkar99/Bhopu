import FAAASound from './assets/faaa.mp3';
import FAAAImage from './assets/faaa.jpeg';
import AAYEINSound from './assets/aayein.mp3';
import AAYEINImage from './assets/aayein.jpg';
import HUHSound from './assets/huh.mp3';
import HUHImage from './assets/huh.jpg';
import LaughSound from './assets/laugh.mp3';
import LaughImage from './assets/laugh.jpg';

const memes = {
  faaa: {
    image: FAAAImage,
    sound: FAAASound,
    altText: "FAAAAAAAAAAAA"
  },
  aayein: {
    image: AAYEINImage,
    sound: AAYEINSound,
    altText: "Aayein"
  },
  huh: {
    image: HUHImage,
    sound: HUHSound,
    altText: "Huh"
  },
  laugh: {
    image: LaughImage,
    sound: LaughSound,
    altText: "Laugh"
  }
};

export default memes;