import { makeComponent } from "../../jsgui.mts";

function glCompileShader(gl: WebGL2RenderingContext, program: WebGLProgram, shaderType: number, shaderCode: string) {
  const shader = gl.createShader(shaderType);
  while (1) {
    if (!shader) break;
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) break;
    gl.attachShader(program, shader);
    return;
  }
  const ShaderTypeName: Record<any, string | undefined> = {
    [gl.VERTEX_SHADER]: ".VERTEX_SHADER",
    [gl.FRAGMENT_SHADER]: ".FRAGMENT_SHADER",
  };
  const shaderLog = gl.getShaderInfoLog(shader!);
  console.error(`Could not compile shader:\n${shaderLog}`, {
    program,
    shaderType: ShaderTypeName[shaderType] ?? shaderType,
    shaderCode,
    shader,
  });
}

type GlBufferDescriptor = {
  location: number;
  count: 1 | 2 | 3 | 4;
  type: number; // gl.FLOAT | ...
}
type GlBufferInfo = GlBufferDescriptor & {
  bufferIndex: WebGLBuffer;
};
export function glSetBuffer(gl: any, bufferInfo: GlBufferInfo, data: any) {
  const {location, count, type, bufferIndex} = bufferInfo;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferIndex);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, count, type, false, 0, 0);
}

type GLDataDescriptor = Record<string, GlBufferDescriptor>
type GLDataInfo = Record<string, GlBufferInfo> & {
  _vao: WebGLVertexArrayObject;
};
type WebGLState = {
  vertexCode: string;
  fragmentCode: string;
  gl: WebGL2RenderingContext;
  data: Record<string, GLDataInfo>;
};
export type WebGLProps = {
  vertex?: string;
  fragment?: string;
  data?: (state: WebGLState) => Record<string, GLDataDescriptor>;
  render?: (state: WebGLState) => void;
}
export const webgl = makeComponent(function webgl(props: WebGLProps) {
  const {
    vertex,
    fragment,
    data,
    render = ({gl}) => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }} = props;
  const node = this.useNode(() => document.createElement("canvas"));
  type PartiallyUninitialized<T, K extends keyof T> = Omit<T, K> & {[K2 in K]: T[K2] | null};
  type WebGlStateUninitialized = PartiallyUninitialized<WebGLState, 'gl' | 'data'>;
  const [state] = this.useState<WebGlStateUninitialized>({
    vertexCode: '',
    fragmentCode: '',
    gl: null,
    data: null,
  });
  if (state.gl == null) {
    const gl = node.getContext("webgl2");
    if (!gl) return;
    state.gl = gl;
    // compile shaders
    const DEFAULT_SHADER_VERSION = "#version 300 es\n";
    const DEFAULT_FLOAT_PRECISION = "precision highp float;\n"
    const program = gl.createProgram();
    if (vertex) {
      state.vertexCode = vertex.startsWith("#version ") ? vertex : DEFAULT_SHADER_VERSION + vertex;
      glCompileShader(gl, program, gl.VERTEX_SHADER, state.vertexCode);
    }
    if (fragment) {
      state.fragmentCode = fragment.startsWith("#version ") ? fragment : DEFAULT_SHADER_VERSION + DEFAULT_FLOAT_PRECISION + fragment;
      glCompileShader(gl, program, gl.FRAGMENT_SHADER, state.fragmentCode);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const programLog = gl.getProgramInfoLog(program);
      console.error(`Error linking shader program:\n${programLog}`, {program});
    }
    gl.useProgram(program);
    // init buffers
    if (data) {
      const newDataInfos = data(state as WebGLState) as Record<string, GLDataInfo>;
      for (let dataInfo of Object.values(newDataInfos)) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        for (let b of Object.keys(dataInfo)) {
          const bufferInfo = dataInfo[b];
          bufferInfo.bufferIndex = gl.createBuffer();
        }
        dataInfo._vao = vao;
      }
      state.data = newDataInfos;
    }
  }
  // render
  const gl = state.gl;
  if (gl != null) {
    gl.viewport(0, 0, node.width, node.height);
    render(state as WebGLState);
  }
});
