import { glSetBuffer, makeComponent, webgl } from "../../../jsgui/out/jsgui.mts";

export const webglPage = makeComponent(function webglPage() {
  this.append(webgl({
    programs: ({gl}) => ({
      gradient: {
        vertex: `
          in vec2 in_position;
          in vec3 in_color;
          out vec3 v_color;
          void main() {
            gl_Position = vec4(in_position, 0, 1);
            v_color = in_color;
          }
        `,
        fragment: `
          in vec3 v_color;
          out vec4 f_color;
          void main() {
            f_color = vec4(v_color, 1);
          }
        `,
        buffers: {
          position: {location: 0, count: 2, type: gl.FLOAT},
          color: {location: 1, count: 3, type: gl.FLOAT},
        },
      },
      flatColor: {
        vertex: `
          in vec2 in_position;
          void main() {
            gl_Position = vec4(in_position, 0, 1);
          }
        `,
        fragment: `
          out vec4 f_color;
          void main() {
            f_color = vec4(1, 0, 0, 1);
          }
        `,
        buffers: {
          position: {location: 0, count: 2, type: gl.FLOAT},
        }
      },
    }),
    render: ({gl, programs}) => {
      // draw triangle
      const gradient = programs.gradient;
      gl.useProgram(gradient.program);
      gl.bindVertexArray(gradient.vao);
      glSetBuffer(gl, gradient.buffers.position, new Float32Array([
        -1, -1,
        -1, +1,
        +1, +1,
      ]));
      glSetBuffer(gl, gradient.buffers.color, new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // draw square
      const flatColor = programs.flatColor;
      gl.useProgram(flatColor.program);
      gl.bindVertexArray(flatColor.vao);
      glSetBuffer(gl, flatColor.buffers.position, new Float32Array([
        -0.3, -0.3,
        -0.3, +0.3,
        +0.3, +0.3,
        +0.3, -0.3,
      ]));
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
  }));
})
