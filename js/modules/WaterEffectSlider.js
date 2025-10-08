/**
 * Water Effect Slider Class
 * 水エフェクトスライダー
 */
import WaterEffectCore from './WaterEffectCore.js';

export default class WaterEffectSlider extends WaterEffectCore {
  /**
   * @param {string|Element} container - コンテナセレクタまたは要素
   * @param {Object} options - 設定オプション
   */
  constructor(container, options = {}) {
    // 画像配列を取得
    const images = options.images || [];
    
    // 親クラスのコンストラクタを呼び出し
    super(container, Object.assign({}, options, {
      defaultImagePath: images.length > 0 ? images[0] : null
    }));
    
    // スライダー固有のオプション
    this.options.sliderOptions = Object.assign({
      images: [],
      autoplay: false,
      interval: 5000,
      loop: true
    }, options.sliderOptions || {});
    
    // スライダーの状態
    this.currentIndex = -1; // 最初は-1に設定して、初回のshowSlide(0)が確実に実行されるようにする
    this.images = images;
    this.totalSlides = this.images.length;
    this.isAnimating = false;
    this.autoplayTimer = null;
    
    // スライダー初期化
    if (this.totalSlides > 0) {
      this._initSlider();
    }
  }
  
  /**
   * スライダーの初期化
   * @private
   */
  _initSlider() {
    // 現在のインデックスを-1にリセットして、確実に最初のスライドが表示されるようにする
    this.currentIndex = -1;
    
    // 初期スライドを表示
    this.showSlide(0);
    
    // 自動再生設定（スライドが表示された後に自動再生を開始する）
    if (this.options.sliderOptions.autoplay) {
      this.startAutoplay();
    }
  }
  
  /**
   * 特定のスライドを表示
   * @param {number} index - スライドのインデックス
   * @public
   */
  showSlide(index) {
    if (this.totalSlides === 0) {
      return;
    }
    
    // アニメーション中は新しいスライド表示をキューに入れる
    if (this.isAnimating) {
      setTimeout(() => this.showSlide(index), 100);
      return;
    }
    
    // ループ設定を考慮したインデックスの調整
    if (index < 0) {
      index = this.options.sliderOptions.loop ? this.totalSlides - 1 : 0;
    } else if (index >= this.totalSlides) {
      index = this.options.sliderOptions.loop ? 0 : this.totalSlides - 1;
    }
    
    if (index === this.currentIndex) return;
    
    this.isAnimating = true;
    
    // 前のインデックスを保存
    const prevIndex = this.currentIndex;
    this.currentIndex = index;
    
    // 画像URLを取得
    const imagePath = this.images[index];
    
    if (!imagePath) {
      console.error('Image not found at index:', index);
      this.isAnimating = false;
      return;
    }
    
    // スライド遷移のトランジションエフェクトを実行（フェードアウト+フェードイン）
    const fadeOutIntensity = this.options.fadeOutIntensity || 1.2; // デフォルト1.2倍
    const transitionSpeed = this.options.transitionSpeed || 0.8;   // デフォルト0.8倍
    
    try {
      this.runTransitionEffect(imagePath, {
        // ここでエフェクトパラメータをカスタマイズ
        displacementStartX: this.options.displacementStartX * fadeOutIntensity,
        displacementStartY: this.options.displacementStartY * fadeOutIntensity,
        displacementEndX: this.options.displacementEndX,
        displacementEndY: this.options.displacementEndY,
        duration: this.options.duration * transitionSpeed,
        alpha: this.options.alpha
      }).then(() => {
        // アニメーション完了後の処理
        this.isAnimating = false;
      }).catch(error => {
        console.error('スライド遷移エフェクトに失敗しました:', error);
        this.isAnimating = false;
        
        // エラー時はフォールバックとして単純に画像を読み込み
        this.loadImage(imagePath).then(() => {
          const timeline = this.runEffect();
          if (timeline) {
            timeline.eventCallback('onComplete', () => {
              this.isAnimating = false;
            });
          } else {
            this.isAnimating = false;
          }
        }).catch((loadError) => {
          console.error('画像読み込みにも失敗しました:', loadError);
          this.isAnimating = false;
        });
      });
    } catch (e) {
      console.error('スライド遷移の開始に失敗しました:', e);
      this.isAnimating = false;
    }
  }
  
  /**
   * 次のスライドを表示
   * @public
   */
  nextSlide() {
    if (this.isAnimating) return;
    this.showSlide(this.currentIndex + 1);
  }
  
  /**
   * 前のスライドを表示
   * @public
   */
  prevSlide() {
    if (this.isAnimating) return;
    this.showSlide(this.currentIndex - 1);
  }
  
  /**
   * 自動再生を開始
   * @public
   */
  startAutoplay() {
    // 既存のタイマーがあれば停止
    this.stopAutoplay();
    
    // 画像が1枚以上あることを確認
    if (this.totalSlides <= 1) {
      return;
    }
    
    // 新しいタイマーをセット
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.options.sliderOptions.interval);
    
    // 自動再生フラグを設定
    this.options.sliderOptions.autoplay = true;
  }
  
  /**
   * 自動再生を停止
   * @public
   */
  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
      
      // 自動再生フラグを更新
      this.options.sliderOptions.autoplay = false;
    }
  }
  
  /**
   * 画像配列を設定
   * @param {string[]} images - 画像パスの配列
   * @public
   */
  setImages(images) {
    this.images = images || [];
    this.totalSlides = this.images.length;
    
    // 自動再生中の場合は一旦停止
    const wasAutoPlaying = !!this.autoplayTimer;
    if (wasAutoPlaying) {
      this.stopAutoplay();
    }
    
    // インデックスをリセットして最初のスライドを表示
    // インデックスを-1に設定して、確実に最初のスライドが表示されるようにする
    this.currentIndex = -1;
    if (this.totalSlides > 0) {
      this.showSlide(0);
      
      // 自動再生を再開
      if (wasAutoPlaying || this.options.sliderOptions.autoplay) {
        this.startAutoplay();
      }
    }
  }
  
  /**
   * リソース解放（オーバーライド）
   * @public
   */
  destroy() {
    // 自動再生を停止
    this.stopAutoplay();
    
    // 親クラスのdestroyを呼び出し
    super.destroy();
  }
}