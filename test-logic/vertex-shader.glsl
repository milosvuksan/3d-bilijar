#version 300 es
precision mediump float;

uniform mat4 u_mvp;

layout(location = 0) in vec3 in_position;
layout(location = 1) in vec3 in_normal;

out vec3 v_normal;

void main() {
    gl_Position = u_mvp * vec4(in_position, 1.0);
    v_normal = normalize(in_normal);
}