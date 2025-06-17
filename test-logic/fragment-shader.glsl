#version 300 es
precision mediump float;

uniform vec3 u_light_direction;
uniform vec3 u_light_color;
uniform vec3 u_object_color; // Object color uniform

in vec3 v_normal;
out vec4 out_color;

void main() {
    float diff = max(dot(v_normal, u_light_direction), 0.0);

    // Combine object color and light color
    vec3 color = diff * u_light_color * u_object_color;

    out_color = vec4(color, 1.0);
}