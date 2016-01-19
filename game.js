"use strict";

const gameState = new GameState(new Input());

const gameLoop = () => {

  switch (gameState.mode) {
    case GAME_MODES.GAME_PLAY:
      if (!gameState.modeState) {
        gameState.modeState = GAME_PLAY_MODE.init(gameState);
      }
      GAME_PLAY_MODE.update(gameState);
      break;
  }

  switch (gameState.mode) {
    case GAME_MODES.GAME_PLAY:
      GAME_PLAY_MODE.render(gameState);
      break;
  }

  requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);
