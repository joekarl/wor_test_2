"use strict";

/**
 * core game types
 */

const GRID_FLAGS = {
  WALL_LEFT: 1 << 0,
  WALL_DOWN: 1 << 1,
  WALL_UP: 1 << 2,
  WALL_RIGHT: 1 << 3,
  WRAP_POINT: 1 << 4,
};

const SIM_ENTITY_FLAGS = {
  GRID_SIM: 1 << 1, // simulate movement inside of the grid
  AI_CONTROLLED: 1 << 2, // cpu controls movement decisions
  INPUT_CONTROLLED: 1 << 3, // user controls movement decisions
  CAN_WRAP: 1 << 4, // can wrap from left/right side
  STRAIGHT_LINE_SIM: 1 << 5, // only move in straight line
  SIM_COLLISIONS: 1 << 7, // will be tested for collisions with other entities
  CAN_UPGRADE: 1 << 8, // set if enemy can be upgraded
  RENDER: 1 << 9, // set if should be drawn
  DYING: 1 << 10, // set if should be dying
  DEAD: 1 << 12,
  PLAYER_FIREABLE_LASER: 1 << 13,
};

const ENTITY_TYPES = {
  PLAYER: 1 << 0,
  ENEMY_1: 1 << 1,
  ENEMY_2: 1 << 2,
  ENEMY_3: 1 << 3,
  LASER: 1 << 4,
};

const LASER_DIRECTIONS = {
  HORIZONTAL: 1 << 0,
  VERTICAL: 1 << 1,
};

const GAME_MODES = {
  INTRO: 1 << 0,
  MAIN_MENU: 1 << 1,
  GAME_PLAY: 1 << 2,
  GAME_OVER: 1 << 3,
};

const GAME_PLAY_STATES = {
  PLAYING: 1 << 0,
  LOADING: 1 << 1,
  CHANGE_LEVEL: 1 << 2,
};

const MAX_DEATH_TIMEOUT = 60/*fps*/ * 1.5/*seconds*/;

function GameState(input) {
  this.mode = GAME_MODES.GAME_PLAY;
  this.modeState = undefined;
  this.input = input;
}

function GamePlayModeState() {
  this.initialized = false;
  this.entities = [];
  this.level = 0;
  this.maxEnemySpeed = 0.04;
  this.enemySpeed = 0.01;
  this.enemySpeedTimeout = 0;
  this.warpTimeout = 0;
  this.playerLives = -1;
  this.canFireLaser = true;
  this.gamePlayState = GAME_PLAY_STATES.LOADING;
  this.gamePlayStateTimeout = 0;
  this.loadingAssets = false;
  this.sprites = {};
}

function Entity() {
  this.simFlags = 0; // no flags
  this.position = new Vec2(0, 0); // grid position
  this.previousPosition = new Vec2(0, 0); // previous position
  this.targetGridPosition = new Vec2(0, 0); // where the entity wants to go next
  this.facingDirection = new Vec2(1, 0); // which direction the entity is facing
  this.desiredDirection = new Vec2(0, 0); // used for input controlled entities
  this.collisionBounds = new Rect(0, 0, NaN, NaN); // used for collision detection, initially invalid
  this.entityType = undefined;
  this.deathTimeout = -1;
  this.sprite = undefined;
}

const makePlayer = (position) => {
  var e = new Entity();
  resetPlayer(e, position);
  return e;
};

const makeEnemy = (position) => {
  var e = new Entity();
  resetEnemy(e, position);
  return e;
};

const makeLaser = (position, direction, playerFireable) => {
  var e = new Entity();
  resetLaser(e, position, direction, playerFireable);
  return e;
};

const resetPlayer = (e, position) => {
  e.entityType = ENTITY_TYPES.PLAYER;
  e.simFlags = SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.INPUT_CONTROLLED |
    SIM_ENTITY_FLAGS.CAN_WRAP |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS |
    SIM_ENTITY_FLAGS.RENDER;
  e.position.set(position);
  e.previousPosition.set(e.position);
  e.targetGridPosition.set(e.position);
  e.deathTimeout = MAX_DEATH_TIMEOUT;
};

const resetEnemy = (e, position) => {
  e.entityType = ENTITY_TYPES.ENEMY_1;
  e.simFlags = SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.AI_CONTROLLED |
    SIM_ENTITY_FLAGS.CAN_WRAP |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS |
    SIM_ENTITY_FLAGS.RENDER;
  e.position.set(position);
  e.previousPosition.set(e.position);
  e.targetGridPosition.set(e.position);
  e.deathTimeout = MAX_DEATH_TIMEOUT;
};

const resetLaser = (e, position, direction, playerFireable) => {
  e.entityType = ENTITY_TYPES.LASER;
  e.simFlags = SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS |
    SIM_ENTITY_FLAGS.STRAIGHT_LINE_SIM |
    SIM_ENTITY_FLAGS.RENDER;
  if (playerFireable) {
    e.simFlags |= SIM_ENTITY_FLAGS.PLAYER_FIREABLE_LASER;
  }
  e.position.set(position);
  e.facingDirection.set(direction);
  var newTarget = position;
  const gridXY = vec2Round(position);
  if (!position.isEqual(gridXY)) {
    newTarget = vec2Add(vec2Round(position), direction);
  }
  e.targetGridPosition.set(newTarget);
  e.collisionBounds.width = vec2Mul(direction, 0.3).x || 0.1;
  e.collisionBounds.height = vec2Mul(direction, 0.3).y || 0.1;
};

function Vec2(x, y) {
  this.x = x;
  this.y = y;
}

Vec2.prototype.add = function (aVec) {
  this.x = this.x + aVec.x;
  this.y = this.y + aVec.y;
};

Vec2.prototype.sub = function (aVec) {
  this.x -= aVec.x;
  this.y -= aVec.y;
};

Vec2.prototype.mult = function (scaler) {
  this.x *= scaler;
  this.y *= scaler;
};

Vec2.prototype.div = function (scaler) {
  this.x /= scaler;
  this.y /= scaler;
};

Vec2.prototype.isZero = function () {
  return this.x == 0 && this.y == 0;
};

Vec2.prototype.set = function (aVec) {
  this.x = aVec.x;
  this.y = aVec.y;
};

Vec2.prototype.isEqual = function (aVec) {
  return this.x == aVec.x && this.y == aVec.y;
};

const vec2Floor = (aVec) => {
  return new Vec2(Math.floor(aVec.x), Math.floor(aVec.y));
};

// compare 2 vectors, return a unit vector with the common components
// (0, 1) and (1, 1) returns (0, 1)
// (-1, 0) and (-1, 0) returns (-1, 0)
// (-1, 0) and (1, 0) returns (0, 0)
// (-1, 0) and (0, 0) returns (0, 0)
const vec2CompareExactComponents = (aVec2, bVec2) => {
  return new Vec2(
    aVec2.x == bVec2.x && bVec2.x != 0 ? aVec2.x : 0,
    aVec2.y == bVec2.y && bVec2.y != 0 ? aVec2.y : 0
  );
};

// compare 2 vectors, return a unit vector with the common components
// differs from vec2CompareExactComponents as this will return the value from aVec2
// if both vecs have non zero components
// (0, 1) and (1, 1) returns (0, 1)
// (-1, 0) and (-1, 0) returns (-1, 0)
// (-1, 0) and (1, 0) returns (-1, 0)
// (-1, 0) and (0, 0) returns (0, 0)
const vec2CompareLikeComponents = (aVec2, bVec2) => {
  return new Vec2(
    aVec2.x != 0 && bVec2.x != 0 ? aVec2.x : 0,
    aVec2.y != 0 && bVec2.y != 0 ? aVec2.y : 0
  );
};

// compare 2 vectors, return a unit vector with the un common components
// (0, 1) and (1, 1) returns (1, 0)
// (-1, 0) and (-1, 0) returns (0, 0)
// (-1, 0) and (0, 0) returns (-1, 0)
// (0, 0) and (0, -1) returns (0, -1)
const vec2CompareUnLikeComponents = (aVec2, bVec2) => {
  return new Vec2(
    aVec2.x != 0 && bVec2.x == 0 ? aVec2.x : 0,
    aVec2.y != 0 && bVec2.y == 0 ? aVec2.y : 0
  );
};

const vec2Round = (aVec2) => {
  return new Vec2(Math.round(aVec2.x), Math.round(aVec2.y));
};

// special case where we know that the vec will be (0, y) or (x, 0)
const vec2GridDirectionToUnit = (aVec2) => {
  if (aVec2.isZero()) {
    return new Vec2(0, 0);
  } else if (aVec2.x > 0) {
    return new Vec2(1, 0);
  } else if (aVec2.x < 0) {
    return new Vec2(-1, 0);
  } else if (aVec2.y > 0) {
    return new Vec2(0, 1);
  } else if (aVec2.y < 0) {
    return new Vec2(0, -1);
  }
};

const vec2Add = (aVec2, bVec2) => {
  return new Vec2(aVec2.x + bVec2.x, aVec2.y + bVec2.y);
};

const vec2Sub = (aVec2, bVec2) => {
  return new Vec2(aVec2.x - bVec2.x, aVec2.y - bVec2.y);
};

const vec2Mul = (aVec2, scalar) => {
  return new Vec2(aVec2.x * scalar, aVec2.y * scalar);
};

const vec2Div = (aVec2, scalar) => {
  return new Vec2(aVec2.x / scalar, aVec2.y / scalar);
};

function Rect(centerX, centerY, width, height) {
  this.centerX = centerX;
  this.centerY = centerY;
  this.width = width;
  this.height = height;
}

const rectApplyPosition = (aRect, aVec2) => {
  return new Rect(
    aRect.centerX + aVec2.x,
    aRect.centerY + aVec2.y,
    aRect.width,
    aRect.height
  );
};

const rectMinkowskiSum = (aRect, bRect) => {
  return new Rect(
    aRect.centerX,
    aRect.centerY,
    aRect.width + bRect.width,
    aRect.height + bRect.height
  );
};

const rectContainsPoint = (aRect, aVec2) => {
  const left = aRect.centerX - aRect.width / 2;
  const up = aRect.centerY - aRect.height / 2;
  const right = left + aRect.width;
  const down = up + aRect.height;
  return (aVec2.x > left && aVec2.x < right && aVec2.y > up && aVec2.y < down);
};

function Sprite(tag, resourceImg, startingFrame, endingFrame, frameDuration, loop) {
  this.tag = tag;
  this.resourceImg = resourceImg;
  this.startingFrame = startingFrame;
  this.endingFrame = endingFrame;
  this.frameDuration = frameDuration;
  this.loop = loop;
  this.frameCounter = 0;
  this.currentFrame = this.startingFrame;
  this.nextSprite = undefined;
}

Sprite.prototype.draw = function(x, y, width, height, facingDirection) {
  if (this.frameCounter >= this.frameDuration) {
    this.currentFrame++;
    this.frameCounter = 0;
    if (this.currentFrame > this.endingFrame && this.loop) {
      this.currentFrame = this.startingFrame;
    } else if (this.currentFrame >= this.endingFrame && !this.loop) {
      if (this.nextSprite) {
        this.copy(this.nextSprite);
      } else {
        this.currentFrame = this.endingFrame;
      }
    }
  }

  const frameWidth = 32;
  const frameHeight = 32;
  const frameOffsetX = this.currentFrame * frameWidth;
  const frameOffsetY = 0; // all sprites are linear
  const flippedHorizontal = (facingDirection.x == -1) || (facingDirection.y == 1);
  var rotationAngle = 0;
  if (facingDirection.y != 0) {
    rotationAngle = 270 / 180 * Math.PI;
  }

  RENDERER.drawImage(this.resourceImg, x, y, width, height, frameOffsetX, frameOffsetY, frameWidth, frameHeight, flippedHorizontal, rotationAngle);

  this.frameCounter++;
};

Sprite.prototype.copy = function(otherSprite) {
  this.tag = otherSprite.tag;
  this.resourceImg = otherSprite.resourceImg;
  this.startingFrame = otherSprite.startingFrame;
  this.endingFrame = otherSprite.endingFrame;
  this.frameDuration = otherSprite.frameDuration;
  this.loop = otherSprite.loop;
  this.frameCounter = 0;
  this.currentFrame = this.startingFrame;
  if (otherSprite.nextSprite) {
    this.nextSprite = (new Sprite()).copy(otherSprite.nextSprite);
  }
  return this;
};
