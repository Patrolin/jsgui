import { glSetBuffer, makeComponent, webgl } from "../../../jsgui/out/jsgui.mts";

export const webglPage = makeComponent(function webglPage() {
  this.append(webgl({
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
    data: ({gl}) => ({
      triangle: {
        position: {location: 0, count: 2, type: gl.FLOAT},
        color: {location: 1, count: 3, type: gl.FLOAT},
      },
      square: {
        position: {location: 0, count: 2, type: gl.FLOAT},
      },
    }),
    render: ({gl, data}) => {
      // triangle
      gl.bindVertexArray(data.triangle._vao);
      glSetBuffer(gl, data.triangle.position, new Float32Array([
        -1, -1,
        -1, +1,
        +1, +1,
      ]));
      glSetBuffer(gl, data.triangle.color, new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // square
      gl.bindVertexArray(data.square._vao);
      glSetBuffer(gl, data.square.position, new Float32Array([
        -0.3, -0.3,
        -0.3, +0.3,
        +0.3, +0.3,
        +0.3, -0.3,
      ]));
      glSetBuffer(gl, data.triangle.color, new Float32Array([
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
      ]));
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
  }));
})
