import { BaseProps, makeComponent } from "../jsgui.mts";

type GPUType = {
  requestAdapter(): Promise<AdapterType>;
  getPreferredCanvasFormat(): any;
};
type AdapterType = {
  requestDevice(): Promise<DeviceType>;
};
type DeviceType = {
  createShaderModule(options: {code: string}): ShaderModuleType;
};
type ShaderModuleType = {};
/*declare global {
  interface Window {
    GPUBufferUsage: {
      COPY_DST: number;
      COPY_SRC: number;
      INDEX: number;
      INDIRECT: number;
      MAP_READ: number;
      MAP_WRITE: number;
      QUERY_RESOLVE: number;
      STORAGE: number;
      UNIFORM: number;
      VERTEX: number;
    }
  }
  interface Navigator {
    gpu: GPUType | undefined;
  }
}*/

type ContextType = any;
type WebgpuRenderProps = {
  context: ContextType;
  device: any;
  shaderModule: any;
};
type WebgpuProps = {
  width: number;
  height: number;
  shaderCode: string;
  render: (renderProps: WebgpuRenderProps) => void
} & BaseProps;
export const webgpu = makeComponent(function webgpu(props: WebgpuProps) {
  const {width, height, shaderCode, render} = props;
  const state = this.useState({
    _isDeviceInitialized: false,
    context: null as ContextType | null,
    device: null as DeviceType | null,
    shaderModule: null as any,
  });
  const node = this.useNode(() => document.createElement("canvas"));
  node.width = width;
  node.height = height;
  this.baseProps.style.width = width;
  this.baseProps.style.height = height;
  // WebGPU
  const renderIfNeeded = () => {
    if (!state.context && state.device) {
      state.context = node.getContext("webgpu");
      (state.context as any).configure({
        device: state.device,
        format: navigator.gpu?.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
      });
    }
    if (state.context && state.device && state.shaderModule) render({context: state.context, device: state.device, shaderModule: state.shaderModule});
  };
  if (!state._isDeviceInitialized) {
    state._isDeviceInitialized = true;
    const gpu = navigator.gpu;
    if (!gpu) {
      console.error("WebGPU is not supported in this browser.")
      return;
    }
    gpu.requestAdapter().then(adapter => {
      if (!adapter) {
        console.error("Couldn't request WebGPU adapter.");
        return;
      }
      adapter.requestDevice().then(device => {
        state.device = device;
        // TODO: create/delete shaders dynamically (device.destroy()?)?
        state.shaderModule = device.createShaderModule({code: shaderCode});
        renderIfNeeded();
      });
    });
  }
  return {
    onMount: () => {
      renderIfNeeded();
    }
  }
});
