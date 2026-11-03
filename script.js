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

let ball = {
  x: 200,
  y: 400,
  radius: 20,
  vx: 0,
  vy: 0,
};
let timestamp = 0;
let lastTime = 0;
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
  updateControls();
  updateArm(dt);
  handleBallBoundaries(ball);
  updateBall(ball, dt);
  collisionBallPaddle(ball);
  drawArm();
  drawBall(ball);

  requestAnimationFrame(gameloop);
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
    ball.x = 200;
    ball.y = 400;
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
