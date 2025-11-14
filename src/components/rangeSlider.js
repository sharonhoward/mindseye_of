// https://observablehq.com/@mootari/range-slider

//import * as Plot from "npm:@observablehq/plot";
//import * as d3 from "npm:d3";
import {html} from "npm:htl"; // need this one!
 
// trying to work out if/how i can import "invalidation"...
//import {invalidation} from "observablehq:stdlib";
// RuntimeError: The requested module 'http://127.0.0.1:3000/_observablehq/stdlib.js' doesn't provide an export named: 'invalidation'



export function interval(range = [], options = {}) {
  const [min = 0, max = 1] = range;
  const {
    step = .001,
    label = null,
    value = [min, max],
    format = ([start, end]) => `${start} … ${end}`,
    color,
    width = 360,
    theme,
    __ns__ = randomScope(),
  } = options;

  const css = `
#${__ns__} {
  font: 13px/1.2 var(--sans-serif);
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  max-width: 100%;
  width: auto;
}
@media only screen and (min-width: 30em) {
  #${__ns__} {
    flex-wrap: nowrap;
    width: ${cssLength(width)};
  }
}
#${__ns__} .label {
  width: 120px;
  padding: 5px 0 4px 0;
  margin-right: 6.5px;
  flex-shrink: 0;
}
#${__ns__} .form {
  display: flex;
  width: 100%;
}
#${__ns__} .range {
  flex-shrink: 1;
  width: 100%;
}
#${__ns__} .range-slider {
  width: 100%;
}
  `;
  
  const $range = rangeInput({min, max, value: [value[0], value[1]], step, color, width: "100%", theme});
  const $output = html`<output>`;
  const $view = html`<div id=${__ns__}>
${label == null ? '' : html`<div class="label">${label}`}
<div class=form>
  <div class=range>
    ${$range}<div class=range-output>${$output}</div>
  </div>
</div>
${html`<style>${css}`}
  `;

  const update = () => {
    const content = format([$range.value[0], $range.value[1]]);
    if(typeof content === 'string') $output.value = content;
    else {
      while($output.lastChild) $output.lastChild.remove();
      $output.appendChild(content);
    }
  };
  $range.oninput = update;
  update();
  
  return Object.defineProperty($view, 'value', {
    get: () => $range.value,
    set: ([a, b]) => {
      $range.value = [a, b];
      update();
    },
  });
}

function rangeInput(options = {}) {
  const {
    min = 0,
    max = 100,
    step = 'any',
    value: defaultValue = [min, max],
    color,
    width,
    theme = theme_Flat,
  } = options;
  
  const controls = {};
  const scope = randomScope();
  const clamp = (a, b, v) => v < a ? a : v > b ? b : v;

  // Will be used to sanitize values while avoiding floating point issues.
  const input = html`<input type=range ${{min, max, step}}>`;
  
  const dom = html`<div class=${`${scope} range-slider`} style=${{
    color,
    width: cssLength(width),
  }}>
  ${controls.track = html`<div class="range-track">
    ${controls.zone = html`<div class="range-track-zone">
      ${controls.range = html`<div class="range-select" tabindex=0>
        ${controls.min = html`<div class="thumb thumb-min" tabindex=0>`}
        ${controls.max = html`<div class="thumb thumb-max" tabindex=0>`}
      `}
    `}
  `}
  ${html`<style>${theme.replace(/:scope\b/g, '.'+scope)}`}
</div>`;

  let value = [], changed = false;
  Object.defineProperty(dom, 'value', {
    get: () => [...value],
    set: ([a, b]) => {
      value = sanitize(a, b);
      updateRange();
    },
  });

  const sanitize = (a, b) => {
    a = isNaN(a) ? min : ((input.value = a), input.valueAsNumber);
    b = isNaN(b) ? max : ((input.value = b), input.valueAsNumber);
    return [Math.min(a, b), Math.max(a, b)];
  }
  
  const updateRange = () => {
    const ratio = v => (v - min) / (max - min);
    dom.style.setProperty('--range-min', `${ratio(value[0]) * 100}%`);
    dom.style.setProperty('--range-max', `${ratio(value[1]) * 100}%`);
  };

  const dispatch = name => {
    dom.dispatchEvent(new Event(name, {bubbles: true}));
  };
  const setValue = (vmin, vmax) => {
    const [pmin, pmax] = value;
    value = sanitize(vmin, vmax);
    updateRange();
    // Only dispatch if values have changed.
    if(pmin === value[0] && pmax === value[1]) return;
    dispatch('input');
    changed = true;
  };
  
  setValue(...defaultValue);
  
  // Mousemove handlers.
  const handlers = new Map([
    [controls.min, (dt, ov) => {
      const v = clamp(min, ov[1], ov[0] + dt * (max - min));
      setValue(v, ov[1]);
    }],
    [controls.max, (dt, ov) => {
      const v = clamp(ov[0], max, ov[1] + dt * (max - min));
      setValue(ov[0], v);
    }],
    [controls.range, (dt, ov) => {
      const d = ov[1] - ov[0];
      const v = clamp(min, max - d, ov[0] + dt * (max - min));
      setValue(v, v + d);
    }],
  ]);
  
  // Returns client offset object.
  const pointer = e => e.touches ? e.touches[0] : e;
  // Note: Chrome defaults "passive" for touch events to true.
  const on  = (e, fn) => e.split(' ').map(e => document.addEventListener(e, fn, {passive: false}));
  const off = (e, fn) => e.split(' ').map(e => document.removeEventListener(e, fn, {passive: false}));
  
  let initialX, initialV, target, dragging = false;
  function handleDrag(e) {
    // Gracefully handle exit and reentry of the viewport.
    if(!e.buttons && !e.touches) {
      handleDragStop();
      return;
    }
    dragging = true;
    const w = controls.zone.getBoundingClientRect().width;
    e.preventDefault();
    handlers.get(target)((pointer(e).clientX - initialX) / w, initialV);
  }
  
  
  function handleDragStop(e) {
    off('mousemove touchmove', handleDrag);
    off('mouseup touchend', handleDragStop);
    if(changed) dispatch('change');
  }
  
  //invalidation.then(handleDragStop);
  
  // ReferenceError: invalidation is not defined; can't work out how to fix it, though it seems to work without it. it's not a problem when the code is in the md, only in an external js. (which suggests you need to import something, but what?)
  // https://observablehq.com/@observablehq/invalidation
  // To free up resources when a cell is re-evaluated, such as cancelling timers or disposing WebGL contexts, use the `invalidation` promise. This promise resolves when the current cell is re-evaluated: when the cell’s code changes, when it is run using Shift-Enter, or when a referenced input changes. This promise is typically used to dispose of resources that were allocated by the cell. 
  // https://observablehq.com/framework/reactivity#invalidation 
  // With reactive evaluation, code blocks can run multiple times, say in response to interaction or streaming data. If you need to “clean up” after a code block, say to cancel an animation loop or close a socket, use the invalidation promise to register a disposal hook.
  // is it worng format? or perhaps you should put the invalidation line separately in the md?
  // https://github.com/observablehq/framework/discussions/1829
  // barChartView.addSignalListener("barSelect", handleBarSelection);
	// invalidation.then(() => {  barChartView.removeSignalListener("barSelect", handleBarSelection); });
  
  
  dom.ontouchstart = dom.onmousedown = e => {
    dragging = false;
    changed = false;
    if(!handlers.has(e.target)) return;
    on('mousemove touchmove', handleDrag);
    on('mouseup touchend', handleDragStop);
    e.preventDefault();
    e.stopPropagation();
    
    target = e.target;
    initialX = pointer(e).clientX;
    initialV = value.slice();
  };
  
  controls.track.onclick = e => {
    if(dragging) return;
    changed = false;
    const r = controls.zone.getBoundingClientRect();
    const t = clamp(0, 1, (pointer(e).clientX - r.left) / r.width);
    const v = min + t * (max - min);
    const [vmin, vmax] = value, d = vmax - vmin;
    if(v < vmin) setValue(v, v + d);
    else if(v > vmax) setValue(v - d, v);
    if(changed) dispatch('change');
  };
  
  return dom;
}



function randomScope(prefix = 'scope-') {
  return prefix + (performance.now() + Math.random()).toString(32).replace('.', '-');
}




const cssLength = v => v == null ? null : typeof v === 'number' ? `${v}px` : `${v}`



const theme_Flat = `
/* Options */
:scope {
  color: #3b99fc;
  width: 240px;
}

:scope {
  position: relative;
  display: inline-block;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 7px;
  background-color: hsl(0, 0%, 80%);
  overflow: visible;
  border-radius: 4px;
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 7px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #fcfcfc;
  top: -4px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`



const theme_GoogleChrome_MacOS1013 = `
/* Options */
:scope {
  color: #3b99fc;
  width: 240px;
}

:scope {
  position: relative;
  display: inline-block;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 5px;
  background-color: hsl(0, 0%, 80%);
  box-shadow: inset 0 1px 3px -1px rgba(0,0,0,0.33);
  overflow: visible;
  border-radius: 3px;
  border: 1px inset hsl(0, 0%, 70%);
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 5px;
  top: -1px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #eee linear-gradient(0deg, #fff0 50%, #fff9 50%, #fff5);
  top: -5px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`



const theme_Retro1 = `
/* Options */
:scope {
  color: #3b99fc;  
  width: 240px;
}

:scope {
  position: relative;
  display: inline-block;
  vertical-align: -10px;
  margin: 2px;
}
:scope .range-track {
  height: 20px;
  border: 2px solid #000;
  padding: 0 18px;
  position: relative;
  background: #fff url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAPUlEQVQoU2NkYGD4z8DAwMiAH/wnpACunWyFIGeAAIYB6ALYFILFiLGaaIXY3YIrlLBZjdVDIIXoAY7VQwD4rQoH9uQ3nwAAAABJRU5ErkJggg==");
}
:scope .range-track-zone {
  position: relative;
  height: 100%;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
  background: currentColor url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAK0lEQVQoU2NkwA/+g6QZqaEIbAY2k8BWIMuRrQjDmTCTMKxAVkmSIrwhAQBStQYIBYnwugAAAABJRU5ErkJggg==") fixed;
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  height: 100%;
  top: 0;
  width: 20px;
  background: #fff;
  border: 2px solid #000;
  border-width: 0 2px;
  cursor: default;
}
:scope .thumb:active {
  background: #000;
}
:scope .thumb-min {
  left: -20px;
}
:scope .thumb-max {
  right: -20px;
}
`


const theme_NoUiSlider = `
/* Options */
:scope {
  color: #3b99fc;
  width: 240px;
}

:scope {
  box-sizing: border-box;
  display: inline-block;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  margin: 10px 17px;
  position: relative;
  background: #FAFAFA;
  border-radius: 4px;
  border: 1px solid #D3D3D3;
  box-shadow: inset 0 1px 1px #F0F0F0, 0 3px 6px -5px #BBB;
  height: 18px;
}
:scope .range-select {
  box-sizing: border-box;
  position: absolute;
  background: currentColor;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: 34px;
  height: 28px;
  top: -6px;
  border: 1px solid #D9D9D9;
  border-radius: 3px;
  background: #FFF;
  cursor: default;
  box-shadow: inset 0 0 1px #FFF, inset 0 1px 7px #EBEBEB, 0 3px 6px -3px #BBB;
}
:scope .thumb:before,
:scope .thumb:after {
  content: "";
  display: block;
  position: absolute;
  height: 14px;
  width: 1px;
  background: #E8E7E6;
  left: 14px;
  top: 6px;
}
:scope .thumb:after {
  left: 17px;
}
:scope .thumb-min {
  left: -17px;
}
:scope .thumb-max {
  right: -17px;
}
`






