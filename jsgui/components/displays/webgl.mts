import { makeComponent } from "../../jsgui.mts";

// utils
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
function glCompileProgram(gl: WebGL2RenderingContext, programInfo: GLProgramInfo) {
  const {program, vertex, fragment} = programInfo;
  glCompileShader(gl, program, gl.VERTEX_SHADER, vertex);
  glCompileShader(gl, program, gl.FRAGMENT_SHADER, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const programLog = gl.getProgramInfoLog(program);
    console.error(`Error linking shader program:\n${programLog}`, {program});
  }
  gl.useProgram(program);
}
export function glSetBuffer(gl: WebGL2RenderingContext, bufferInfo: GLBufferInfo, data: any) {
  const {location, count, type, bufferIndex} = bufferInfo;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferIndex);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, count, type, false, 0, 0);
}

// data
export type GLBufferDescriptor = {
  location: number;
  count: 1 | 2 | 3 | 4;
  type: number; // gl.FLOAT | ...
}
export type GLBufferInfo = GLBufferDescriptor & {
  bufferIndex: WebGLBuffer;
};

export type GLProgramDescriptor = {
  vertex: string;
  fragment: string;
  buffers: Record<string, GLBufferDescriptor>;
};
export type GLProgramInfo = {
  program: WebGLProgram;
  vertex: string;
  fragment: string;
  vao: WebGLVertexArrayObject;
  buffers: Record<string, GLBufferInfo>;
};

// component
type WebGLStateDescriptor = {
  gl: WebGL2RenderingContext;
};
type WebGLState = {
  gl: WebGL2RenderingContext;
  programs: Record<string, GLProgramInfo>;
};
export type WebGLProps = {
  programs: (state: WebGLStateDescriptor) => Record<string, GLProgramDescriptor>;
  render?: (state: WebGLState) => void;
}
export const webgl = makeComponent(function webgl(props: WebGLProps) {
  const {
    programs,
    render = ({gl}) => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }} = props;
  const node = this.useNode(() => document.createElement("canvas"));
  type PartiallyUninitialized<T, K extends keyof T> = Omit<T, K> & {[K2 in K]: T[K2] | null};
  type WebGlStateUninitialized = PartiallyUninitialized<WebGLState, 'gl' | 'programs'>;
  const [state] = this.useState<WebGlStateUninitialized>({
    gl: null,
    programs: null,
  });
  if (state.gl == null) {
    const gl = node.getContext("webgl2");
    if (!gl) return;
    state.gl = gl;
    // init shaders
    state.programs = programs(state as WebGLStateDescriptor) as Record<string, GLProgramInfo>;
    const DEFAULT_SHADER_VERSION = "#version 300 es\n";
    const DEFAULT_FLOAT_PRECISION = "precision highp float;\n"
    const addShaderHeader = (headerCode: string, shaderCode: string) => {
      return shaderCode.startsWith("#version") ? shaderCode : headerCode + shaderCode
    }
    for (let programInfo of Object.values(state.programs)) {
      // compile
      programInfo.program = gl.createProgram();
      programInfo.vertex = addShaderHeader(DEFAULT_SHADER_VERSION, programInfo.vertex);
      programInfo.fragment = addShaderHeader(DEFAULT_SHADER_VERSION + DEFAULT_FLOAT_PRECISION, programInfo.fragment);
      glCompileProgram(gl, programInfo);
      // init buffers
      programInfo.vao = gl.createVertexArray(); // vao means buffer[]
      gl.bindVertexArray(programInfo.vao);
      for (let bufferInfo of Object.values(programInfo.buffers)) {
        bufferInfo.bufferIndex = gl.createBuffer();
      }
    }
  }
  // render
  const gl = state.gl;
  if (gl != null) {
    gl.viewport(0, 0, node.width, node.height);
    render(state as WebGLState);
  }
});
