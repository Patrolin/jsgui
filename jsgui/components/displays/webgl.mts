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
function glDecodeVertexAttributeType(gl: WebGL2RenderingContext, flatType: GLenum): [GLenum, number] {
  switch (flatType) {
  /* WebGL */
  case gl.FLOAT:
    return [gl.FLOAT, 1];
  case gl.FLOAT_VEC2:
    return [gl.FLOAT, 2];
  case gl.FLOAT_VEC3:
    return [gl.FLOAT, 3];
  case gl.FLOAT_VEC4:
    return [gl.FLOAT, 4];
  case gl.FLOAT_MAT2:
    return [gl.FLOAT, 4];
  case gl.FLOAT_MAT3:
    return [gl.FLOAT, 9];
  case gl.FLOAT_MAT4:
    return [gl.FLOAT, 16];
  // NOTE: non-square matrices are only valid as uniforms
  /* WebGL2 */
  case gl.INT:
    return [gl.INT, 1];
  case gl.INT_VEC2:
    return [gl.INT, 2];
  case gl.INT_VEC3:
    return [gl.INT, 3];
  case gl.INT_VEC4:
    return [gl.INT, 4];
  case gl.UNSIGNED_INT:
    return [gl.UNSIGNED_INT, 1];
  case gl.UNSIGNED_INT_VEC2:
    return [gl.UNSIGNED_INT, 2];
  case gl.UNSIGNED_INT_VEC3:
    return [gl.UNSIGNED_INT, 3];
  case gl.UNSIGNED_INT_VEC4:
    return [gl.UNSIGNED_INT, 4];
  }
  console.error('Uknown vertexAttribute type:', {flatType});
  return [-1, -1];
}
// user utils
export function glUseProgram(gl: WebGL2RenderingContext, programInfo: GLProgramInfo) {
  gl.useProgram(programInfo.program);
  gl.bindVertexArray(programInfo.vao);
}
export function glSetBuffer(gl: WebGL2RenderingContext, bufferInfo: GLBufferInfo, data: any) {
  const {location, count, type, bufferIndex} = bufferInfo;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferIndex);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  if (type === gl.FLOAT) {
    let currentLocation = location;
    let remainingCount = count;
    while (remainingCount >= 4) {
      gl.enableVertexAttribArray(currentLocation);
      gl.vertexAttribPointer(currentLocation++, 4, type, false, 0, 0);
      remainingCount -= 4;
    }
    if (remainingCount > 0) {
      gl.enableVertexAttribArray(currentLocation);
      gl.vertexAttribPointer(currentLocation++, remainingCount, type, false, 0, 0);
    }
  } else {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribIPointer(location, count, type, 0, 0);
  }
}

// data
export type GLBufferInfo = {
  location: number;
  count: number; // can be >4 for matrices
  type: GLenum; // gl.FLOAT | ...
  bufferIndex: WebGLBuffer;
};

export type GLProgramDescriptor = {
  vertex: string;
  fragment: string;
};
export type GLProgramInfo = {
  program: WebGLProgram;
  vertex: string;
  fragment: string;
  vao: WebGLVertexArrayObject;
  buffers: Record<string, GLBufferInfo>;
} & Record<`v_${string}`, GLBufferInfo> & Record<`u_${string}`, WebGLUniformLocation>;

// component
type WebGLState = {
  gl: WebGL2RenderingContext;
  programs: Record<string, GLProgramInfo>;
};
export type WebGLProps = {
  programs: Record<string, GLProgramDescriptor>;
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
    state.programs = {};
    const DEFAULT_SHADER_VERSION = "#version 300 es\n";
    const DEFAULT_FLOAT_PRECISION = "precision highp float;\n"
    const addShaderHeader = (headerCode: string, shaderCode: string) => {
      return shaderCode.trimStart().startsWith("#version") ? shaderCode : headerCode + shaderCode
    }
    for (let [k, _programInfo] of Object.entries(programs)) {
      const programInfo = _programInfo as GLProgramInfo;
      state.programs[k] = programInfo;
      // compile
      programInfo.program = gl.createProgram();
      programInfo.vertex = addShaderHeader(DEFAULT_SHADER_VERSION, programInfo.vertex);
      programInfo.fragment = addShaderHeader(DEFAULT_SHADER_VERSION + DEFAULT_FLOAT_PRECISION, programInfo.fragment);
      glCompileProgram(gl, programInfo);
      // init vertex buffers
      programInfo.vao = gl.createVertexArray(); // vao means vertexBuffer[]
      gl.bindVertexArray(programInfo.vao);
      const vertexBufferCount = gl.getProgramParameter(programInfo.program, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < vertexBufferCount; i++) {
        const vertexAttribute = gl.getActiveAttrib(programInfo.program, i);
        if (vertexAttribute == null) {
          console.error(`Couldn't get vertexAttribute:`, {i});
          continue
        }
        const vertexAttributeLocation = gl.getAttribLocation(programInfo.program, vertexAttribute.name);
        if (vertexAttributeLocation == null) {
          console.error(`Couldn't get vertexAttribute location:`, {i, vertexAttribute});
          continue
        }
        const [type, count] = glDecodeVertexAttributeType(gl, vertexAttribute.type);
        programInfo[vertexAttribute.name as `v_${string}`] = {
          location: vertexAttributeLocation,
          count,
          type,
          bufferIndex: gl.createBuffer(),
        };
      }
      // get uniform locations
      const uniformCount = gl.getProgramParameter(programInfo.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniform = gl.getActiveUniform(programInfo.program, i);
        if (uniform == null) {
          console.error(`Couldn't get uniform:`, {i});
          continue
        }
        const uniformLocation = gl.getUniformLocation(programInfo.program, uniform.name);
        if (uniformLocation == null) {
          console.error(`Couldn't get uniform location:`, {i, uniform});
          continue
        }
        programInfo[uniform.name as `u_${string}`] = uniformLocation;
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
