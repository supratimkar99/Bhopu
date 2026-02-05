import memes from './memes';

export const preloadGifs = () => {
  Object.values(memes).forEach((meme) => {
    if (meme.gif) {
      const img = new Image();
      img.src = meme.gif;
    }
  });
};
