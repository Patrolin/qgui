// wasm utils
let /** @type {WebAssembly.Instance} */ wasm_instance;
let /** @type {WebAssembly.Exports} */ wasm_exports;
const utf8_decoder = new TextDecoder();
/**
 * @param {number} channel
 * @param {number} ptr
 * @param {number} size
 */
function write(channel, ptr, size) {
  const slice = wasm_exports.memory.buffer.slice(ptr, ptr + size);
  const message = utf8_decoder.decode(slice);
  if (channel === 2) {
    console.error(message);
  } else {
    console.log(message);
  }
}

// create wasm instance
WebAssembly.instantiateStreaming(window.app, {
  odin_env: {write},
  js: {println},
}).then(result => {
  wasm_instance = result.instance;
  wasm_exports = wasm_instance.exports;
  console.log(wasm_exports.setup());
});

const USE_BUFFERED_INPUT = true;
const BUFFERED_INPUT_TIME = 8;

// utils
function println(...args) {
  console.log(...args);
}
/**
 * @param {Record<string, any>} object
 * @param {([key, value]: [string, any]) => [any, any]} map
 * @return {[any[], any[]]}
 */
function mapObject(object, map) {
  return Object.fromEntries(Object.entries(object).map(map));
}
/**
 * @param {any[]} inputs
 * @return {[any[], any[]]}
 */
function buffer_inputs(inputs) {
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
window.addEventListener("resize", (/** @type Event */ event) => {
  // NOTE: rescale immediately
  thread1.postMessage({
    new_width: window.innerWidth,
    new_height: window.innerHeight,
    new_devicePixelRatio: window.devicePixelRatio,
  });
  rerender();
}, {passive: true})

// mouse and touch events
window.addEventListener("pointerdown", (/** @type PointerEvent */ event) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerDown});
  rerender();
}, {passive: true});
canvas.addEventListener("touchstart", (/** @type TouchEvent */ event) => {
  event.preventDefault(); // prevent `pointercancel` event
})
window.addEventListener("pointermove", (/** @type PointerEvent */ event) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerMove});
  rerender();
}, {passive: true});
window.addEventListener("pointerup", (/** @type PointerEvent */ event) => {
  acc_inputs.push({time: +new Date(), type: InputType.PointerUp});
  rerender();
}, {passive: true});

// key events
input.addEventListener("input", (/** @type InputEvent */ event) => {
  event.preventDefault();
  // NOTE: this is the only way to get key inputs on mobile, but you need to focus the input element first
  acc_inputs.push({time: +new Date(), type: InputType.KeyInput});
  rerender();
})
window.addEventListener("keydown", (/** @type KeyboardEvent */ event) => {
  console.log(event.key)
  acc_inputs.push({time: +new Date(), type: InputType.KeyboardDown});
  rerender();
}, {passive: true});
window.addEventListener("keyup", (/** @type KeyboardEvent */ event) => {
  acc_inputs.push({time: +new Date(), type: InputType.KeyboardUp});
  rerender();
}, {passive: true});
// TODO: controller events?
