// Presents 
const presets = [
  { id: 'p1', title: 'Mountain', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop' },
  { id: 'p2', title: 'City', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1200&auto=format&fit=crop' },
  { id: 'p3', title: 'Animals', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1200&auto=format&fit=crop' },
  { id: 'p4', title: 'Friends', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop' }
];

// elements
const setupOverlay = document.getElementById('setupOverlay');
const presetList = document.getElementById('presetList');
const presetSizes = document.getElementById('presetSizes');
const setupCols = document.getElementById('setupCols');
const setupRows = document.getElementById('setupRows');
const setupCreate = document.getElementById('setupCreate');
const setupUpload = document.getElementById('setupUpload');
const setupSignup = document.getElementById('setupSignup');
const authMessage = document.getElementById('authMessage');
const menuBtn = document.getElementById('menuBtn');
const imageUpload = document.getElementById('imageUpload');
const previewBtn = document.getElementById('previewBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const enableCheckEl = document.getElementById('enableCheck');
const puzzle = document.getElementById('puzzle');
const previewContainer = document.getElementById('previewContainer');
const previewPuzzle = document.getElementById('previewPuzzle');
const message = document.getElementById('message');
const timerDisplay = document.getElementById('timer');
const completionOverlay = document.getElementById('completionOverlay');
const completionTime = document.getElementById('completionTime');
const completionNew = document.getElementById('completionNew');
const completionShuffle = document.getElementById('completionShuffle');
const completionClose = document.getElementById('completionClose');
const completionSignup = document.getElementById('completionSignup');
const completionSave = document.getElementById('completionSave');
const savePrompt = document.getElementById('savePrompt');
const saveSection = document.getElementById('saveSection');
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const headerSignup = document.getElementById('headerSignup');
const historyBtn = document.getElementById('historyBtn');

// State
let selectedPreset = presets[0];
let uploadedURL = '';
let imageURL = selectedPreset.url;
let currentImageName = selectedPreset.title;
let cols = 5, rows = 6;
let pieceWidth = 100, pieceHeight = 100;
let cells = [];
let started = false;
let startTime = null;
let timer = null;
let pieceIdCounter = 0;
let solvedAlready = false;
let selectedPiece = null;
let isLoggedIn = false;

//check auth
function checkAuthStatus() {
  const token = sessionStorage.getItem('userToken');
  const userData = sessionStorage.getItem('userData');

  if (token && userData) {
    isLoggedIn = true;
    const user = JSON.parse(userData);
    userInfo.textContent = `👤 ${user.fullName}`;
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';
    headerSignup.style.display = 'none';
    historyBtn.style.display = 'inline-flex';
    savePrompt.style.display = 'none';
    saveSection.style.display = 'block';
    setupSignup.style.display = 'none';
    authMessage.style.display = 'none';
  } else {
    isLoggedIn = false;
    userInfo.style.display = 'none';
    logoutBtn.style.display = 'none';
    headerSignup.style.display = 'inline-flex';
    historyBtn.style.display = 'none';
    savePrompt.style.display = 'block';
    saveSection.style.display = 'none';
    setupSignup.style.display = 'inline-flex';
    authMessage.style.display = 'block';
  }
}

menuBtn.addEventListener('click', () => {
  setupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
});

headerSignup.addEventListener('click', () => {
  window.location.href = '../auth/index.html';
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('userData');
  isLoggedIn = false;
  checkAuthStatus();
  message.textContent = 'You have been signed out';
});

setupSignup.addEventListener('click', () => {
  window.location.href = '../auth/index.html';
});

completionSignup.addEventListener('click', () => {
  window.location.href = '../auth/index.html';
});

// build presets
presets.forEach(p => {
  const el = document.createElement('div');
  el.className = 'presetItem selected';
  el.dataset.id = p.id;
  el.innerHTML = `<img src="${p.url}" alt="${p.title}"><div>${p.title}</div>`;
  el.addEventListener('click', () => {
    document.querySelectorAll('.presetItem').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    selectedPreset = p;
    imageURL = p.url;
    currentImageName = p.title;
  });
  presetList.appendChild(el);
});

// buttons size
presetSizes.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    presetSizes.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setupCols.value = btn.dataset.cols;
    setupRows.value = btn.dataset.rows;
  });
});

// upload
setupUpload.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (uploadedURL) URL.revokeObjectURL(uploadedURL);
  uploadedURL = URL.createObjectURL(f);
  imageURL = uploadedURL;
  currentImageName = f.name;
  document.querySelectorAll('.presetItem').forEach(i => i.classList.remove('selected'));
});

imageUpload.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (uploadedURL) URL.revokeObjectURL(uploadedURL);
  uploadedURL = URL.createObjectURL(f);
  imageURL = uploadedURL;
  currentImageName = f.name;
  message.textContent = '✅ Custom image uploaded!';
});

//create puzzle
setupCreate.addEventListener('click', () => {
  const c = Math.max(1, Math.min(30, +setupCols.value || 5));
  const r = Math.max(1, Math.min(30, +setupRows.value || 6));

  if (!imageURL) {
    alert('Please select or upload an image');
    return;
  }

  setupOverlay.classList.remove('active');
  document.body.style.overflow = '';
  createPuzzle(imageURL, c, r);
});

// loading
function createPuzzle(imgSrc, c, r) {
  cols = c;
  rows = r;
  const canvasSize = 500;
  pieceWidth = Math.floor(canvasSize / cols);
  pieceHeight = Math.floor(canvasSize / rows);

  puzzle.innerHTML = '';
  cells = [];
  pieceIdCounter = 0;
  solvedAlready = false;
  selectedPiece = null;
  shuffleBtn.disabled = true;
  message.textContent = '⏳ Loading image...';

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => buildPuzzle(imgSrc);
  img.onerror = () => {
    message.textContent = '❌ Failed to load image. Try another.';
  };
  img.src = imgSrc;
}

function buildPuzzle(imgSrc) {
  puzzle.style.gridTemplateColumns = `repeat(${cols}, ${pieceWidth}px)`;
  puzzle.style.gridTemplateRows = `repeat(${rows}, ${pieceHeight}px)`;

  for (let i = 0; i < cols * rows; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.width = pieceWidth + 'px';
    cell.style.height = pieceHeight + 'px';
    cell.dataset.index = i;

    cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drop-target'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
    cell.addEventListener('drop', onDropOnCell);

    const piece = document.createElement('div');
    piece.className = 'piece';
    piece.draggable = true;
    piece.id = 'piece-' + (pieceIdCounter++);

    const rr = Math.floor(i / cols), cc = i % cols;
    piece.style.backgroundImage = `url('${imgSrc}')`;
    piece.style.backgroundSize = `${cols * pieceWidth}px ${rows * pieceHeight}px`;
    piece.style.backgroundPosition = `-${cc * pieceWidth}px -${rr * pieceHeight}px`;
    piece.dataset.correct = i;

    piece.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', piece.id);
      piece.classList.add('dragging');
      if (!started) startTimer();
    });
    piece.addEventListener('dragend', () => {
      piece.classList.remove('dragging');
      document.querySelectorAll('.cell.drop-target').forEach(el => el.classList.remove('drop-target'));
    });
    piece.addEventListener('click', e => { e.stopPropagation(); toggleSelect(piece); });

    piece.addEventListener('touchstart', onTouchStart, { passive: false });
    piece.addEventListener('touchmove', onTouchMove, { passive: false });
    piece.addEventListener('touchend', onTouchEnd);

    cell.appendChild(piece);
    cells.push(cell);
    puzzle.appendChild(cell);
  }

  shuffle();
  shuffleBtn.disabled = false;
  resetTimer();
  previewContainer.style.display = 'none';
  previewPuzzle.innerHTML = '';
  message.textContent = '🎮 Puzzle ready! Start solving!';
}

// shuffle
shuffleBtn.addEventListener('click', () => {
  shuffle();
  solvedAlready = false;
  resetTimer();
  message.textContent = '🔀 Puzzle shuffled!';
});

function shuffle() {
  if (!cells.length) return;
  const pieces = cells.map(c => c.firstChild);
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  cells.forEach((cell, i) => cell.appendChild(pieces[i]));
  document.querySelectorAll('.piece').forEach(p => p.style.border = '2px solid transparent');
}

//drop handler
function onDropOnCell(e) {
  e.preventDefault();
  this.classList.remove('drop-target');
  const draggedId = e.dataTransfer.getData('text/plain');
  const dragged = document.getElementById(draggedId);
  if (!dragged) return;
  const targetPiece = this.firstChild;
  const sourceCell = dragged.parentElement;
  if (sourceCell === this) return;
  sourceCell.appendChild(targetPiece);
  this.appendChild(dragged);
  dragged.classList.remove('selected', 'dragging');
  if (enableCheckEl.checked) checkPositions();
  else if (isSolved()) finishPuzzle();
}

// select
function toggleSelect(piece) {
  if (selectedPiece) selectedPiece.classList.remove('selected');
  if (selectedPiece === piece) selectedPiece = null;
  else {
    selectedPiece = piece;
    piece.classList.add('selected');
  }
  if (!started && selectedPiece) startTimer();
}

puzzle.addEventListener('click', e => {
  const cell = e.target.closest('.cell');
  if (!cell || !selectedPiece) return;
  const targetPiece = cell.firstChild;
  const sourceCell = selectedPiece.parentElement;
  if (targetPiece === selectedPiece) return;
  sourceCell.appendChild(targetPiece);
  cell.appendChild(selectedPiece);
  selectedPiece.classList.remove('selected');
  selectedPiece = null;
  if (enableCheckEl.checked) checkPositions();
  else if (isSolved()) finishPuzzle();
});

// check positions
function checkPositions() {
  if (!cells.length) return;
  let solved = true;
  cells.forEach((cell, i) => {
    const piece = cell.firstChild;
    if (+piece.dataset.correct === i) piece.style.border = '2px solid #4caf50';
    else {
      piece.style.border = '2px solid #f44336';
      solved = false;
    }
  });
  if (solved) finishPuzzle();
}

function isSolved() {
  return cells.length && cells.every((cell, i) => +cell.firstChild.dataset.correct === i);
}

// check toggle
enableCheckEl.addEventListener('change', () => {
  if (enableCheckEl.checked) {
    checkPositions();
    message.textContent = '✓ Position checking ON - Green = correct, Red = wrong';
  } else {
    document.querySelectorAll('.piece').forEach(p => p.style.border = '2px solid transparent');
    message.textContent = '✗ Position checking OFF - Puzzle solves when all tiles are correct';
  }
});

//finish
function finishPuzzle() {
  if (solvedAlready) return;
  solvedAlready = true;
  stopTimer();
  message.textContent = '🎉 Puzzle complete!';
  completionTime.textContent = `⏱️ Time: ${formatElapsedTime()}`;
  showCompletion();
}

function showCompletion() {
  completionOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideCompletion() {
  completionOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

completionNew.addEventListener('click', () => {
  hideCompletion();
  setupOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
});

completionShuffle.addEventListener('click', () => {
  hideCompletion();
  shuffle();
  solvedAlready = false;
  resetTimer();
  message.textContent = '🔀 Puzzle shuffled!';
});

completionClose.addEventListener('click', hideCompletion);

completionSave.addEventListener('click', async () => {
  if (!isLoggedIn) {
    alert('Please sign in to save results');
    return;
  }

  completionSave.disabled = true;
  completionSave.textContent = '⏳ Saving...';

  try {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const timeStr = formatElapsedTime();
    const totalSec = startTime ? Math.floor((performance.now() - startTime) / 1000) : 0;

    const { error } = await db
      .from('puzzle_results')
      .insert([{
        user_id: userData.id,
        image_name: currentImageName,
        image_url: imageURL.startsWith('blob:') ? null : imageURL,
        grid_size: `${cols}×${rows}`,
        cols: cols,
        rows: rows,
        time_elapsed: timeStr,
        time_seconds: totalSec
      }]);

    if (error) throw error;

    completionSave.textContent = '✅ Saved!';
    message.textContent = '✅ Result saved to your profile!';
    setTimeout(() => hideCompletion(), 1200);
  } catch (err) {
    console.error('Save error:', err);
    completionSave.textContent = '❌ Error saving';
    completionSave.disabled = false;
  }
});

//history or progress
async function showHistory() {
  if (!isLoggedIn) {
    alert('Please sign in to view history');
    return;
  }

  const overlay = document.getElementById('historyOverlay');
  const list = document.getElementById('historyList');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  list.innerHTML = '<p class="history-loading">⏳ Loading...</p>';

  try {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    const { data, error } = await db
      .from('puzzle_results')
      .select('*')
      .eq('user_id', userData.id)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!data || data.length === 0) {
      list.innerHTML = '<p class="history-empty">No results yet. Solve some puzzles!</p>';
      return;
    }

    list.innerHTML = data.map(r => `
      <div class="history-item">
        ${r.image_url
          ? `<img class="history-thumb" src="${r.image_url}" alt="${r.image_name}" onerror="this.style.display='none'">`
          : `<div class="history-thumb history-thumb-placeholder">🧩</div>`
        }
        <div class="history-info">
          <div class="history-name">${r.image_name}</div>
          <div class="history-meta">
            <span>📐 ${r.grid_size}</span>
            <span>⏱️ ${r.time_elapsed}</span>
          </div>
          <div class="history-date">${new Date(r.completed_at).toLocaleString()}</div>
        </div>
        <button class="history-delete btn btn-ghost" data-id="${r.id}" title="Delete">🗑️</button>
      </div>
    `).join('');

    list.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const { error } = await db.from('puzzle_results').delete().eq('id', id);
        if (!error) btn.closest('.history-item').remove();
      });
    });

  } catch (err) {
    list.innerHTML = `<p class="history-empty">Error loading results: ${err.message}</p>`;
  }
}

document.getElementById('historyBtn').addEventListener('click', showHistory);
document.getElementById('historyClose').addEventListener('click', () => {
  document.getElementById('historyOverlay').classList.remove('active');
  document.body.style.overflow = '';
});
document.getElementById('historyOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('historyOverlay')) {
    document.getElementById('historyOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }
});

//timer
function startTimer() {
  if (started) return;
  started = true;
  startTime = performance.now();
  timer = setInterval(() => {
    const t = performance.now() - startTime;
    const ms = Math.floor(t % 1000).toString().padStart(3, '0');
    const sec = Math.floor(t / 1000) % 60;
    const min = Math.floor(t / 60000);
    timerDisplay.textContent = `⏱️ Time: ${min}:${sec.toString().padStart(2, '0')}:${ms}`;
  }, 50);
}

function stopTimer() {
  clearInterval(timer);
}

function resetTimer() {
  clearInterval(timer);
  started = false;
  startTime = null;
  timerDisplay.textContent = '⏱️ Time: 0:00:000';
}

function formatElapsedTime() {
  if (!startTime) return '0:00:000';
  const t = performance.now() - startTime;
  const ms = Math.floor(t % 1000).toString().padStart(3, '0');
  const sec = Math.floor(t / 1000) % 60;
  const min = Math.floor(t / 60000);
  return `${min}:${sec.toString().padStart(2, '0')}:${ms}`;
}

// preview
previewBtn.addEventListener('click', () => {
  if (!imageURL) return alert('Choose image from menu');
  if (previewContainer.style.display === 'block') {
    previewContainer.style.display = 'none';
    previewBtn.textContent = '👁️ Preview';
    return;
  }
  const pW = pieceWidth;
  const pH = pieceHeight;
  const gridW = cols * pW + (cols - 1) * 2 + 8; // gap=2px*cols + padding=4px*2
  const gridH = rows * pH + (rows - 1) * 2 + 8;

  previewPuzzle.innerHTML = '';
  previewPuzzle.style.gridTemplateColumns = `repeat(${cols}, ${pW}px)`;
  previewPuzzle.style.gridTemplateRows = `repeat(${rows}, ${pH}px)`;
  previewContainer.style.width = (gridW + 48) + 'px';

  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const pp = document.createElement('div');
    pp.style.width = pW + 'px';
    pp.style.height = pH + 'px';
    pp.style.backgroundImage = `url('${imageURL}')`;
    pp.style.backgroundSize = `${cols * pW}px ${rows * pH}px`;
    pp.style.backgroundPosition = `-${c * pW}px -${r * pH}px`;
    previewPuzzle.appendChild(pp);
  }
  previewContainer.style.display = 'block';
  previewBtn.textContent = '✕ Hide';
});

// touch
let touchDrag = { piece: null, srcCell: null, currentTargetCell: null };

function onTouchStart(e) {
  e.preventDefault();
  const piece = e.currentTarget;
  touchDrag.piece = piece;
  touchDrag.srcCell = piece.parentElement;
  piece.classList.add('dragging');
  if (!started) startTimer();
}

function onTouchMove(e) {
  if (!touchDrag.piece) return;
  e.preventDefault();
  const touch = e.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const cell = el ? el.closest('.cell') : null;
  if (cell !== touchDrag.currentTargetCell) {
    if (touchDrag.currentTargetCell) touchDrag.currentTargetCell.classList.remove('drop-target');
    touchDrag.currentTargetCell = cell;
    if (cell) cell.classList.add('drop-target');
  }
}

function onTouchEnd(e) {
  if (!touchDrag.piece) return;
  const piece = touchDrag.piece;
  const targetCell = touchDrag.currentTargetCell;
  piece.classList.remove('dragging');
  if (targetCell && targetCell !== touchDrag.srcCell) {
    const targetPiece = targetCell.firstChild;
    const srcCell = touchDrag.srcCell;
    srcCell.appendChild(targetPiece);
    targetCell.appendChild(piece);
    if (enableCheckEl.checked) checkPositions();
    else if (isSolved()) finishPuzzle();
  }
  document.querySelectorAll('.cell.drop-target').forEach(el => el.classList.remove('drop-target'));
  touchDrag = { piece: null, srcCell: null, currentTargetCell: null };
}

// close by click
setupOverlay.addEventListener('click', (e) => {
  if (e.target === setupOverlay) {
    setupOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
});

completionOverlay.addEventListener('click', (e) => {
  if (e.target === completionOverlay) hideCompletion();
});

//init
checkAuthStatus();
