import { div, makeComponent, webgpu } from "../../../jsgui/out/jsgui.mts";

export const webgpuPage = makeComponent(function webgpuPage() {
  let row = this.append(div({className: "display-row", style: {marginTop: 0}}));
  const shaderCode = `
    struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) color : vec4f
    }

    @vertex
    fn vertex_main(
      @location(0) position: vec4f,
      @location(1) color: vec4f
    ) -> VertexOut {
      var output : VertexOut;
      output.position = position;
      output.color = color;
      return output;
    }

    @fragment
    fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
      return fragData.color;
    }
  `;
  row.append(webgpu({
    style: {width: 150, height: 150},
    shaderCode,
    init: ({gpu, device, shaderModule}) => {
      // NOTE: copy paste from MDN
      // Vertex data for triangle
      // Each vertex has 8 values representing position and color: X Y Z W R G B A
      const vertices = new Float32Array([
        0.0,  0.6, 0, 1, 1, 0, 0, 1,
       -0.5, -0.6, 0, 1, 0, 1, 0, 1,
        0.5, -0.6, 0, 1, 0, 0, 1, 1
      ]);

      const vertexBuffer = device.createBuffer({
        size: vertices.byteLength, // make it big enough to store vertices in
        usage: window['GPUBufferUsage'].VERTEX | window['GPUBufferUsage'].COPY_DST,
      });

      // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
      device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

      // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
      const vertexBuffers = [{
        attributes: [{
          shaderLocation: 0, // position
          offset: 0,
          format: 'float32x4'
        }, {
          shaderLocation: 1, // color
          offset: 16,
          format: 'float32x4'
        }],
        arrayStride: 32,
        stepMode: 'vertex'
      }];

      const pipelineDescriptor = {
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
          buffers: vertexBuffers
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment_main',
          targets: [{
            format: gpu.getPreferredCanvasFormat()
          }]
        },
        primitive: {
          topology: 'triangle-list'
        },
        layout: 'auto'
      };

      // 6: Create the actual render pipeline
      const renderPipeline = device.createRenderPipeline(pipelineDescriptor); // TODO: can we store the descriptors and pipeline?

      return {
        vertexBuffer,
        renderPipeline,
      };
    },
    render: ({context, device, data}) => {
      const {vertexBuffer, renderPipeline} = data;

      // swap buffers
      const renderPassDescriptor = {
        colorAttachments: [{
          clearValue: {r: 0.0, g: 0.5, b: 1.0, a: 1.0},
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView(),
        }]
      };

      // create command buffer
      const commandEncoder = device.createCommandEncoder();

      // create a draw triangles command
      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
      renderPass.setPipeline(renderPipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(3);
      renderPass.end();

      // submit commands
      device.queue.submit([commandEncoder.finish()]);
    }
  }))
});
