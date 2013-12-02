window.onload = function() {

PI = Math.PI;
TAU = 2 * PI;

// ------------------------------------------------------------------ DOM OJECTS
var canvas = document.getElementById("game-canvas");
var context = canvas.getContext("2d");

var loadScreen = document.getElementById("load-screen");
var menuScreen = document.getElementById("menu-screen");
var gameScreen = document.getElementById("game-screen");

var startButton = document.getElementById("start-button");
var leftButton = document.getElementById("left-button");
var rightButton = document.getElementById("right-button");
var results = document.getElementById("results");

var seconds = document.getElementById("seconds");
var thirds = document.getElementById("thirds");

// -------------------------------------------------------- GAME STATE VARIABLES

var bpm = 130;                         // Game global BPM
var period = 60 / bpm * 1000;          // Length of one game period in ms
var beat = 0;                          // Beat counter

var scale = 1;

var worldRot = 0;                      // World rotation
var worldSpeed = TAU / 4;              // World speed
var worldDir = 1;                      // World rotation direction

var heroRot = PI * Math.random();      // Hero rotation
var heroSegment = 5;                   // Hero current segment in world
var heroSpeed = PI;                    // Hero speed
var heroDir = 0;                       // Hero rotation direction

var timestamp = 0;                     // Loop start time
var last_timestamp = 0;                // Last loop start time
var requestID = 0;                     // Animation frame request id

var colors;                            // Used colors
var h = 120;                           // Base color hue

var shapes = [];                       // Shapes list

var gameTime = 0;                      // Current game start time

// ------------------------------------------------- ANIMATION CONTROL FUNCTIONS
window.requestAnimFrame = (function() {
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame;
})();

window.cancelAnimFrame = (function() {
  return  window.cancelAnimationFrame       ||
          window.webkitCancelAnimationFrame ||
          window.mozCancelAnimationFrame;
})();

// --------------------------------------------------------------- GAME CONTROLS
window.addEventListener("keydown", onKeyDown, false);
function onKeyDown(e) {
  switch(e.keyCode) {
    case 37:
      heroDir = -1;
      break;
    case 39:
      heroDir = 1;
      break;
    default:
      console.log("Key code: " + e.keyCode + " | Whitch: " + e.which);
  }
}

window.addEventListener("keyup", onKeyUp, false);
function onKeyUp(e) {
  switch(e.keyCode) {
    case 37:
    case 39:
      heroDir = 0;
      break;
  }
}

leftButton.addEventListener("touchstart", function(e) {
  heroDir = -1;
}, false);

leftButton.addEventListener("touchend", function(e) {
  heroDir = 0;
}, false);

rightButton.addEventListener("touchstart", function(e) {
  heroDir = 1;
}, false);

rightButton.addEventListener("touchend", function(e) {
  heroDir = 0;
}, false);

// --------------------------------------------------------------- MENU CONTROLS
startButton.addEventListener("click", function() {
  console.log("Start");
  goGame();
}, false);

// --------------------------------------------------------------- WINDOW EVENTS
window.addEventListener("resize", onResize, false);
function onResize() {
  var width = window.innerWidth;
  var height = window.innerHeight;
  if(height / 2 < width / 3) {width = Math.round(3 / 2 * height);}
  else {height = Math.round(2 / 3 * width);}
  canvas.width = width;
  canvas.height = height;
  
  scale = width / 480;
  console.log("Resize");
  console.log("Window: " + window.innerWidth + "/" + window.innerHeight);
  console.log("Canvas: " + width + "/" + height);
  console.log("Scale:" + scale);
}

window.addEventListener("visibilitychange", function() {
    if(document.hidden) {window.cancelAnimFrame(requestID);}
    else {goMenu();}
}, false);

// ----------------------------------------------------------- DRAWING FUNCTIONS
function drawSegment(fill) {
  context.beginPath();
  context.moveTo( 0,                           0 );
  context.lineTo( 340,                         0 );
  context.lineTo( 340 * Math.cos(    TAU / 6), 340 * Math.sin(    TAU / 6) );
  context.moveTo( 0,                           0 );
  context.lineTo( 340 * Math.cos(2 * TAU / 6), 340 * Math.sin(2 * TAU / 6) );
  context.lineTo( 340 * Math.cos(3 * TAU / 6), 340 * Math.sin(3 * TAU / 6) );
  context.moveTo( 0,                           0 );
  context.lineTo( 340 * Math.cos(4 * TAU / 6), 340 * Math.sin(4 * TAU / 6) );
  context.lineTo( 340 * Math.cos(5 * TAU / 6), 340 * Math.sin(5 * TAU / 6) );
  context.fillStyle = fill;
  context.fill();
}

function drawCenter(fill, stroke) {  
  context.beginPath();
  context.moveTo( 32,                         0 );
  context.lineTo( 32 * Math.cos(    TAU / 6), 32 * Math.sin(    TAU / 6) );
  context.lineTo( 32 * Math.cos(2 * TAU / 6), 32 * Math.sin(2 * TAU / 6) );
  context.lineTo( 32 * Math.cos(3 * TAU / 6), 32 * Math.sin(3 * TAU / 6) );
  context.lineTo( 32 * Math.cos(4 * TAU / 6), 32 * Math.sin(4 * TAU / 6) );
  context.lineTo( 32 * Math.cos(5 * TAU / 6), 32 * Math.sin(5 * TAU / 6) );
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.stroke();
}

function drawHero(fill) {
  context.beginPath();
  context.moveTo(40, 0);
  context.arc(40, 0, 6, 2.5, - 2.5, false);
  context.fillStyle = fill;
  context.fill();
}

function drawObstacle(seg, dist, fill) {
  context.beginPath();
  context.moveTo(
    dist * Math.cos(seg * TAU / 6),
    dist * Math.sin(seg * TAU /6)
  );
  context.lineTo(
    (dist + 13) * Math.cos(seg * TAU / 6),
    (dist + 13) * Math.sin(seg * TAU / 6)
  );
  context.lineTo(
    (dist + 13) * Math.cos((seg + 1) * TAU / 6),
    (dist + 13) * Math.sin((seg + 1) * TAU / 6)
  );
  context.lineTo(
    dist * Math.cos((seg + 1) * TAU / 6),
    dist * Math.sin((seg + 1) * TAU / 6)
  );
  context.fillStyle = fill;
  context.fill();  
}

// TODO: don't need to draw all the obstacles
function drawShape(shape, fill) {
  for(var i = 0; i < shape.seg.length; i++) {
    drawObstacle(shape.seg[i], shape.dist, fill);
  }
}

// --------------------------------------------------- SHAPE GENERATOR FUNCTIONS
function createCIShape(seg, dist) {
  return {
    "seg": [ seg % 6, (seg + 2) % 6, (seg + 3) % 6, (seg + 4) % 6 ],
    "dist": dist
  };
}

function createCShape(seg, dist) {
  return {
    "seg": [ seg % 6, (seg + 1) % 6, (seg + 2) % 6,
             (seg + 3) % 6, (seg + 4) % 6 ],
    "dist": dist
  };
}

function createOShape(seg, dist) {
  return {
    "seg": [ seg % 6, (seg + 2) % 6, (seg + 4) % 6 ],
    "dist": dist
  };
}

function isCollision() {
  if(shapes.length) { //TODO: obstacle is linear but hero's position is rounded
     return ( shapes[0].dist <= 46 ) &&
            ( shapes[0].dist + 13 >= 46 ) &&
            ( shapes[0].seg.indexOf(heroSegment) !== -1); 
  }
  else {
    return false;
  }
} 

function goMenu() {
  loadScreen.style.display = "none";
  menuScreen.style.display = "block";
  canvas.style.display = "block";
  
  worldSpeed = TAU / 16;
  menu();
}

function goGame() {
  shapes.length = 0;
  gameTime = 0; 
  worldSpeed = TAU / 4;
  startTime = performance.now();
  
  menuScreen.style.display = "none";
  gameScreen.style.display = "block";
  
  window.cancelAnimFrame(requestID);
  requestID = window.requestAnimFrame(animate);
}

function goResults() {
  gameScreen.style.display = "none";
  menuScreen.style.display = "block";
  
  worldSpeed = TAU / 16;
  window.cancelAnimFrame(requestID);
  requestID = window.requestAnimFrame(menu);
}

function generateColor(h, s, l) {
  colors = {
    "bg1":  "hsl( " + h + ", " + s + "%, " + l + "%)",
    "bg2":  "hsl( " + h + ", " + s + "%, " + (l + 10) + "%)",
    "main": "hsl( " + h + ", " + s + "%, " + (l + 40) + "%)"
  };
}

function clear(fill) {
  canvas.style.background = fill;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function menu() {
  var timestamp = performance.now();
  var dp = (timestamp - last_timestamp) / period;
  last_timestamp = timestamp;
  
  h += 5 * dp;
  generateColor(h, 100, 20);
  
  clear(colors.bg1);
  
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(scale, scale);
  context.rotate(worldRot);
  drawSegment(colors.bg2);
  shapes.forEach(function(e) {
    drawShape(e, colors.main);
  });
  drawCenter(colors.bg2, colors.main);
  
  context.rotate(heroRot);
  drawHero(colors.main);
  
  worldRot += worldDir * worldSpeed * dp;
  requestID = window.requestAnimFrame(menu);
}

function animate() {
  var timestamp = performance.now();
  var dt = timestamp - last_timestamp;
  var dp = dt / period;
  last_timestamp = timestamp;
  
  seconds.innerHTML = Math.floor(gameTime / 1000);
  thirds.innerHTML = Math.round((gameTime % 1000) * 60 / 1000);

  h += 5 * dp;
  generateColor(h, 100, 20);
  
  clear(colors.bg1);
  
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(worldRot);

  context.scale(scale, scale);
  drawSegment(colors.bg2);
  context.scale(
    (1 - Math.cos(beat * TAU) * 0.07),
    (1 - Math.cos(beat * TAU) * 0.07)
  );

  shapes.forEach(function(e) {
    drawShape(e, colors.main);
  });
  drawCenter(colors.bg2, colors.main);
  
  context.rotate(heroRot);
  drawHero(colors.main);

  gameTime += dt;
  beat += dp;
  worldRot += worldDir * worldSpeed * dp;
  heroRot += heroDir * heroSpeed * dp;
  
  if(beat > 4) {
    beat = 0;
    worldDir = Math.random() < 0.5 ? 1 : -1;
  }
  
  if(shapes.length && shapes[0].dist < 30) {shapes.shift();}
  
  shapes.forEach(function(e) {
    e.dist -= 60 * dp;
  });
  
  if( shapes.length < 3 ) {
    var selector = Math.random();
    if( selector < 0.3 ) {
      shapes.push(createCIShape(
        Math.round(Math.random() * 6),
        (shapes.length + 2) * 150)
      );
    }
    else if ( selector < 0.6 ){
      shapes.push(createOShape(
        Math.round(Math.random() * 6),
        (shapes.length + 2) * 150)
      );
    }
    else {
      shapes.push(createCShape(
        Math.round(Math.random() * 6),
        (shapes.length + 2) * 150)
      );
    }
  }
    
  if(heroRot > 0) { heroSegment = Math.floor((heroRot % TAU) / (TAU / 6)); }
  else { heroSegment = 6 + Math.floor((heroRot % TAU) / (TAU / 6)); }
  
  if( !isCollision() ) {
    requestID = window.requestAnimFrame(animate);
  }
  else {
    window.navigator.vibrate(100);
    results.innerHTML = Math.round(gameTime) / 1000;
    goResults(); 
  }
}

onResize();
goMenu();

};