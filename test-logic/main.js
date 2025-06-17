import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from '../WebGLUtils.js';
import MouseInput from '../MouseInput.js';

async function main() {
  /** @type {WebGLRenderingContext} */
  const gl = WebGLUtils.initWebGL();
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  WebGLUtils.resizeCanvasToWindow(gl);

  const vertices = await WebGLUtils.loadOBJ("../temp-obj/temp-table.obj", true);
  const verticesball = await WebGLUtils.loadOBJ("../temp-obj/temp-ball.obj",true);
  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");

const ballPositions = [
    // Cue ball
    [0.0, 0.57, -1.0],        // Cue ball (white ball)
    
    // Triangle formation (15 balls)
    [0.0, 0.57, 1.0],         // Front ball
    
    [-0.065, 0.57, 1.112],    // Second row left
    [0.065, 0.57, 1.112],     // Second row right
    
    [-0.13, 0.57, 1.224],     // Third row left 
    [0.0, 0.57, 1.224],       // Third row middle
    [0.13, 0.57, 1.224],      // Third row right
    
    [-0.195, 0.57, 1.336],    // Fourth row left
    [-0.065, 0.57, 1.336],    // Fourth row middle left
    [0.065, 0.57, 1.336],     // Fourth row middle right  
    [0.195, 0.57, 1.336],     // Fourth row right
    
    [-0.26, 0.57, 1.448],     // Fifth row leftmost
    [-0.13, 0.57, 1.448],     // Fifth row middle left
    [0.0, 0.57, 1.448],       // Fifth row middle
    [0.13, 0.57, 1.448],      // Fifth row middle right
    [0.26, 0.57, 1.448],      // Fifth row rightmost
];

// Ball colors (you might want to adjust these)
const ballColors = [
    [1.0, 1.0, 1.0],   // Cue ball (white)
    [1.0, 1.0, 0.0],   // Yellow
    [0.0, 0.0, 1.0],   // Blue
    [1.0, 0.0, 0.0],   // Red
    [0.57, 0.0, 0.57],   // Purple
    [0.0, 0.0, 0.0],   // 8 ball (black)
    [0.0, 0.57, 0.0],   // Green
    [0.8, 0.4, 0.0],   // Brown
    [1.0, 0.0, 0.0],   // Red
    [1.0, 1.0, 0.0],   // Yellow
    [0.0, 0.0, 1.0],   // Blue
    [1.0, 0.57, 0.0],   // Orange
    [0.57, 0.0, 0.57],   // Purple
    [0.0, 0.57, 0.0],   // Green
    [0.8, 0.4, 0.0],   // Brown
    [1.0, 0.57, 0.0],   // Orange
];

function renderBalls(projectionMat, viewMat) {
    for (let i = 0; i < ballPositions.length; i++) {
        // Skip rendering pocketed balls
        if (pocketedBalls[i]) continue;
        
        const ballModelMat = mat4.create();
        mat4.translate(ballModelMat, ballModelMat, ballPositions[i]);
        mat4.scale(ballModelMat, ballModelMat, [0.09, 0.09, 0.09]);

        const ballMvpMat = mat4.create();
        mat4.multiply(ballMvpMat, projectionMat, viewMat);
        mat4.multiply(ballMvpMat, ballMvpMat, ballModelMat);

        WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [ballMvpMat]);
        WebGLUtils.setUniform3f(gl, program, ["u_color"], ballColors[i]);
        gl.useProgram(program);
        gl.bindVertexArray(VAOball);
        gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
    }
}


  // Ball physics variables
  const ballVelocities = ballPositions.map(() => [0, 0, 0]);
  const friction = 0.98;
  // More accurate table boundaries for standard pool table
  const tableMinX = -1.37, tableMaxX = 1.37; // Standard 9ft table is ~2.74m wide
  const tableMinZ = -2.74, tableMaxZ = 2.74; // Standard 9ft table is ~5.48m long

  // Pocket positions (6 pockets in 8-ball pool)
  const pockets = [
    // Corner pockets
    { x: tableMinX, z: tableMinZ, radius: 0.12 }, // Bottom left
    { x: tableMaxX, z: tableMinZ, radius: 0.12 }, // Bottom right
    { x: tableMinX, z: tableMaxZ, radius: 0.12 }, // Top left
    { x: tableMaxX, z: tableMaxZ, radius: 0.12 }, // Top right
    // Side pockets (middle of long sides)
    { x: tableMinX, z: 0, radius: 0.10 }, // Left side
    { x: tableMaxX, z: 0, radius: 0.10 }  // Right side
  ];

  // Track pocketed balls
  const pocketedBalls = new Array(ballPositions.length).fill(false);

  // Shooting variables
  let isAiming = false;
  let shootPower = 0;
  let aimAngle = 0; // Angle in radians
  let maxShootPower = 0.5;
  const ballRadius = 0.09;

  const mouse = new MouseInput(gl.canvas);
  let yaw = 0;
  let pitch = 2.4;
  let radius = 4; 

  // Add shooting controls
  let isMouseDown = false;
  let shootStartTime = 0;
  let keys = {};

  // Keyboard event listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  gl.canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button
      isMouseDown = true;
      isAiming = true;
      shootStartTime = Date.now();
      shootPower = 0;
    }
  });

  gl.canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0 && isAiming) { // Left mouse button
      isMouseDown = false;
      isAiming = false;
      
      // Shoot the cue ball using angle
      ballVelocities[0][0] = Math.sin(aimAngle) * shootPower;
      ballVelocities[0][2] = Math.cos(aimAngle) * shootPower;
      
      shootPower = 0;
    }
  });

  // Remove the old mousemove event listener for aiming
  // ...existing code...

  // Helper function to convert world coordinates to screen coordinates
  function worldToScreen(worldPos, projMat, viewMat, screenWidth, screenHeight) {
    const mvpMat = mat4.create();
    mat4.multiply(mvpMat, projMat, viewMat);
    
    const clipPos = vec3.create();
    vec3.transformMat4(clipPos, worldPos, mvpMat);
    
    return [
      (clipPos[0] + 1) * screenWidth / 2,
      (1 - clipPos[1]) * screenHeight / 2
    ];
  }

  gl.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius += e.deltaY * 0.01;
    radius = Math.max(2, Math.min(30, radius)); 
  });

  const VAO = WebGLUtils.createVAO(gl, program, vertices, 8, [
    { name: "in_position", size: 3, offset: 0 },
    { name: "in_normal", size: 3, offset: 5 },
  ]);

  const VAOball = WebGLUtils.createVAO(gl, program, verticesball, 8, [
    { name: "in_position", size: 3, offset: 0 },
    { name: "in_normal", size: 3, offset: 5 },
  ]);

  function checkBallCollision(ball1Pos, ball1Vel, ball2Pos, ball2Vel) {
    const dx = ball1Pos[0] - ball2Pos[0];
    const dz = ball1Pos[2] - ball2Pos[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < ballRadius * 2) {
      // Normalize collision vector
      const nx = dx / distance;
      const nz = dz / distance;
      
      // Separate balls to prevent overlap
      const overlap = ballRadius * 2 - distance;
      ball1Pos[0] += nx * overlap * 0.5;
      ball1Pos[2] += nz * overlap * 0.5;
      ball2Pos[0] -= nx * overlap * 0.5;
      ball2Pos[2] -= nz * overlap * 0.5;
      
      // Calculate relative velocity
      const relVelX = ball1Vel[0] - ball2Vel[0];
      const relVelZ = ball1Vel[2] - ball2Vel[2];
      
      // Calculate relative velocity along collision normal
      const relVelNormal = relVelX * nx + relVelZ * nz;
      
      // Do not resolve if velocities are separating
      if (relVelNormal > 0) return;
      
      // Calculate restitution (bounciness)
      const restitution = 0.8;
      
      // Calculate impulse scalar
      const impulse = -(1 + restitution) * relVelNormal / 2; // Assuming equal mass
      
      // Apply impulse
      ball1Vel[0] += impulse * nx;
      ball1Vel[2] += impulse * nz;
      ball2Vel[0] -= impulse * nx;
      ball2Vel[2] -= impulse * nz;
    }
  }

  function checkPocketCollision(ballIndex) {
    const pos = ballPositions[ballIndex];
    
    for (let pocket of pockets) {
      const dx = pos[0] - pocket.x;
      const dz = pos[2] - pocket.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < pocket.radius) {
        // Ball is pocketed
        pocketedBalls[ballIndex] = true;
        ballVelocities[ballIndex][0] = 0;
        ballVelocities[ballIndex][1] = 0;
        ballVelocities[ballIndex][2] = 0;
        // Move ball below table (out of sight)
        ballPositions[ballIndex][1] = -1;
        return true;
      }
    }
    return false;
  }

  function updatePhysics() {
    // Handle aim angle input
    if (isAiming) {
      if (keys['a'] || keys['arrowleft']) {
        aimAngle -= 0.05;
      }
      if (keys['d'] || keys['arrowright']) {
        aimAngle += 0.05;
      }
    }

    for (let i = 0; i < ballPositions.length; i++) {
        // Skip pocketed balls
        if (pocketedBalls[i]) continue;
        
        // Apply velocity to position
        ballPositions[i][0] += ballVelocities[i][0];
        ballPositions[i][2] += ballVelocities[i][2];
        
        // Apply friction
        ballVelocities[i][0] *= friction;
        ballVelocities[i][2] *= friction;
        
        // Stop very slow balls
        if (Math.abs(ballVelocities[i][0]) < 0.001) ballVelocities[i][0] = 0;
        if (Math.abs(ballVelocities[i][2]) < 0.001) ballVelocities[i][2] = 0;
        
        // Check pocket collision first
        if (checkPocketCollision(i)) {
          continue;
        }
        
        // Boundary collision with cushions
        if (ballPositions[i][0] <= tableMinX + ballRadius || ballPositions[i][0] >= tableMaxX - ballRadius) {
            ballVelocities[i][0] *= -0.8;
            ballPositions[i][0] = Math.max(tableMinX + ballRadius, Math.min(tableMaxX - ballRadius, ballPositions[i][0]));
        }
        if (ballPositions[i][2] <= tableMinZ + ballRadius || ballPositions[i][2] >= tableMaxZ - ballRadius) {
            ballVelocities[i][2] *= -0.8;
            ballPositions[i][2] = Math.max(tableMinZ + ballRadius, Math.min(tableMaxZ - ballRadius, ballPositions[i][2]));
        }
    }
    
    // Check ball-to-ball collisions (only for non-pocketed balls)
    for (let i = 0; i < ballPositions.length; i++) {
      if (pocketedBalls[i]) continue;
      for (let j = i + 1; j < ballPositions.length; j++) {
        if (pocketedBalls[j]) continue;
        checkBallCollision(ballPositions[i], ballVelocities[i], ballPositions[j], ballVelocities[j]);
      }
    }
  }

  function renderCueStick(projectionMat, viewMat) {
    if (!isAiming) return;
    
    const cuePos = ballPositions[0]; // Cue ball position
    const stickLength = 1.5 + shootPower * 2;
    
    // Calculate stick position based on aim angle
    const stickEnd = [
        cuePos[0] - Math.sin(aimAngle) * stickLength,
        cuePos[1],
        cuePos[2] - Math.cos(aimAngle) * stickLength
    ];
    
    // Simple line rendering for cue stick (you might want to replace with actual geometry)
    const stickModelMat = mat4.create();
    mat4.translate(stickModelMat, stickModelMat, stickEnd);
    
    // Rotate the stick to align with aim direction
    mat4.rotateY(stickModelMat, stickModelMat, aimAngle);
    
    // Scale to make it look like a stick
    mat4.scale(stickModelMat, stickModelMat, [0.02, 0.02, stickLength]);
    
    const stickMvpMat = mat4.create();
    mat4.multiply(stickMvpMat, projectionMat, viewMat);
    mat4.multiply(stickMvpMat, stickMvpMat, stickModelMat);
    
    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [stickMvpMat]);
    WebGLUtils.setUniform3f(gl, program, ["u_color"], [0.6, 0.3, 0.1]); // Brown color for stick
    gl.useProgram(program);
    gl.bindVertexArray(VAOball);
    gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
  }

  function render() {
    // Update physics
    updatePhysics();
    
    // Update shoot power while aiming
    if (isMouseDown && isAiming) {
      const elapsed = (Date.now() - shootStartTime) / 1000;
      shootPower = Math.min(elapsed * 0.2, maxShootPower);
    }

    // Handle mouse input for camera (only when not aiming)
    const { deltaX, deltaY, isDragging } = mouse.getDeltas();
    if (isDragging && !isAiming) {
      yaw += -deltaX * 0.01;
      pitch += deltaY * 0.01;
      pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
    }

    // Calculate camera position
    const eye = [
      radius * Math.sin(yaw) * Math.cos(pitch),
      radius * Math.sin(pitch) + 2, // Slightly above the table
      radius * Math.cos(yaw) * Math.cos(pitch)
    ];
    const center = [0, 0, 0];
    const up = [0, 1, 0];

    const lightDir = vec3.fromValues(0.0, 2.0, 0.0);
    const lightColor = vec3.fromValues(1.0, 1.0, 1.0); // white light

    vec3.normalize(lightDir, lightDir);

    WebGLUtils.setUniform3f(gl, program,
    ["u_light_direction",
      "u_light_color"],
    [lightDir,
    lightColor]
    );
    // Table matrices
    const tableModelMat = mat4.create();
    const viewMat = mat4.create();
    const projectionMat = mat4.create();
    mat4.lookAt(viewMat, eye, center, up);
    mat4.perspective(projectionMat, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

    // MVP for table
    const tableMvpMat = mat4.create();
    mat4.multiply(tableMvpMat, projectionMat, viewMat);
    mat4.multiply(tableMvpMat, tableMvpMat, tableModelMat);

    // Ball matrices
    const ballModelMat = mat4.create();
    mat4.translate(ballModelMat, ballModelMat, [0, 0.57, 0]); // Position ball higher
    mat4.scale(ballModelMat, ballModelMat, [0.09, 0.09, 0.]); // Make ball smaller

    // MVP for ball
    const ballMvpMat = mat4.create();
    mat4.multiply(ballMvpMat, projectionMat, viewMat);
    mat4.multiply(ballMvpMat, ballMvpMat, ballModelMat);
    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [tableMvpMat]);
    // Render table
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindVertexArray(VAO);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);

    renderBalls(projectionMat, viewMat);
    renderCueStick(projectionMat, viewMat);

    requestAnimationFrame(render);
  }

  render();
}

main();