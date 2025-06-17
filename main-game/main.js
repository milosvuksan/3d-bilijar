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
    //loading vertices from objects
    const vertices = await WebGLUtils.loadOBJ("../temp-obj/temp-table.obj", true);
    const verticesball = await WebGLUtils.loadOBJ("../temp-obj/temp-ball.obj",true);
    const verticescue = await WebGLUtils.loadOBJ("../temp-obj/stick.obj", true); 
    const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");

  //positions of balls at the start
  const ballPositions = [
      [0.0, 0.67, -1.0], 

      [0.0, 0.67, 1.0], 

      [-0.09, 0.67, 1.0 + 0.156], 
      [0.09, 0.67, 1.0 + 0.156],  

      [-0.18, 0.67, 1.0 + 0.156 * 2],
      [0.0, 0.67, 1.0 + 0.156 * 2],
      [0.18, 0.67, 1.0 + 0.156 * 2],

      [-0.27, 0.67, 1.0 + 0.156 * 3],
      [-0.09, 0.67, 1.0 + 0.156 * 3],
      [0.09, 0.67, 1.0 + 0.156 * 3],
      [0.27, 0.67, 1.0 + 0.156 * 3],

      [-0.36, 0.67, 1.0 + 0.156 * 4],
      [-0.18, 0.67, 1.0 + 0.156 * 4],
      [0.0, 0.67, 1.0 + 0.156 * 4],
      [0.18, 0.67, 1.0 + 0.156 * 4],
      [0.36, 0.67, 1.0 + 0.156 * 4],
  ];
  //ball colors, 1 white, 1 black, 7 red and 7 blue
  const ballColors = [
      [1.0, 1.0, 1.0],   
      [0.0, 0.0, 1.0],  
      [0.0, 0.0, 1.0],  
      [0.0, 0.0, 1.0],  
      [0.0, 0.0, 1.0],   
      [0.0, 0.0, 0.0],  
      [0.0, 0.0, 1.0],   
      [0.0, 0.0, 1.0],   
      [0.0, 0.0, 1.0],   
      [1.0, 0.0, 0.0],  
      [1.0, 0.0, 0.0],   
      [1.0, 0.0, 0.0],   
      [1.0, 0.0, 0.0],   
      [1.0, 0.0, 0.0],   
      [1.0, 0.0, 0.0],   
      [1.0, 0.0, 0.0],  
  ];
  //ball render function
  function renderBalls(projectionMat, viewMat) {
      for (let i = 0; i < ballPositions.length; i++) {
          if (pocketedBalls[i]) continue;
          
          const ballModelMat = mat4.create();
          mat4.translate(ballModelMat, ballModelMat, ballPositions[i]);
          mat4.scale(ballModelMat, ballModelMat, [0.09, 0.09, 0.09]);

          const ballMvpMat = mat4.create();
          mat4.multiply(ballMvpMat, projectionMat, viewMat);
          mat4.multiply(ballMvpMat, ballMvpMat, ballModelMat);

          WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [ballMvpMat]);
          WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [ballColors[i]]);
          gl.useProgram(program);
          gl.bindVertexArray(VAOball);
          gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
      }
  }


    const ballVelocities = ballPositions.map(() => [0, 0, 0]);
    const friction = 0.98;
    const tableMinX = -1.5, tableMaxX = 1.5; 
    const tableMinZ = -3.0, tableMaxZ = 3.0;

    //pool pocket info
    const pocketRadiusCorner = 0.17;
    const pocketRadiusSide = 0.15;
    const pocketY = 0.57;

    const pockets = [
      { x: tableMinX, z: tableMinZ, y: pocketY, radius: pocketRadiusCorner }, 
      { x: tableMaxX, z: tableMinZ, y: pocketY, radius: pocketRadiusCorner }, 
      { x: tableMinX, z: tableMaxZ, y: pocketY, radius: pocketRadiusCorner }, 
      { x: tableMaxX, z: tableMaxZ, y: pocketY, radius: pocketRadiusCorner }, 
      { x: tableMinX, z: 0, y: pocketY, radius: pocketRadiusSide }, 
      { x: tableMaxX, z: 0, y: pocketY, radius: pocketRadiusSide }, 
    ];

    const pocketedBalls = new Array(ballPositions.length).fill(false);
    //aiming and shooting stuff
    let isAiming = false; 
    let shootPower = 0;
    let aimAngle = 0; 
    let targetAimAngle = 0; 
    const aimLerpSpeed = 0.13; 
    let maxShootPower = 0.5;
    const ballRadius = 0.09;

    const mouse = new MouseInput(gl.canvas);
    let yaw = 0;
    let pitch = 2.4;
    let radius = 4; 

    let isMouseDown = false;
    let shootStartTime = 0;
    let keys = {};

    // Keyboard listener
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if ((e.key === ' ' || e.code === 'Space') && canShoot() && !isAiming) {
        isAiming = true;
        shootStartTime = Date.now();
        shootPower = 0;
        e.preventDefault();
      }
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
      if ((e.key === ' ' || e.code === 'Space') && isAiming && canShoot()) {
        isAiming = false;
        ballVelocities[0][0] = Math.sin(aimAngle) * shootPower;
        ballVelocities[0][2] = Math.cos(aimAngle) * shootPower;
        shootPower = 0;
        e.preventDefault();
      }
    });

    // check if cue ball is stationary and not pocketed
    function canShoot() {
      return !gameOver &&  // end game if game over
        !pocketedBalls[0] &&
        Math.abs(ballVelocities[0][0]) < 0.001 &&
        Math.abs(ballVelocities[0][2]) < 0.001;
    }


    // convert world coordinates to screen coordinates
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

    //view manipulation with mouse controls
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

    //ball collision and position fix and velocity stuff
    function checkBallCollision(ball1Pos, ball1Vel, ball2Pos, ball2Vel) {
      const dx = ball1Pos[0] - ball2Pos[0];
      const dz = ball1Pos[2] - ball2Pos[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < ballRadius * 2) {
        const nx = dx / distance;
        const nz = dz / distance;
        
        const overlap = ballRadius * 2 - distance;
        ball1Pos[0] += nx * overlap * 0.5;
        ball1Pos[2] += nz * overlap * 0.5;
        ball2Pos[0] -= nx * overlap * 0.5;
        ball2Pos[2] -= nz * overlap * 0.5;
        
        const relVelX = ball1Vel[0] - ball2Vel[0];
        const relVelZ = ball1Vel[2] - ball2Vel[2];
        
        const relVelNormal = relVelX * nx + relVelZ * nz;
        
        if (relVelNormal > 0) return;
        
        const restitution = 0.8;
        
        const impulse = -(1 + restitution) * relVelNormal / 2;
        
        // impulse
        ball1Vel[0] += impulse * nx;
        ball1Vel[2] += impulse * nz;
        ball2Vel[0] -= impulse * nx;
        ball2Vel[2] -= impulse * nz;
      }
    }

    // default cue ball position
    const defaultCueBallPosition = [0.0, 0.67, -1.0];

    function checkPocketCollision(ballIndex) {
      const pos = ballPositions[ballIndex];
      
      for (let pocket of pockets) {
        const dx = pos[0] - pocket.x;
        const dz = pos[2] - pocket.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < pocket.radius) {
          // ball is pocketed
          pocketedBalls[ballIndex] = true;
          ballVelocities[ballIndex][0] = 0;
          ballVelocities[ballIndex][1] = 0;
          ballVelocities[ballIndex][2] = 0;
          // move ball below table
          ballPositions[ballIndex][1] = -1;

          // player logic
          if (ballIndex !== 0 && ballIndex !== 5) { // not cue or black
            let color = blueBalls.includes(ballIndex) ? 'blue' : 'red';
            if (!firstGroupAssigned && (color==='blue'||color==='red')) {
              playerGroups[currentPlayer] = color;
              playerGroups[currentPlayer===1?2:1] = (color==='blue'?'red':'blue');
              firstGroupAssigned = true;
            }
            // only count if player has group assigned and this is their color

            //deprecated, code breaks if removed
            if (playerGroups[currentPlayer] === color) {
              playerPocketed[currentPlayer].push(ballIndex);
            }
            updatePlayerInfo();
          }

          return true;
        }
      }
      return false;
    }

    //physics shit
    function updatePhysics() {
      for (let i = 0; i < ballPositions.length; i++) {
          // skip pocketed balls
          if (pocketedBalls[i]) continue;
          
          // velocity
          ballPositions[i][0] += ballVelocities[i][0];
          ballPositions[i][2] += ballVelocities[i][2];
          
          // friction
          ballVelocities[i][0] *= friction;
          ballVelocities[i][2] *= friction;
          
          // stop slow balls
          if (Math.abs(ballVelocities[i][0]) < 0.001) ballVelocities[i][0] = 0;
          if (Math.abs(ballVelocities[i][2]) < 0.001) ballVelocities[i][2] = 0;

          if (checkPocketCollision(i)) {
            continue;
          }
          
          // boundary collision
          if (ballPositions[i][0] <= tableMinX + ballRadius || ballPositions[i][0] >= tableMaxX - ballRadius) {
              ballVelocities[i][0] *= -0.8;
              ballPositions[i][0] = Math.max(tableMinX + ballRadius, Math.min(tableMaxX - ballRadius, ballPositions[i][0]));
          }
          if (ballPositions[i][2] <= tableMinZ + ballRadius || ballPositions[i][2] >= tableMaxZ - ballRadius) {
              ballVelocities[i][2] *= -0.8;
              ballPositions[i][2] = Math.max(tableMinZ + ballRadius, Math.min(tableMaxZ - ballRadius, ballPositions[i][2]));
          }
      }
      
      // Cceek ball to ball collisions 
      for (let i = 0; i < ballPositions.length; i++) {
        if (pocketedBalls[i]) continue;
        for (let j = i + 1; j < ballPositions.length; j++) {
          if (pocketedBalls[j]) continue;
          checkBallCollision(ballPositions[i], ballVelocities[i], ballPositions[j], ballVelocities[j]);
        }
      }
    }

    function renderCueStick(projectionMat, viewMat) {
      if (!canShoot() && !isAiming) return;
      
      const cuePos = ballPositions[0]; 
      const stickLength = 1.6; 
      const pullBack = isAiming ? shootPower * 2 : 0; 
      const stickOffset = 0.10 + pullBack; 
      const stickEnd = [
          cuePos[0] - Math.sin(aimAngle) * (stickOffset) + 0.0268,
          cuePos[1],
          cuePos[2] - Math.cos(aimAngle) * (stickOffset)
      ];

      const stickModelMat = mat4.create();
      mat4.translate(stickModelMat, stickModelMat, stickEnd);
      mat4.rotateY(stickModelMat, stickModelMat, aimAngle + Math.PI);
      mat4.scale(stickModelMat, stickModelMat, [1, 1, stickLength]); 

      const stickMvpMat = mat4.create();
      mat4.multiply(stickMvpMat, projectionMat, viewMat);
      mat4.multiply(stickMvpMat, stickMvpMat, stickModelMat);
      
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [stickMvpMat]);
      WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0.6, 0.3, 0.1]]); 
      gl.useProgram(program);
      gl.bindVertexArray(VAOcue);
      gl.drawArrays(gl.TRIANGLES, 0, verticescue.length / 8);
    }

    function renderPockets(projectionMat, viewMat) {
      for (let pocket of pockets) {
        const pocketModelMat = mat4.create();
        mat4.translate(pocketModelMat, pocketModelMat, [pocket.x, pocket.y, pocket.z]);
        mat4.scale(pocketModelMat, pocketModelMat, [pocket.radius, pocket.radius, pocket.radius]);
        const pocketMvpMat = mat4.create();
        mat4.multiply(pocketMvpMat, projectionMat, viewMat);
        mat4.multiply(pocketMvpMat, pocketMvpMat, pocketModelMat);
        WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [pocketMvpMat]);
        WebGLUtils.setUniform3f(gl, program, ["u_object_color"], [[0, 0, 0]]); 
        gl.useProgram(program);
        gl.bindVertexArray(VAOball);
        gl.drawArrays(gl.TRIANGLES, 0, verticesball.length / 8);
      }
    }
    //render borders around table
    function renderRails(projectionMat, viewMat) {
      const corners = [
        { x: tableMinX, z: tableMinZ }, 
        { x: tableMaxX, z: tableMinZ }, 
        { x: tableMaxX, z: tableMaxZ }, 
        { x: tableMinX, z: tableMaxZ }, 
      ];
      const railY = pocketY + 0.01; 
      const railWidth = 0.18; 
      const railHeight = 0.04;

      const railLengthX = Math.abs(tableMaxX - tableMinX) - 2 * pocketRadiusCorner;
      const railLengthZ = Math.abs(tableMaxZ - tableMinZ) - 2 * pocketRadiusCorner;

      {
        const z = tableMinZ;
        const xMid = (tableMinX + tableMaxX) / 2 + 1.6;
        const railModelMat = mat4.create();
        mat4.translate(railModelMat, railModelMat, [xMid, railY, z]);
        mat4.rotateY(railModelMat, railModelMat, 0); 
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
      {
        const z = tableMaxZ;
        const xMid = (tableMinX + tableMaxX) / 2 - 1.6;
        const railModelMat = mat4.create();
        mat4.translate(railModelMat, railModelMat, [xMid, railY, z]);
        mat4.rotateY(railModelMat, railModelMat, 0); 
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
      {
        const x = tableMinX;
        const zMid = (tableMinZ + tableMaxZ) / 2 - 2.93;
        const railModelMat = mat4.create();
        mat4.translate(railModelMat, railModelMat, [x, railY, zMid]);
        mat4.rotateY(railModelMat, railModelMat, Math.PI / 2); 
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
      {
        const x = tableMaxX;
        const zMid = (tableMinZ + tableMaxZ) / 2 + 3.1;
        const railModelMat = mat4.create();
        mat4.translate(railModelMat, railModelMat, [x, railY, zMid]);
        mat4.rotateY(railModelMat, railModelMat, Math.PI / 2); 
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

    const tableScale = [1.6, 1.6, 1.55];
    const tablePosition = [0, -0.2, 0];

    function renderTable(projectionMat, viewMat) {
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

  // turn and group logic
  let currentPlayer = 1; 
  let playerGroups = { 1: null, 2: null }; 
  let playerPocketed = { 1: [], 2: [] };
  let firstGroupAssigned = false;
  // game state logic
  let gameOver = false;
  let winner = null;
  const BLACK_BALL_INDEX = 5; 

  const blueBalls = [1,2,3,4,6,7,8];
  const redBalls = [9,10,11,12,13,14,15];

  updatePlayerInfo();

  function getPocketedByGroup(player) {
    if (!playerGroups[player]) return 0;
    const groupBalls = playerGroups[player] === 'blue' ? blueBalls : redBalls;
    return groupBalls.filter(ballIndex => pocketedBalls[ballIndex]).length;
  }

  function updatePlayerInfo() {
    const groupText = g => g ? (g==='blue'?'Blue (left)':'Red (right)') : 'Not assigned';
    const player1Pocketed = playerGroups[1] ? getPocketedByGroup(1) : playerPocketed[1].length;
    const player2Pocketed = playerGroups[2] ? getPocketedByGroup(2) : playerPocketed[2].length;
    
    document.getElementById('player1-info').innerHTML =
      `<b>Player 1</b><br>Group: ${groupText(playerGroups[1])}<br>Pocketed: ${player1Pocketed}`;
    document.getElementById('player2-info').innerHTML =
      `<b>Player 2</b><br>Group: ${groupText(playerGroups[2])}<br>Pocketed: ${player2Pocketed}`;
    
    const turnDiv = document.getElementById('turn-info');
    if (turnDiv) {
      if (gameOver) {
        turnDiv.textContent = `Player ${winner} won!`;
        turnDiv.style.color = 'gold';
        turnDiv.style.fontWeight = 'bold';
        turnDiv.style.fontSize = '24px';
      } else {
        turnDiv.textContent = `Player ${currentPlayer}'s turn`;
        turnDiv.style.color = '';
        turnDiv.style.fontWeight = '';
        turnDiv.style.fontSize = '';
      }
    }
  }

  // player all balls pocekted
  function hasPlayerPocketedAllBalls(player) {
    if (!playerGroups[player]) return false;
    const groupBalls = playerGroups[player] === 'blue' ? blueBalls : redBalls;
    return groupBalls.every(ballIndex => pocketedBalls[ballIndex]);
  }

  // win logic
  function handleWin(winningPlayer) {
    gameOver = true;
    winner = winningPlayer;
    updatePlayerInfo();
  }

  // pocket collision logic
  function checkPocketCollision(ballIndex) {
    const pos = ballPositions[ballIndex];
    for (let pocket of pockets) {
      const dx = pos[0] - pocket.x;
      const dz = pos[2] - pocket.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < pocket.radius) {
        pocketedBalls[ballIndex] = true;
        ballVelocities[ballIndex][0] = 0;
        ballVelocities[ballIndex][1] = 0;
        ballVelocities[ballIndex][2] = 0;
        ballPositions[ballIndex][1] = -1;

        // bb handling
        if (ballIndex === BLACK_BALL_INDEX) {
          if (hasPlayerPocketedAllBalls(currentPlayer)) {
            handleWin(currentPlayer);
          } else {
            handleWin(currentPlayer === 1 ? 2 : 1);
          }
        } else if (ballIndex !== 0) { 
          let color = blueBalls.includes(ballIndex) ? 'blue' : 'red';
          if (!firstGroupAssigned && (color==='blue'||color==='red')) {
            playerGroups[currentPlayer] = color;
            playerGroups[currentPlayer===1?2:1] = (color==='blue'?'red':'blue');
            firstGroupAssigned = true;
          }
          if (playerGroups[currentPlayer] === color) {
            playerPocketed[currentPlayer].push(ballIndex);
          }
          updatePlayerInfo();
        }
        return true;
      }
    }
    return false;
  }

  // turn logic
  function allBallsStopped() {
    return ballVelocities.every(v => Math.abs(v[0])<0.001 && Math.abs(v[2])<0.001);
  }
  let lastPocketedCount = 0;
  let canSwitchTurn = false;
  function checkTurnSwitch() {
    if (gameOver) return; 
    
    if (allBallsStopped()) {
      let totalPocketed = playerPocketed[1].length + playerPocketed[2].length;
      if (canSwitchTurn) {
        if (totalPocketed === lastPocketedCount) {
          currentPlayer = currentPlayer===1 ? 2 : 1;
          updatePlayerInfo();
        }
        lastPocketedCount = totalPocketed;
        canSwitchTurn = false;
      }
    } else {
      canSwitchTurn = true;
    }
  }

    function render() {
      updatePhysics();
      checkTurnSwitch();
      
      if (isAiming && canShoot()) {
        const elapsed = (Date.now() - shootStartTime) / 1000;
        shootPower = Math.min(elapsed * 0.2, maxShootPower);
      }

      const { deltaX, deltaY, isDragging } = mouse.getDeltas();
      if (isDragging && !isAiming) {
        yaw += -deltaX * 0.01;
        pitch += deltaY * 0.01;
        pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
      }

      aimAngle += (targetAimAngle - aimAngle) * aimLerpSpeed;

      const eye = [
        radius * Math.sin(yaw) * Math.cos(pitch),
        radius * Math.sin(pitch) + 2, 
        radius * Math.cos(yaw) * Math.cos(pitch)
      ];
      const center = [0, 0, 0];
      const up = [0, 1, 0];

      const lightDir = vec3.fromValues(0.0, 2.0, 0.0);
      const lightColor = vec3.fromValues(1.0, 1.0, 1.0); 

      vec3.normalize(lightDir, lightDir);

      WebGLUtils.setUniform3f(gl, program,
      ["u_light_direction",
        "u_light_color"],
      [lightDir,
      lightColor]
      );
      const tableModelMat = mat4.create();
      const viewMat = mat4.create();
      const projectionMat = mat4.create();
      mat4.lookAt(viewMat, eye, center, up);
      mat4.perspective(projectionMat, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
      const tableMvpMat = mat4.create();
      mat4.multiply(tableMvpMat, projectionMat, viewMat);
      mat4.multiply(tableMvpMat, tableMvpMat, tableModelMat);

      const ballModelMat = mat4.create();
      mat4.translate(ballModelMat, ballModelMat, [0, 0.57, 0]); 
      mat4.scale(ballModelMat, ballModelMat, [0.09, 0.09, 0.]); 

      const ballMvpMat = mat4.create();
      mat4.multiply(ballMvpMat, projectionMat, viewMat);
      mat4.multiply(ballMvpMat, ballMvpMat, ballModelMat);
      WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [tableMvpMat]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);

      renderTable(projectionMat, viewMat);

      gl.bindVertexArray(VAO);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);

      renderRails(projectionMat, viewMat); 
      renderPockets(projectionMat, viewMat); 
      renderBalls(projectionMat, viewMat);
      renderCueStick(projectionMat, viewMat);
      requestAnimationFrame(render);
    }

    render();
  }

main();