"use strict";
const GAME_PLAY_MODE = function() {

  const WORLD_OFFSET = 20;
  const ENEMY_SPEED_TIMEOUT = 60/*fps*/ * 60/*seconds*/;
  const ENEMY_SPEED_INCREASE = 0.005;
  const MAX_ENEMY_SPEED = 0.04;
  const INITIAL_ENEMY_SPEED = 0.01;
  const MAX_PLAYER_LIVES = 4;
  const RESOURCE_KEYS = {
    EXPLOSION_IMG: "explosion_img",
    PLAYER_IMG: "player_img",
    ENEMY_1_IMG: "enemy_1_img",
    ENEMY_2_IMG: "enemy_2_img",
    ENEMY_3_IMG: "enemy_3_img",
    MISSING_IMG: "missing_img",
  };
  const RESOURCE_PATHS = {};
  RESOURCE_PATHS[RESOURCE_KEYS.EXPLOSION_IMG] = "./assets/Explosion.png";
  RESOURCE_PATHS[RESOURCE_KEYS.PLAYER_IMG] = "./assets/Worrier.png";
  RESOURCE_PATHS[RESOURCE_KEYS.ENEMY_1_IMG] = "./assets/Enemy 1.png";
  RESOURCE_PATHS[RESOURCE_KEYS.ENEMY_2_IMG] = "./assets/Enemy 2.png";
  RESOURCE_PATHS[RESOURCE_KEYS.ENEMY_3_IMG] = "./assets/Enemy 3.png";
  RESOURCE_PATHS[RESOURCE_KEYS.MISSING_IMG] = "./assets/MISSING.png";
  const SPRITE_KEYS = {
    EXPLOSION: 1 << 0,
    PLAYER_STANDING: 1 << 1,
    PLAYER_WALKING: 1 << 2,
    PLAYER_FIRING: 1 << 3,
    ENEMY_1: 1 << 4,
    ENEMY_2: 1 << 5,
    ENEMY_3: 1 << 6,
    MISSING: 1 << 7,
  };

  const init = (gameState) => {
    const modeState = new GamePlayModeState();
    modeState.level = 0;
    modeState.playerLives = MAX_PLAYER_LIVES;

    modeState.enemySpeedTimeout = ENEMY_SPEED_TIMEOUT;
    modeState.enemySpeed = INITIAL_ENEMY_SPEED + ENEMY_SPEED_INCREASE * modeState.level;
    if (modeState.enemySpeed > MAX_ENEMY_SPEED) {
      modeState.enemySpeed = MAX_ENEMY_SPEED;
    }
    modeState.gamePlayState = GAME_PLAY_STATES.LOADING;
    modeState.initialized = true;
    return modeState;
  };

  const update = (gameState) => {
    const modeState = gameState.modeState;
    switch (modeState.gamePlayState) {
      case GAME_PLAY_STATES.LOADING:
        loadingUpdate(gameState);
        break;
      case GAME_PLAY_STATES.PLAYING:
        playingUpdate(gameState);
        break;
    };
  };

  const render = (gameState) => {
    const modeState = gameState.modeState;
    switch (modeState.gamePlayState) {
      case GAME_PLAY_STATES.LOADING:
        loadingRender(gameState);
        break;
      case GAME_PLAY_STATES.PLAYING:
        playingRender(gameState);
        break;
    };
  };

  const resetLevel = (modeState) => {
    const levelWidth = LEVELS[modeState.level][0].length;
    const levelHeight = LEVELS[modeState.level].length;
    modeState.entities.forEach((e) => {
      switch (e.entityType) {
        case ENTITY_TYPES.PLAYER:
          resetPlayer(e, new Vec2(levelWidth - 2, levelHeight - 1));
          e.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
          break;
        case ENTITY_TYPES.ENEMY_1:
        case ENTITY_TYPES.ENEMY_2:
        case ENTITY_TYPES.ENEMY_3:
          resetEnemy(e, new Vec2(getRandomInt(1, levelWidth - 1), getRandomInt(1, levelHeight - 1)));
          e.sprite.copy(modeState.sprites[SPRITE_KEYS.ENEMY_1]);
          break;
        case ENTITY_TYPES.LASER:
          e.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
          e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
          e.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
          e.simFlags |= SIM_ENTITY_FLAGS.DEAD;
          break;
      }
    });
    modeState.enemySpeedTimeout = ENEMY_SPEED_TIMEOUT;
    modeState.enemySpeed = INITIAL_ENEMY_SPEED + ENEMY_SPEED_INCREASE * modeState.level;
    if (modeState.enemySpeed > MAX_ENEMY_SPEED) {
      modeState.enemySpeed = MAX_ENEMY_SPEED;
    }
    modeState.warpTimeout = 0;
  };

  const loadingUpdate = (gameState) => {
    const modeState = gameState.modeState;
    if (!modeState.loadingAssets) {
      modeState.loadingAssets = true;
      const pipeline = Object.keys(RESOURCE_KEYS).map((key) => {
        return RESOURCE_MANAGER.loadImage.bind(null, RESOURCE_KEYS[key], RESOURCE_PATHS[RESOURCE_KEYS[key]]);
      });
      asyncAll(pipeline, (errors, results) => {
        if (errors) {
          throw new Error("Failed to load assets :(");
        }

        // setup mode state sprites Object
        modeState.sprites[SPRITE_KEYS.EXPLOSION] = new Sprite(
          SPRITE_KEYS.EXPLOSION,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.EXPLOSION_IMG),
          0, 5, 60/*fps*/ * 1.5/*secs*/ / 10/*frames displayed*/, true
        );
        // first frame, no loop,
        modeState.sprites[SPRITE_KEYS.PLAYER_STANDING] = new Sprite(
          SPRITE_KEYS.PLAYER_STANDING,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.PLAYER_IMG),
          0, 0, 0, false
        );
        modeState.sprites[SPRITE_KEYS.PLAYER_WALKING] = new Sprite(
          SPRITE_KEYS.PLAYER_WALKING,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.PLAYER_IMG),
          0, 1, 60/*fps*/ * 0.1/*secs*/, true
        );
        modeState.sprites[SPRITE_KEYS.PLAYER_FIRING] = new Sprite(
          SPRITE_KEYS.PLAYER_FIRING,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.PLAYER_IMG),
          1, 4, 60/*fps*/ * 0.3/*secs*/ / 4 /*frames*/, false
        );
        modeState.sprites[SPRITE_KEYS.PLAYER_FIRING].nextSprite = (new Sprite()).copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);

        modeState.sprites[SPRITE_KEYS.ENEMY_1] = new Sprite(
          SPRITE_KEYS.ENEMY_1,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.ENEMY_1_IMG),
          0, 1, 60/*fps*/ * 0.3/*secs*/, true
        );
        modeState.sprites[SPRITE_KEYS.ENEMY_2] = new Sprite(
          SPRITE_KEYS.ENEMY_2,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.ENEMY_2_IMG),
          0, 3, 60/*fps*/ * 0.3/*secs*/, true
        );
        modeState.sprites[SPRITE_KEYS.ENEMY_3] = new Sprite(
          SPRITE_KEYS.ENEMY_3,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.ENEMY_3_IMG),
          0, 3, 60/*fps*/ * 0.3/*secs*/, true
        );
        modeState.sprites[SPRITE_KEYS.MISSING] = new Sprite(
          SPRITE_KEYS.MISSING,
          RESOURCE_MANAGER.getResource(RESOURCE_KEYS.MISSING_IMG),
          0, 0, 0, false
        );

        const levelWidth = LEVELS[modeState.level][0].length;
        const levelHeight = LEVELS[modeState.level].length;
        const entityWidth = 0.7;
        const entityHeight = 0.7;
        const playerWidth = 0.5;
        const playerHeight = 0.5;

        const player = makePlayer(new Vec2(levelWidth - 2, levelHeight - 1));
        player.collisionBounds.width = playerWidth;
        player.collisionBounds.height = playerHeight;
        player.sprite = (new Sprite()).copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
        modeState.entities.push(player);

        for (let i = 0; i < 6; ++i) {
          const enemy = makeEnemy(new Vec2(getRandomInt(1, levelWidth - 1), getRandomInt(1, levelHeight - 1)));
          enemy.collisionBounds.width = entityWidth;
          enemy.collisionBounds.height = entityHeight;
          enemy.sprite = (new Sprite()).copy(modeState.sprites[SPRITE_KEYS.ENEMY_1]);
          modeState.entities.push(enemy);
        }

        const playerLaser = makeLaser(new Vec2(-1, -1), new Vec2(-1, -1), true);
        // initially make dead
        playerLaser.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
        playerLaser.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
        playerLaser.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
        playerLaser.simFlags |= SIM_ENTITY_FLAGS.DEAD;
        modeState.entities.push(playerLaser);

        modeState.gamePlayState = GAME_PLAY_STATES.PLAYING;
      });
    }
  };

  const loadingRender = (gameState) => {
    RENDERER.clearCanvas();
    RENDERER.fillText("Loading Assets...", 10, RENDERER.HEIGHT - 10, "#0F0", "10px sans");
  };

  const playingUpdate = (gameState) => {
    const modeState = gameState.modeState;

    const levelWidth = LEVELS[modeState.level][0].length;
    const levelHeight = LEVELS[modeState.level].length;

    // update game level things
    if (modeState.playerLives == 0) {
      // game over :/
      gameState.mode = GAME_MODES.GAME_OVER;
      gameState.modeState = undefined;
      RESOURCE_MANAGER.evictAll();
      return;
    }

    if (modeState.warpTimeout > 0) {
      modeState.warpTimeout--;
    }

    if (modeState.enemySpeedTimeout > 0) {
      modeState.enemySpeedTimeout--;
    } else {
      modeState.enemySpeedTimeout = ENEMY_SPEED_TIMEOUT;
      if (modeState.enemySpeed < MAX_ENEMY_SPEED) {
        modeState.enemySpeed += ENEMY_SPEED_INCREASE;
      }
    }

    // upgrade enemies before checking if level ended
    const upgradeableDeadEnemies = modeState.entities.filter((e) => {
      return (e.entityType == ENTITY_TYPES.ENEMY_1 ||
          e.entityType == ENTITY_TYPES.ENEMY_2) &&
          (e.simFlags & SIM_ENTITY_FLAGS.DEAD) &&
          (e.simFlags & SIM_ENTITY_FLAGS.CAN_UPGRADE);
    });

    upgradeableDeadEnemies.forEach((e) => {
      const newType = e.entityType <<= 1;
      resetEnemy(e, new Vec2(getRandomInt(1, levelWidth - 1), getRandomInt(1, levelHeight - 1)));
      e.entityType = newType;
      switch (newType) {
        case ENTITY_TYPES.ENEMY_2:
          e.sprite.copy(modeState.sprites[SPRITE_KEYS.ENEMY_2]);
          break;
        case ENTITY_TYPES.ENEMY_3:
          e.sprite.copy(modeState.sprites[SPRITE_KEYS.ENEMY_3]);
          break;
      };
    });

    const liveEnemies = modeState.entities.filter((e) => {
      return (e.entityType == ENTITY_TYPES.ENEMY_1 ||
          e.entityType == ENTITY_TYPES.ENEMY_2 ||
          e.entityType == ENTITY_TYPES.ENEMY_3) &&
          !(e.simFlags & SIM_ENTITY_FLAGS.DEAD);
    });

    if (liveEnemies.length == 0) {
      // change level
      modeState.level++;
      resetLevel(modeState);
      return;
    } else {
      if (modeState.level >= 6 ||
          liveEnemies.length <= (modeState.level + 1)) {
        liveEnemies.forEach((e) => {
          e.simFlags |= SIM_ENTITY_FLAGS.CAN_UPGRADE;
        });
      }
    }

    // find laser
    const playerLaser = modeState.entities.find((e) => {
      return e.simFlags & SIM_ENTITY_FLAGS.PLAYER_FIREABLE_LASER;
    });
    // find player
    const player = modeState.entities.find((e) => {
      return e.entityType == ENTITY_TYPES.PLAYER;
    });

    if (playerLaser.simFlags & SIM_ENTITY_FLAGS.DEAD) {
      modeState.canFireLaser = true;
    }

    if (player.simFlags & SIM_ENTITY_FLAGS.DYING) {
      modeState.canFireLaser = false;
    }

    if (gameState.input.isActive(KEY_BINDINGS.SPACE) && modeState.canFireLaser) {
      if (canMoveInDirection(vec2Round(player.position), player.facingDirection, LEVELS[modeState.level], 1)) {
        modeState.canFireLaser = false;
        resetLaser(playerLaser, player.position, player.facingDirection, true);
        player.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_FIRING]);
      }
    }

    // update individual entites
    modeState.entities.forEach((e) => {
      if (e.simFlags & SIM_ENTITY_FLAGS.DEAD) {
        switch (e.entityType) {
          case ENTITY_TYPES.PLAYER:
            const levelWidth = LEVELS[modeState.level][0].length;
            const levelHeight = LEVELS[modeState.level].length;
            modeState.playerLives--;
            if (modeState.playerLives > 0) {
              resetPlayer(e, new Vec2(levelWidth - 2, levelHeight - 1));
              player.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
            }
            break;
        }
      }

      if (e.simFlags & SIM_ENTITY_FLAGS.DYING && e.deathTimeout > 0) {
        if (e.deathTimeout == MAX_DEATH_TIMEOUT) {
          e.sprite.copy(modeState.sprites[SPRITE_KEYS.EXPLOSION]);
        }
        e.deathTimeout--;
      } else if (e.simFlags & SIM_ENTITY_FLAGS.DYING && e.deathTimeout <= 0) {
        e.simFlags &= ~SIM_ENTITY_FLAGS.RENDER;
        e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
        e.simFlags &= ~SIM_ENTITY_FLAGS.SIM_COLLISIONS;
        e.simFlags |= SIM_ENTITY_FLAGS.DEAD;
        return; // short circuit
      }

      if (e.simFlags & SIM_ENTITY_FLAGS.AI_CONTROLLED && !(e.simFlags & SIM_ENTITY_FLAGS.DYING)) {
        const previousMovementVector = vec2GridDirectionToUnit(vec2Sub(e.targetGridPosition, e.position));

        if (!previousMovementVector.isZero()) {
          // we're not at a grid point, see if we want to randomly flip flop directions
          if (getRandomInt(0, 1000) < 1) { /* 1% chance */
            e.targetGridPosition.sub(e.facingDirection);
          }
        }
      }

      if (e.simFlags & SIM_ENTITY_FLAGS.INPUT_CONTROLLED && !(e.simFlags & SIM_ENTITY_FLAGS.DYING)) {
        e.desiredDirection.set(new Vec2(0, 0));
        if (gameState.input.isActive(KEY_BINDINGS.UP)) {
          e.desiredDirection.y -= 1;
        }
        if (gameState.input.isActive(KEY_BINDINGS.DOWN)) {
          e.desiredDirection.y += 1;
        }
        if (gameState.input.isActive(KEY_BINDINGS.LEFT)) {
          e.desiredDirection.x -= 1;
        }
        if (gameState.input.isActive(KEY_BINDINGS.RIGHT)) {
          e.desiredDirection.x += 1;
        }

        // if we don't have any direction keys pressed or we can't move, short circuit
        if (e.desiredDirection.isZero()) {
          // clear grid sim so we don't move, also short circuit
          e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
          if (e.sprite.tag == SPRITE_KEYS.PLAYER_WALKING) {
            e.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
          }
          return;
        } else {
          e.simFlags |= SIM_ENTITY_FLAGS.GRID_SIM;
          // if we're not walking setup walking sprite state
          if (e.sprite.tag == SPRITE_KEYS.PLAYER_STANDING) {
            e.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_WALKING]);
          }
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
              if (canMoveInDirection(currentGridPoint, orthogonalMovementVec, LEVELS[modeState.level], modeState.warpTimeout)) {
                // if so keep simming but set target to our current grid point
                e.targetGridPosition.set(currentGridPoint);
              } else if (canMoveInDirection(currentGridPoint, e.facingDirection, LEVELS[modeState.level], modeState.warpTimeout)) {
                // if not short circuit sim
                //e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
                e.targetGridPosition.add(e.facingDirection);
              } else {
                // we can't move in our desired orthogonal direction of facing direction
                // we have to stop moving
                e.simFlags &= ~SIM_ENTITY_FLAGS.GRID_SIM;
                if (e.sprite.tag == SPRITE_KEYS.PLAYER_WALKING) {
                  e.sprite.copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
                }
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

    DUNGEON_SIM.simDungeon(modeState);
  };

  const playingRender = (gameState) => {
    const modeState = gameState.modeState;

    // draw the game
    RENDERER.clearCanvas();
    RENDERER.drawLevel(
      WORLD_OFFSET,
      WORLD_OFFSET,
      RENDERER.WIDTH - WORLD_OFFSET * 2,
      RENDERER.HEIGHT - WORLD_OFFSET * 2,
      LEVELS[modeState.level],
      modeState.warpTimeout
    );

    const levelWidth = LEVELS[modeState.level][0].length;
    const levelHeight = LEVELS[modeState.level].length;
    const entityWidth = RENDERER.WIDTH / levelWidth * 0.7;
    const entityHeight = RENDERER.HEIGHT / levelHeight * 0.7;
    const laserWidth = RENDERER.WIDTH / levelWidth * 0.3;
    const laserHeight = RENDERER.HEIGHT / levelHeight * 0.1;

    // draw lives
    var lifeIndex = 1;

    const livesSprite = (new Sprite()).copy(modeState.sprites[SPRITE_KEYS.PLAYER_STANDING]);
    for (; lifeIndex < modeState.playerLives; ++lifeIndex) {
      const worldXY = gridToWorldXY(new Vec2(levelWidth - 1, levelHeight - lifeIndex), LEVELS[modeState.level], WORLD_OFFSET, RENDERER.WIDTH, RENDERER.HEIGHT);
      livesSprite.draw(worldXY.x, worldXY.y, entityWidth, entityHeight, new Vec2(-1, 0));
    }

    modeState.entities.forEach((e) => {
      if (!(e.simFlags & SIM_ENTITY_FLAGS.RENDER)) {
        return;
      }

      const worldXY = gridToWorldXY(e.position, LEVELS[modeState.level], WORLD_OFFSET, RENDERER.WIDTH, RENDERER.HEIGHT);
      // draw entity body
      switch (e.entityType) {
        case ENTITY_TYPES.LASER:
          if (e.facingDirection.x != 0) {
            RENDERER.fillRect(worldXY.x - laserWidth / 2, worldXY.y - laserHeight / 2, laserWidth, laserHeight, "#F00");
          } else {
            RENDERER.fillRect(worldXY.x - laserHeight / 2, worldXY.y - laserWidth / 2, laserHeight, laserWidth, "#F00");
          }
          break;
        default:
          // we have a sprite, let's draw it
          e.sprite.draw(worldXY.x, worldXY.y, entityWidth, entityHeight, e.facingDirection);
          break;
      }
      // if (e.collisionBounds) {
      //   const entityBoundsWidth = RENDERER.WIDTH / levelWidth * e.collisionBounds.width;
      //   const entityBoundsHeight = RENDERER.HEIGHT / levelHeight * e.collisionBounds.height;
      //   RENDERER.strokeRect(worldXY.x - entityBoundsWidth / 2, worldXY.y - entityBoundsHeight / 2, entityBoundsWidth, entityBoundsHeight, "#F00");
      // }
    });
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

  return {
    init,
    update,
    render,
  };

}();
