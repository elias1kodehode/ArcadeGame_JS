const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const attempt = document.getElementById("attempt");
const recordAttempts = document.getElementById("record-attempt");
const recordTimer = document.getElementById("record-time");

canvas.height = 720;
canvas.width = 480;
const gravity = 100;
const game = {
  attempts: 1,
  record: Number(localStorage.getItem("record") ?? Infinity),
  recordTime: Number(localStorage.getItem("recordTime") ?? 0),
  elapsedTime: 0,
  state: "start",
};

const arm = {
  overArm: {
    length: 80,
    thickness: 20,
  },
  underArm: {
    length: 80,
    thickness: 20,
  },
  hand: {
    length: 30,
    thickness: 10,
  },
  paddle: {
    length: 160,
    thickness: 14,
  },
};

const shoulder = {
  x: canvas.width / 2,
  y: canvas.height / 1.1,
  radius: 20,
  angle: radians(45),
  angularVelocity: 0,
  angularAcceleration: 15,
  maxAngularVelocity: Math.PI,
  angularDeceleration: 25,
};
const elbow = {
  x: 0,
  y: 0,
  radius: 20,
  angle: radians(-90),
  angularVelocity: 0,
  angularAcceleration: 15,
  maxAngularVelocity: Math.PI,
  angularDeceleration: 25,
};
const wrist = {
  x: 0,
  y: 0,
  radius: 15,
  angle: radians(30),
  angularVelocity: 0,
  angularAcceleration: 15,
  maxAngularVelocity: Math.PI,
  angularDeceleration: 25,
};
const hand = {
  x: 0,
  y: 0,
};
const paddleRight = {
  x: 0,
  y: 0,
};
const paddleLeft = {
  x: 0,
  y: 0,
};
const bricks = [];
updateArm(1);
let timer = document.getElementById("timer");
function showTime() {
  const minutes = Math.floor(game.elapsedTime / 60);
  const seconds = Math.floor(game.elapsedTime % 60);
  timer.innerText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function createBrick({ x, y, width, height, health = 1, score = 100 }) {
  return { x, y, width, height, health, score };
}
function drawBrick(brick) {
  ctx.save();
  ctx.fillStyle = "#2665C6";
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  ctx.fillStyle = "#A4D9FF";
  ctx.fillRect(brick.x + 3, brick.y + 3, brick.width - 6, 2);

  ctx.strokeStyle = "#143E84";
  ctx.lineWidth = 1;
  ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

  ctx.restore();
}

function generateBricks(columns, rows) {
  const horizontalGap = 10;
  const verticalGap = 10;
  const margin = 20;
  const brickWidth =
    (canvas.width - margin * 2 - (columns - 1) * horizontalGap) / columns;

  let brickPosX = margin;

  const brickHeight = 20;
  let brickPosY = 100;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      bricks.push(
        createBrick({
          x: brickPosX,
          y: brickPosY,
          width: brickWidth,
          height: brickHeight,
        }),
      );
      brickPosX += brickWidth + horizontalGap;
    }
    brickPosX = margin;
    brickPosY += brickHeight + verticalGap;
  }
}

function checkCircleBrickCollision(brick, ball) {
  const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
  const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
  const distance = Math.hypot(closestX - ball.x, closestY - ball.y);

  if (distance <= ball.radius && distance !== 0) {
    return {
      nx: (ball.x - closestX) / distance,
      ny: (ball.y - closestY) / distance,
      penetration: ball.radius - distance,
    };
  } else if (distance === 0) {
    const left = ball.x - brick.x;
    const right = brick.x + brick.width - ball.x;
    const top = ball.y - brick.y;
    const bottom = brick.y + brick.height - ball.y;
    const closestEdge = Math.min(left, right, top, bottom);
    if (closestEdge === left) {
      return { nx: -1, ny: 0, penetration: ball.radius + closestEdge };
    } else if (closestEdge === right) {
      return { nx: 1, ny: 0, penetration: ball.radius + closestEdge };
    } else if (closestEdge === top) {
      return { nx: 0, ny: -1, penetration: ball.radius + closestEdge };
    } else if (closestEdge === bottom) {
      return { nx: 0, ny: 1, penetration: ball.radius + closestEdge };
    }
  } else {
    return null;
  }
}
function handleBrickBallCollision(ball, brick, collision) {
  const { nx, ny, penetration } = collision;
  const dot = ball.vx * nx + ball.vy * ny;
  const restitution = 1;
  const minBrickBounceSpeed = 100;
  ball.x += penetration * nx;
  ball.y += penetration * ny;
  if (dot < 0) {
    ball.vx += -(1 + restitution) * dot * nx;
    ball.vy += -(1 + restitution) * dot * ny;
    if (ny === -1 && ball.vy > -100) {
      ball.vy = -minBrickBounceSpeed;
    }
    return true;
  }
  return false;
}

function drawBricks() {
  for (let brick of bricks) {
    drawBrick(brick);
  }
}
function updateBrickCollisions(ball) {
  for (let i = bricks.length - 1; i >= 0; i--) {
    const collision = checkCircleBrickCollision(bricks[i], ball);
    if (collision !== null) {
      if (handleBrickBallCollision(ball, bricks[i], collision)) {
        if (bricks[i].health === 1) {
          bricks.splice(i, 1);
        } else {
          bricks[i].health--;
        }
      }
    }
  }
}
generateBricks(10, 5);
let ball = createBall({
  x: canvas.width / 2,
  y: 300,
  radius: 20,
  vx: 0,
  vy: 0,
  angle: 0,
  angularVelocity: 0,
  trail: [],
});

let timestamp = 0;
let lastTime = 0;
let maxSpeed = 350;

function gameloop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!lastTime) {
    lastTime = timestamp;
  }
  let dt = (timestamp - lastTime) * 0.001;
  if (dt >= 0.1) {
    dt = 0;
  }
  lastTime = timestamp;
  if (bricks.length === 0 && game.state === "playing") {
    game.state = "gameOver";
    updateRecords();
    updateUI();
  }
  if (game.state === "gameOver") {
    updateUI();
    // restartGame();
  }
  if (game.state === "playing") {
    updateBrickCollisions(ball);
    updateControls(dt);
    updateArm(dt);
    handleBallBoundaries(ball);
    updateBall(ball, dt);
    collisionBallPaddle(ball);
    game.elapsedTime += dt;
  }
  drawArm();
  drawBall(ball);
  drawBricks();
  //limitBallSpeed(ball, maxSpeed);

  showTime();
  requestAnimationFrame(gameloop);
}
function restartGame() {
  bricks.length = 0;
  game.attempts = 1;
  game.elapsedTime = 0;
  generateBricks(10, 5);
  ball.x = shoulder.x;
  ball.y = 300;
  ball.vx = 0;
  ball.vy = 0;
  ball.angle = 0;
  ball.angularVelocity = 0;
  game.state = "playing";
  shoulder.angle = radians(45);
  elbow.angle = radians(-90);
  wrist.angle = 0;
  let pressedA = false;
  let pressedS = false;
  let pressedD = false;
  let pressedJ = false;
  let pressedK = false;
  let pressedL = false;
  updateUI();
}
function updateRecords() {
  if (
    game.attempts < game.record ||
    (game.attempts === game.record && game.elapsedTime < game.recordTime)
  ) {
    game.record = game.attempts;
    game.recordTime = game.elapsedTime;
    localStorage.setItem("record", game.record);
    localStorage.setItem("recordTime", game.recordTime);
  }
}

updateUI();
function updateUI() {
  const overlay = document.getElementById("game-over-overlay");
  overlay.classList.toggle("visible", game.state === "gameOver");
  const startOverlay = document.getElementById("game-start-overlay");
  startOverlay.classList.toggle("visible", game.state === "start");
  const pauseOverlay = document.getElementById("game-pause-overlay");
  pauseOverlay.classList.toggle("visible", game.state === "pause");
  attempt.innerText = game.attempts;
  if (game.record === Infinity) {
    recordAttempts.innerText = "Not set";
  } else {
    recordAttempts.innerText = game.record;
  }
  if (game.recordTime === 0) {
    recordTimer.innerText = "Not set";
  } else {
    recordTimer.innerText = formatTime(game.recordTime);
  }
}
const restartButton = document.getElementById("restart-button");
restartButton.addEventListener("click", restartGame);
const restartButtonFromPause = document.getElementById("restart-from-pause");
restartButtonFromPause.addEventListener("click", restartGame);
const startButton = document.getElementById("startbutton");
startButton.addEventListener("click", () => {
  game.state = "playing";
  updateUI();
});
function limitBallSpeed(ball, maxSpeed) {
  const totalSpeed = Math.hypot(ball.vx, ball.vy);
  if (totalSpeed > maxSpeed) {
    const scale = maxSpeed / totalSpeed;
    ball.vx = maxSpeed * scale;
    ball.vy = maxSpeed * scale;
  }
}
// Find the end of a limb. angle is in radians.
function calculateEndpoint(start, length, angle) {
  const x = start.x + length * Math.cos(angle);
  const y = start.y + length * Math.sin(angle);
  return { x, y };
}

function updateArm(dt) {
  ({ x: elbow.x, y: elbow.y } = calculateEndpoint(
    shoulder,
    arm.overArm.length,
    shoulder.angle,
  ));
  ({ x: wrist.x, y: wrist.y } = calculateEndpoint(
    elbow,
    arm.underArm.length,
    shoulder.angle + elbow.angle,
  ));
  ({ x: hand.x, y: hand.y } = calculateEndpoint(
    wrist,
    arm.hand.length,
    shoulder.angle + elbow.angle + wrist.angle,
  ));
  ({ x: paddleRight.x, y: paddleRight.y } = calculateEndpoint(
    hand,
    arm.paddle.length / 2,
    shoulder.angle + elbow.angle + wrist.angle + Math.PI / 2,
  ));
  ({ x: paddleLeft.x, y: paddleLeft.y } = calculateEndpoint(
    hand,
    arm.paddle.length / 2,
    shoulder.angle + elbow.angle + wrist.angle - Math.PI / 2,
  ));
  shoulder.angle += shoulder.angularVelocity * dt;
  elbow.angle += elbow.angularVelocity * dt;
  wrist.angle += wrist.angularVelocity * dt;
}

function drawArmSegment(start, end, thickness) {
  const dx = start.x - end.x;
  const dy = start.y - end.y;
  const L = Math.hypot(dx, dy);
  const nx = dx / L;
  const ny = dy / L;
  const px = -ny;
  const py = nx;
  const halfThickness = thickness / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(start.x + px * halfThickness, start.y + py * halfThickness);
  ctx.lineTo(end.x + px * halfThickness, end.y + py * halfThickness);
  ctx.lineTo(end.x + -px * halfThickness, end.y + -py * halfThickness);
  ctx.lineTo(start.x + -px * halfThickness, start.y + -py * halfThickness);
  ctx.closePath();
  ctx.fillStyle = "#2F3744";
  ctx.strokeStyle = "#7E8A9A";
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function radians(degrees) {
  return degrees * (Math.PI / 180);
}
function drawJoints() {
  ctx.save();
  ctx.fillStyle = "#374355";
  ctx.strokeStyle = "#91A4BC";
  ctx.lineWidth = 2;
  ctx.beginPath();

  ctx.stroke();
  ctx.fill();
  drawJoint(shoulder.x, shoulder.y, 8, "#182536", "#b1c2d5", 1);
  ctx.beginPath();

  ctx.stroke();
  drawJoint(shoulder.x, shoulder.y, shoulder.radius, "#374355", "#91A4BC", 2);
  ctx.fill();
  ctx.beginPath();

  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  drawJoint(hand.x, hand.y, 6, "#374355", "#91A4BC", 2);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
function drawJoint(x, y, radius, fillStyle, strokeStyle, lineWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawJointIndicator(joint, orientation) {
  ctx.save();
  let startAngle;
  if (joint.angularVelocity === 0) {
    ctx.restore();
    return;
  } else if (Math.sign(joint.angularVelocity) > 0) {
    startAngle = orientation;
  } else if (Math.sign(joint.angularVelocity) < 0) {
    startAngle = orientation + Math.PI;
  }
  const endAngle = startAngle + Math.PI;
  ctx.beginPath();
  ctx.strokeStyle = "#53B8FF";
  ctx.lineWidth = joint.radius * 0.3;
  ctx.lineCap = "round";
  const speedRatio = Math.abs(joint.angularVelocity) / joint.maxAngularVelocity;

  ctx.globalAlpha = 0.15 + (0.8 - 0.15) * speedRatio;
  ctx.arc(joint.x, joint.y, joint.radius * 0.75, startAngle, endAngle);
  ctx.stroke();
  ctx.restore();
}
function drawArm() {
  drawArmSegment(shoulder, elbow, arm.overArm.thickness);
  drawJoint(shoulder.x, shoulder.y, shoulder.radius, "#374355", "#91A4BC", 2);
  drawJointIndicator(shoulder, shoulder.angle);
  drawJoint(shoulder.x, shoulder.y, 8, "#182536", "#b1c2d5", 1);
  drawArmSegment(elbow, wrist, arm.underArm.thickness);
  drawJoint(elbow.x, elbow.y, elbow.radius, "#374355", "#91A4BC", 2);
  drawJointIndicator(elbow, shoulder.angle + elbow.angle);
  drawJoint(elbow.x, elbow.y, 7, "#182536", "#b1c2d5", 1);
  //drawArmSegment(hand, paddleRight, arm.paddle.thickness);
  drawArmSegment(wrist, hand, arm.hand.thickness);
  drawJoint(wrist.x, wrist.y, wrist.radius, "#374355", "#91A4BC", 2);
  drawJointIndicator(wrist, shoulder.angle + elbow.angle + wrist.angle);
  drawJoint(wrist.x, wrist.y, 6, "#182536", "#b1c2d5", 1);
  drawArmSegment(paddleRight, paddleLeft, arm.paddle.thickness);
  drawJoint(hand.x, hand.y, 6, "#374355", "#91A4BC", 2);
}

function updateControls(dt) {
  updateJointControls(shoulder, pressedL - pressedA, dt);
  updateJointControls(elbow, pressedK - pressedS, dt);
  updateJointControls(wrist, pressedJ - pressedD, dt);
}

function updateJointControls(joint, direction, dt) {
  if (direction !== 0) {
    joint.angularVelocity += joint.angularAcceleration * dt * direction;
  } else if (joint.angularVelocity > 0) {
    joint.angularVelocity = Math.max(
      0,
      joint.angularVelocity - joint.angularDeceleration * dt,
    );
  } else if (joint.angularVelocity < 0) {
    joint.angularVelocity = Math.min(
      0,
      joint.angularVelocity + joint.angularDeceleration * dt,
    );
  }

  joint.angularVelocity = Math.max(
    -joint.maxAngularVelocity,
    Math.min(joint.angularVelocity, joint.maxAngularVelocity),
  );
}

let pressedA = false;
let pressedS = false;
let pressedD = false;
let pressedJ = false;
let pressedK = false;
let pressedL = false;

document.addEventListener("keydown", (event) => {
  if (event.key === "a") {
    console.log(shoulder.angle);
    pressedA = true;
  }

  if (event.key === "s") {
    console.log(elbow.angle);
    pressedS = true;
  }

  if (event.key === "d") {
    console.log(wrist.angle);
    pressedD = true;
  }

  if (event.key === "l") {
    console.log(shoulder.angle);
    pressedL = true;
  }

  if (event.key === "k") {
    console.log(elbow.angle);
    pressedK = true;
  }

  if (event.key === "j") {
    console.log(wrist.angle);
    pressedJ = true;
  }
  if (event.key === "Escape") {
    if (game.state !== "pause") {
      game.state = "pause";
      updateUI();
    } else {
      game.state = "playing";
      updateUI();
    }
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "a") {
    console.log(shoulder.angle);
    pressedA = false;
  }

  if (event.key === "s") {
    console.log(elbow.angle);
    pressedS = false;
  }

  if (event.key === "d") {
    console.log(wrist.angle);
    pressedD = false;
  }

  if (event.key === "l") {
    console.log(shoulder.angle);
    pressedL = false;
  }

  if (event.key === "k") {
    console.log(elbow.angle);
    pressedK = false;
  }

  if (event.key === "j") {
    console.log(wrist.angle);
    pressedJ = false;
  }
});

function calculatePointVelocity(point) {
  const pxShoulder = -(point.y - shoulder.y);
  const pyShoulder = point.x - shoulder.x;
  const pxElbow = -(point.y - elbow.y);
  const pyElbow = point.x - elbow.x;
  const pxWrist = -(point.y - wrist.y);
  const pyWrist = point.x - wrist.x;

  const vx =
    shoulder.angularVelocity * pxShoulder +
    elbow.angularVelocity * pxElbow +
    wrist.angularVelocity * pxWrist;

  const vy =
    shoulder.angularVelocity * pyShoulder +
    elbow.angularVelocity * pyElbow +
    wrist.angularVelocity * pyWrist;
  return { vx, vy };
}
// Collision
function collisionBallPaddle(ball) {
  const abX = paddleRight.x - paddleLeft.x;
  const abY = paddleRight.y - paddleLeft.y;
  const apX = ball.x - paddleLeft.x;
  const apY = ball.y - paddleLeft.y;
  const dot = abX * apX + abY * apY;
  const t = dot / (abX ** 2 + abY ** 2);
  const clamped = Math.max(0, Math.min(t, 1));
  const closestX = paddleLeft.x + clamped * abX;
  const closestY = paddleLeft.y + clamped * abY;
  const collisionThreshold = ball.radius + arm.paddle.thickness / 2;
  const distance = Math.hypot(closestX - ball.x, closestY - ball.y);
  let nx, ny;
  const displacementVectorX = ball.x - closestX;
  const displacementVectorY = ball.y - closestY;
  const restitution = 0.4;
  if (distance === 0) {
    const newDistance = Math.hypot(abX, abY);
    nx = -abY / newDistance;
    ny = abX / newDistance;
  } else if (distance > 0) {
    nx = displacementVectorX / distance;
    ny = displacementVectorY / distance;
  }
  //friction
  const tx = -ny;
  const ty = nx;
  if (distance <= collisionThreshold) {
    const { vx: paddleVx, vy: paddleVy } = calculatePointVelocity({
      x: closestX,
      y: closestY,
    });

    const relativeVelocityX = ball.vx - paddleVx;
    const relativeVelocityY = ball.vy - paddleVy;
    const tangentialVelocity = relativeVelocityX * tx + relativeVelocityY * ty;
    const slidingVelocity =
      tangentialVelocity - ball.angularVelocity * ball.radius;

    // !!!!
    const mass = 1;
    const frictionCoefficient = 0.3;
    // !!!!

    const momentOfInertia = 0.5 * mass * ball.radius ** 2;

    let frictionImpulse =
      -slidingVelocity / (1 / mass + ball.radius ** 2 / momentOfInertia);

    const collisionDot = nx * relativeVelocityX + ny * relativeVelocityY;
    if (collisionDot < 0) {
      //SLAp
      const j = -(1 + restitution) * collisionDot;
      const maxFrictionImpulse = Math.abs(frictionCoefficient * j);
      frictionImpulse = Math.max(
        -maxFrictionImpulse,
        Math.min(frictionImpulse, maxFrictionImpulse),
      );
      ball.vx += j * nx;
      ball.vy += j * ny;
      ball.angularVelocity += -(
        (frictionImpulse * ball.radius) /
        momentOfInertia
      );
      ball.vx += (frictionImpulse / mass) * tx;
      ball.vy += (frictionImpulse / mass) * ty;
    }
    const penetration = collisionThreshold - distance;
    if (penetration > 0) {
      ball.x += penetration * nx;
      ball.y += penetration * ny;
    }
  }
}

// BALL

function createBall({
  x,
  y,
  radius,
  vx = 0,
  vy = 0,
  angle = 0,
  angularVelocity = 0,
  trail = [],
  rotationTail = [],
}) {
  return { x, y, radius, vx, vy, angle, angularVelocity, trail, rotationTail };
}
attempt.innerText = game.attempts;
function handleBallBoundaries(ball) {
  if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.vx = -ball.vx;
  }
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = -ball.vx;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = -ball.vy;
  }
  if (ball.y + ball.radius > canvas.height) {
    //lose life, if(life === 0) { game over}
    ball.x = shoulder.x;
    ball.y = 300;
    ball.vx = 0;
    ball.vy = 0;
    ball.angle = 0;
    ball.angularVelocity = 0;
    ball.trail.length = 0;
    ball.rotationTail.length = 0;
    game.attempts += 1;
    attempt.innerText = game.attempts;
  }
}
function drawBall(ball) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    ball.x - 0.3 * ball.radius,
    ball.y - 0.3 * ball.radius,
    0,
    ball.x,
    ball.y,
    ball.radius,
  );
  gradient.addColorStop(0, "#A2B9D3");
  gradient.addColorStop(0.3, "#53667F");
  gradient.addColorStop(0.7, "#273549");
  gradient.addColorStop(1, "#101827");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(
    ball.x - ball.radius * Math.cos(ball.angle),
    ball.y - ball.radius * Math.sin(ball.angle),
  );
  ctx.lineTo(
    ball.x + ball.radius * Math.cos(ball.angle),
    ball.y + ball.radius * Math.sin(ball.angle),
  );
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBallTrail(ball) {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < ball.trail.length - 1; i++) {
    const t = i / (ball.trail.length - 1);
    const lineWidth = 0.5 + 7 * t;
    const alpha = 0.1 + 0.8 * t;

    ctx.beginPath();
    ctx.moveTo(ball.trail[i].x, ball.trail[i].y);
    ctx.lineTo(ball.trail[i + 1].x, ball.trail[i + 1].y);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#65758B";
    ctx.globalAlpha = alpha;
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  for (let i = 0; i < ball.trail.length - 1; i++) {
    const t = i / (ball.trail.length - 1);
    const lineWidth = 0.5 + 2 * t;
    const alpha = 0.1 + 0.5 * t;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#4F87B8";
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(ball.rotationTail[i].x, ball.rotationTail[i].y);
    ctx.lineTo(ball.rotationTail[i + 1].x, ball.rotationTail[i + 1].y);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#D18B44";
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ball.rotationTail[i].x2, ball.rotationTail[i].y2);
    ctx.lineTo(ball.rotationTail[i + 1].x2, ball.rotationTail[i + 1].y2);
    ctx.stroke();
  }

  // ctx.beginPath();
  // ctx.lineWidth = 1;
  // ctx.strokeStyle = "orange";
  // for (let pos of ball.rotationTail) {
  //   ctx.lineTo(pos.x, pos.y);
  // }

  ctx.restore();
}
function updateBall(ball, dt) {
  const y0 = ball.y;
  const vy0 = ball.vy;
  const airResistance = 0.8;
  const angularDragCoefficient = 0.4;
  const magnusStrengthCoefficient = 0.03;
  const angularDragAcceleration = -(
    angularDragCoefficient * ball.angularVelocity
  );
  ball.angularVelocity += angularDragAcceleration * dt;
  ball.angle += ball.angularVelocity * dt;
  const magnusAx = -(
    magnusStrengthCoefficient *
    ball.angularVelocity *
    ball.vy
  );
  const magnusAy = magnusStrengthCoefficient * ball.angularVelocity * ball.vx;

  const ax = -airResistance * ball.vx + magnusAx;
  const ay = gravity - airResistance * ball.vy + magnusAy;

  ball.vx += ax * dt;
  ball.vy += ay * dt;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 60) {
    ball.trail.shift();
  }
  ball.rotationTail.push({
    x: ball.x + ball.radius * Math.cos(ball.angle),
    y: ball.y + ball.radius * Math.sin(ball.angle),
    x2: ball.x - ball.radius * Math.cos(ball.angle),
    y2: ball.y - ball.radius * Math.sin(ball.angle),
  });
  if (ball.rotationTail.length > 60) {
    ball.rotationTail.shift();
  }
  drawBallTrail(ball);
}

// INFO

requestAnimationFrame(gameloop);
