function updatePhysics() {
    // Allow aim angle input if cue ball is stationary and not pocketed
    if (canShoot()) {
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
