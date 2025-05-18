import { lerp, makeArray, noise } from "../../../jsgui/out/jsgui.mts";

/** find the closest value to `start`, such that `condition(value) == true`, assuming `condition` has boxcar or monotonic shape */
export function binary_search_float(start: number, end: number, condition: (value: number) => boolean): number | null {
  // find some endpoint, such that `condition(endpoint) == true`
  for (let i = 0; i < 1000; i++) { // runs in <100 steps
    let new_end = end + (start - end)*noise(i);
    if (condition(new_end)) {
      end = new_end;
      break;
    }
  }
  if (!condition(end)) return null;
  // NOTE: `condition` must be monotonic here
  while (true) {
    let midpoint = end + (start - end)*0.5;
    if (midpoint === start || midpoint === end) break;
    if (condition(midpoint)) {
      end = midpoint;
    } else {
      start = midpoint;
    }
  }
  if (condition(start)) {
    return start;
  } else if (condition(end)) {
    return end;
  } else {
    return null;
  }
}


/**
 * solve linear system(s) `MX = Y` in-place
 * @param M left square submatrix
 * @param Y any column after M
 * @returns `X`
 * */
export function solveLinearSystem(rows: number[][]) {
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
export type GoldenSectionSearchOptions = {
  f: (x: number) => number;
  range: [number, number];
  findMaximum: boolean;
};
export function goldenSectionSearch(options: GoldenSectionSearchOptions) {
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
    return a;
}
/*goldenSectionSearch({
    f: v => Math.cos(v),
    range: [0, Math.PI/4],
    findMaximum: true,
})*/
export type MinimaxOptions = {
  reference: (x: number) => number;
  range: [number, number];
  /** approximation(x) = sum(params.map(x)) */
  params: ((x: number) => number)[];
  matchEnds?: boolean;
};
export function minimax(options: MinimaxOptions) {
  const {reference, range, params, matchEnds = true} = options;
  const nodeCount = params.length + 1;
  let nodes = makeArray(nodeCount, (_, i) => {
    const t = matchEnds ? i / (nodeCount - 1) : (i + 1) / (nodeCount + 1);
    return lerp(t, range[0], range[1])
  });
  let coefficients: number[] = [];
  let maxSolveError = 0;
  let pastErrors = Array(20).fill(Infinity);
  for (let iteration = 0; iteration < 300; iteration++) {
    // solve
    const matrixToSolve = nodes.map((node, i) => {
        let errorCoefficient = (-1)**i;
        if (matchEnds && (i === 0 || (i === nodes.length - 1))) {
            errorCoefficient = 0;
        }
        return [...params.map(param => param(node)), errorCoefficient, reference(node)]
    });
    let solve = solveLinearSystem(matrixToSolve);
    coefficients = solve.slice(0, -1);
    maxSolveError = solve[params.length];
    if (pastErrors.includes(maxSolveError)) break; // NOTE: we accumulate rounding errors while solving, so we would otherwise never converge when (matchEnds == true)
    pastErrors[iteration % pastErrors.length] = maxSolveError;
    //console.log(JSON.stringify({iteration, nodes, coefficients, maxSolveError}))
    // exchange nodes with extremum
    let extremum = {i: -1, x: 0, absError: 0};
    const f = (x: number) => params.reduce((acc, param, i) => acc + coefficients[i] * param(x), 0);
    const error = (x: number) => f(x) - reference(x);
    const extremumSearchStart = matchEnds ? 1 : 0;
    const extremumSearchEnd = matchEnds ? nodes.length - 1 : nodes.length;
    for (let i = extremumSearchStart; i < extremumSearchEnd; i++) {
      const left = i === 0 ? range[0] : nodes[i-1];
      const right = i === nodes.length - 1 ? range[1] : nodes[i+1];
      let findMaximum = i % 2 === 0;
      if (matchEnds) findMaximum = !findMaximum;
      const x = goldenSectionSearch({
        f: error,
        range: [left, right],
        findMaximum,
      });
      //console.log({x, left, right, findMaximum})
      const absError = Math.abs(error(x));
      if (absError >= extremum.absError) {
        extremum = {i, x, absError}
      }
    }
    //console.log(JSON.stringify({extremum}))
    if (nodes[extremum.i] === extremum.x) {break}
    nodes[extremum.i] = extremum.x;
  }
  return {coefficients, maxError: maxSolveError};
}
/*minimax({
  reference: v => Math.cos(v),
  range: [0, Math.PI/4],
  params: [() => 1, (v) => v*v, (v) => v*v*v*v],
  matchEnds: true,
})*/ // {"coefficients": [1, -0.49974056901418235, 0.040398729230590104], "maxError": 0.000015342201404119158}
