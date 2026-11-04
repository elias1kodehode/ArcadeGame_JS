const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.height = 720;
canvas.width = 480;

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
};
const elbow = {
  x: 0,
  y: 0,
  radius: 20,
  angle: radians(-90),
  angularVelocity: 0,
};
const wrist = {
  x: 0,
  y: 0,
  radius: 15,
  angle: radians(30),
  angularVelocity: 0,
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

function createBrick({ x, y, width, height, health = 1, score = 100 }) {
  return { x, y, width, height, health, score };
}
function drawBrick(brick) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "blue";
  ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  ctx.closePath();

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
  ball.x += penetration * nx;
  ball.y += penetration * ny;
  if (dot < 0) {
    ball.vx += -(1 + restitution) * dot * nx;
    ball.vy += -(1 + restitution) * dot * ny;
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
let ball = {
  x: shoulder.x,
  y: 500,
  radius: 20,
  vx: 0,
  vy: 0,
};
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
  updateBrickCollisions(ball);
  updateControls();
  updateArm(dt);
  handleBallBoundaries(ball);
  updateBall(ball, dt);
  collisionBallPaddle(ball);
  drawArm();
  drawBall(ball);
  drawBricks();
  //limitBallSpeed(ball, maxSpeed);
  requestAnimationFrame(gameloop);
}
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

  ctx.beginPath();
  ctx.moveTo(start.x + px * halfThickness, start.y + py * halfThickness);
  ctx.lineTo(end.x + px * halfThickness, end.y + py * halfThickness);
  ctx.lineTo(end.x + -px * halfThickness, end.y + -py * halfThickness);
  ctx.lineTo(start.x + -px * halfThickness, start.y + -py * halfThickness);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function radians(degrees) {
  return degrees * (Math.PI / 180);
}
function drawJoints() {
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, shoulder.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(elbow.x, elbow.y, elbow.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, wrist.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}
function drawArm() {
  drawArmSegment(shoulder, elbow, arm.overArm.thickness);
  drawArmSegment(elbow, wrist, arm.underArm.thickness);
  drawArmSegment(wrist, hand, arm.hand.thickness);
  drawArmSegment(hand, paddleRight, arm.paddle.thickness);
  drawArmSegment(hand, paddleLeft, arm.paddle.thickness);
  drawJoints();
}

function updateControls() {
  const rotationSpeed = Math.PI;

  // if (pressedA && pressedL) {
  //   shoulder.angularVelocity = 0;
  // } else if (pressedA === true) {
  //   shoulder.angularVelocity = -rotationSpeed;
  // } else if (pressedL === true) {
  //   shoulder.angularVelocity = +rotationSpeed;
  // } else {
  //   shoulder.angularVelocity = 0;
  // }
  shoulder.angularVelocity = rotationSpeed * (pressedL - pressedA);
  elbow.angularVelocity = rotationSpeed * (pressedK - pressedS);
  wrist.angularVelocity = rotationSpeed * (pressedJ - pressedD);
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
  if (distance === 0) {
    const newDistance = Math.hypot(abX, abY);
    nx = -abY / newDistance;
    ny = abX / newDistance;
  } else if (distance > 0) {
    nx = displacementVectorX / distance;
    ny = displacementVectorY / distance;
  }
  if (distance <= collisionThreshold) {
    const { vx: paddleVx, vy: paddleVy } = calculatePointVelocity({
      x: closestX,
      y: closestY,
    });

    const relativeVelocityX = ball.vx - paddleVx;
    const relativeVelocityY = ball.vy - paddleVy;

    const collisionDot = nx * relativeVelocityX + ny * relativeVelocityY;
    if (collisionDot < 0) {
      //SLAp

      const j = -(1 + 1) * collisionDot;
      ball.vx += j * nx;
      ball.vy += j * ny;
    }
    const penetration = collisionThreshold - distance;
    if (penetration > 0) {
      ball.x += penetration * nx;
      ball.y += penetration * ny;
    }
  }
}

// BALL

function createBall({ x, y, radius, vx = 0, vy = 0, z = 0 }) {
  return { x, y, radius, vx, vy, z };
}

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
    ball.y = 450;
    ball.vx = 0;
    ball.vy = 0;
  }
}
function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}
function updateBall(ball, dt) {
  // const x0 = ball.x;
  // const y0 = ball.y;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}
requestAnimationFrame(gameloop);
