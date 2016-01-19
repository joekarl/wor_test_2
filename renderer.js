"use strict";

const RENDERER = (() => {
  const canvasEl = document.getElementById('gameCanvas');
  const WIDTH = 800;
  const HEIGHT = 600;
  canvasEl.width = WIDTH;
  canvasEl.height = HEIGHT;
  const ctx2D = canvasEl.getContext('2d');
  const LINE_WIDTH = WIDTH / 200;

  const clearCanvas = () => {
    ctx2D.fillStyle = "#000";
    ctx2D.fillRect(0, 0, WIDTH, HEIGHT);
  };

  const fillRect = (x, y, width, height, fillStyle) => {
    ctx2D.save();

    if (fillStyle) ctx2D.fillStyle = fillStyle;
    ctx2D.fillRect(x, y, width, height);

    ctx2D.restore();
  };

  const strokeRect = (x, y, width, height, strokeStyle) => {
    ctx2D.save();

    if (strokeStyle) ctx2D.strokeStyle = strokeStyle;
    ctx2D.strokeRect(x, y, width, height);

    ctx2D.restore();
  };

  const drawLevel = (x, y, width, height, level, warpTimeout) => {
    const levelWidth = level[0].length;
    const levelHeight = level.length;
    const gridWidth = width / levelWidth;
    const gridHeight = height / levelHeight;

    ctx2D.save();

    for (var gridY = 0; gridY < levelHeight; ++gridY) {
      for (var gridX = 0; gridX < levelWidth; ++gridX) {
        drawGridPoint(gridX, gridY, x, y, gridWidth, gridHeight, level, warpTimeout);
      }
    }

    ctx2D.restore();
  };

  const drawGridPoint = (gridX, gridY, offsetX, offsetY, gridWidth, gridHeight, level, warpTimeout) => {

    const gridLeft = gridX * gridWidth + offsetX;
    const gridRight = (gridX + 1) * gridWidth + offsetX;
    const gridUp = gridY * gridHeight + offsetY;
    const gridDown = (gridY + 1) * gridHeight + offsetY;

    const lineColor = "#00F";

    const flags = level[gridY][gridX];
    if (flags & GRID_FLAGS.WALL_LEFT) {
      strokeLine(gridLeft, gridUp, gridLeft, gridDown, LINE_WIDTH, lineColor);
    }
    if (flags & GRID_FLAGS.WALL_RIGHT) {
      strokeLine(gridRight, gridUp, gridRight, gridDown, LINE_WIDTH, lineColor);
    }
    if (flags & GRID_FLAGS.WALL_UP) {
      strokeLine(gridLeft, gridUp, gridRight, gridUp, LINE_WIDTH, lineColor);
    }
    if (flags & GRID_FLAGS.WALL_DOWN) {
      strokeLine(gridLeft, gridDown, gridRight, gridDown, LINE_WIDTH, lineColor);
    }

    if (flags & GRID_FLAGS.WRAP_POINT) {
      const warpAvailable = (warpTimeout <= 0);
      if (gridX == 0) {
        if (warpAvailable) {
          drawArrow(gridLeft + gridWidth / 3, gridUp + gridHeight / 2,
            gridWidth / 3,  gridHeight / 3, true, LINE_WIDTH, "#F00");
        }
        strokeLine(gridRight, gridUp, gridRight, gridDown, LINE_WIDTH, "#F00", warpAvailable);
      } else {
        if (warpAvailable) {
          drawArrow(gridRight - gridWidth / 3, gridUp + gridHeight / 2,
            gridWidth / 3, gridHeight / 3, false, LINE_WIDTH, "#F00");
        }
        strokeLine(gridLeft, gridUp, gridLeft, gridDown, LINE_WIDTH, "#F00", warpAvailable);
      }
    }
  };

  const strokeLine = (x1, y1, x2, y2, lineWidth, strokeStyle, dashed) => {
    ctx2D.save();

    if (strokeStyle) ctx2D.strokeStyle = strokeStyle;
    if (lineWidth) ctx2D.lineWidth = lineWidth;
    if (dashed) {
      const dashLength = (x1 == x2) ?
        Math.abs(y2 - y1) / (4 + lineWidth) :
        Math.abs(x2 - x1) / (4 + lineWidth);
      ctx2D.setLineDash([dashLength, dashLength + lineWidth]);
    }

    ctx2D.beginPath();
    ctx2D.moveTo(x1, y1);
    ctx2D.lineTo(x2, y2);
    ctx2D.closePath();
    ctx2D.stroke();

    ctx2D.restore();
  };

  const drawArrow = (x, y, width, height, pointLeft, lineWidth, strokeStyle) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    strokeLine(x - halfWidth, y, x + halfWidth, y, lineWidth, strokeStyle, false);
    if (pointLeft) {
      strokeLine(x - halfWidth, y, x, y - halfHeight, lineWidth, strokeStyle, false);
      strokeLine(x - halfWidth, y, x, y + halfHeight, lineWidth, strokeStyle, false);
    } else {
      strokeLine(x + halfWidth, y, x, y - halfHeight, lineWidth, strokeStyle, false);
      strokeLine(x + halfWidth, y, x, y + halfHeight, lineWidth, strokeStyle, false);
    }
  };

  const fillText = (text, x, y, fillStyle, font) => {
    ctx2D.save();
    if (font) ctx2D.font = font;
    if (fillStyle) ctx2D.fillStyle = fillStyle;

    ctx2D.fillText(text, x, y);

    ctx2D.restore();
  };

  const drawImage = (img, x, y, width, height, srcX, srcY, srcWidth, srcHeight, flippedHorizontal, rotationAngle) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    ctx2D.save();

    ctx2D.translate(x, y);
    if (rotationAngle) ctx2D.rotate(rotationAngle);
    if (flippedHorizontal) ctx2D.scale(-1, 1);

    ctx2D.drawImage(img, srcX, srcY, srcWidth, srcHeight, -halfWidth, -halfHeight, width, height);

    ctx2D.restore();
  };

  return {
    clearCanvas,
    drawImage,
    drawLevel,
    fillRect,
    fillText,
    strokeLine,
    strokeRect,
    WIDTH,
    HEIGHT
  };
})();
