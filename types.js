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
  REMOVE_ON_ENTITY_COLLISION: 1 << 5, // remove when collides with an entity
  REMOVE_ON_WALL_COLLISION: 1 << 6, // remove when have to change directions
  SIM_COLLISIONS: 1 << 7, // will be tested for collisions with other entities
};

function GameState() {
  this.initialized = false;
  this.entities = [];
  this.level = null;
  this.warpTimeout = 0;
}

function Entity() {
  this.simFlags = 0; // no flags
  this.position = new Vec2(0, 0); // grid position
  this.previousPosition = new Vec2(0, 0); // previous position
  this.targetGridPosition = new Vec2(0, 0); // where the entity wants to go next
  this.facingDirection = new Vec2(1, 0); // which direction the entity is facing
  this.desiredDirection = new Vec2(0, 0); // used for input controlled entities
}

const makePlayer = () => {
  var e = new Entity();
  e.simFlags = e.simFlags |
    SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.INPUT_CONTROLLED |
    SIM_ENTITY_FLAGS.CAN_WRAP |
    SIM_ENTITY_FLAGS.REMOVE_ON_ENTITY_COLLISION |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS;
  return e;
};

const makeEnemy = () => {
  var e = new Entity();
  e.simFlags = e.simFlags |
    SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.AI_CONTROLLED |
    SIM_ENTITY_FLAGS.CAN_WRAP |
    SIM_ENTITY_FLAGS.REMOVE_ON_ENTITY_COLLISION |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS;
  return e;
};

const makeLaser = () => {
  var e = new Entity();
  e.simFlags = e.simFlags |
    SIM_ENTITY_FLAGS.GRID_SIM |
    SIM_ENTITY_FLAGS.REMOVE_ON_ENTITY_COLLISION |
    SIM_ENTITY_FLAGS.REMOVE_ON_WALL_COLLISION |
    SIM_ENTITY_FLAGS.SIM_COLLISIONS;
  return e;
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
