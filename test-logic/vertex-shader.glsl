#version 300 es
precision mediump float;

uniform mat4 u_mvp; // Model-View-Projection matrix

in vec3 in_position;
in vec3 in_normal;
out vec3 v_normal;

void main() {
gl_Position = u_mvp * vec4(in_position, 1.0f);

v_normal = normalize(in_normal);
}