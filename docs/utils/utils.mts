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
export function solveLinear(rows: number[][]) {
  const width = rows[0].length;
  const height = rows.length;
  const normalizeRow = (x: number, y: number) => {
    const m = 1 / rows[y][x];
    for (let k = 0; k < width; k++) {
        rows[y][k] *= m;
    }
  }
  const subtractRow = (x: number, y: number) => {
      const m = rows[y][x]; // NOTE: source is always 1
      for(let k = 0; k < width; k++) {
          rows[y][k] -= rows[x][k] * m; // NOTE: source is always at (x, x)
      }
  }
  for (let i = 0; i < height; i++) {
    // prevent zeros
    if (rows[i][i] === 0) {
        const nonZeroRow = rows.findIndex(v => v[i] !== 0.0);
        if (nonZeroRow === -1) throw `Invalid linear system: ${rows}`;
        for (let k = 0; k < width; k++) {rows[i][k] += rows[nonZeroRow][k]}
    }
    // normalize
    normalizeRow(i, i);
    // subtract below
    for (let j = i+1; j < height; j++) {
        subtractRow(i, j);
    }
  }
  for (let i = height - 1; i >= 0; i--) {
    // subtract above
    for (let j = i-1; j >= 0; j--) {
        subtractRow(i, j);
    }
  }
  return rows.map(row => row[row.length - 1]);
}
type MinimaxOptions = {
  reference: (x: number) => number;
  range: [number, number];
  params: ((param: number) => number)[];
}
export function minimax(options: MinimaxOptions) {
  const {reference, range, params} = options;
  const nodeCount = params.length + 1;
  const nodes = makeArray(nodeCount, (i) => lerp((i+1) / (nodeCount+1), range[0], range[1]));
  // solve
  const newParams = solveLinear(nodes.map((node, i) =>
    [...params.map(f => f(node)), (-1)**i, reference(node)]
  )).slice(0, -1);
  console.log(newParams);
  /*
    [1, x0, x0^2, 1] [a]   [f(x0)]
    [1, x1, x1^2, 1] [b] = [f(x1)]
    [1, x2, x2^2, 1] [c]   [f(x2)]
    [1, x3, x3^2, 1] [h]   [f(x3)]
  */
}
