const USE_BUFFERED_INPUT = true;
const BUFFERED_INPUT_TIME = 8;

// utils
function println(...args/*: any[]*/) {
  console.log(...args);
}
function mapObject(object/*: Record<string, any>*/, map/*: ([key: string, value: any]) => [any, any]*/)/*: Record<string, any>*/ {
  return Object.fromEntries(Object.entries(object).map(map));
}
function buffer_inputs(inputs/*: Input[] */)/*: [Input[], Input[]] */ {
  if (!USE_BUFFERED_INPUT || inputs.length === 0) return [inputs, []];
  const split_time = inputs[0].time + BUFFERED_INPUT_TIME;
  const split_index = inputs.find(v => v > v.time >= split_time);
  if (split_index === -1) return [inputs, []];
  return [inputs.slice(0, split_index), inputs.slice(split_index)];
}

// create input (for mobile key events)
const input = document.createElement("input");
document.body.append(input);

// create canvas
const canvas = document.createElement("canvas");
document.body.append(canvas);
const offscreen_canvas = canvas.transferControlToOffscreen();
thread1.postMessage({
  new_width: window.innerWidth,
  new_height: window.innerHeight,
  new_devicePixelRatio: window.devicePixelRatio,
  offscreen_canvas,
}, [offscreen_canvas]);

// render
const InputType = {
  PointerDown: 0,
  PointerMove: 1,
  PointerUp: 2,
  KeyInput: 3,
  KeyboardDown: 4,
  KeyboardUp: 5,
};
const InputType_IdToName = mapObject(InputType, ([name, id]) => [id, name]);
let acc_inputs = [];
let will_rerender = false;
function _render() {
  let current_inputs;
  [current_inputs, acc_inputs] = buffer_inputs(acc_inputs);
  will_rerender = false;
  acc_inputs = [];
  const isMobile = navigator.maxTouchPoints > 0;
  thread1.postMessage({
    inputs: current_inputs,
    isMobile,
    devicePixelRatio: window.devicePixelRatio,
    InputType_IdToName,
    // TODO: give thread1 url_info
  });
  if (acc_inputs.length > 0) rerender();
}
_render();

// resize event
function rerender() {
  if (!will_rerender) {
    will_rerender = true;
    requestAnimationFrame(_render);
  }
}
window.addEventListener("resize", (event/*: Event*/) => {
  // NOTE: rescale immediately
  thread1.postMessage({
    new_width: window.innerWidth,
    new_height: window.innerHeight,
    new_devicePixelRatio: window.devicePixelRatio,
  });
  rerender();
}, {passive: true})

// mouse and touch events
window.addEventListener("pointerdown", (event/*: PointerEvent*/) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerDown});
  rerender();
}, {passive: true});
canvas.addEventListener("touchstart", (event/*: TouchEvent*/) => {
  event.preventDefault();
})
window.addEventListener("pointermove", (event/*: PointerEvent*/) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerMove});
  rerender();
}, {passive: true});
window.addEventListener("pointerup", (event/*: PointerEvent*/) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerUp});
  rerender();
}, {passive: true});

// key events
input.addEventListener("input", (event/*: InputEvent*/) => {
  event.preventDefault();
  // NOTE: this is the only way to get key inputs on mobile, but you need to focus the input element first
  acc_inputs.push({time: +new Date(), type: InputType.KeyInput});
  rerender();
})
window.addEventListener("keydown", (event/*: KeyboardEvent*/) => {
  console.log(event.key)
  acc_inputs.push({time: +new Date(), type: InputType.KeyboardDown});
  rerender();
}, {passive: true});
window.addEventListener("keyup", (event/*: KeyboardEvent*/) => {
  acc_inputs.push({time: +new Date(), type: InputType.KeyboardUp});
  rerender();
}, {passive: true});
// TODO: controller events?
