export function makeArray<T>(N: number, map: (v: undefined, i: number) => T): T[] {
	const arr = Array(N);
	for (let i = 0; i < arr.length; i++) {
		arr[i] = map(undefined, i);
	}
	return arr;
}
