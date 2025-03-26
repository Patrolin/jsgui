package main

void :: struct {}
Set :: struct($T: typeid) {
	m: map[T]void,
}
as_set :: proc(arr: []$K) -> (acc: Set(K)) {
	for v in arr {set_add(&acc, v)}
	return
}
as_set_by :: proc(arr: []$V, key: proc(value: V) -> $K) -> (acc: Set(K)) {
	for v in arr {set_add(&acc, key(v))}
	return
}
set_add :: proc(set: $T/^Set($K), key: K) {
	set.m[key] = {}
}
set_remove :: proc(set: $T/^Set($K), key: K) {
	delete_key(&set.m, key)
}
set_diff :: proc(a, b: $T/^Set($K)) -> (diff: Set(K)) {
	for k in a.m {set_add(&diff, k)}
	for k in b.m {set_remove(&diff, k)}
	return
}
