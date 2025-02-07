import {ComponentFunction, lerp, makeArray} from '../../jsgui/out/jsgui.mts'
export type DocsSection = {
  id: string;
  label: string;
  pages: DocsPage[];
}
export type DocsPage = {
  id: string;
  label: string;
  component: ComponentFunction<[]>;
}
export function getSizeLabel(size: string) {
  return size[0].toUpperCase() + size.slice(1);
}
export function getGithubPrefix(): string {
  const githubPrefix = "/jsgui";
  return window.location.pathname.startsWith(githubPrefix) ? githubPrefix : "";
}
