// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createWaiter() {
	let called = false;
	const resolve = (): void => {
		called = true;
	};

	const wait = (): Promise<void> => new Promise((resolve) => {
		const timer = setInterval(() => {
			if (called) {
				called = false;
				clearInterval(timer);
				resolve();
			}
		}, 100);
	});

	return {
		wait,
		resolve,
	};
}
