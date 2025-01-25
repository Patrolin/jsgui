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
// solver utils
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
const PHI_INV = (Math.sqrt(5) - 1) / 2;
type GoldenSectionSearchOptions = {
  f: (v: number) => number;
  range: [number, number];
  findMaximum: boolean;
}
function goldenSectionSearch(options: GoldenSectionSearchOptions) {
    const {f, range, findMaximum} = options;
    let [a, b] = range;
    if (findMaximum) {
        while (true) {
            let c = b - (b - a) * PHI_INV;
            let d = a + (b - a) * PHI_INV;
            if (c === a) return a;
            if (f(c) >= f(d)) {
                b = d;
            } else {
                a = c;
            }
        }
    } else {
        while (true) {
            let c = b - (b - a) * PHI_INV;
            let d = a + (b - a) * PHI_INV;
            if (c === a) return a;
            if (f(c) <= f(d)) {
                b = d;
            } else {
                a = c;
            }
        }
    }
}
type MinimaxOptions = {
  reference: (x: number) => number;
  range: [number, number];
  params: ((param: number) => number)[];
}
export function minimax(options: MinimaxOptions) {
  const {reference, range, params} = options;
  const nodeCount = params.length + 1;
  let nodes = makeArray(nodeCount, (i) => lerp((i+1) / (nodeCount+1), range[0], range[1]));
  let coefficients: number[] = [];
  while (true) {
    // solve
    coefficients = solveLinear(nodes.map((node, i) =>
      [...params.map(param => param(node)), (-1)**i, reference(node)]
    )).slice(0, -1);
    // exchange nodes with extremum
    let extremum = {i: -1, x: 0, absError: 0};
    const f = (v: number) => params.reduce((acc, param, i) => acc + coefficients[i] * param(v), 0);
    const error = (v: number) => f(v) - reference(v);
    for (let i = 0; i < nodes.length; i++) {
      const left = i === 0 ? range[0] : nodes[i-1];
      const right = i === nodes.length - 1 ? range[1] : nodes[i+1];
      const findMaximum = i % 2 === 0;
      const x = goldenSectionSearch({
        f: error,
        range: [left, right],
        findMaximum,
      });
      const absError = Math.abs(error(x));
      if (absError >= extremum.absError) {
        extremum = {i, x, absError}
      }
    }
    if (nodes[extremum.i] === extremum.x) {break}
    nodes[extremum.i] = extremum.x;
    console.log({nodes, paramValues: coefficients, extremum});
  }
  return coefficients;
}
