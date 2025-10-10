/**
 * Image Preloader Utility
 * 画像プリロードユーティリティ
 */

/**
 * 画像配列をプリロードする
 * @param {string[]} imagePaths - プリロードする画像パスの配列
 * @returns {Promise<Image[]>} - 読み込み完了したImage要素の配列
 */
export function preloadImages(imagePaths) {
  return Promise.all(imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = path;
    });
  }));
}

/**
 * 単一画像をプリロードする
 * @param {string} imagePath - プリロードする画像パス
 * @returns {Promise<Image>} - 読み込み完了したImage要素
 */
export function preloadImage(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imagePath;
  });
}

export default { preloadImages, preloadImage };