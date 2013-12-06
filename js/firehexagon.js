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
var leftButton  = document.getElementById("left-button");
var rightButton = document.getElementById("right-button");
var results     = document.getElementById("results");

var bestTime = document.getElementById("best-time");
var gameTime = document.getElementById("game-time");

// -------------------------------------------------------- GAME STATE VARIABLES
var beat = 0;                          // Beat counter

var scale = 1;

// --------------------------------------------------------------- TIMER OBJECT
var timer = new Object();
timer.timestamp = 0;
timer.lastTimestamp = 0;
timer.dt = 0;
timer.dp = 0;
timer.time = 0;

timer.tick = function() {
  this.timestamp = performance.now();
  this.dt = this.timestamp - this.lastTimestamp;
  this.time += this.dt;
  this.dp = this.dt / (60 / 130 * 1000);
  this.lastTimestamp = this.timestamp;
};

timer.reset = function() {
  this.lastTimestamp = performance.now();
  this.time = 0;
};

timer.convert = function(t) {
  return {
    "seconds": Math.floor(t / 1000), 
    "thirds":  Math.floor((t % 1000) * 60 / 1000)
  };
};

// ---------------------------------------------------------------- HERO OBJECT
var hero = new Object();
hero.rot = 0;
hero.dir = 0;
hero.speed = PI;
hero.update = function() {
  this.rot += this.dir * this.speed * timer.dp;
};

hero.getSegment = function() {
  if( this.rot > 0 ) { return Math.floor((this.rot % TAU) / (TAU / 6)); }
  else { return 6 + Math.floor((this.rot % TAU) / (TAU / 6)); }
};

// --------------------------------------------------------------- WORLD OBJECT
var world = new Object();
world.rot = 0;
world.dir = 1;
world.speed = TAU / 8;
world.update = function() {
  this.rot += this.dir * this.speed * timer.dp;
};

// -------------------------------------------------------------- COLORS OBJECT
var colors = new Object();
colors.hue  = 120;
colors.bg1  = "hsl(120, 100%, 20%)";
colors.bg2  = "hsl(120, 100%, 30%)";
colors.main = "hsl(120, 100%, 60%)";
colors.update = function() {
  this.bg1  = "hsl(" + this.hue + ", 100%, 20%)";
  this.bg2  = "hsl(" + this.hue + ", 100%, 30%)";
  this.main = "hsl(" + this.hue + ", 100%, 60%)";
  this.hue += 5 * timer.dp;  //TODO: resolve fixed speed
};

// -------------------------------------------------------------- SHAPES OBJECT
var shapes = [];
shapes.update = function() {
  if( this.length < 3 ) { this.fill(); }
  if( this[0].dist < 30 ) { this.shift(); }
  this.forEach( function(shape) {
    shape.dist += -60 * timer.dp;
  });
};

shapes.fill = function() {
  var selector = Math.random();
  if( selector < 0.3 ) {
    this.push(createCIShape(
      Math.round(Math.random() * 6),
      (this.length + 2) * 150)
    );
  }
  else if ( selector < 0.6 ){
    this.push(createOShape(
      Math.round(Math.random() * 6),
      (this.length + 2) * 150)
    );
  }
  else {
    this.push(createCShape(
      Math.round(Math.random() * 6),
      (this.length + 2) * 150)
    );
  }
}

shapes.clear = function() {
  this.length = 0;
}

shapes.isCollision = function() {
  return ( this[0].dist <= 46      &&
           this[0].dist + 13 >= 46 &&
           this[0].seg.indexOf( hero.getSegment() ) !== -1 );
};

// ---------------------------------------------------------- HIGHSCORES OBJECT
var highscores;
if( localStorage["fh-highscores"] === undefined ) { highscores = [ 0 ]; }
else { highscores = JSON.parse( localStorage["fh-highscores"] ) }
highscores.add = function(t) {
  if( this.length > 10 ) {
    this.sort( function(a, b) { return b-a; } );
    if (this[this.length - 1] < t) {
      this[this.length - 1] = t;
    }
  }
  else {
    this.push(t);
  }
}

highscores.save = function() {
  localStorage["fh-highscores"] = JSON.stringify( highscores );
};

highscores.getBest = function() {
  return highscores.sort( function(a, b) { return b-a; } )[0];
};

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
      hero.dir = -1;
      break;
    case 39:
      hero.dir = 1;
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
      hero.dir = 0;
      break;
  }
}

leftButton.addEventListener("touchstart", function(e) {
  hero.dir = -1;
}, false);

leftButton.addEventListener("touchend", function(e) {
  hero.dir = 0;
}, false);

rightButton.addEventListener("touchstart", function(e) {
  hero.dir = 1;
}, false);

rightButton.addEventListener("touchend", function(e) {
  hero.dir = 0;
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
  context.lineWidth = 2;
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

// ----------------------------------------------------------------- GAME LOGIC
function goMenu() {
  loadScreen.style.display = "none";
  menuScreen.style.display = "block";
  canvas.style.display = "block";
  
  world.speed = TAU / 16;
  menu();
}

function goGame() {
  timer.reset();
  world.speed = TAU / 4;
  shapes.clear();

  var b = timer.convert( highscores.getBest() );
  bestTime.textContent = "BEST " + b.seconds + ":" + b.thirds;

  menuScreen.style.display = "none";
  gameScreen.style.display = "block";
  
  window.cancelAnimFrame(requestID);
  requestID = window.requestAnimFrame(animate);
}

function goResults() {
  gameScreen.style.display = "none";
  menuScreen.style.display = "block";
  
  results.innerHTML = Math.round(timer.time) / 1000;

  highscores.add(timer.time);
  highscores.save();

  world.speed = TAU / 16;
  window.cancelAnimFrame(requestID);
  requestID = window.requestAnimFrame(menu);
}

function clear(fill) {
  canvas.style.background = fill;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function menu() {
  timer.tick();
  
  clear(colors.bg1);
  
  context.translate(canvas.width * 2 / 3, canvas.height * 2 / 3);
  context.scale(scale * 2, scale * 2);
  context.rotate(world.rot);
  drawSegment(colors.bg2);
  shapes.forEach(function(e) {
    drawShape(e, colors.main);
  });
  drawCenter(colors.bg2, colors.main);
  
  context.rotate(hero.rot);
  drawHero(colors.main);
  
  world.update();
  colors.update();
  requestID = window.requestAnimFrame(menu);
}

function animate() {
  timer.tick();
  
  var t = timer.convert(timer.time);
  gameTime.textContent = "TIME " + t.seconds + ":" + t.thirds;

  clear(colors.bg1);
  
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(world.rot);

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
  
  context.rotate(hero.rot);
  drawHero(colors.main);

  beat += timer.dp;
  world.update();
  hero.update();
  shapes.update();
  colors.update();

  if(beat > 4) {
    beat = 0;
    world.dir = Math.random() < 0.5 ? 1 : -1;
  }
  
  if( !shapes.isCollision() ) {
    requestID = window.requestAnimFrame(animate);
  }
  else {
    window.navigator.vibrate(100);
    goResults(); 
  }
}

onResize();
goMenu();
};
