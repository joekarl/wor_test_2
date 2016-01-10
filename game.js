"use strict";

const LEVELS = [
  // level 0
  [
    [ 0b000000, 0b000101, 0b000110, 0b000100, 0b000110, 0b000110, 0b000110, 0b001100, 0b000000],
    [ 0b000000, 0b000001, 0b000110, 0b001010, 0b000101, 0b000110, 0b000110, 0b001000, 0b000000],
    [ 0b010110, 0b000000, 0b000110, 0b000100, 0b001000, 0b000101, 0b000100, 0b000000, 0b010110],
    [ 0b000000, 0b000001, 0b001100, 0b000011, 0b000000, 0b000010, 0b000010, 0b001000, 0b000000],
    [ 0b000000, 0b001001, 0b000001, 0b000100, 0b000000, 0b000100, 0b000110, 0b001000, 0b000000],
    [ 0b000000, 0b000011, 0b001010, 0b000011, 0b001010, 0b000011, 0b000110, 0b001010, 0b000000],
    [ 0b000000, 0b000000, 0b000000, 0b000000, 0b000000, 0b000000, 0b000000, 0b001011, 0b000000]
  ]

];

const gameState = new GameState();
const input = new Input();
const WORLD_OFFSET = 20;
const PLAYER_SPEED = 0.02;
const KEY_BINDINGS = {
  UP:     38,
  DOWN:   40,
  LEFT:   37,
  RIGHT:  39,
  SPACE:  32,
};
const MAX_WARP_TIMEOUT = 60/*fps*/ * 10/*seconds*/;

const gameLoop = () => {

  if (!gameState.initialized) {
    gameState.level = LEVELS[0];
    const player = makePlayer();
    player.position.set(new Vec2(1, 1));
    player.previousPosition.set(player.position);
    player.targetGridPosition.set(player.position);
    gameState.entities.push(player);

    gameState.initialized = true;
  }

  if (gameState.warpTimeout > 0) {
    gameState.warpTimeout--;
  }

  // update the game
  gameState.entities.forEach((e) => {
    if (e.simFlags & SIM_ENTITY_FLAGS.INPUT_CONTROLLED) {
      e.desiredDirection.set(new Vec2(0, 0));
      if (input.isActive(KEY_BINDINGS.UP)) {
        e.desiredDirection.y -= 1;
      }
      if (input.isActive(KEY_BINDINGS.DOWN)) {
        e.desiredDirection.y += 1;
      }
      if (input.isActive(KEY_BINDINGS.LEFT)) {
        e.desiredDirection.x -= 1;
      }
      if (input.isActive(KEY_BINDINGS.RIGHT)) {
        e.desiredDirection.x += 1;
      }

      // if we don't have any direction keys pressed or we can't move, short circuit
      if (e.desiredDirection.isZero()) {
        // clear grid sim so we don't move, also short circuit
        e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
        return;
      } else {
        e.simFlags |= SIM_ENTITY_FLAGS.GRID_SIM;
      }

      const previousMovementVector = vec2GridDirectionToUnit(vec2Sub(e.targetGridPosition, e.position));

      if (!previousMovementVector.isZero()) {
        // we're not at a grid point, we need to figure out what our target grid point should be

        // first see if our desired direction is towards our current target
        const commonBetweenDesiredAndPrev = vec2CompareExactComponents(previousMovementVector, e.desiredDirection);
        if (commonBetweenDesiredAndPrev.isEqual(previousMovementVector)) {
          // if so, do nothing
        } else {
          // if we're wanting to move away then we need to calculate our new target point
          // first see if we're in the same grid point as our previous target
          const currentGridPoint = vec2Round(e.position);
          const inPreviousTargetPoint = currentGridPoint.isEqual(e.targetGridPosition);
          const likeBetweenDesiredAndPrev = vec2CompareLikeComponents(previousMovementVector, e.desiredDirection);
          const desiredMoveIsInAxisOfTarget = !likeBetweenDesiredAndPrev.isZero();
          if (inPreviousTargetPoint && desiredMoveIsInAxisOfTarget) {
            // we've desired a move towards or away from our target in the same axis
            // so we need to change move the target 1 unit away from the current target
            e.targetGridPosition.set(vec2Sub(e.targetGridPosition, likeBetweenDesiredAndPrev));
          } else if (!inPreviousTargetPoint && desiredMoveIsInAxisOfTarget) {
            // if not, we just need to set the new target position to the current grid point
            e.targetGridPosition.set(currentGridPoint);
          } else if (inPreviousTargetPoint) {
            // we've desired a move orthogonal to our target and we're facing our new target
            // see if we can move that direction from the new target grid point
            const orthogonalMovementVec = vec2CompareUnLikeComponents(e.desiredDirection, previousMovementVector);
            if (canMoveInDirection(currentGridPoint, orthogonalMovementVec, gameState.level, gameState.warpTimeout)) {
              // if so keep simming but set target to our current grid point
              e.targetGridPosition.set(currentGridPoint);
            } else if (canMoveInDirection(currentGridPoint, e.facingDirection, gameState.level, gameState.warpTimeout)) {
              // if not short circuit sim
              //e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
              e.targetGridPosition.add(e.facingDirection);
            } else {
              // we can't move in our desired orthogonal direction of facing direction
              // we have to stop moving
              e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
            }
          } else {
            // this state we're already facing our target and we have a direction held down
            // but we're not yet in our target grid points grid section
            // we don't need to change directions and don't need to short circuit the sim
            // just punt to general movement code
          }
        }
      } else {
        // we're at a grid point, punt to general sim code
      }

    }
  });

  // sim entities
  gameState.entities.forEach((e) => {
    if (!(e.simFlags & SIM_ENTITY_FLAGS.GRID_SIM)) {
      // if we don't have a grid sim flag set, short circuit
      return;
    }
    let distanceRemaining = PLAYER_SPEED;
    let maxIterations = 4;
    while (distanceRemaining > 0 && maxIterations-- > 0) {
      const previousMovementVector = vec2Sub(e.targetGridPosition, e.position);

      // if at grid point
      if (previousMovementVector.isZero()) {
        calculateTargetGridPoint(e, gameState.level, gameState.warpTimeout);
      }

      const targetMovementVector = vec2Sub(e.targetGridPosition, e.position);
      if (targetMovementVector.isZero()) {
        // we're not moving, short circuit
        break;
      }

      const distanceToTarget = Math.abs(targetMovementVector.x + targetMovementVector.y);
      const movementDirection = vec2GridDirectionToUnit(targetMovementVector);
      e.facingDirection.set(movementDirection);

      if (distanceToTarget < distanceRemaining) {
        distanceRemaining -= distanceToTarget;
        e.previousPosition.set(e.position);
        e.position.set(e.targetGridPosition);
      } else {
        const actualMovementVec = vec2Mul(movementDirection, distanceRemaining);
        const newPosition = vec2Add(e.position, actualMovementVec);
        e.previousPosition.set(e.position);
        e.position.set(newPosition);
        distanceRemaining = 0;
      }

      // check and see if we should wrap
      const currentGridPoint = vec2Round(e.position);
      const nearestEdgeGridPoint = e.position.x < currentGridPoint.x ?
        vec2Add(currentGridPoint, new Vec2(-1, 0)) :
        vec2Add(currentGridPoint, new Vec2(1, 0));
      const nearestEdgeLevelTile = gameState.level[nearestEdgeGridPoint.y][nearestEdgeGridPoint.x];
      if (e.position.x != currentGridPoint.x &&
          (nearestEdgeLevelTile & GRID_FLAGS.WRAP_POINT) &&
          gameState.warpTimeout <= 0) {
        // we're at a wrap point
        if (nearestEdgeGridPoint.x == 0) {
          e.position.set(new Vec2(gameState.level[0].length - 2, currentGridPoint.y));
        } else {
          e.position.set(new Vec2(1, currentGridPoint.y));
        }
        e.targetGridPosition.set(e.position);
        e.previousPosition.set(e.position);
        if (gameState.warpTimeout <= 0) {
          gameState.warpTimeout = MAX_WARP_TIMEOUT;
        }
      }
    }
  });

  // draw the game
  RENDERER.clearCanvas();
  RENDERER.drawLevel(
    WORLD_OFFSET,
    WORLD_OFFSET,
    RENDERER.WIDTH - WORLD_OFFSET * 2,
    RENDERER.HEIGHT - WORLD_OFFSET * 2,
    gameState.level,
    gameState.warpTimeout
  );

  const levelWidth = gameState.level[0].length;
  const levelHeight = gameState.level.length;
  const gridWidth = RENDERER.WIDTH / levelWidth * 0.8;
  const gridHeight = RENDERER.HEIGHT / levelHeight * 0.8;

  gameState.entities.forEach((e) => {
    const worldXY = gridToWorldXY(e.position, gameState.level, WORLD_OFFSET, RENDERER.WIDTH, RENDERER.HEIGHT);
    // draw entity body
    RENDERER.fillRect(worldXY.x - gridWidth / 2, worldXY.y - gridHeight / 2, gridWidth, gridHeight, "#FFF");
    // draw facing direction
    RENDERER.strokeLine(
      worldXY.x,
      worldXY.y,
      worldXY.x + e.facingDirection.x * gridWidth / 2,
      worldXY.y + e.facingDirection.y * gridHeight / 2,
      1, "#F00");
  });

  requestAnimationFrame(gameLoop);
};

const gridToWorldXY = (gridVec2, level, offset, width, height) => {
  //TODO(karl): don't calc this all the time o_0
  const levelWidth = level[0].length;
  const levelHeight = level.length;
  const gridWidth = (width - (offset * 2)) / levelWidth;
  const gridHeight = (height - (offset * 2)) / levelHeight;

  return new Vec2(
    offset + gridVec2.x * gridWidth + gridWidth / 2,
    offset + gridVec2.y * gridHeight + gridHeight / 2
  );
};

const isValidGridPosition = (gridXY, level) => {
  const levelWidth = level[0].length;
  const levelHeight = level.length;
  return (gridXY.x >= 0 &&
          gridXY.x < levelWidth &&
          gridXY.y >= 0 &&
          gridXY.y < levelHeight);
};

const calculateTargetGridPoint = (entity, level, warpTimeout) => {
  if (entity.simFlags & SIM_ENTITY_FLAGS.AI_CONTROLLED) {
    // pick a random direction to go
    var randomDirection;
    do {
      randomDirection = getRandomDirectionBiasedTowardsTurning(entity.facingDirection, 0.8);
    } while (!canMoveInDirection(entity.position, randomDirection, gameState.level, warpTimeout));
    entity.targetGridPosition.set(vec2Add(entity.position, randomDirection));
  } else if (entity.simFlags & SIM_ENTITY_FLAGS.INPUT_CONTROLLED) {
    // use desired direction and previous position to determine
    const canMoveInXDirection = canMoveInDirection(entity.position, new Vec2(entity.desiredDirection.x, 0), level, warpTimeout);
    const canMoveInYDirection = canMoveInDirection(entity.position, new Vec2(0, entity.desiredDirection.y), level, warpTimeout);
    if (canMoveInXDirection && canMoveInYDirection) {
      const previousMovementVector = vec2Sub(entity.position, entity.previousPosition);
      if (previousMovementVector.isZero()) {
        // if we have no previous move state (ie we hit a wall and are stopped)
        // we have to pick one or the other direction randomly
        if (getRandomInt(0, 2) == 0) {
          entity.targetGridPosition.add(new Vec2(entity.desiredDirection.x, 0));
        } else {
          entity.targetGridPosition.add(new Vec2(0, entity.desiredDirection.y));
        }
      } else {
        // if we have state we choose to move orthogonal to the past movement (ie turn)
        const orthogonalMovementVec = vec2CompareUnLikeComponents(entity.desiredDirection, previousMovementVector);
        entity.targetGridPosition.add(orthogonalMovementVec);
      }
    } else if (canMoveInXDirection) {
      entity.targetGridPosition.add(new Vec2(entity.desiredDirection.x, 0));
    } else if (canMoveInYDirection) {
      entity.targetGridPosition.add(new Vec2(0, entity.desiredDirection.y));
    } else {
      // we can't move, make sure our position is the target grid position
      entity.targetGridPosition.set(entity.position);
    }
  }
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

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

const getRandomDirection = () => {
  switch (getRandomInt(0, 4)) {
    case 0:
      return new Vec2(0, 1);
    case 1:
      return new Vec2(0, -1);
    case 2:
      return new Vec2(1, 0);
    case 3:
      return new Vec2(-1, 0);
  }
};

// get a biased random direction with bias being towards a given direction
// biasAmount is a number between 0 and 1 with 1 being 100% bias
// DO NOT SET TO 1 FOR BIAS AS IT WILL PROBABLY LOCK THE GAME UP
const getRandomBiasedDirection = (direction, biasAmount) => {
  if (Math.random() < biasAmount) {
    const v = new Vec2(0, 0);
    v.set(direction);
    return v;
  } else {
    return getRandomDirection();
  }
};

const getRandomDirectionBiasedTowardsTurning = (facingDirection, biasAmount) => {
  if (facingDirection.x != 0) {
    if (Math.random() < 0.5) {
      return getRandomBiasedDirection(new Vec2(0, 1), biasAmount);
    } else {
      return getRandomBiasedDirection(new Vec2(0, -1), biasAmount);
    }
  } else {
    if (Math.random() < 0.5) {
      return getRandomBiasedDirection(new Vec2(1, 0), biasAmount);
    } else {
      return getRandomBiasedDirection(new Vec2(-1, 0), biasAmount);
    }
  }
};

requestAnimationFrame(gameLoop);
