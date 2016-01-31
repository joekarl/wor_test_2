"use strict";

const editorEl = document.getElementById("editor");
const levelTextEl = document.getElementById("levelText");
const editorCtx = editorEl.getContext("2d");
const LEVEL_WIDTH = 13;
const LEVEL_HEIGHT = 7;
const EDITOR_WIDTH = 800;
const EDITOR_HEIGHT = 600;
editorEl.width = EDITOR_WIDTH;
editorEl.height = EDITOR_HEIGHT;
const GRID_WIDTH = EDITOR_WIDTH / LEVEL_WIDTH;
const GRID_HEIGHT = EDITOR_HEIGHT / LEVEL_HEIGHT;
const GRID_FLAGS = {
  WALL_LEFT: 1 << 0,
  WALL_DOWN: 1 << 1,
  WALL_UP: 1 << 2,
  WALL_RIGHT: 1 << 3,
  WRAP_POINT: 1 << 4,
};
var mouseX, mouseY;
var level;

initLevel();
updateLevelText();
drawEditor();

levelTextEl.addEventListener("change", manualEdit);
editorEl.addEventListener("mousemove", updateMouse);
editorEl.addEventListener("mousewheel", onClick);
editorEl.addEventListener("click", onClick);

function updateMouse(e) {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
  drawEditor();
}

function onClick(e) {
  const modifier = e.shiftKey;
  mouseX = e.offsetX;
  mouseY = e.offsetY;
  const gridXY = xyToGrid(mouseX, mouseY);
  if (modifier) {
    const flags = level[gridXY[1]][gridXY[0]];
    if (flags & GRID_FLAGS.WRAP_POINT) {
      level[gridXY[1]][gridXY[0]] &= ~GRID_FLAGS.WRAP_POINT;
    } else {
      level[gridXY[1]][gridXY[0]] |= GRID_FLAGS.WRAP_POINT;
    }
  } else {
    const delta = e.wheelDelta && e.wheelDelta < 0 ? -1 : 1;
    if (((level[gridXY[1]][gridXY[0]] & 0b1111) == 0b1111) && delta > 0) {
      level[gridXY[1]][gridXY[0]] &= 0b10000;
    } else if (((level[gridXY[1]][gridXY[0]] & 0b1111) == 0b0000) && delta < 0) {
      level[gridXY[1]][gridXY[0]] |= 0b1111;
    } else {
      level[gridXY[1]][gridXY[0]] += delta;
    }
  }
  updateLevelText();
  drawEditor();
}

function manualEdit() {
  try {
    level = eval(levelTextEl.value)
    drawEditor();
  } catch(e) {
    console.log("Invalid level edit");
  }
}

function initLevel() {
  var i, j;

  level = new Array(LEVEL_HEIGHT);
  for (i = 0; i < LEVEL_HEIGHT; ++i) {
    level[i] = new Array(LEVEL_WIDTH);
    for (j = 0; j < LEVEL_WIDTH; ++j) {
      level[i][j] = 0b000000;
    }
  }
}

function updateLevelText() {
  var i, j;

  levelTextEl.value = "";
  levelTextEl.value += "[\n";
  for (i = 0; i < LEVEL_HEIGHT; ++i) {
    levelTextEl.value += "  [";
    for (j = 0; j < LEVEL_WIDTH; ++j) {
      levelTextEl.value += "0b" + level[i][j].toString(2);
      if (j != (LEVEL_WIDTH - 1)) {
        levelTextEl.value += ",";
      }
    }
    levelTextEl.value += "]";
    if (i != (LEVEL_HEIGHT - 1)) {
      levelTextEl.value += ",";
    }
    levelTextEl.value += "\n";
  }
  levelTextEl.value += "]";
}

function drawEditor() {
  var i, j, k;

  editorCtx.save();

  // clear canvas
  editorCtx.fillStyle = "#000";
  editorCtx.fillRect(0, 0, EDITOR_WIDTH, EDITOR_HEIGHT);

  // draw current mouse position
  if (mouseX && mouseY) {
    const gridXY = xyToGrid(mouseX, mouseY);
    editorCtx.save();
    editorCtx.fillStyle = "#555";
    editorCtx.fillRect(gridXY[0] * GRID_WIDTH, gridXY[1] * GRID_HEIGHT, GRID_WIDTH, GRID_HEIGHT);
    editorCtx.restore();
  }

  // draw grid dividers
  editorCtx.save();
  editorCtx.strokeStyle = "#C2C2C2";
  editorCtx.strokeWidth = "1px";
  for (i = 1; i < LEVEL_HEIGHT; ++i) {
    editorCtx.beginPath();
    editorCtx.moveTo(0, i * GRID_HEIGHT);
    editorCtx.lineTo(EDITOR_WIDTH, i * GRID_HEIGHT);
    editorCtx.stroke();
  }
  for (i = 1; i < LEVEL_WIDTH; ++i) {
    editorCtx.beginPath();
    editorCtx.moveTo(i * GRID_WIDTH, 0);
    editorCtx.lineTo(i * GRID_WIDTH, EDITOR_HEIGHT);
    editorCtx.stroke();
  }
  editorCtx.restore();

  // draw each grid cell
  const wallWidth = 4;
  editorCtx.strokeStyle = "#00F";
  editorCtx.lineWidth = wallWidth;
  for (i = 0; i < LEVEL_HEIGHT; ++i) {
    for (j = 0; j < LEVEL_WIDTH; ++j) {
      const flags = level[i][j];
      if (flags & GRID_FLAGS.WALL_LEFT) {
        editorCtx.beginPath();
        editorCtx.moveTo(j * GRID_WIDTH + wallWidth, i * GRID_HEIGHT);
        editorCtx.lineTo(j * GRID_WIDTH + wallWidth, i * GRID_HEIGHT + GRID_HEIGHT);
        editorCtx.stroke();
      }
      if (flags & GRID_FLAGS.WALL_RIGHT) {
        editorCtx.beginPath();
        editorCtx.moveTo(j * GRID_WIDTH - wallWidth + GRID_WIDTH, i * GRID_HEIGHT);
        editorCtx.lineTo(j * GRID_WIDTH - wallWidth + GRID_WIDTH, i * GRID_HEIGHT + GRID_HEIGHT);
        editorCtx.stroke();
      }
      if (flags & GRID_FLAGS.WALL_UP) {
        editorCtx.beginPath();
        editorCtx.moveTo(j * GRID_WIDTH, i * GRID_HEIGHT + wallWidth);
        editorCtx.lineTo(j * GRID_WIDTH + GRID_WIDTH, i * GRID_HEIGHT + wallWidth);
        editorCtx.stroke();
      }
      if (flags & GRID_FLAGS.WALL_DOWN) {
        editorCtx.beginPath();
        editorCtx.moveTo(j * GRID_WIDTH, i * GRID_HEIGHT - wallWidth + GRID_HEIGHT);
        editorCtx.lineTo(j * GRID_WIDTH + GRID_WIDTH, i * GRID_HEIGHT - wallWidth + GRID_HEIGHT);
        editorCtx.stroke();
      }

      if (flags & GRID_FLAGS.WRAP_POINT) {
        editorCtx.save();
        editorCtx.fillStyle = "#F00";
        editorCtx.fillText("W", j * GRID_WIDTH + GRID_WIDTH / 2 - 5, i * GRID_HEIGHT + GRID_HEIGHT / 2 + 5);
        editorCtx.restore();
      }
    }
  }

  editorCtx.restore();
}

function xyToGrid(x, y) {
  const gridX = Math.floor(x / GRID_WIDTH);
  const gridY = Math.floor(y / GRID_HEIGHT);
  return [gridX, gridY];
}
