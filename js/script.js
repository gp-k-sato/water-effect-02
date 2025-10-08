
import WaterEffectSliderWithGUI from './modules/WaterEffectSliderWithGUI.js';
// import WaterEffectSlider from './modules/WaterEffectSlider.js';

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

  const waterSlider = new WaterEffectSliderWithGUI(selector, {
    texturePath: './images/texture.png',
    images: initialImages,
    sliderOptions: {
      autoplay: true,
      interval: 5000,
      loop: true
    }
  });
  
  window.waterSlider = waterSlider;
});
