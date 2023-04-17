export function isPromise<T>(target: unknown): target is PromiseLike<T> {
	return (
		target != null &&
		(typeof target === "object" || typeof target === "function") &&
		typeof (target as any).then === "function"
	);
}
