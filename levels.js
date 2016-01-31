"use strict";

const LEVELS = [
  [
    [0b0,0b101,0b110,0b1100,0b101,0b110,0b100,0b110,0b1100,0b101,0b110,0b1100,0b0],
    [0b0,0b1001,0b101,0b10,0b0,0b110,0b0,0b110,0b0,0b10,0b1100,0b1001,0b0],
    [0b10110,0b10,0b1000,0b101,0b0,0b1100,0b1001,0b101,0b0,0b1100,0b1,0b10,0b10110],
    [0b0,0b101,0b10,0b1000,0b1001,0b1001,0b1001,0b1001,0b1001,0b1,0b10,0b1100,0b0],
    [0b0,0b1,0b110,0b0,0b1010,0b1,0b0,0b1000,0b11,0b0,0b110,0b1000,0b0],
    [0b0,0b11,0b110,0b10,0b110,0b1010,0b1011,0b11,0b110,0b10,0b110,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b1100,0b0],
    [0b0,0b1001,0b1,0b1000,0b1,0b10,0b10,0b10,0b1000,0b1,0b1000,0b1001,0b0],
    [0b10110,0b1000,0b1001,0b1001,0b1,0b100,0b110,0b100,0b1000,0b1001,0b1001,0b1,0b10110],
    [0b0,0b1001,0b1001,0b1001,0b1,0b10,0b110,0b10,0b1000,0b1001,0b1001,0b1001,0b0],
    [0b0,0b1,0b1000,0b1,0b0,0b100,0b100,0b100,0b0,0b1000,0b1,0b1000,0b0],
    [0b0,0b11,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b100,0b110,0b110,0b110,0b100,0b110,0b110,0b110,0b100,0b1100,0b0],
    [0b0,0b1,0b1010,0b101,0b100,0b100,0b0,0b100,0b100,0b1100,0b11,0b1000,0b0],
    [0b10110,0b0,0b110,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b110,0b0,0b10110],
    [0b0,0b1,0b1100,0b11,0b10,0b10,0b0,0b10,0b10,0b1010,0b101,0b1000,0b0],
    [0b0,0b1,0b0,0b100,0b100,0b100,0b0,0b100,0b100,0b100,0b0,0b1000,0b0],
    [0b0,0b11,0b10,0b10,0b1010,0b11,0b10,0b1010,0b11,0b10,0b10,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b1100,0b0],
    [0b0,0b1,0b1010,0b1,0b1000,0b1001,0b1001,0b1001,0b1,0b1000,0b11,0b1000,0b0],
    [0b10110,0b10,0b110,0b10,0b0,0b1000,0b1001,0b1,0b0,0b10,0b110,0b10,0b10110],
    [0b0,0b101,0b110,0b100,0b10,0b1000,0b1001,0b1,0b10,0b100,0b110,0b1100,0b0],
    [0b0,0b1001,0b101,0b1000,0b101,0b1000,0b1001,0b1,0b1100,0b1,0b1100,0b1001,0b0],
    [0b0,0b11,0b1010,0b11,0b10,0b10,0b10,0b10,0b10,0b1010,0b11,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b1100,0b0],
    [0b0,0b1001,0b1,0b0,0b0,0b1010,0b11,0b10,0b0,0b0,0b0,0b1000,0b0],
    [0b10110,0b1000,0b1,0b0,0b1000,0b1000,0b0,0b10,0b11,0b10,0b0,0b0,0b10110],
    [0b0,0b1001,0b11,0b1010,0b1011,0b1010,0b1000,0b1000,0b0,0b0,0b1,0b1000,0b0],
    [0b0,0b1,0b100,0b100,0b1100,0b0,0b1000,0b1000,0b0,0b0,0b1,0b1000,0b0],
    [0b0,0b11,0b10,0b10,0b10,0b110,0b1110,0b1110,0b110,0b111,0b10,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b110,0b110,0b1100,0b101,0b100,0b1100,0b101,0b110,0b110,0b1100,0b0],
    [0b0,0b1001,0b101,0b110,0b10,0b1000,0b1001,0b1,0b10,0b110,0b1100,0b1001,0b0],
    [0b10110,0b10,0b1000,0b101,0b100,0b10,0b0,0b10,0b100,0b1100,0b1,0b10,0b10110],
    [0b0,0b101,0b1000,0b1001,0b1,0b110,0b10,0b110,0b1000,0b1001,0b1,0b1100,0b0],
    [0b0,0b1001,0b1,0b0,0b0,0b110,0b100,0b110,0b0,0b0,0b1000,0b1001,0b0],
    [0b0,0b11,0b10,0b1010,0b11,0b110,0b10,0b110,0b1010,0b11,0b10,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b0,0b101,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b1100,0b0],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b10110,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b10110],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b0,0b11,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b1010,0b0],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ],
  [
    [0b10110,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b100,0b10110],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b0,0b1,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1000,0b0],
    [0b10110,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10,0b10110],
    [0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b0,0b1011,0b0]
  ]
];

const isValidGridPosition = (gridXY, level) => {
  const levelWidth = level[0].length;
  const levelHeight = level.length;
  return (gridXY.x >= 0 &&
          gridXY.x < levelWidth &&
          gridXY.y >= 0 &&
          gridXY.y < levelHeight);
};

const canMoveInDirection = (gridXY, direction, level, warpTimeout) => {
  if (direction.isZero() || !isValidGridPosition(vec2Add(gridXY, direction), level)) {
    return false;
  }

  // build a direction mask we can compare to our grid location
  var directionMask = 0b0000;
  if (direction.x == 1) {
    directionMask |= GRID_FLAGS.WALL_RIGHT;
  } else if (direction.x == -1) {
    directionMask |= GRID_FLAGS.WALL_LEFT;
  } else if (direction.y == 1) {
    directionMask |= GRID_FLAGS.WALL_DOWN;
  } else if (direction.y == -1) {
    directionMask |= GRID_FLAGS.WALL_UP;
  }

  var levelTile = level[gridXY.y][gridXY.x];
  const nextGridXY = vec2Add(gridXY, direction);
  const nextLevelTile = level[nextGridXY.y][nextGridXY.x];
  if (nextLevelTile & GRID_FLAGS.WRAP_POINT && warpTimeout > 0) {
    // we need to block one of our directions
    if (nextGridXY.x == 0) {
      levelTile |= GRID_FLAGS.WALL_LEFT;
    } else {
      levelTile |= GRID_FLAGS.WALL_RIGHT;
    }
  }

  // we're blocked if we match any of wall flags
  const isBlocked = (levelTile & directionMask);
  return !isBlocked;
};
