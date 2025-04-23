export function is_nullsy(value: any): value is null | undefined {
  return value == null;
}
export function is_array<V>(value: any): value is V[] {
  return Array.isArray(value);
}
export function is_object<V>(value: any): value is Record<string, V> {
  return value !== null && typeof value === "object";
}
export function is_string(value: any): value is string {
  return typeof value === "string";
}
export function is_number(value: any): value is number {
  return typeof value === "number";
}
export function is_boolean(value: any): value is boolean {
  return typeof value === "boolean";
}
export function is_function(value: any): value is Function {
  return typeof value === "function";
}
export function is_symbol(value: any): value is Symbol {
  return typeof value === "symbol";
}
export function is_bigint(value: any): value is BigInt {
  return typeof value === "bigint";
}
