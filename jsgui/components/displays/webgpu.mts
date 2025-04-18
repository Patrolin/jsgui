import { BaseProps, makeComponent } from "../../jsgui.mts";

/* polyfill the types, because typescript isn't up to date */
type _GPU = {
  requestAdapter(): Promise<_GPUAdapter>;
  getPreferredCanvasFormat(): any;
};
type _GPUAdapter = {
  requestDevice(): Promise<_GPUDevice>;
};
type _GPUDevice = {
  createShaderModule(options: {code: string}): _GPUShaderModule;
};

type _GPUShaderModule = any;
declare global {
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
    gpu: _GPU | undefined;
  }
}

type WebgpuContextType = {
  configure: (options: any) => void;
};

/* component */
type WebgpuRenderProps = {
  // NOTE: any because we don't have the complete types..
  gpu: any;
  context: any;
  device: any;
  shaderModule: any;
  data: any; // custom user data
};
type WebgpuProps = {
  shaderCode: string;
  init?: (props: WebgpuRenderProps) => any;
  render?: (props: WebgpuRenderProps) => void;
} & BaseProps;
export const webgpu = makeComponent(function webgpu(props: WebgpuProps) {
  const {shaderCode, init, render} = props;
  const [state] = this.useState({
    _isDeviceInitialized: false,
    device: null as _GPUDevice | null,
    shaderModule: null as any,
    context: null as WebgpuContextType | null,
    data: null as any,
  });
  const node = this.useNode(() => document.createElement("canvas"));

  const {gpu} = navigator;
  if (!state._isDeviceInitialized) {
    state._isDeviceInitialized = true;
    if (!gpu) {
      console.error("WebGPU is not supported in this browser.")
      return;
    }
    gpu.requestAdapter().then((adapter) => {
      if (!adapter) {
        console.error("Couldn't request WebGPU adapter.");
        return;
      }
      adapter.requestDevice().then((device) => {
        state.device = device;
        // TODO: create/delete shaders dynamically (device.destroy()?)?
        state.shaderModule = device.createShaderModule({code: shaderCode});
        this.rerender();
      });
    });
  }
  if (!state.context && state.device) {
    state.context = node.getContext("webgpu") as unknown as WebgpuContextType | null;
    state.context?.configure({
      device: state.device,
      format: gpu?.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied',
    });
    if (init) {
      state.data = init({gpu, ...state});
    }
  }
  return {
    onMount: () => {
      // autosize canvas
      const rect = node.getBoundingClientRect();
      node.width = rect.width;
      node.height = rect.height;
      // render
      if (state.context && state.device && state.shaderModule && render) {
        render({gpu, ...state});
      }
    }
  }
});
