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
  const verticescue = await WebGLUtils.loadOBJ("../temp-obj/stick.obj", true); // Use stick.obj for cue stick
  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");

const ballPositions = [
    // Cue ball
    [0.0, 0.67, -1.0],        // Cue ball (white ball)

    // Triangle formation (15 balls)
    // The triangle's front is at z = 1.0, each row behind is spaced by sqrt(3)*radius
    // Each ball is 0.09 radius, so row spacing is ~0.156
    // Centered on x = 0
    [0.0, 0.67, 1.0], // Front ball

    // Second row (2 balls)
    [-0.09, 0.67, 1.0 + 0.156], // left
    [0.09, 0.67, 1.0 + 0.156],  // right

    // Third row (3 balls)
    [-0.18, 0.67, 1.0 + 0.156 * 2],
    [0.0, 0.67, 1.0 + 0.156 * 2],
    [0.18, 0.67, 1.0 + 0.156 * 2],

    // Fourth row (4 balls)
    [-0.27, 0.67, 1.0 + 0.156 * 3],
    [-0.09, 0.67, 1.0 + 0.156 * 3],
    [0.09, 0.67, 1.0 + 0.156 * 3],
    [0.27, 0.67, 1.0 + 0.156 * 3],

    // Fifth row (5 balls)
    [-0.36, 0.67, 1.0 + 0.156 * 4],
    [-0.18, 0.67, 1.0 + 0.156 * 4],
    [0.0, 0.67, 1.0 + 0.156 * 4],
    [0.18, 0.67, 1.0 + 0.156 * 4],
    [0.36, 0.67, 1.0 + 0.156 * 4],
];

// Ball colors: cue (white), 7 blue, 8-ball (black), 7 red
const ballColors = [
    [1.0, 1.0, 1.0],   // Cue ball (white)
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 0.0],   // 8 ball (black)
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 1.0],   // Blue
    [0.0, 0.0, 1.0],   // Blue
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
    [1.0, 0.0, 0.0],   // Red
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
        if (!ballColors[i]) {
            console.warn(`ballColors[${i}] is undefined! Using fallback color.`);
            WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[1,0,1]]); // fallback magenta
        } else {
            WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [ballColors[i]]);
        }
        gl.useProgram(program);
        gl.bindVertexArray(VAOball);
        gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
    }
}


  // Ball physics variables
  const ballVelocities = ballPositions.map(() => [0, 0, 0]);
  const friction = 0.98;
  // More accurate table boundaries for standard pool table
  // Set boundaries to match the table mesh size (assuming OBJ is centered at origin)
  // Adjust these values to match your OBJ table size if needed
  // Make the table bigger (e.g., 3.0m x 6.0m)
  const tableMinX = -1.5, tableMaxX = 1.5; // Table width: 3.0m
  const tableMinZ = -3.0, tableMaxZ = 3.0; // Table length: 6.0m

  // Pocket positions (6 pockets in 8-ball pool)
  // Place pockets at the four corners and the middle of the long sides, on the table surface
  // Use a slightly larger radius so the holes are bigger
  const pocketRadiusCorner = 0.17;
  const pocketRadiusSide = 0.15;
  // Y position for pockets (should match table surface, adjust if needed)
  const pocketY = 0.57;

  const pockets = [
    // Corner pockets (on the table corners)
    { x: tableMinX, z: tableMinZ, y: pocketY, radius: pocketRadiusCorner }, // Bottom left
    { x: tableMaxX, z: tableMinZ, y: pocketY, radius: pocketRadiusCorner }, // Bottom right
    { x: tableMinX, z: tableMaxZ, y: pocketY, radius: pocketRadiusCorner }, // Top left
    { x: tableMaxX, z: tableMaxZ, y: pocketY, radius: pocketRadiusCorner }, // Top right
    // Side pockets (middle of left and right sides)
    { x: tableMinX, z: 0, y: pocketY, radius: pocketRadiusSide }, // Left center
    { x: tableMaxX, z: 0, y: pocketY, radius: pocketRadiusSide }, // Right center
  ];

  // Track pocketed balls
  const pocketedBalls = new Array(ballPositions.length).fill(false);

  // Shooting variables
  let isAiming = false; // Now used only for charging/shooting, not for aiming direction
  let shootPower = 0;
  let aimAngle = 0; // Angle in radians (re-added)
  let targetAimAngle = 0; // For smooth transition
  const aimLerpSpeed = 0.15; // Lower = smoother, higher = snappier
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
    // Start aiming/charging when space is pressed
    if ((e.key === ' ' || e.code === 'Space') && canShoot() && !isAiming) {
      isAiming = true;
      shootStartTime = Date.now();
      shootPower = 0;
      e.preventDefault();
    }
    // Allow aim angle input if cue ball is stationary and not pocketed
    if (canShoot()) {
      if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'arrowleft') {
        targetAimAngle -= 0.037;
      }
      if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'arrowright') {
        targetAimAngle += 0.037;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    // Shoot when space is released
    if ((e.key === ' ' || e.code === 'Space') && isAiming && canShoot()) {
      isAiming = false;
      ballVelocities[0][0] = Math.sin(aimAngle) * shootPower;
      ballVelocities[0][2] = Math.cos(aimAngle) * shootPower;
      shootPower = 0;
      e.preventDefault();
    }
  });

  // Helper to check if cue ball is stationary and not pocketed
  function canShoot() {
    // Cue ball is not pocketed and not moving
    return !pocketedBalls[0] &&
      Math.abs(ballVelocities[0][0]) < 0.001 &&
      Math.abs(ballVelocities[0][2]) < 0.001;
  }

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

  const VAOcue = WebGLUtils.createVAO(gl, program, verticescue, 8, [
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

  // Default cue ball position
  const defaultCueBallPosition = [0.0, 0.67, -1.0];

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

        // If cue ball (white ball) is pocketed, respot it
        if (ballIndex === 0) {
          // Use setTimeout to respot after a short delay for realism (optional)
          setTimeout(() => {
            ballPositions[0][0] = defaultCueBallPosition[0];
            ballPositions[0][1] = defaultCueBallPosition[1];
            ballPositions[0][2] = defaultCueBallPosition[2];
            ballVelocities[0][0] = 0;
            ballVelocities[0][1] = 0;
            ballVelocities[0][2] = 0;
            pocketedBalls[0] = false;
          }, 500); // 0.5s delay before respotting
        }

        return true;
      }
    }
    return false;
  }

  function updatePhysics() {
    // Allow aim angle input if cue ball is stationary and not pocketed
    // (Handled in keydown event now)
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
    // Always show cue stick if cue ball is stationary and not pocketed
    if (!canShoot() && !isAiming) return;
    
    const cuePos = ballPositions[0]; // Cue ball position
    const stickLength = 1.6; // Use the OBJ's length, do not stretch
    // When charging, move the stick further away from the ball
    const pullBack = isAiming ? shootPower * 2 : 0; // Pull back more as you charge
    const stickOffset = 0.10 + pullBack; // Move the whole stick back
    const stickEnd = [
        cuePos[0] - Math.sin(aimAngle) * (stickOffset) + 0.0268,
        cuePos[1],
        cuePos[2] - Math.cos(aimAngle) * (stickOffset)
    ];

    const stickModelMat = mat4.create();
    mat4.translate(stickModelMat, stickModelMat, stickEnd);
    mat4.rotateY(stickModelMat, stickModelMat, aimAngle + Math.PI); // Fix aim direction and flip
    mat4.scale(stickModelMat, stickModelMat, [1, 1, stickLength]); // Use stick.obj's proportions

    const stickMvpMat = mat4.create();
    mat4.multiply(stickMvpMat, projectionMat, viewMat);
    mat4.multiply(stickMvpMat, stickMvpMat, stickModelMat);
    
    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [stickMvpMat]);
    WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.6, 0.3, 0.1]]); // Brown color for stick
    gl.useProgram(program);
    gl.bindVertexArray(VAOcue);
    gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
  }

  // --- Update rendering of pockets to use correct Y position ---
  function renderPockets(projectionMat, viewMat) {
    for (let pocket of pockets) {
      const pocketModelMat = mat4.create();
      mat4.translate(pocketModelMat, pocketModelMat, [pocket.x, pocket.y, pocket.z]);
      mat4.scale(pocketModelMat, pocketModelMat, [pocket.radius, pocket.radius, pocket.radius]);
      const pocketMvpMat = mat4.create();
      mat4.multiply(pocketMvpMat, projectionMat, viewMat);
      mat4.multiply(pocketMvpMat, pocketMvpMat, pocketModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [pocketMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0, 0, 0]]); // Black color for pocket
      gl.useProgram(program);
      gl.bindVertexArray(VAOball);
      gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
    }
  }

  // Helper: Brown rail rectangles between corners
  function renderRails(projectionMat, viewMat) {
    // Define the 4 corners for easier reference
    const corners = [
      { x: tableMinX, z: tableMinZ }, // Bottom left
      { x: tableMaxX, z: tableMinZ }, // Bottom right
      { x: tableMaxX, z: tableMaxZ }, // Top right
      { x: tableMinX, z: tableMaxZ }, // Top left
    ];
    const railY = pocketY + 0.01; // Slightly above table surface
    const railWidth = 0.18; // Thickness of the rail (adjust as needed)
    const railHeight = 0.04;

    // Calculate rail lengths so they run between pockets, not over them
    const railLengthX = Math.abs(tableMaxX - tableMinX) - 2 * pocketRadiusCorner;
    const railLengthZ = Math.abs(tableMaxZ - tableMinZ) - 2 * pocketRadiusCorner;

    // Horizontal rails (bottom and top)
    {
      const z = tableMinZ;
      const xMid = (tableMinX + tableMaxX) / 2 + 1.6;
      const railModelMat = mat4.create();
      mat4.translate(railModelMat, railModelMat, [xMid, railY, z]);
      mat4.rotateY(railModelMat, railModelMat, 0); // No rotation for horizontal
      // Center stick.obj: move by -0.8 in z (half its length)
      mat4.translate(railModelMat, railModelMat, [-0.2, 0, 0]);
      mat4.scale(railModelMat, railModelMat, [railLengthX / 1.6 + 2.4, railHeight / 0.05, railWidth / 0.05 + 0.12]);
      const railMvpMat = mat4.create();
      mat4.multiply(railMvpMat, projectionMat, viewMat);
      mat4.multiply(railMvpMat, railMvpMat, railModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [railMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.4, 0.2, 0.05]]);
      gl.useProgram(program);
      gl.bindVertexArray(VAOcue);
      gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
    }
    // Top rail: between top-left and top-right pockets
    {
      const z = tableMaxZ;
      const xMid = (tableMinX + tableMaxX) / 2 - 1.6;
      const railModelMat = mat4.create();
      mat4.translate(railModelMat, railModelMat, [xMid, railY, z]);
      mat4.rotateY(railModelMat, railModelMat, 0); // No rotation for horizontal
      mat4.translate(railModelMat, railModelMat, [0, 0, -6]);
      mat4.scale(railModelMat, railModelMat, [railLengthX / 1.6 + 2.4, railHeight / 0.05, railWidth / 0.05 + 0.2]);
      const railMvpMat = mat4.create();
      mat4.multiply(railMvpMat, projectionMat, viewMat);
      mat4.multiply(railMvpMat, railMvpMat, railModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [railMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.4, 0.2, 0.05]]);
      gl.useProgram(program);
      gl.bindVertexArray(VAOcue);
      gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
    }
    // Vertical rails (left and right)
    // Left rail: between bottom-left and top-left pockets
    {
      const x = tableMinX;
      const zMid = (tableMinZ + tableMaxZ) / 2 - 2.93;
      const railModelMat = mat4.create();
      mat4.translate(railModelMat, railModelMat, [x, railY, zMid]);
      mat4.rotateY(railModelMat, railModelMat, Math.PI / 2); // Rotate 90 deg for vertical
      mat4.translate(railModelMat, railModelMat, [0, 0, 0]);
      mat4.scale(railModelMat, railModelMat, [railLengthZ / 1.6, railHeight / 0.05, railWidth / 0.05 - 1.67]);
      const railMvpMat = mat4.create();
      mat4.multiply(railMvpMat, projectionMat, viewMat);
      mat4.multiply(railMvpMat, railMvpMat, railModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [railMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.4, 0.2, 0.05]]);
      gl.useProgram(program);
      gl.bindVertexArray(VAOcue);
      gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
    }
    // Right rail: between bottom-right and top-right pockets
    {
      const x = tableMaxX;
      const zMid = (tableMinZ + tableMaxZ) / 2 + 3.1;
      const railModelMat = mat4.create();
      mat4.translate(railModelMat, railModelMat, [x, railY, zMid]);
      mat4.rotateY(railModelMat, railModelMat, Math.PI / 2); // Rotate 90 deg for vertical
      mat4.translate(railModelMat, railModelMat, [0, 0, -3]);
      mat4.scale(railModelMat, railModelMat, [railLengthZ / 1.6, railHeight / 0.05, railWidth / 0.05 - 1.7]);
      const railMvpMat = mat4.create();
      mat4.multiply(railMvpMat, projectionMat, viewMat);
      mat4.multiply(railMvpMat, railMvpMat, railModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [railMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.4, 0.2, 0.05]]);
      gl.useProgram(program);
      gl.bindVertexArray(VAOcue);
      gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
    }
  }

  // Table scale and position (edit these to move/scale the table)
  const tableScale = [1.6, 1.6, 1.55];
  const tablePosition = [0, -0.2, 0]; // [x, y, z] position of table center

  function renderTable(projectionMat, viewMat) {
    // Table model matrix (apply translation and scaling)
    const tableModelMat = mat4.create();
    mat4.translate(tableModelMat, tableModelMat, tablePosition);
    mat4.scale(tableModelMat, tableModelMat, tableScale);
    const tableMvpMat = mat4.create();
    mat4.multiply(tableMvpMat, projectionMat, viewMat);
    mat4.multiply(tableMvpMat, tableMvpMat, tableModelMat);
    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [tableMvpMat]);
    WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.0, 0.3, 0.0]]);
    gl.useProgram(program);
    gl.bindVertexArray(VAO);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
  }

  function render() {
    // Update physics
    updatePhysics();
    
    // Update shoot power while charging
    if (isAiming && canShoot()) {
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

    // Smoothly interpolate aimAngle toward targetAimAngle
    aimAngle += (targetAimAngle - aimAngle) * aimLerpSpeed;

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
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    renderTable(projectionMat, viewMat);

    gl.bindVertexArray(VAO);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);

    renderRails(projectionMat, viewMat); // <-- Draw brown rails
    renderPockets(projectionMat, viewMat); // Draw pockets as holes
    renderBalls(projectionMat, viewMat);
    renderCueStick(projectionMat, viewMat);
    requestAnimationFrame(render);
  }

  render();
}

main();