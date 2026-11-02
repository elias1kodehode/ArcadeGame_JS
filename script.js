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
};

const shoulder = {
  x: canvas.width / 2,
  y: canvas.height / 1.3,
  radius: 20,
  angle: radians(45),
};
const elbow = {
  x: 0,
  y: 0,
  radius: 20,
  angle: radians(-90),
};
const wrist = {
  x: 0,
  y: 0,
  radius: 15,
  angle: 0,
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
  updateControls(dt);
  updateArm();
  drawArm();

  requestAnimationFrame(gameloop);
}

// Find the end of a limb. angle is in radians.
function calculateEndpoint(start, length, angle) {
  const x = start.x + length * Math.cos(angle);
  const y = start.y + length * Math.sin(angle);
  return { x, y };
}

function updateArm() {
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
  drawJoints();
}

function updateControls(dt) {
  const rotationSpeed = Math.PI;

  if (pressedA === true) {
    shoulder.angle -= rotationSpeed * dt;
  }
  if (pressedJ === true) {
    shoulder.angle += rotationSpeed * dt;
  }

  if (pressedS === true) {
    elbow.angle -= rotationSpeed * dt;
  }
  if (pressedK === true) {
    elbow.angle += rotationSpeed * dt;
  }
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

  if (event.key === "j") {
    console.log(shoulder.angle);
    pressedJ = true;
  }

  if (event.key === "k") {
    console.log(elbow.angle);
    pressedK = true;
  }

  if (event.key === "l") {
    console.log(wrist.angle);
    pressedL = true;
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

  if (event.key === "j") {
    console.log(shoulder.angle);
    pressedJ = false;
  }

  if (event.key === "k") {
    console.log(elbow.angle);
    pressedK = false;
  }

  if (event.key === "l") {
    console.log(wrist.angle);
    pressedL = false;
  }
});

// BALL
function createBall({ x, y, radius, vx = 0, vy = 0, z = 0 }) {
  return { x, y, radius, vx, vy, z };
}
function updateBall(ball, dt) {
  const x0 = ball.x;
  const y0 = ball.y;

  ball.x = x0 + ball.vx * dt;
  ball.y = y0 + ball.vy * dt;
}

requestAnimationFrame(gameloop);
