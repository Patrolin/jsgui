package main

void :: struct {}
Set :: struct($T: typeid) {
	m: map[T]void,
}
as_set :: proc(arr: []$T) -> (acc: Set(T)) {
	for v in arr {
		set_add(&acc, v)
	}
	return
}
set_add :: proc(set: ^Set($T), key: T) {
	set.m[key] = {}
}
set_remove :: proc(set: ^Set($T), key: T) {
	delete_key(&set.m, key)
}
set_diff :: proc(a, b: Set($T)) -> (diff: Set(T)) {
	for k in a.m {set_add(&diff, k)}
	for k in b.m {set_remove(&diff, k)}
	return
}
