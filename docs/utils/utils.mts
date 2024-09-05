import {ComponentFunction} from '../../jsgui/jsgui.mts'
export type MainPageSection = {
  label: string;
  id: string;
  component: ComponentFunction<[]>;
};
export function getSizeLabel(size: string) {
  return size[0].toUpperCase() + size.slice(1);
}
