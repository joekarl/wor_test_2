"use strict";

const DUNGEON_SIM = function() {

  const PLAYER_SPEED = 0.03;
  const LASER_SPEED = 0.07;
  const MAX_WARP_TIMEOUT = 60/*fps*/ * 10/*seconds*/;

  const simDungeon = (modeState) => {
    // sim entities
    modeState.entities.forEach((e) => {
      if (!(e.simFlags & SIM_ENTITY_FLAGS.GRID_SIM)) {
        // if we don't have a grid sim flag set, short circuit
        return;
      }
      var distanceRemaining;
      switch (e.entityType) {
        case ENTITY_TYPES.PLAYER:
          distanceRemaining = PLAYER_SPEED;
          break;
        case ENTITY_TYPES.ENEMY_1:
        case ENTITY_TYPES.ENEMY_2:
        case ENTITY_TYPES.ENEMY_3:
          distanceRemaining = modeState.enemySpeed;
          break;
        case ENTITY_TYPES.LASER:
          distanceRemaining = LASER_SPEED;
          break;
      }
      let maxIterations = 4;
      while (distanceRemaining > 0 && maxIterations-- > 0) {
        const previousMovementVector = vec2Sub(e.targetGridPosition, e.position);

        // if at grid point
        if (previousMovementVector.isZero()) {
          calculateTargetGridPoint(e, LEVELS[modeState.level], modeState.warpTimeout);
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
        const nearestEdgeLevelTile = LEVELS[modeState.level][nearestEdgeGridPoint.y][nearestEdgeGridPoint.x];
        if (e.position.x != currentGridPoint.x &&
            (nearestEdgeLevelTile & GRID_FLAGS.WRAP_POINT) &&
            modeState.warpTimeout <= 0) {
          // we're at a wrap point
          if (nearestEdgeGridPoint.x == 0) {
            e.position.set(new Vec2(LEVELS[modeState.level][0].length - 2, currentGridPoint.y));
          } else {
            e.position.set(new Vec2(1, currentGridPoint.y));
          }
          e.targetGridPosition.set(e.position);
          e.previousPosition.set(e.position);
          if (modeState.warpTimeout <= 0) {
            modeState.warpTimeout = MAX_WARP_TIMEOUT;
          }
        }
      }
    });

    // check collisions
    var collisionIndexA;
    var collisionIndexB;
    for (collisionIndexA = 0; collisionIndexA < modeState.entities.length - 1; ++collisionIndexA) {
      for (collisionIndexB = collisionIndexA + 1; collisionIndexB < modeState.entities.length; ++collisionIndexB) {
        const entityA = modeState.entities[collisionIndexA];
        const entityB = modeState.entities[collisionIndexB];
        if (entitiesCollide(entityA, entityB)) {
          if (matchesEntityTypes(entityA, entityB, ENTITY_TYPES.PLAYER, ENTITY_TYPES.ENEMY_1) ||
              matchesEntityTypes(entityA, entityB, ENTITY_TYPES.PLAYER, ENTITY_TYPES.ENEMY_2) ||
              matchesEntityTypes(entityA, entityB, ENTITY_TYPES.PLAYER, ENTITY_TYPES.ENEMY_3)) {
            // player dies
            // stop simming and set dying
            entityA.simFlags |= SIM_ENTITY_FLAGS.DYING;
            entityA.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
            entityA.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
          } else if (matchesEntityTypes(entityA, entityB, ENTITY_TYPES.LASER, ENTITY_TYPES.ENEMY_1) ||
              matchesEntityTypes(entityA, entityB, ENTITY_TYPES.LASER, ENTITY_TYPES.ENEMY_2) ||
              matchesEntityTypes(entityA, entityB, ENTITY_TYPES.LASER, ENTITY_TYPES.ENEMY_3)) {
            if (entityA.type == ENTITY_TYPES.LASER) {
              entityA.simFlags |= SIM_ENTITY_FLAGS.DEAD;
              entityA.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
              entityB.simFlags |= SIM_ENTITY_FLAGS.DYING;
            } else {
              entityB.simFlags |= SIM_ENTITY_FLAGS.DEAD;
              entityB.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
              entityA.simFlags |= SIM_ENTITY_FLAGS.DYING;
            }

            entityA.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
            entityA.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
            entityB.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
            entityB.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
          }
        }
      }
    }
  };

  const calculateTargetGridPoint = (entity, level, warpTimeout) => {
    if (entity.simFlags & SIM_ENTITY_FLAGS.AI_CONTROLLED) {
      // pick a random direction to go
      var randomDirection;
      do {
        randomDirection = getRandomBiasedDirection(entity.facingDirection, 0.6);
      } while (!canMoveInDirection(entity.position, randomDirection, level, warpTimeout));
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
    } else if (entity.simFlags & SIM_ENTITY_FLAGS.STRAIGHT_LINE_SIM) {
      if (canMoveInDirection(entity.position, entity.facingDirection, level, 1 /*set to not 0 so always blocks warping*/)) {
        entity.targetGridPosition.add(entity.facingDirection);
      } else {
        // can't move, set dying
        entity.simFlags |= SIM_ENTITY_FLAGS.DEAD;
        entity.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
        entity.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
        entity.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
      }
    }

  };

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

  const entitiesCollide = (entityA, entityB) => {
    if (!(entityA.simFlags & SIM_ENTITY_FLAGS.SIM_COLLISIONS) ||
        !(entityB.simFlags & SIM_ENTITY_FLAGS.SIM_COLLISIONS)) {
      return false;
    }

    // create minkowski sum collision bounds
    const positionedRect = rectApplyPosition(entityA.collisionBounds, entityA.position);
    const summedRect = rectMinkowskiSum(positionedRect, entityB.collisionBounds);
    return rectContainsPoint(summedRect, entityB.position);
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

  const matchesEntityTypes = (entityA, entityB, typeA, typeB) => {
    return (entityA.entityType == typeA && entityB.entityType == typeB) ||
      (entityA.entityType == typeB && entityB.entityType == typeA);
  };

  return {
    simDungeon
  };

}();
