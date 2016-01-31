Todos

- enemies
  - ~~basic movement/bahavior~~
  - ~~upgrade behavior (based on level number)~~
  - path finding? (start with list of targets, length 1)
  - ~~speed based on level~~
  - invisibility
  - end game boss?
- ~~collision detection~~
- scoring
- ~~laser~~
- ~~sprites~~
  - ~~artwork~~
- sound
  - timbre + generated
  - howler + pre-rendered
  - specifics
    - laser
    - death
    - start game
    - game over
    - change level
    - enemy death
    - background music
- ~~levels~~
  - ~~editor~~
  - endless gameplay?
- level effects
- game states
  - intro
  - main menu
  - game over
- overlay during game play (pause, between levels, etc...)
  - inter game state states?
- radar
- refactoring
  - components
  - split up code better

--- enemies
start of with 6 per level
first 6 levels the last n enemies will upgrade (ie level 1, 1 enemy will upgrade, level 4 4 will upgrade, etc...)
speed timer (x frames then increase speed until level max which is determined by the first 10 levels, after level 10 speed starts at max)
random invisibility unless in sight of player
show on radar always
