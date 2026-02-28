let data = null;
let selectedIndex = null;

let SIDEBAR_W;
let ITEM_H = 50;
let LIST_TOP = 220;

let myFont;
let img;
let angle = 0;

let p5gif = null;

// Sound
let osc = null;
let soundStarted = false;
let isPlaying = false;

// ── load data ──────────────────────────────────────────────
async function loadHurricanes() {
  try {
    const res = await fetch("/api/data");
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    data = json;
    selectStorm(0);
  } catch (e) {
    console.error(e.message);
  }
}

// ── preload ──────────────────────────────────────────────
function preload() {
  myFont = loadFont("Aboreto-Regular.ttf");
  img = loadImage("images/stylus.png");
}

// ── setup ────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(myFont);
  SIDEBAR_W = width / 4;
  loadHurricanes();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ── setup sound ──────────────────────────────
function setupSound() {
  osc = new p5.Oscillator("sine");
  osc.amp(0);
  osc.start();
  soundStarted = true;
}

// ── select storm ────────────────────────────────────────────
function selectStorm(i) {
  selectedIndex = i;
  p5gif = null;
  angle = 0;

  const item = data.items[i];
  if (item.gif) {
    loadImage(
      item.gif,
      (img) => {
        p5gif = img;
      },
      (err) => console.error("GIF load failed:", err),
    );
  }

  if (osc) osc.amp(0, 0.1);
  isPlaying = false;
}

// ── mouse clicked, selected ─────────────────────────────────────────────
function mousePressed() {
  if (!soundStarted) setupSound();

  // btn
  let btnX = SIDEBAR_W + 30;
  let btnY = 30;
  let btnSize = 20;
  if (
    mouseX >= btnX &&
    mouseX <= btnX + btnSize &&
    mouseY >= btnY &&
    mouseY <= btnY + btnSize
  ) {
    isPlaying = !isPlaying;
    if (isPlaying) {
      osc.amp(0.25, 0.2);
    } else {
      osc.amp(0, 0.2);
    }
    return;
  }

  if (!data?.items) return;
  if (mouseX > SIDEBAR_W) return;

  const i = Math.floor((mouseY - LIST_TOP) / ITEM_H);
  if (i >= 0 && i < data.items.length) selectStorm(i);
}

// ── sidebar ─────────────────────────────────────────────────
function drawSidebar() {
  noStroke();
  fill(20);
  rect(0, 0, SIDEBAR_W, height);

  fill(255);
  textSize(60);
  textLeading(60);
  textAlign(LEFT, TOP);
  text("2025\nSTORMS\nVinyl", 24, 20);

  if (!data?.items) {
    fill(100);
    textSize(14);
    text("Loading…", 24, LIST_TOP);
    return;
  }

  data.items.forEach((item, i) => {
    const y = LIST_TOP + i * ITEM_H;
    const hovered = mouseX < SIDEBAR_W && mouseY > y && mouseY < y + ITEM_H;

    noStroke();
    if (i === selectedIndex) {
      fill(35);
      rect(0, y, SIDEBAR_W, ITEM_H);
    } else if (hovered) {
      fill(25);
      rect(0, y, SIDEBAR_W, ITEM_H);
    }

    fill(i === selectedIndex ? 255 : color(200, 208, 232));
    textSize(24);
    textAlign(LEFT, CENTER);
    text(item.heading, 24, y + ITEM_H / 2);
  });
}

// ── right window ──────────────────
function drawVinyl() {
  const panelW = width - SIDEBAR_W;
  const size = Math.min(panelW, height) * 0.85;
  const cx = SIDEBAR_W + panelW / 2;
  const cy = height / 2;
  const r = size / 2;

  if (!p5gif) {
    noStroke();
    fill(40);
    ellipse(cx, cy, size, size);
    fill(120);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(selectedIndex !== null ? "Loading…" : "← Select a storm", cx, cy);
    return;
  }

  // draw GIF
  const ctx = drawingContext;
  ctx.save();
  ctx.translate(cx, cy);
  if (isPlaying) ctx.rotate((angle * Math.PI) / 180);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  imageMode(CENTER);
  image(p5gif, 0, 0, size, size);
  ctx.restore();

  // circles
  ctx.save();
  ctx.translate(cx, cy);
  if (isPlaying) ctx.rotate((angle * Math.PI) / 180);

  noStroke();
  fill(30);
  ellipse(0, 0, size * 0.25, size * 0.25);
  fill(10);
  ellipse(0, 0, size * 0.03, size * 0.03);

  if (data?.items?.[selectedIndex]) {
    fill(255);
    textSize(size * 0.03);
    textAlign(CENTER, CENTER);
    text(data.items[selectedIndex].heading, 0, -size * 0.06);
    textSize(size * 0.02);
    text("2025", 0, size * 0.06);
  }

  ctx.restore();

  // line for detecting pixel
  stroke(255, 0);
  line(cx, cy, cx + r, cy);
  fill(255, 0);
  ellipse(cx + r * 0.6, cy, 8, 8);

  // sound control
  if (soundStarted && osc && isPlaying) {
    const samples = 20;
    const innerSkip = 0.15;
    let totalBright = 0;

    for (let k = 0; k < samples; k++) {
      const t = innerSkip + (k / samples) * (1 - innerSkip);
      const px = Math.floor(cx + t * r);
      const py = Math.floor(cy);
      const c = get(px, py);
      totalBright += (red(c) + green(c) + blue(c)) / 3;
    }

    const avg = totalBright / samples;
    const freq = map(avg, 0, 255, 80, 1200);
    osc.freq(freq, 0.08);

    angle += 0.5;
  }

  // play btn
  let btnX = SIDEBAR_W + 30;
  let btnY = 30;
  let btnSize = 20;
  fill(200);
  noStroke();
  textSize(18);
  textAlign(LEFT, BOTTOM);
  if (isPlaying) {
    rect(btnX, btnY, btnSize * 0.3, btnSize);
    rect(btnX + btnSize * 0.6, btnY, btnSize * 0.3, btnSize);
    text("click to pause the music", btnX + btnSize + 15, btnY + btnSize);
  } else {
    triangle(
      btnX,
      btnY,
      btnX,
      btnY + btnSize,
      btnX + btnSize,
      btnY + btnSize / 2,
    );
    text("click to play the music", btnX + btnSize + 15, btnY + btnSize);
  }
}

function drawStylus() {
  let sx = width - 300;
  let sy = 0;
  let sw = 290;
  let sh = 700;

  push();
  translate(sx + sw / 2, sy + sh / 2);

  if (isPlaying) {
    translate(-50, 0);
    rotate(radians(10));
  }

  imageMode(CENTER);
  image(img, 0, 0, sw, sh);
  pop();
}

// ── draw ─────────────────────────────────────────────────
function draw() {
  background(0);
  noStroke();
  fill(0);
  rect(SIDEBAR_W, 0, width - SIDEBAR_W, height);

  drawVinyl();
  drawSidebar();
  drawStylus();
}
