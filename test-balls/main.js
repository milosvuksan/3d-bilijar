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
  const vertices = await WebGLUtils.loadOBJ("../temp-obj/sphere.obj",true);
  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");

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
    // Matrices
    const modelMat = mat4.create();
    mat4.translate(modelMat, modelMat, [0, 2, 0]); // Move up by 2 units
    mat4.scale(modelMat, modelMat, [0.5, 0.5, 0.5]);
    const viewMat = mat4.create();
    const projectionMat = mat4.create();
    mat4.lookAt(viewMat, eye, center, up);
    mat4.perspective(projectionMat, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

    const mvpMat = mat4.create();
    mat4.multiply(mvpMat, projectionMat, viewMat);
    mat4.multiply(mvpMat, mvpMat, modelMat);

    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [mvpMat]);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(VAO);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
    requestAnimationFrame(render);
  }

  render();
}

main();