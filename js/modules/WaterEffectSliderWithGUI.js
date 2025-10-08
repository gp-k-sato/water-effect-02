/**
 * Water Effect Slider With GUI Class
 * GUIを含む水エフェクトスライダークラス
 */
import WaterEffectSlider from './WaterEffectSlider.js';

export default class WaterEffectSliderWithGUI extends WaterEffectSlider {
  /**
   * @param {string|Element} container - コンテナセレクタまたは要素
   * @param {Object} options - 設定オプション
   */
  constructor(container, options = {}) {
    super(container, options);
    
    // GUI関連のプロパティ
    this.gui = null;
    this.params = null;
    this.fileInput = null;
    this.imageList = this.images.slice(); // 画像リストをコピー
    
    this._initFileInput();
    this._initGUI();
    this._initKeyboardEventsForGUI();
  }
  
  /**
   * ファイル入力要素の初期化
   * @private
   */
  _initFileInput() {
    // 既存の要素があれば使用
    this.fileInput = document.getElementById('image-upload');
    
    // なければ作成
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.id = 'image-upload';
      this.fileInput.accept = 'image/*';
      this.fileInput.style.display = 'none';
      document.body.appendChild(this.fileInput);
    }
    
    // イベントリスナーを設定
    this.fileInput.addEventListener('change', this._handleImageUpload.bind(this));
  }
  
  /**
   * 画像アップロードハンドラー
   * @param {Event} event - イベントオブジェクト
   * @private
   */
  _handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      // 画像形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルをアップロードしてください');
        return;
      }
      
      // 画像URLを作成
      const imagePath = URL.createObjectURL(file);
      
      // 画像の読み込みテスト
      const image = new Image();
      image.onload = () => {
        // 画像リストに追加
        this.imageList.push(imagePath);
        
        // GUIの画像リストを更新
        this._updateImageListGUI();
        
        console.log('画像を追加しました:', file.name, `(合計:${this.imageList.length}枚)`);
        
        // スライダーの画像を更新
        this.setImages(this.imageList);
        
        // 最後の画像を表示
        this.showSlide(this.imageList.length - 1);
      };
      
      image.onerror = () => {
        console.error('画像の読み込みに失敗しました:', file.name);
        URL.revokeObjectURL(imagePath);
        alert('画像の読み込みに失敗しました');
      };
      
      image.src = imagePath;
    } catch (error) {
      console.error('画像のアップロードに失敗しました:', error);
      if (imagePath && imagePath.startsWith('blob:')) {
        URL.revokeObjectURL(imagePath);
      }
      alert('画像のアップロードに失敗しました');
    } finally {
      // ファイル入力をリセット
      this.fileInput.value = '';
    }
  }
  
  /**
   * GUIの初期化
   * @private
   */
  _initGUI() {
    // GUIパラメータ
    this.params = {
      // スライダー設定
      autoplay: this.options.sliderOptions.autoplay,
      interval: this.options.sliderOptions.interval / 1000, // 秒単位で表示
      loop: this.options.sliderOptions.loop,
      
      // エフェクト設定
      displacementStartX: this.options.displacementStartX,
      displacementStartY: this.options.displacementStartY,
      displacementEndX: this.options.displacementEndX,
      displacementEndY: this.options.displacementEndY,
      fadeOutIntensity: 1.0, // フェードアウト時のエフェクト強度倍率
      alpha: this.options.alpha,
      duration: this.options.duration,
      transitionSpeed: 1.2, // トランジションの速度倍率（1.0が標準）
      noiseSpeedX: this.options.noiseSpeedX,
      noiseSpeedY: this.options.noiseSpeedY,
      spriteScaleX: this.options.spriteScaleX,
      spriteScaleY: this.options.spriteScaleY,
      
      // アクション
      uploadImage: () => this._triggerImageUpload(),
      playTimeline: () => this.runEffect(this.params),
      removeCurrentImage: () => this._removeCurrentImage(),
      
      // 画像管理
      currentImageIndex: this.currentIndex,
      imageList: this._getImageListString(),
      totalImages: this.images.length
    };
    
    // dat.GUI
    this.gui = new dat.GUI();
    
    // スライダーフォルダ
    const sliderFolder = this.gui.addFolder('スライダー設定');
    sliderFolder.add(this.params, 'autoplay').name('自動再生').onChange(value => {
      this.options.sliderOptions.autoplay = value;
      if (value) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    });
    sliderFolder.add(this.params, 'interval', 1, 10).step(0.5).name('表示間隔（秒）').onChange(value => {
      this.options.sliderOptions.interval = value * 1000;
      if (this.options.sliderOptions.autoplay) {
        this.stopAutoplay();
        this.startAutoplay();
      }
    });
    sliderFolder.add(this.params, 'loop').name('ループ再生').onChange(value => {
      this.options.sliderOptions.loop = value;
    });
    sliderFolder.add(this.params, 'totalImages').name('登録画像数').listen().domElement.style.pointerEvents = 'none';
    sliderFolder.open();
    
    // 画像管理フォルダ
    const imageFolder = this.gui.addFolder('画像管理');
    const uploadController = imageFolder.add(this.params, 'uploadImage').name('画像を追加');
    const removeController = imageFolder.add(this.params, 'removeCurrentImage').name('現在の画像を削除');
    
    // コントローラーにクラスを追加
    setTimeout(() => {
      if (uploadController.__li) {
        uploadController.__li.classList.add('upload-image');
      }
      if (removeController.__li) {
        removeController.__li.classList.add('remove-image');
      }
    }, 100);
    
    // 画像リスト表示（読み取り専用）
    this.imageListController = imageFolder.add(this.params, 'imageList').name('登録画像一覧').listen();
    this.imageListController.domElement.style.pointerEvents = 'none';
    this.imageListController.domElement.style.height = '60px';
    this.imageListController.domElement.style.overflow = 'auto';
    
    imageFolder.open();
    
    // エフェクトフォルダ
    const effectsFolder = this.gui.addFolder('エフェクト設定');
    effectsFolder.add(this.params, 'displacementStartX', 0, 300).name('歪み X軸').onChange(this._updateOptions.bind(this));
    effectsFolder.add(this.params, 'displacementStartY', 0, 300).name('歪み Y軸').onChange(this._updateOptions.bind(this));
    effectsFolder.add(this.params, 'spriteScaleX', 0.1, 5).step(0.1).name('ノイズサイズ X軸').onChange(val => {
      this.displacementSprite.scale.x = val;
      this._updateOptions();
    });
    effectsFolder.add(this.params, 'spriteScaleY', 0.1, 5).step(0.1).name('ノイズサイズ Y軸').onChange(val => {
      this.displacementSprite.scale.y = val;
      this._updateOptions();
    });
    effectsFolder.add(this.params, 'alpha', 0, 1).step(0.01).name('最終透明度').onChange(this._updateOptions.bind(this));
    effectsFolder.add(this.params, 'duration', 0.1, 6).step(0.1).name('アニメーション時間').onChange(this._updateOptions.bind(this));
    
    // トランジション設定
    const transitionFolder = this.gui.addFolder('トランジション設定');
    transitionFolder.add(this.params, 'transitionSpeed', 0.5, 2).step(0.1).name('切替速度').onChange(this._updateOptions.bind(this));
    transitionFolder.add(this.params, 'fadeOutIntensity', 0.8, 2).step(0.1).name('消える強度').onChange(this._updateOptions.bind(this));
    transitionFolder.open();
    
    effectsFolder.add(this.params, 'noiseSpeedX', 0, 8).step(0.01).name('ゆらぎ速度 X軸').onChange(this._updateOptions.bind(this));
    effectsFolder.add(this.params, 'noiseSpeedY', 0, 8).step(0.01).name('ゆらぎ速度 Y軸').onChange(this._updateOptions.bind(this));
    
    // メインコントロール
    const playButton = this.gui.add(this.params, 'playTimeline').name('▶ エフェクトを再生');
    setTimeout(() => {
      if (playButton.__li) {
        playButton.__li.classList.add('play-button-container');
      }
    }, 100);
    
    this._customizeDatGui();
  }
  
  /**
   * 画像リストをGUIで表示用にフォーマット
   * @returns {string} フォーマットされた画像リスト
   * @private
   */
  _getImageListString() {
    if (!this.imageList || this.imageList.length === 0) {
      return '画像が登録されていません';
    }
    
    return this.imageList.map((path, index) => {
      let fileName;
      try {
        // データURLまたはblobの場合
        if (typeof path === 'string' && (path.startsWith('data:') || path.startsWith('blob:'))) {
          fileName = `アップロード画像 ${index + 1}`;
        } else if (typeof path === 'string') {
          // 通常のパスの場合、最後のスラッシュ以降を取得
          const parts = path.split('/');
          fileName = parts[parts.length - 1] || `画像 ${index + 1}`;
        } else {
          fileName = `画像 ${index + 1}`;
        }
      } catch (e) {
        fileName = `画像 ${index + 1}`;
      }
      
      // 現在のインデックスを強調表示
      const isCurrent = index === this.currentIndex;
      return `${index + 1}: ${fileName}${isCurrent ? ' ◀' : ''}`;
    }).join('\n');
  }
  
  /**
   * 画像リストGUIの更新
   * @private
   */
  _updateImageListGUI() {
    this.params.imageList = this._getImageListString();
    this.params.totalImages = this.imageList.length;
  }
  
  /**
   * 現在表示中の画像を削除
   * @private
   */
  _removeCurrentImage() {
    if (this.imageList.length <= 1) {
      alert('最低1枚の画像が必要です。');
      return;
    }
    
    // BlobURLの場合、メモリリークを防ぐためにURLを解放
    const imageToDelete = this.imageList[this.currentIndex];
    if (typeof imageToDelete === 'string' && imageToDelete.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(imageToDelete);
      } catch (e) {
        console.warn('BlobURLの解放中にエラーが発生しました:', e);
      }
    }
    
    // 削除前のインデックスを保存
    const currentIdx = this.currentIndex;
    
    // 現在の画像を削除
    this.imageList.splice(currentIdx, 1);
    
    // GUIの画像リストを更新
    this._updateImageListGUI();
    
    // スライダーの画像を更新
    this.setImages(this.imageList);
    
    // インデックスの調整（削除前のインデックスが配列の最後だった場合は1つ前の画像を表示）
    const newIndex = Math.min(currentIdx, this.imageList.length - 1);
    this.showSlide(newIndex);
    
    console.log(`画像を削除しました（インデックス:${currentIdx}、残り:${this.imageList.length}枚）`);
  }
  
  /**
   * ファイルアップロードを開始
   * @private
   */
  _triggerImageUpload() {
    this.fileInput.click();
  }
  
  /**
   * オプション更新
   * @private
   */
  _updateOptions() {
    // 除外するパラメータ
    const excludedParams = [
      'autoplay', 'interval', 'loop', 'uploadImage', 'playTimeline', 
      'removeCurrentImage', 'currentImageIndex', 'imageList', 'totalImages'
    ];
    
    // パラメータをオプションにコピー
    Object.keys(this.params).forEach(key => {
      if (excludedParams.indexOf(key) === -1) {
        this.options[key] = this.params[key];
      }
    });
    
    // スライダーオプションの更新
    this.options.sliderOptions.autoplay = this.params.autoplay;
    this.options.sliderOptions.interval = this.params.interval * 1000;
    this.options.sliderOptions.loop = this.params.loop;
  }
  
  /**
   * dat.GUIのカスタマイズ
   * @private
   */
  _customizeDatGui() {
    setTimeout(() => {
      const guiContainer = document.querySelector('.dg.ac');
      if (guiContainer) {
        guiContainer.classList.add('custom-dat-gui');
        
        const functionControllers = document.querySelectorAll('.dg .function .property-name');
        functionControllers.forEach(element => {
          element.classList.add('gui-button');
        });
      }
    }, 100);
  }
  
  /**
   * キーボードイベント初期化（GUI用）
   * @private
   */
  _initKeyboardEventsForGUI() {
    // バインドしたイベントハンドラを保存する
    this._handleKeyDown = (event) => {
      // スペースキー
      if ((event.key === ' ' || event.keyCode === 32) && event.target === document.body) {
        event.preventDefault(); // デフォルトのスクロール動作を防止
        this.toggleGuiVisibility();
      }
    };
    
    document.addEventListener('keydown', this._handleKeyDown);
  }
  
  /**
   * GUI表示・非表示の切り替え
   * @param {boolean} visible - 表示状態
   * @public
   */
  toggleGuiVisibility(visible) {
    const guiElement = document.querySelector('.dg.ac');
    
    if (guiElement) {
      if (visible === undefined) {
        guiElement.style.display = (guiElement.style.display === 'none') ? '' : 'none';
      } else {
        guiElement.style.display = visible ? '' : 'none';
      }
    }
  }
  
  /**
   * スライドを表示（オーバーライド）
   * @param {number} index - スライドのインデックス
   * @public
   */
  showSlide(index) {
    super.showSlide(index);
    
    // GUIの現在のインデックスを更新（paramsが存在する場合のみ）
    if (this.params) {
      this.params.currentImageIndex = this.currentIndex;
      this._updateImageListGUI(); // 画像リストも更新
    }
  }
  
  /**
   * リソース解放（オーバーライド）
   * @public
   */
  destroy() {
    // GUI破棄
    if (this.gui) {
      try {
        this.gui.destroy();
      } catch (e) {
        console.warn('GUIの破棄中にエラーが発生しました:', e);
      }
    }
    
    // イベントリスナー削除
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }
    
    // Blob URLを解放
    if (this.imageList) {
      this.imageList.forEach(imagePath => {
        if (typeof imagePath === 'string' && imagePath.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(imagePath);
          } catch (e) {
            console.warn('BlobURLの解放中にエラーが発生しました:', e);
          }
        }
      });
    }
    
    // ファイル入力要素の削除
    if (this.fileInput) {
      try {
        this.fileInput.removeEventListener('change', this._handleImageUpload.bind(this));
        if (this.fileInput.parentNode) {
          this.fileInput.parentNode.removeChild(this.fileInput);
        }
      } catch (e) {
        console.warn('ファイル入力要素の削除中にエラーが発生しました:', e);
      }
    }
    
    // 親クラスのdestroyを呼び出し
    try {
      super.destroy();
    } catch (e) {
      console.error('親クラスのdestroyメソッド実行中にエラーが発生しました:', e);
    }
  }
}