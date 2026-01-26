import { div, makeComponent, vec3 } from "../../jsgui/out/jsgui.mts";
import { oklchInput } from "../components/inputs/oklch_input.mts";
import { oklch_to_srgb255i } from "../utils/color_utils.mts";

// TODO: verify against 3rd party library
// TODO: use LH_C mode, clamp to unit circle and clamp chroma in shader (and have toggle for clamp vs alpha)
// TODO: delete CH_L mode

// TODO: color sphere mode?

/* TODO:
  - H = angle(click, center), C = distance(click, center), L = distance(pixel, center)
  - draw a line from the center through the click
  - then find_min_L(line) and find_max_L(line), and interpolate between them
  - (optionally also have sliders for H, C)
*/

// TODO!: theme creator with: L, L_step, C%, H, H_step?

// TODO pt2: pick and interpolate through OKLab + pick through OKLCH

export const palettePickerPage = makeComponent("themeCreatorPage", function() {
  const wrapper = this.append(div());
  wrapper.append(oklchInput({
    defaultValue: vec3(0.7482, 0.127, -2.7041853071795865), // TODO: make this be in degrees
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
});
