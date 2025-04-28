export function makeArray<T>(N: number, map: (v: undefined, i: number) => T): T[] {
	const arr = Array(N);
	for (let i = 0; i < arr.length; i++) {
		arr[i] = map(undefined, i);
	}
	return arr;
}

// sorting
type Comparable = number | string | Date | BigInt | undefined | null;
function compare(a: any, b: any): number {
	return ((a > b) as unknown as number) - ((a < b) as unknown as number);
}
export function sortBy<T, K extends Comparable>(arr: T[], key: (v: T) => K, descending = false): T[] {
	return arr.sort((a, b) => {
		let comparison = compare(key(a), key(b));
		if (descending) {comparison = -comparison;}
		return comparison;
	});
}
export function sortByArray<T, K extends Comparable>(arr: T[], key: (v: T) => K[], descending: boolean[] = []): T[] {
	return arr.sort((a, b) => {
		const a_key = key(a);
		const b_key = key(b);
		const n = Math.max(a_key.length, b_key.length);
		for (let i = 0; i < n; i++) {
			let comparison = compare(a_key[i], b_key[i]);
			if (descending[i]) {comparison = -comparison;}
			if (comparison !== 0) return comparison;
		}
		return 0;
	});
}
