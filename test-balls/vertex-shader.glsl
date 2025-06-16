#version 300 es
precision mediump float;

uniform mat4 u_mvp;     // Model-View-Projection matrix
uniform mat4 u_model;   // Model matrix for normal transformation

in vec3 in_position;
in vec3 in_normal;
out vec3 v_normal;

void main() {
    gl_Position = u_mvp * vec4(in_position, 1.0);
    
    // Transform normal with the normal matrix
    mat3 normalMatrix = mat3(transpose(inverse(u_model)));
    v_normal = normalize(normalMatrix * in_normal);
}