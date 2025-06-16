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


  const mouse = new MouseInput(gl.canvas);
  let yaw = 0;
  let pitch = 2.4;
  let radius = 4; 

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

  function render() {
    // Handle mouse input
    const { deltaX, deltaY, isDragging } = mouse.getDeltas();
    if (isDragging) {
      yaw += -deltaX * 0.01;
      pitch += deltaY * 0.01;
      pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch)); // Clamp pitch
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


    requestAnimationFrame(render);
  }

  render();
}

main();