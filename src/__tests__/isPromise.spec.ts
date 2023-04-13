import { isPromise } from "../isPromise";

test("isPromiseのテスト", () => {
	expect(isPromise(null)).toBe(false);
	expect(isPromise({})).toBe(false);
	expect(isPromise(new Promise<void>((resolve) => void resolve()))).toBe(true);
	expect(isPromise((async () => undefined)())).toBe(true);
});
