#version 300 es
precision mediump float;

uniform vec3 u_light_direction;
uniform vec3 u_light_color;


in vec3 v_normal;
out vec4 out_color;

void main() {
    float diff = max(dot(v_normal, u_light_direction), 0.0);
    vec3 color = diff * u_light_color;


    out_color = vec4(color, 1.0);
}