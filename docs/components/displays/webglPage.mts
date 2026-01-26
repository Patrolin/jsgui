import { glSetBuffer, glUseProgram, makeComponent, webgl } from "../../../jsgui/out/jsgui.mts";

export const webglPage = makeComponent("webglPage", function() {
  this.append(webgl({
    style: {width: 150, height: 150},
    programs: {
      gradient: {
        vertex: `
          in vec2 v_position;
          in vec3 v_color;
          out vec3 f_color;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
            f_color = v_color;
          }
        `,
        fragment: `
          in vec3 f_color;
          out vec4 out_color;
          void main() {
            out_color = vec4(f_color, 1);
          }
        `,
      },
      flatColor: {
        vertex: `
          in vec2 v_position;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
          }
        `,
        fragment: `
          uniform mat4x4 u_mat;
          uniform vec3 u_color;
          out vec4 out_color;
          void main() {
            out_color = u_mat * vec4(u_color, 1);
          }
        `,
      },
    },
    render: ({gl, programs}) => {
      // draw square
      const flatColor = programs.flatColor;
      glUseProgram(gl, flatColor);
      glSetBuffer(gl, flatColor.v_position, new Float32Array([
        -1, -1,
        -1, +1,
        +1, +1,
        +1, -1,
      ]));
      gl.uniformMatrix4fv(flatColor.u_mat, false, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ]);
      gl.uniform3f(flatColor.u_color, 0, 0.5, 1);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      // draw triangle
      const gradient = programs.gradient;
      glUseProgram(gl, gradient);
      glSetBuffer(gl, gradient.v_position, new Float32Array([
        0.0,  0.6,
       -0.5, -0.6,
        0.5, -0.6,
      ]));
      glSetBuffer(gl, gradient.v_color, new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }));
})
