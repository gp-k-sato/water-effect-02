
import WaterEffectSliderWithGUI from './modules/WaterEffectSliderWithGUI.js';
// import WaterEffectSlider from './modules/WaterEffectSlider.js';

// 画像プリロード
function preloadImages(imagePaths) {
  return Promise.all(imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = path;
    });
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  const selector = '.js-canvas';
  const container = document.querySelector(selector);
  
  if (!container) return;

  // 初期画像のパス
  const initialImages = [
    './images/forest.webp',
    './images/forest_02.webp',
    './images/forest_03.webp',
  ];

  const texturePath = './images/texture.png';

  preloadImages([...initialImages, texturePath]);

  const waterSlider = new WaterEffectSliderWithGUI(selector, {
    texturePath: texturePath,
    images: initialImages,
    sliderOptions: {
      autoplay: true,
      interval: 5000,
      loop: true
    }
  });
  
  window.waterSlider = waterSlider;
});
