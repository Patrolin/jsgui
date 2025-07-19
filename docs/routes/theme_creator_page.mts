import { div, makeComponent, vec3 } from "../../jsgui/out/jsgui.mts";
import { OKLCH_InputMode, oklchInput } from "../components/inputs/oklch_input.mts";
import { oklch_to_srgb255i } from "../utils/color_utils.mts";

// TODO: verify against 3rd party library
// TODO: use LH_C mode, clamp to unit circle and clamp chroma in shader (and have toggle for clamp vs alpha)
// TODO: delete CH_L mode

// TODO: color sphere mode

// TODO!: theme creator with: L, L_step, C%, H, H_step?
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const wrapper = this.append(div());
  wrapper.append(oklchInput({
    defaultValue: vec3(0.7482, 0.127, -2.7041853071795865), // TODO: make this be in degrees
    inputMode: OKLCH_InputMode.LH_C,
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
  wrapper.append(oklchInput({
    defaultValue: vec3(0.6939, 0.1614, 57.18 * Math.PI / 180),
    inputMode: OKLCH_InputMode.CH_L,
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
});
