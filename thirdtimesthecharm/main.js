const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying vec3 vNormal;
    
    void main() {
        vNormal = aNormal;
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vNormal;
    uniform vec3 uColor;
    
    void main() {
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float intensity = max(dot(vNormal, light), 0.1);
        gl_FragColor = vec4(uColor * intensity, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function initBuffers(gl) {
    // Cuboid vertices
    const cuboidVertices = new Float32Array([
        // Front face
        -1.0, -0.5,  1.5,
         1.0, -0.5,  1.5,
         1.0,  0.5,  1.5,
        -1.0,  0.5,  1.5,
        // Back face
        -1.0, -0.5, -1.5,
        -1.0,  0.5, -1.5,
         1.0,  0.5, -1.5,
         1.0, -0.5, -1.5,
    ]);

    // Create sphere vertices
    const sphereVertices = [];
    const sphereNormals = [];
    const radius = 0.5;
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
        const lat = (i * Math.PI) / segments;
        for (let j = 0; j <= segments; j++) {
            const lon = (j * 2 * Math.PI) / segments;
            const x = radius * Math.sin(lat) * Math.cos(lon);
            const y = radius * Math.cos(lat);
            const z = radius * Math.sin(lat) * Math.sin(lon);
            sphereVertices.push(x, y + 1.0, z); // Y + 1.0 to place on top
            sphereNormals.push(x, y, z);
        }
    }

    const cuboidBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cuboidBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cuboidVertices, gl.STATIC_DRAW);

    const sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW);

    return {
        cuboid: cuboidBuffer,
        sphere: sphereBuffer,
        sphereVertexCount: sphereVertices.length / 3
    };
}

function main() {
    const canvas = document.querySelector('#glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not available');
        return;
    }

    // Create shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Get buffer locations
    const buffers = initBuffers(gl);
    
    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const colorLocation = gl.getUniformLocation(program, 'uColor');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');

    let rotation = 0;

    function render() {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // Set up projection matrix
        const projectionMatrix = mat4.perspective(mat4.create(),
            45 * Math.PI / 180,
            canvas.width / canvas.height,
            0.1,
            100.0);

        // Draw cuboid
        const cuboidModelViewMatrix = mat4.create();
        mat4.translate(cuboidModelViewMatrix, cuboidModelViewMatrix, [0, 0, -6.0]);
        mat4.rotate(cuboidModelViewMatrix, cuboidModelViewMatrix, rotation, [0, 1, 0]);

        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLocation, false, cuboidModelViewMatrix);
        gl.uniform3fv(colorLocation, [0.545, 0.271, 0.075]); // Brown color

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cuboid);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 8);

        // Draw sphere
        const sphereModelViewMatrix = mat4.create();
        mat4.translate(sphereModelViewMatrix, sphereModelViewMatrix, [0, 0, -6.0]);
        mat4.rotate(sphereModelViewMatrix, sphereModelViewMatrix, rotation, [0, 1, 0]);

        gl.uniformMatrix4fv(modelViewMatrixLocation, false, sphereModelViewMatrix);
        gl.uniform3fv(colorLocation, [1.0, 0.0, 0.0]); // Red color

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.sphereVertexCount);

        rotation += 0.01;
        requestAnimationFrame(render);
    }

    render();
}