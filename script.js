// 6x6 の設定
const SIZE = 6;

// 6x6 の 2次元配列を0で初期化
let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
let score = 0;

// 各種要素を取得
const boardElem = document.getElementById('board');
const scoreElem = document.getElementById('score');
const gameOverElem = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

/**
 * ゲーム開始時の初期化
 */
function initGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;

  // 最初にタイルを2枚追加 (1 or 3)
  placeRandomTile();
  placeRandomTile();

  updateBoard();
  updateScore();
  // ゲームオーバー表示を隠す
  gameOverElem.classList.add('hidden');
}

/**
 * 空きマスに 1 or 3 のタイルをランダム配置
 * (例: 90%で1, 10%で3)
 */
function placeRandomTile() {
  let emptyCells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }
  if (emptyCells.length === 0) return;

  const idx = Math.floor(Math.random() * emptyCells.length);
  const { r, c } = emptyCells[idx];
  board[r][c] = Math.random() < 0.9 ? 1 : 3; // 好みに応じて確率変更
}

/**
 * 盤面をHTMLに反映
 */
function updateBoard() {
  boardElem.innerHTML = ''; // いったんクリア

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      const tileDiv = document.createElement('div');
      tileDiv.classList.add('tile', `tile-${val}`);
      tileDiv.textContent = val === 0 ? '' : val;
      boardElem.appendChild(tileDiv);
    }
  }
}

/**
 * スコアを画面に反映
 */
function updateScore() {
  scoreElem.textContent = score;
}

/**
 * 「三つ連続だけ」合体するロジック
 * - 0を取り除いて詰める
 * - 左から見て、同じ値が3つ連続していたら1回で合体 (x,x,x => x*3)
 * - 4つ並んでいれば、最初の3つだけ合体→残り1つ
 * - 2つ連続は合体しない
 */
function mergeTripleRow(row) {
  // 1) 0以外を抽出
  let filtered = row.filter(x => x !== 0);
  let merged = [];
  let i = 0;

  while (i < filtered.length) {
    // 3連続チェック
    if (
      i <= filtered.length - 3 &&
      filtered[i] === filtered[i+1] &&
      filtered[i] === filtered[i+2]
    ) {
      let newVal = filtered[i] * 3;  // 1,1,1 => 3, 3,3,3 => 9, etc.
      merged.push(newVal);
      score += newVal;  // 合体した分だけスコア加算
      i += 3;           // 3つ分スキップ
    } else {
      // 3連続でなければそのまま追加
      merged.push(filtered[i]);
      i++;
    }
  }

  // 2) 後ろを 0 で埋める (6マスぶん)
  while (merged.length < SIZE) {
    merged.push(0);
  }
  return merged;
}

/**
 * 左方向へのスライド (全行に mergeTripleRow を適用)
 */
function moveLeft() {
  for (let r = 0; r < SIZE; r++) {
    board[r] = mergeTripleRow(board[r]);
  }
}

/**
 * 右方向へのスライド
 * -> 行を反転 → 左へスライド → 再度反転
 */
function moveRight() {
  for (let r = 0; r < SIZE; r++) {
    board[r].reverse();
    board[r] = mergeTripleRow(board[r]);
    board[r].reverse();
  }
}

/**
 * 盤面を左回転
 */
function rotateLeft(mat) {
  let size = mat.length;
  let rotated = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[size - 1 - c][r] = mat[r][c];
    }
  }
  return rotated;
}

/**
 * 盤面を右回転
 */
function rotateRight(mat) {
  let size = mat.length;
  let rotated = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[c][size - 1 - r] = mat[r][c];
    }
  }
  return rotated;
}

/**
 * 上方向へのスライド
 * => 左回転 → 左へスライド → 右回転
 */
function moveUp() {
  board = rotateLeft(board);
  moveLeft();
  board = rotateRight(board);
}

/**
 * 下方向へのスライド
 * => 右回転 → 左へスライド → 左回転
 */
function moveDown() {
  board = rotateRight(board);
  moveLeft();
  board = rotateLeft(board);
}

/**
 * ゲームオーバー判定
 * - 空きマスが無い
 * - かつ、どこにも「三つ連続」で合体可能な場所が無い
 */
function isGameOver() {
  // 空きマスがあれば継続
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) {
        return false;
      }
    }
  }

  // 水平方向に三つ連続があるかチェック
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      const v1 = board[r][c];
      const v2 = board[r][c+1];
      const v3 = board[r][c+2];
      if (v1 !== 0 && v1 === v2 && v2 === v3) {
        return false; // まだ合体できる
      }
    }
  }

  // 垂直方向に三つ連続があるかチェック
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      const v1 = board[r][c];
      const v2 = board[r+1][c];
      const v3 = board[r+2][c];
      if (v1 !== 0 && v1 === v2 && v2 === v3) {
        return false;
      }
    }
  }

  // どこにも三つ連続がなく、空きマスも無ければゲームオーバー
  return true;
}

/**
 * キー入力 (矢印 or WASD) を受けてタイルを動かす
 */
document.addEventListener('keydown', (e) => {
    handleInput(e.key); // キーボード入力を処理
  });
  
  // 十字キークリックに対応
  document.querySelectorAll('.d-pad__button').forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.getAttribute('data-direction'); // ボタンの方向を取得
      if (direction) {
        handleInput(direction); // クリックされた方向を処理
      }
    });
  });
    // タッチイベント用に方向を設定
    document.querySelectorAll('.d-pad__button').forEach(button => {
        button.addEventListener('touchstart', () => {
        const direction = button.getAttribute('data-direction');
        if (direction) {
            handleInput(direction); // タッチで方向入力を処理
        }
        });
    });
  
  /**
   * 入力処理関数
   * @param {string} input 入力キーまたは方向 (例: 'ArrowLeft', 'up', 'down'など)
   */
  function handleInput(input) {
    // 移動前の盤面コピー
    const before = board.map(row => row.slice());
    let moved = false;
  
    if (input === 'ArrowLeft' || input === 'a' || input === 'left') {
      moveLeft();  moved = true;
    } else if (input === 'ArrowRight' || input === 'd' || input === 'right') {
      moveRight(); moved = true;
    } else if (input === 'ArrowUp' || input === 'w' || input === 'up') {
      moveUp();    moved = true;
    } else if (input === 'ArrowDown' || input === 's' || input === 'down') {
      moveDown();  moved = true;
    }
  
    // もし実際に盤面が変化したら、新タイルを追加
    if (moved) {
      let changed = false;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (board[r][c] !== before[r][c]) {
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
      if (changed) {
        placeRandomTile();
      }
  
      updateBoard();
      updateScore();
  
      // ゲームオーバー判定
      if (isGameOver()) {
        gameOverElem.classList.remove('hidden');
      }
    }
  }
  

/**
 * Restart ボタン
 */
restartBtn.addEventListener('click', () => {
  initGame();
});

/** ページ読み込み時に初期化 */
initGame();
