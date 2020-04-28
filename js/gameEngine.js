// initial position of the player
// 0 (left), 1 (center), or 2 (right)
var player_pos = 1;

// 3 possible positions of the player
const POSITION_X_LEFT = -0.5;
const POSITION_X_CENTER = 0;
const POSITION_X_RIGHT = 0.5;

/**
 * Move player to new position
 */
function go_to_pos(current_pos) {
	
  if (current_pos < 0) current_pos = 0;
  if (current_pos > 2) current_pos = 2;
  // set player position
  player_pos = current_pos;

  position = {x: 0, y: 0, z: 0}
  if      (player_pos == 0) position.x = POSITION_X_LEFT;
  else if (player_pos == 1) position.x = POSITION_X_CENTER;
  else    position.x = POSITION_X_RIGHT;
  document.getElementById('player').setAttribute('position', position);
}

/**
 * Controls on different platforms
 **/
function findDevice() {
  return isVR() ? VRControls() : pcControls();
}

// keyboard controls
function pcControls() {
  window.onkeydown = function(e) {
    startGame();
    switch (e.keyCode) {
      case 37:  // left arrow
      case 65:  // a
        go_to_pos(player_pos - 1)
        break;
      case 39:  // right arrow
      case 68:  // d
        go_to_pos(player_pos + 1)
        break;
      default:
        break;
    }
  }
}

// VR Controls
function VRControls() {
  AFRAME.registerComponent('lane-controls', {
    tick: function (time, timeDelta) {
      var rotation = this.el.object3D.rotation;

      if      (rotation.y > 0.1)  go_to_pos(0);
      else if (rotation.y < -0.1) go_to_pos(2);
      else                        go_to_pos(1);
    }
  })
}

/*********
 * BULLETS *
 *********/

var bulletLeft;
var bulletCenter;
var bulletRight;
var BulletArray;
var treeContainer;
var numberOfTrees = 0;
var bulletInterval;

function bulletHandler() {
  bulletLeft    = document.getElementById('template-tree-left');
  bulletCenter  = document.getElementById('template-tree-center');
  bulletRight   = document.getElementById('template-tree-right');
  BulletArray   = [bulletLeft, bulletCenter, bulletRight];
  treeContainer = document.getElementById('tree-container');

  removeBullet(bulletLeft);
  removeBullet(bulletRight);
  removeBullet(bulletCenter);
}

// after the bullets are out of sight, these "children" wil
function cleanBullets() {
  clearInterval(bulletInterval);
}

function shootBullet(el) {
  numberOfTrees += 1;
  el.id = 'tree-' + numberOfTrees;
  treeContainer.appendChild(el);
}

function removeBullet(tree) {
  tree.parentNode.removeChild(tree);
}

function shootBulletTo(current_pos) {
  var template = BulletArray[current_pos];
  shootBullet(template.cloneNode(true));
}

/**
 * This function creates bullets but no more than 2 at the time so that the user can escape
 **/
function shootBulletsRandomly(
  {
    probLeft = 0.5,
    probCenter = 0.5,
    probRight = 0.5,
    maxBullets = 2
  } = {}) {

  var bullets = [
    {probability: probLeft,   current_pos: 0},
    {probability: probCenter, current_pos: 1},
    {probability: probRight,  current_pos: 2},
  ]
  shuffle(bullets);

  var bulletsShot = 0;
  var position_indices = [];
  bullets.forEach(function (tree) {
    if (Math.random() < tree.probability && bulletsShot < maxBullets) {
      shootBulletTo(tree.current_pos);
      bulletsShot += 1;

      position_indices.push(tree.current_pos);
    }
  });
  return bulletsShot;
}

function shootBulletsRandomlyLoop({intervalLength = 500} = {}) {
  bulletInterval = setInterval(shootBulletsRandomly, intervalLength);
}

/**************
 COLLISION MANAGEMENT
 **************/

const POSITION_Z_OUT_OF_SIGHT = 1;
const POSITION_Z_LINE_START = 0.6;
const POSITION_Z_LINE_END = 0.7;

AFRAME.registerComponent('player', {
  tick: function() {
    document.querySelectorAll('.tree').forEach(function(tree) {
      position = tree.getAttribute('position');
      tree_current_pos = tree.getAttribute('data-tree-position-index');
      tree_id = tree.getAttribute('id');
	
		// remove the bullet after is dodged
      if (position.z > POSITION_Z_OUT_OF_SIGHT) {
        removeBullet(tree);
      }
		
		// handle game over
      if (!isGameRunning) return;

		// if the position of the bullet and of the cursor are the same calls game over
      if (POSITION_Z_LINE_START < position.z && position.z < POSITION_Z_LINE_END
          && tree_current_pos == player_pos) {
        gameOver();
      }

		// update score
      if (position.z > POSITION_Z_LINE_END && !dodgedBullets.has(tree_id)) {
        addScoreForTree(tree_id);
        updateScoreDisplay();
      }
    })
  }
})

/*********
 * SCORE *
 *********/

var score;
var dodgedBullets;
var gameOverScoreDisplay;
var scoreDisplay;

function setupScore() {
  score = 0;
  dodgedBullets = new Set();
  scoreDisplay = document.getElementById('score');
  gameOverScoreDisplay = document.getElementById('game-score');
}

function teardownScore() {
  scoreDisplay.setAttribute('value', '');
  gameOverScoreDisplay.setAttribute('value', score);
}

function addScoreForTree(tree_id) {
  score += 50;
  dodgedBullets.add(tree_id);
}

function updateScoreDisplay() {
  scoreDisplay.setAttribute('value', score);
}

/********
 * MENU *
 ********/

var menuStart;
var menuGameOver;
var menuContainer;
var isGameRunning = false;
var startButton;
var restartButton;

function hideEntity(el) {
  el.setAttribute('visible', false);
}

function showEntity(el) {
  el.setAttribute('visible', true);
}

function setupAllMenus() {
  menuStart     = document.getElementById('start-menu');
  menuGameOver  = document.getElementById('game-over');
  menuContainer = document.getElementById('menu-container');
  startButton   = document.getElementById('start-button');
  restartButton = document.getElementById('restart-button');

  showStartMenu();

  startButton.addEventListener('click', function(evt) {
    startGame();
  })

  restartButton.addEventListener('click', function(evt) {
    startGame();
  })
}

function hideAllMenus() {
  hideEntity(menuContainer);
  startButton.classList.remove('clickable');
  restartButton.classList.remove('clickable');
}

function showGameOverMenu() {
  showEntity(menuContainer);
  hideEntity(menuStart);
  showEntity(menuGameOver);
  startButton.classList.remove('clickable');
  restartButton.classList.add('clickable');
}

function showStartMenu() {
  showEntity(menuContainer);
  hideEntity(menuGameOver);
  showEntity(menuStart);
  startButton.classList.add('clickable');
  restartButton.classList.remove('clickable');
}


function setupCursor() {
  if (!isVR()) {
    var cursor = document.getElementById('cursor-mobile');
    hideEntity(cursor);
  }
}


// when the game is over, it shows the score, clears it and stops generating bullets
function gameOver() {
  isGameRunning = false;
  showGameOverMenu();
  setupInstructions();
  cleanBullets();
  teardownScore();
}

// Calls all functions needed reset the messages and generate new bullets
function startGame() {
  if (isGameRunning) return;
  isGameRunning = true;
  hideAllMenus();
  setupScore();
  updateScoreDisplay();
  shootBulletsRandomlyLoop();
}

// changes visualization depending if the game is ran through and headset or with a PC
function setupInstructions() {
  if (isVR()) {
    hideEntity(document.getElementById('start-copy-desktop'));
    hideEntity(document.getElementById('game-over-copy-desktop'));
    showEntity(document.getElementById('start-copy-mobile'));
    showEntity(document.getElementById('game-over-copy-mobile'));
  } else {
    showEntity(document.getElementById('start-copy-desktop'));
    showEntity(document.getElementById('game-over-copy-desktop'));
    hideEntity(document.getElementById('start-copy-mobile'));
    hideEntity(document.getElementById('game-over-copy-mobile'));
  }
}

findDevice();

window.onload = function() {
  setupAllMenus();
  setupScore();
  bulletHandler();
  setupInstructions();
  setupCursor();

}


/**
 * Shuffle function to make sure the bullets are shot 
 * in a different order every new game
 */
function shuffle(a) {
   var j, x, i;
   for (i = a.length - 1; i > 0; i--) {
       j = Math.floor(Math.random() * (i + 1));
       x = a[i];
       a[i] = a[j];
       a[j] = x;
   }
   return a;
}

/**
 * Checks for mobile and tablet platforms.
 */
function isVR() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
