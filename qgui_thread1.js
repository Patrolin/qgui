// utils
function println(...args/*: any[]*/) {
  console.log(`thread 1:`, ...args);
}

// main
let canvas/*: OffscreenCanvas */;
let context/*: CanvasRenderingContext2D*/;
let width/*: number*/;
let height/*: number*/;
let devicePixelRatio/*: number*/;
onmessage = (event/*: MessageEvent */) => {
  if (event.data.new_width) {
    // initialize
    const {offscreen_canvas, new_width, new_height, new_devicePixelRatio} = event.data;
    if (offscreen_canvas) {
      canvas = offscreen_canvas;
      context = canvas.getContext("2d");
    }
    // resize
    width = new_width * new_devicePixelRatio;
    height = new_height * new_devicePixelRatio;
    devicePixelRatio = new_devicePixelRatio;
    canvas.width = width;
    canvas.height = height;
    return;
  }

  // clear
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  // render
  context.fillStyle = 'black';
  context.font = `400 ${24*devicePixelRatio}px sans-serif`;
  const {inputs, InputType_IdToName, ...otherData} = event.data;
  context.fillText(JSON.stringify(otherData), 4, 24*devicePixelRatio);
  context.fillText(JSON.stringify(inputs.map(v => ({...v, type: InputType_IdToName[v.type]}))), 4, 24*devicePixelRatio*2);

  // TODO: render with Odin compiled to WASM
}
