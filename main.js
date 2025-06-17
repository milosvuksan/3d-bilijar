import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    alert("WebGL2 not supported");
}

const vertices = [
    -1, -1, 0,
     1, -1, 0,
     1,  1, 0,
    -1,  1, 0
];

const indices = [
    0, 1, 2,
    2, 3, 0
];

const balls = [
    {x: -10, y: 10, v: 0, r: 2},
    {x: 10, y: -10, v: 0, r: 2}
];

const vertexSource = `#version 300 es
precision mediump float;
layout(location = 0) in vec3 a_position;
uniform mat4 u_matrix;
void main() {
    gl_Position = u_matrix * vec4(a_position, 1.0);
}
`;

const fragmentSource = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
    outColor = vec4(1.0, 0.4, 0.4, 1.0);
}
`;

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

const uMatrix = gl.getUniformLocation(program, "u_matrix");


function drawBall(ball) {
    const model = mat4.create();
    mat4.translate(model, model, vec3.fromValues(ball.x / 25, ball.y / 25, 0));
    mat4.scale(model, model, vec3.fromValues(ball.r / 25, ball.r / 25, 1));
    gl.uniformMatrix4fv(uMatrix, false, model);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}
// Funkcija koja proverava da li se dve lopte sudaraju
function ballsCollide(ball1, ball2) {
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d < ball1.r + ball2.r;
}

// Reakcija na sudar (prosta zamena brzina - može se proširiti na vx, vy kasnije)
function twoBallsMove(ball1, ball2) {
    if (ballsCollide(ball1, ball2)) {
        const temp = ball1.v;
        ball1.v = ball2.v;
        ball2.v = temp;
    }
}

// Sudar lopte sa ivicom stola
function ballCollideWithTable(ball, table) {
    const minX = table.x - table.width / 2 + ball.r;
    const maxX = table.x + table.width / 2 - ball.r;
    const minY = table.y - table.height / 2 + ball.r;
    const maxY = table.y + table.height / 2 - ball.r;

    if (ball.x <= minX || ball.x >= maxX) {
        ball.v = -ball.v;
    }

    if (ball.y <= minY || ball.y >= maxY) {
        ball.v = -ball.v;
    }
}

function applySpinToCueBallSimple(initialVelocity, spinOffsets) {
  // initialVelocity: { x, y } - velocity vector
  // spinOffsets: { topBack, side } - spin inputs (-1 to +1)

  // Tunable constants for effect strength
  const torqueFactor = 0.1;    // controls how spin affects angular velocity
  const squirtAngleMax = 0.03; // max sideways deflection (radians)

  const speed = Math.sqrt(initialVelocity.x ** 2 + initialVelocity.y ** 2);
  const direction = Math.atan2(initialVelocity.y, initialVelocity.x);

  // Calculate squirt angle (side spin causes sideways deflection)
  const squirtAngle = spinOffsets.side * squirtAngleMax;

  // Adjust direction by squirt angle
  const newDirection = direction + squirtAngle;

  // New linear velocity vector after spin deflection
  const newVelocity = {
    x: speed * Math.cos(newDirection),
    y: speed * Math.sin(newDirection)
  };

  // Calculate angular velocity from spin input
  const angularVelocity = {
    x: spinOffsets.topBack * torqueFactor, // forward/back spin
    z: spinOffsets.side * torqueFactor     // side spin
  };

  return {
    linearVelocity: newVelocity,
    angularVelocity: angularVelocity
  };
}


function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.5, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    balls.forEach(ball => drawBall(ball));
}

render();
// Dodajemo osnovnu animaciju za test
function update() {
    // Pomeri loptice
    balls.forEach(ball => {
        ball.x += ball.v;
        ball.y += ball.v;

        ballCollideWithTable(ball, table);
    });

    // Proveri međusobni sudar
    twoBallsMove(balls[0], balls[1]);

    render();
    requestAnimationFrame(update);
}

// Pokreni animaciju
balls[0].v = 0.2;
balls[1].v = -0.2;

update();
