// Keyboard and mouse input for SUNCOAST: HEATLINE.
// One clear job: track keys, mouse clicks and the aim point, nothing else.

export function createInput() {
  const keys = Object.create(null);
  const state = {
    keys,
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    // Edge-triggered presses consumed by the loop (E, R, P, M, digits).
    pressed: Object.create(null),
  };

  function onKeyDown(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!keys[k]) state.pressed[k] = true;
    keys[k] = true;
  }
  function onKeyUp(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys[k] = false;
  }
  function onMouseDown(e) { state.mouseDown = true; state.mouseX = e.clientX; state.mouseY = e.clientY; }
  function onMouseUp() { state.mouseDown = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  state.isDown = (k) => !!keys[k];
  state.wasPressed = (k) => !!state.pressed[k];
  state.endFrame = () => { for (const k in state.pressed) state.pressed[k] = false; };
  state.axis = () => {
    // +1 forward, -1 back; +1 steer right, -1 steer left.
    let f = 0, s = 0;
    if (keys.w || keys.arrowup) f += 1;
    if (keys.s || keys.arrowdown) f -= 1;
    if (keys.d || keys.arrowright) s += 1;
    if (keys.a || keys.arrowleft) s -= 1;
    return { forward: f, steer: s };
  };
  return state;
}
