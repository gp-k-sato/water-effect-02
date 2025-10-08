/**
 * Water Effect Core Class
 * 水エフェクトコアクラス
 */
export default class WaterEffectCore {
  /**
   * @param {string|Element} container - コンテナセレクタまたは要素
   * @param {Object} options - 設定オプション
   */
  constructor(container, options = {}) {
    // コンテナ要素の取得
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!this.container) {
      console.error('Container element not found:', container);
      return;
    }

    // デフォルトのオプションと結合
    this.options = Object.assign({
      displacementStartX: 80,
      displacementStartY: 30,
      displacementEndX: 0,
      displacementEndY: 0,
      alpha: 1,
      duration: 3.0,
      noiseSpeedX: 3.2,
      noiseSpeedY: 0.1,
      spriteScaleX: 2.5,
      spriteScaleY: 1.5,
      texturePath: './images/texture.png',
      defaultImagePath: null
    }, options);
    
    // PIXI関連のプロパティ
    this.app = null;
    this.stage = null;
    this.slidesContainer = null;
    this.displacementSprite = null;
    this.displacementFilter = null;
    this.image = null;          // 現在表示中の画像
    this.nextImage = null;      // 次に表示する画像
    this.currentTimeline = null;
    
    // 初期化
    this._init();
  }
  
  /**
   * 初期化処理
   */
  _init() {
    this._initApp();
    this._initDisplacement();

    if (this.options.defaultImagePath) {
      this.loadImage(this.options.defaultImagePath);
    }
    
    this._boundHandleResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._boundHandleResize);
    
    this._initTicker();
  }
  
  /**
   * PIXI初期化
   */
  _initApp() {
    this.app = new PIXI.Application({
      resizeTo: this.container,
      backgroundAlpha: 0
    });
    this.container.appendChild(this.app.view);
    
    this.stage = this.app.stage;
    this.slidesContainer = new PIXI.Container();
    this.stage.addChild(this.slidesContainer);
  }
  
  /**
   * ディスプレイスメントフィルターの初期化
   */
  _initDisplacement() {
    this.displacementSprite = PIXI.Sprite.from(this.options.texturePath);
    this.displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    this.displacementSprite.scale.x = this.options.spriteScaleX;
    this.displacementSprite.scale.y = this.options.spriteScaleY;

    // PIXI.js v7では DisplacementFilter は直接使用する
    this.displacementFilter = new PIXI.DisplacementFilter(this.displacementSprite);
    this.stage.addChild(this.displacementSprite);
    this.stage.filters = [this.displacementFilter];
  }
  
  /**
   * 画像のロード
   * @param {string} path - 画像のパス
   * @returns {Promise} - 読み込み完了時に解決するPromise
   */
  loadImage(path) {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject(new Error('画像パスが指定されていません'));
        return;
      }

      // 既存の画像があれば削除
      if (this.image && this.slidesContainer && this.slidesContainer.children.includes(this.image)) {
        this.slidesContainer.removeChild(this.image);
      }
      
      // 新しい画像でスプライト作成
      this.image = PIXI.Sprite.from(path);
      this.image.anchor.set(0.5);
      this.image.alpha = 0;
      
      this.slidesContainer.addChild(this.image);
      
      // 画像ロード完了時の処理
      if (this.image.texture.baseTexture.valid) {
        this._fitImageToCanvas();
        resolve(this.image);
      } else {
        this.image.texture.baseTexture.once('loaded', () => {
          this._fitImageToCanvas();
          resolve(this.image);
        });
        
        this.image.texture.baseTexture.once('error', reject);
      }
    });
  }
  
  /**
   * ファイルオブジェクトから画像をロード
   * @param {File} file - ロードするファイル
   * @returns {Promise} - 読み込み完了時に解決するPromise
   */
  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.loadImage(e.target.result)
          .then(() => resolve(this.image))
          .catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * 画像をキャンバスに合わせる
   * @private
   */
  _fitImageToCanvas() {
    if (!this.image) return;
    
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;

    this.image.x = w / 2;
    this.image.y = h / 2;

    const texW = this.image.texture.width;
    const texH = this.image.texture.height;

    if (texW === 0 || texH === 0) return;

    const scale = Math.max(w / texW, h / texH);
    this.image.scale.set(scale);
  }
  
  /**
   * リサイズハンドラー
   * @private
   */
  _handleResize() {
    this._fitImageToCanvas();
  }
  
  /**
   * ticker初期化（アニメーション）
   * @private
   */
  _initTicker() {
    this.app.ticker.add(() => {
      if (this.displacementSprite) {
        this.displacementSprite.x += this.options.noiseSpeedX;
        this.displacementSprite.y += this.options.noiseSpeedY;
      }
    });
  }
  
  /**
   * フェードイン用のエフェクト実行
   * @param {Object} params - オプションでアニメーションパラメータを上書き
   * @returns {Object} - GSAPのタイムラインオブジェクト
   */
  runEffect(params = {}) {
    // 進行中のアニメーションがあれば強制停止
    if (this.currentTimeline) {
      this.currentTimeline.kill();
    }
    
    // パラメータをマージ
    const animParams = Object.assign({}, this.options, params);
    
    // 初期状態にリセット
    if (this.image) this.image.alpha = 0;
    this.displacementFilter.scale.x = animParams.displacementStartX;
    this.displacementFilter.scale.y = animParams.displacementStartY;

    // アニメーションスタート
    this.currentTimeline = gsap.timeline({ delay: 0.3 })
      .to(this.displacementFilter.scale, {
        x: animParams.displacementStartX,
        y: animParams.displacementStartY,
        duration: 0
      })
      .to(this.image, {
        alpha: animParams.alpha,
        duration: animParams.duration * 0.7
      }, 0)
      .to(this.displacementFilter.scale, {
        x: animParams.displacementEndX,
        y: animParams.displacementEndY,
        duration: animParams.duration,
        ease: 'circ.out'
      }, 0);
      
    return this.currentTimeline;
  }
  
  /**
   * 2つの画像間の遷移エフェクトを実行（フェードアウト＋フェードイン）
   * @param {string} nextImagePath - 次の画像のパス
   * @param {Object} params - オプションでアニメーションパラメータを上書き
   * @returns {Promise} - アニメーション完了時に解決するPromise
   */
  runTransitionEffect(nextImagePath, params = {}) {
    return new Promise((resolve, reject) => {
      // 進行中のアニメーションがあれば強制停止
      if (this.currentTimeline) {
        this.currentTimeline.kill();
      }
      
      // パラメータをマージ
      const animParams = Object.assign({}, this.options, params);
      
      // タイムライン作成
      const timeline = gsap.timeline();
      
      // 現在の画像がない場合は次の画像を直接表示
      if (!this.image || this.image.alpha === 0) {
        this.loadImage(nextImagePath).then(() => {
          const fadeInTimeline = this.runEffect(animParams);
          fadeInTimeline.eventCallback('onComplete', () => resolve());
        }).catch(reject);
        return;
      }
      
      // フェードアウトのエフェクト
      this.displacementFilter.scale.x = 0;
      this.displacementFilter.scale.y = 0;
      
      // フェードアウトアニメーション
      timeline.to(this.displacementFilter.scale, {
        x: animParams.displacementStartX * 1.2, // フェードアウト時は少し強めのエフェクト
        y: animParams.displacementStartY * 1.2,
        duration: animParams.duration * 0.5,
        ease: 'power2.in'
      }, 0);
      
      timeline.to(this.image, {
        alpha: 0,
        duration: animParams.duration * 0.5,
        ease: 'power2.in',
        onComplete: () => {
          // 次の画像を読み込み
          this.loadImage(nextImagePath).then(() => {
            // フェードインエフェクト
            const fadeInTimeline = this.runEffect(animParams);
            fadeInTimeline.eventCallback('onComplete', () => resolve());
          }).catch(reject);
        }
      }, 0);
      
      this.currentTimeline = timeline;
    });
  }
  
  /**
   * オプションを設定
   * @param {Object} options - 新しいオプション
   */
  setOptions(options) {
    this.options = Object.assign(this.options, options);
    
    // スケール設定を即時反映
    if (options.spriteScaleX !== undefined && this.displacementSprite) {
      this.displacementSprite.scale.x = options.spriteScaleX;
    }
    if (options.spriteScaleY !== undefined && this.displacementSprite) {
      this.displacementSprite.scale.y = options.spriteScaleY;
    }
  }
  
  /**
   * リソース解放
   */
  destroy() {
    // GSAPのタイムラインを停止
    if (this.currentTimeline) {
      this.currentTimeline.kill();
      this.currentTimeline = null;
    }
    
    // イベントリスナーを削除
    if (this._boundHandleResize) {
      window.removeEventListener('resize', this._boundHandleResize);
    }
    
    // 画像のBlobURLを解放
    if (this.image?.texture?.baseTexture?.resource?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(this.image.texture.baseTexture.resource.url);
    }
    
    // PIXIアプリケーション破棄
    if (this.app) {
      this.app.destroy(true, {children: true, texture: true, baseTexture: true});
      this.app = null;
    }
    
    // 参照を解除
    this.stage = null;
    this.slidesContainer = null;
    this.displacementSprite = null;
    this.displacementFilter = null;
    this.image = null;
  }
}