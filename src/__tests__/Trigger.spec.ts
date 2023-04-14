// FIXME: lint の修正
/* eslint-disable @typescript-eslint/no-empty-function */

import { Trigger } from "../Trigger";
import type { TriggerLike } from "../TriggerLike";
import { createWaiter } from "./helpers/createWaiter";

describe("Triggerの正常系テスト", () => {
	it("初期化", () => {
		const trigger = new Trigger<void>();
		expect(trigger.length).toBe(0);
		expect(trigger._handlers.length).toBe(0);
	});

	it("add()できる", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};
		const handler4 = (): void => {};
		const handler5 = async (): Promise<void> => {};
		const handler6 = async (): Promise<void> => {};
		const handler7 = async (): Promise<void> => {};
		const owner1 = {};
		const owner2 = {};
		const owner3 = {};
		const owner4 = {};

		expect(trigger.length).toBe(0);
		trigger.add(handler1);
		expect(trigger.length).toBe(1);
		expect(trigger._handlers[0]).toEqual({func: handler1, owner: undefined, name: undefined, once: false});

		trigger.add(handler2, owner1);
		expect(trigger.length).toBe(2);
		expect(trigger._handlers[1]).toEqual({func: handler2, owner: owner1, name: undefined, once: false});

		trigger.add({func: handler3});
		expect(trigger.length).toBe(3);
		expect(trigger._handlers[2]).toEqual({func: handler3, owner: undefined, name: undefined, once: false});

		trigger.add({func: handler4, owner: owner2});
		expect(trigger.length).toBe(4);
		expect(trigger._handlers[3]).toEqual({func: handler4, owner: owner2, name: undefined, once: false});

		trigger.add({func: handler5, name: "hoge"});
		expect(trigger.length).toBe(5);
		expect(trigger._handlers[4]).toEqual({func: handler5, owner: undefined, name: "hoge", once: false});

		trigger.add({func: handler6, owner: owner3, name: "foo"});
		expect(trigger.length).toBe(6);
		expect(trigger._handlers[5]).toEqual({func: handler6, owner: owner3, name: "foo", once: false});

		trigger.add({func: handler7, owner: owner4, name: "insertTop", index: 0});
		expect(trigger.length).toBe(7);
		expect(trigger._handlers[0]).toEqual({func: handler7, owner: owner4, name: "insertTop", once: false});
	});

	it("addOnce()できる", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};
		const handler4 = (): void => {};
		const handler5 = async (): Promise<void> => {};
		const handler6 = async (): Promise<void> => {};
		const handler7 = async (): Promise<void> => {};
		const owner1 = {};
		const owner2 = {};
		const owner3 = {};
		const owner4 = {};

		expect(trigger.length).toBe(0);
		trigger.addOnce(handler1);
		expect(trigger.length).toBe(1);
		expect(trigger._handlers[0]).toEqual({func: handler1, owner: undefined, name: undefined, once: true});

		trigger.addOnce(handler2, owner1);
		expect(trigger.length).toBe(2);
		expect(trigger._handlers[1]).toEqual({func: handler2, owner: owner1, name: undefined, once: true});

		trigger.addOnce({func: handler3});
		expect(trigger.length).toBe(3);
		expect(trigger._handlers[2]).toEqual({func: handler3, owner: undefined, name: undefined, once: true});

		trigger.addOnce({func: handler4, owner: owner2});
		expect(trigger.length).toBe(4);
		expect(trigger._handlers[3]).toEqual({func: handler4, owner: owner2, name: undefined, once: true});

		trigger.addOnce({func: handler5, name: "hoge"});
		expect(trigger.length).toBe(5);
		expect(trigger._handlers[4]).toEqual({func: handler5, owner: undefined, name: "hoge", once: true});

		trigger.addOnce({func: handler6, owner: owner3, name: "foo"});
		expect(trigger.length).toBe(6);
		expect(trigger._handlers[5]).toEqual({func: handler6, owner: owner3, name: "foo", once: true});

		trigger.addOnce({func: handler7, owner: owner4, name: "insertTop", index: 0});
		expect(trigger.length).toBe(7);
		expect(trigger._handlers[0]).toEqual({func: handler7, owner: owner4, name: "insertTop", once: true});
	});

	it("handle()できる", () => {
		const trigger: TriggerLike<number> = new Trigger<number>();
		const owner = { num: 0 };
		const nums = [] as number[];

		function f(this: { num: number }, x: number): void {
			this.num += x;
		}

		trigger.handle((x: number) => {
			nums.push(x);
		});
		trigger.handle(owner, f, "ownered");

		trigger.fire(3);
		trigger.fire(5);
		expect(nums).toEqual([3, 5]);
		expect(owner.num).toBe(8);
		trigger.removeAll({ name: "ownered" });
		trigger.fire(7);
		trigger.fire(11);
		expect(nums).toEqual([3, 5, 7, 11]);
		expect(owner.num).toBe(8);
	});

	it("関数をfire()できる", () => {
		const trigger: TriggerLike<boolean> = new Trigger<boolean>();
		let counter = 0;
		const handler = (): void => {
			counter++;
		};

		trigger.add(handler);
		expect(counter).toBe(0);
		expect(trigger.length).toBe(1);
		trigger.fire();
		expect(counter).toBe(1);
		expect(trigger.length).toBe(1);
	});

	it("Promise を返す関数をfire()できる", done => {
		const trigger: TriggerLike<boolean> = new Trigger<boolean>();
		const handler = async (): Promise<void> => {
			done();
		};

		trigger.add(handler);
		trigger.fire();
	});

	it("fire()にパラメータを与えて関数を実行することができる", () => {
		const trigger = new Trigger<any>();
		let args: any = null;
		const handler = (a: any): void => {
			args = a;
		};

		trigger.add(handler);
		trigger.fire({ param: "hoge" });
		expect(args).toEqual({ param: "hoge" });
	});

	it("fire()にパラメータを与えて Promise を返す関数を実行することができる", done => {
		const trigger = new Trigger<any>();
		const handler = async (a: any): Promise<void> => {
			expect(a).toEqual({ param: "hoge" });
			done();
		};

		trigger.add(handler);
		trigger.fire({ param: "hoge" });
	});

	it("fire()で実行された関数内のthisが正常に解決されている", () => {
		const trigger = new Trigger();

		let that: any = null;
		const testOwner = { testMethod: () => "test" };

		// thisを束縛しないためにfunction構文を利用
		const handler = function(this: any): void {
			that = this;
		};

		trigger.add(handler);
		trigger.fire();
		expect(that).toBeUndefined();

		trigger.add(handler, testOwner);
		trigger.fire();
		expect(that).toBe(testOwner);
	});

	it("fire()で実行された Promise を返す関数のthisが正常に解決されている", async () => {
		const trigger = new Trigger();

		let that: any = null;
		const testOwner = { testMethod: () => "test" };
		const { wait, resolve } = createWaiter();

		// thisを束縛しないためにfunction構文を利用
		const handler = async function(this: any): Promise<void> {
			that = this;
			resolve();
		};

		trigger.add(handler);
		trigger.fire();

		await wait();
		expect(that).toBeUndefined();

		trigger.add(handler, testOwner);
		trigger.fire();

		await wait();
		expect(that).toBe(testOwner);
	});

	it("fire()で実行された関数が真を返すと削除される", () => {
		const trigger = new Trigger<any>();

		function handler(this: {overrideValue: boolean}, x: any): boolean {
			return !!(this && this.overrideValue) || !!x;
		}
		const owner = { overrideValue: false };
		trigger.add(handler, null);
		trigger.add(handler, owner);

		expect(trigger.length).toBe(2);
		expect(trigger.contains(handler, null)).toBe(true);
		expect(trigger.contains(handler, owner)).toBe(true);
		trigger.fire(false);
		expect(trigger.length).toBe(2);
		expect(trigger.contains(handler, null)).toBe(true);
		expect(trigger.contains(handler, owner)).toBe(true);

		owner.overrideValue = true;
		trigger.fire(false);
		expect(trigger.length).toBe(1);
		expect(trigger.contains(handler, null)).toBe(true);
		expect(trigger.contains(handler, owner)).toBe(false);

		trigger.fire(true);
		expect(trigger.length).toBe(0);
		expect(trigger.contains(handler, null)).toBe(false);
		expect(trigger.contains(handler, owner)).toBe(false);
	});

	it("addOnce()で追加した関数がfire()した後に消える", () => {
		const trigger = new Trigger();
		let counter = 0;
		const handler1 = (): void => {
			counter++;
		};
		const handler2 = (): void => {
			counter++;
		};
		const handler3 = (): void => {
			counter++;
		};

		trigger.add(handler1);
		trigger.addOnce(handler2);
		trigger.add(handler3);
		expect(trigger.length).toBe(3);
		trigger.fire();
		expect(counter).toBe(3);
		expect(trigger.length).toBe(2);
		expect(trigger._handlers[0].func).toBe(handler1);
		expect(trigger._handlers[1].func).toBe(handler3);
	});

	it("addOnce()で追加した Promise を返す関数がfire()した後に消える", async () => {
		const trigger = new Trigger();
		let counter = 0;

		const { wait: waitHandler1, resolve: resolveHandler1 } = createWaiter();
		const { wait: waitHandler2, resolve: resolveHandler2 } = createWaiter();
		const { wait: waitHandler3, resolve: resolveHandler3 } = createWaiter();

		const handler1 = async (): Promise<void> => {
			counter++;
			resolveHandler1();
		};
		const handler2 = async (): Promise<void> => {
			counter++;
			resolveHandler2();
		};
		const handler3 = async (): Promise<unknown> => {
			counter++;
			resolveHandler3();
			return true; // Promise の fulfilled 値は関係ないことを確認
		};

		trigger.add(handler1);
		trigger.addOnce(handler2);
		trigger.add(handler3);
		expect(trigger.length).toBe(3);

		trigger.fire();
		await waitHandler1();
		await waitHandler2();
		await waitHandler3();

		expect(counter).toBe(3);
		expect(trigger.length).toBe(2);
		expect(trigger._handlers[0].func).toBe(handler1);
		expect(trigger._handlers[1].func).toBe(handler3);
	});

	it("add()で追加した関数が配列の要素順に実行される", () => {
		const trigger = new Trigger();
		const order = [] as number[];
		const handler1 = (): void => {
			order.push(1);
		};
		const handler2 = (): void => {
			order.push(2);
		};
		const handler3 = (): void => {
			order.push(3);
		};
		const handler4 = (): void => {
			order.push(4);
		};

		trigger.add(handler1); // 1
		trigger.add(handler2); // 1, 2
		trigger.add({func: handler3, index: 1}); // 1, 3, 2
		trigger.add({func: handler4, index: 0}); // 4, 1, 3, 2
		trigger.fire();
		expect(order).toEqual([4, 1, 3, 2]);
	});

	it("add()で追加した Promise を返す関数が配列の要素順に実行される", async () => {
		const trigger = new Trigger();

		const { wait: waitHandler1, resolve: resolveHandler1 } = createWaiter();
		const { wait: waitHandler2, resolve: resolveHandler2 } = createWaiter();
		const { wait: waitHandler3, resolve: resolveHandler3 } = createWaiter();
		const { wait: waitHandler4, resolve: resolveHandler4 } = createWaiter();

		const order: number[] = [];
		const handler1 = async (): Promise<void> => {
			order.push(1);
			resolveHandler1();
		};
		const handler2 = async (): Promise<void> => {
			order.push(2);
			resolveHandler2();
		};
		const handler3 = async (): Promise<void> => {
			order.push(3);
			resolveHandler3();
		};
		const handler4 = async (): Promise<void> => {
			order.push(4);
			resolveHandler4();
		};

		trigger.add(handler1); // 1
		trigger.add(handler2); // 1, 2
		trigger.add({func: handler3, index: 1}); // 1, 3, 2
		trigger.add({func: handler4, index: 0}); // 4, 1, 3, 2

		trigger.fire();
		await waitHandler1();
		await waitHandler2();
		await waitHandler3();
		await waitHandler4();

		expect(order).toEqual([4, 1, 3, 2]);
	});

	it("addOnce()で追加した関数が配列の要素順に実行される", () => {
		const trigger = new Trigger();
		const order = [] as number[];
		const handler1 = (): void => {
			order.push(1);
		};
		const handler2 = (): void => {
			order.push(2);
		};
		const handler3 = (): void => {
			order.push(3);
		};
		const handler4 = (): void => {
			order.push(4);
		};

		trigger.addOnce(handler1); // 1
		trigger.addOnce({func: handler2, index: 0}); // 2, 1
		trigger.addOnce({func: handler3, index: 0}); // 3, 2, 1
		trigger.addOnce({func: handler4, index: 1}); // 3, 4, 2, 1
		trigger.fire();
		expect(order).toEqual([3, 4, 2, 1]);
	});

	it("addOnce()で追加した Promise を返す関数が配列の要素順に実行される", async () => {
		const trigger = new Trigger();

		const { wait: waitHandler1, resolve: resolveHandler1 } = createWaiter();
		const { wait: waitHandler2, resolve: resolveHandler2 } = createWaiter();
		const { wait: waitHandler3, resolve: resolveHandler3 } = createWaiter();
		const { wait: waitHandler4, resolve: resolveHandler4 } = createWaiter();

		const order: number[] = [];
		const handler1 = (): void => {
			order.push(1);
			resolveHandler1();
		};
		const handler2 = (): void => {
			order.push(2);
			resolveHandler2();
		};
		const handler3 = (): void => {
			order.push(3);
			resolveHandler3();
		};
		const handler4 = (): void => {
			order.push(4);
			resolveHandler4();
		};

		trigger.addOnce(handler1); // 1
		trigger.addOnce({func: handler2, index: 0}); // 2, 1
		trigger.addOnce({func: handler3, index: 0}); // 3, 2, 1
		trigger.addOnce({func: handler4, index: 1}); // 3, 4, 2, 1

		trigger.fire();
		await waitHandler1();
		await waitHandler2();
		await waitHandler3();
		await waitHandler4();

		expect(order).toEqual([3, 4, 2, 1]);
	});

	it("add(), addOnce()で同じ関数を複数追加しても正しく実行される", () => {
		const trigger = new Trigger();
		let counter = 0;
		const handler = (): void => {
			counter++;
		};

		trigger.add(handler);
		trigger.add(handler);
		trigger.addOnce(handler);
		trigger.addOnce(handler);
		expect(trigger.length).toBe(4);
		trigger.fire();
		expect(counter).toBe(4);
		expect(trigger.length).toBe(2);
		trigger.fire();
		expect(counter).toBe(6);
		expect(trigger.length).toBe(2);
	});

	it("add(), addOnce()で同じ Promise を返す関数を複数追加しても正しく実行される", async () => {
		const trigger = new Trigger();
		const { wait, resolve } = createWaiter();

		let counter = 0;
		const handler = (): void => {
			counter++;
			resolve();
		};

		trigger.add(handler);
		trigger.add(handler);
		trigger.addOnce(handler);
		trigger.addOnce(handler);
		expect(trigger.length).toBe(4);

		trigger.fire();
		await wait();
		expect(counter).toBe(4);
		expect(trigger.length).toBe(2);

		trigger.fire();
		await wait();
		expect(counter).toBe(6);
		expect(trigger.length).toBe(2);
	});

	it("destroy()するとdestroyed()が確認できる", () => {
		const trigger = new Trigger<void>();
		expect(trigger.destroyed()).toBe(false);
		trigger.destroy();
		expect(trigger.destroyed()).toBe(true);
		expect(trigger._handlers).toBeNull();
	});

	it("contains()できる: handlerのみを指定", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};

		expect(trigger.contains(handler)).toBe(false);
		trigger.add(handler);
		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.contains({func: handler})).toBe(true);
		expect(trigger.contains({func: () => {}})).toBe(false);
	});

	it("contains()できる: handlerとownerを指定", () => {
		const trigger = new Trigger<void>();
		const handler = async (): Promise<void> => {};
		const owner = {};

		expect(trigger.contains(handler)).toBe(false);
		expect(trigger.contains(handler, owner)).toBe(false);
		expect(trigger.contains({func: handler})).toBe(false);
		trigger.add({func: handler, owner});
		expect(trigger.contains(handler, owner)).toBe(true);
		expect(trigger.contains({func: handler, owner})).toBe(true);

		expect(trigger.contains({func: handler, owner: {}})).toBe(false);
		expect(trigger.contains({func: () => {}, owner})).toBe(false);
	});

	it("contains()できる: handlerとnameを指定", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};

		expect(trigger.contains(handler)).toBe(false);
		expect(trigger.contains({func: handler})).toBe(false);
		expect(trigger.contains({func: handler, name: "hoge"})).toBe(false);
		trigger.add({func: handler, name: "hoge"});
		expect(trigger.contains({func: handler, name: "hoge"})).toBe(true);

		expect(trigger.contains({func: handler, name: "fuga"})).toBe(false);
		expect(trigger.contains({func: () => {}, name: "hoge"})).toBe(false);
	});

	it("contains()できる: handlerとownerとnameを指定", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};
		const owner = {};

		expect(trigger.contains(handler)).toBe(false);
		expect(trigger.contains({func: handler, owner, name: "foo"})).toBe(false);
		expect(trigger.contains({func: handler, name: "foo"})).toBe(false);
		trigger.add({func: handler, owner, name: "foo"});
		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.contains(handler, owner)).toBe(true);
		expect(trigger.contains({func: handler, owner, name: "foo"})).toBe(true);
		expect(trigger.contains({func: handler, name: "foo"})).toBe(true);

		expect(trigger.contains({func: handler, owner: {}})).toBe(false);
		expect(trigger.contains({func: handler, name: "bar"})).toBe(false);
		expect(trigger.contains({func: handler, owner: {}, name: "foo"})).toBe(false);
		expect(trigger.contains({func: () => {}, owner, name: "foo"})).toBe(false);
	});

	it("contains()できる: 複数のhandler", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};
		const owner = {};

		expect(trigger.contains(handler)).toBe(false);
		expect(trigger.contains(handler, owner)).toBe(false);
		expect(trigger.contains({func: handler, owner})).toBe(false);
		expect(trigger.contains({func: handler, name: "hoge"})).toBe(false);
		expect(trigger.contains({func: handler, name: "foo"})).toBe(false);
		expect(trigger.contains({func: handler, owner, name: "foo"})).toBe(false);

		trigger.add(handler);
		trigger.add({func: handler, owner});
		trigger.add({func: handler, name: "hoge"});
		trigger.add({func: handler, owner, name: "foo"});

		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.contains(handler, owner)).toBe(true);
		expect(trigger.contains({func: handler, owner})).toBe(true);
		expect(trigger.contains({func: handler, name: "hoge"})).toBe(true);
		expect(trigger.contains({func: handler, name: "foo"})).toBe(true);
		expect(trigger.contains({func: handler, owner, name: "foo"})).toBe(true);

		expect(trigger.contains({func: handler, owner: {}})).toBe(false);
		expect(trigger.contains({func: handler, name: "bar"})).toBe(false);
		expect(trigger.contains({func: handler, owner: {}, name: "foo"})).toBe(false);
		expect(trigger.contains({func: () => {}, owner, name: "foo"})).toBe(false);
	});

	it("remove()できる: handlerのみを指定", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(handler);
		expect(trigger.length).toBe(1);
		expect(trigger.contains(handler)).toBe(true);

		trigger.remove(handler);
		expect(trigger.contains(handler)).toBe(false);
		expect(trigger._handlers.length).toBe(0);
		expect(trigger.length).toBe(0);
	});

	it("remove()できる: handlerのみを登録した後にowner, nameを指定してremove()しても削除されない", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(handler);
		expect(trigger.length).toBe(1);
		expect(trigger.contains(handler)).toBe(true);

		trigger.remove(handler, {});
		expect(trigger.length).toBe(1);
		expect(trigger.contains(handler)).toBe(true);

		trigger.remove({func: handler, owner: null});
		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.length).toBe(1);

		trigger.remove({func: handler, name: "hoge"});
		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.length).toBe(1);

		trigger.remove({func: handler, owner: null, name: "hoge"});
		expect(trigger.contains(handler)).toBe(true);
		expect(trigger.length).toBe(1);
	});

	it("remove()できる: 複数のhandlerを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(handler1);
		trigger.add(handler2);
		expect(trigger.length).toBe(2);
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);

		trigger.remove(handler1);
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger._handlers.length).toBe(1);
		expect(trigger.length).toBe(1);

		trigger.remove(handler2);
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger._handlers.length).toBe(0);
		expect(trigger.length).toBe(0);
	});

	it("remove()できる: handlerとownerを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const owner1 = {};
		const owner2 = {};

		expect(trigger.length).toBe(0);
		trigger.add(handler1, owner1);
		trigger.add(handler2, owner2);
		expect(trigger.length).toBe(2);
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);

		trigger.remove(handler1, owner1);
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger._handlers.length).toBe(1);
		expect(trigger.length).toBe(1);

		trigger.remove({func: handler2, owner: owner2});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger._handlers.length).toBe(0);
		expect(trigger.length).toBe(0);
	});

	it("remove()できる: handlerを重複して登録", () => {
		const trigger = new Trigger<void>();
		let count = 0;
		const handler = (): void => {
			count++;
		};
		const anotherHandler = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(anotherHandler);
		trigger.add(handler);
		trigger.add({ func: handler });
		trigger.add({ func: handler, name: "foo" });

		expect(trigger.length).toBe(4);
		expect(trigger.contains(handler)).toBe(true);
		trigger.fire();
		expect(count).toBe(3);

		trigger.remove(handler);
		expect(trigger.length).toBe(3);
		trigger.fire();
		expect(count).toBe(5);

		trigger.remove(handler);
		expect(trigger.length).toBe(2);
		trigger.fire();
		expect(count).toBe(6);

		trigger.remove(handler);  // 残っている anotherHandler や { func:handler, name:"foo" } とは完全一致しないので何も削除されない
		expect(trigger.length).toBe(2);
		trigger.fire();
		expect(count).toBe(7);
	});

	it("removeAll()できる", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(handler1);
		trigger.add(handler2);
		trigger.add(handler3);
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.length).toBe(3);

		trigger.removeAll();
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger.contains(handler3)).toBe(false);
		expect(trigger._handlers.length).toBe(0);
		expect(trigger.length).toBe(0);
	});

	it("removeAll()できる: handlerのみを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add(handler1);
		trigger.add(handler2);
		trigger.add(handler1);
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.length).toBe(3);

		trigger.removeAll({func: handler1});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger._handlers.length).toBe(1);
		expect(trigger.length).toBe(1);
	});

	it("removeAll()できる: nameのみを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};

		expect(trigger.length).toBe(0);
		trigger.add({func: handler1, name: "testHandler1"});
		trigger.add({func: handler2, name: "testHandler1"});
		trigger.add({func: handler3, name: "testHandler2"});
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.length).toBe(3);

		trigger.removeAll({name: "testHandler1"});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger._handlers.length).toBe(1);
		expect(trigger.length).toBe(1);
	});

	it("removeAll()できる: ownerのみを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};
		const owner1 = {};
		const owner2 = {};

		expect(trigger.length).toBe(0);
		trigger.add({func: handler1, owner: owner1});
		trigger.add({func: handler2, owner: owner2});
		trigger.add({func: handler3, owner: owner1});
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.length).toBe(3);

		trigger.removeAll({owner: owner1});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(false);
		expect(trigger._handlers.length).toBe(1);
		expect(trigger.length).toBe(1);
	});

	it("removeAll()できる: nameとownerを指定", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};
		const handler4 = (): void => {};
		const handler5 = (): void => {};
		const handler6 = (): void => {};
		const owner1 = {};
		const owner2 = {};

		expect(trigger.length).toBe(0);
		trigger.add({func: handler1, owner: owner1, name: "test1"});
		trigger.add({func: handler2, owner: owner2, name: "test1"});
		trigger.add({func: handler3, owner: owner1, name: "test2"});
		trigger.add({func: handler4, owner: owner2, name: "test2"});
		trigger.add({func: handler5, owner: owner1, name: "test3"});
		trigger.add({func: handler6, owner: owner2, name: "test3"});
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.contains(handler4)).toBe(true);
		expect(trigger.contains(handler5)).toBe(true);
		expect(trigger.contains(handler6)).toBe(true);
		expect(trigger.length).toBe(6);

		trigger.removeAll({owner: owner1, name: "test2"});
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(false);
		expect(trigger.contains(handler4)).toBe(true);
		expect(trigger.contains(handler5)).toBe(true);
		expect(trigger.contains(handler6)).toBe(true);
		expect(trigger._handlers.length).toBe(5);
		expect(trigger.length).toBe(5);

		trigger.removeAll({owner: owner2});
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger.contains(handler3)).toBe(false);
		expect(trigger.contains(handler4)).toBe(false);
		expect(trigger.contains(handler5)).toBe(true);
		expect(trigger.contains(handler6)).toBe(false);
		expect(trigger._handlers.length).toBe(2);
		expect(trigger.length).toBe(2);
	});

	it("removeAll()できる: handler, owner, nameを登録した後にhandler, owner, nameをそれぞれ指定してremoveAll()すると削除される", () => {
		const trigger = new Trigger<void>();
		const handler1 = (): void => {};
		const handler2 = (): void => {};
		const handler3 = (): void => {};
		const owner1 = {};
		const owner2 = {};
		const owner3 = {};

		expect(trigger.length).toBe(0);
		trigger.add({func: handler1, owner: owner1, name: "test1"});
		trigger.add({func: handler2, owner: owner2, name: "test2"});
		trigger.add({func: handler3, owner: owner3, name: "test3"});
		expect(trigger.length).toBe(3);
		expect(trigger.contains(handler1)).toBe(true);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);

		trigger.removeAll({func: handler1});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(true);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.length).toBe(2);

		trigger.removeAll({owner: owner2});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger.contains(handler3)).toBe(true);
		expect(trigger.length).toBe(1);

		trigger.removeAll({name: "test3"});
		expect(trigger.contains(handler1)).toBe(false);
		expect(trigger.contains(handler2)).toBe(false);
		expect(trigger.contains(handler3)).toBe(false);
		expect(trigger.length).toBe(0);
	});

	it("destroy()できる", () => {
		const trigger = new Trigger<void>();
		const handler = (): void => {};
		trigger.add(handler);
		expect(trigger.length).toBe(1);
		expect(trigger.destroyed()).toBe(false);

		trigger.destroy();
		expect(trigger.length).toBeNull();
		expect(trigger.destroyed()).toBe(true);
	});
});

describe("Triggerの異常系テスト", () => {
	it("二重にdestroy()しても例外を吐かない", () => {
		const trigger = new Trigger<void>();
		expect(trigger.length).toBe(0);
		expect(trigger.destroyed()).toBe(false);

		trigger.destroy();
		expect(trigger.length).toBeNull();
		expect(trigger.destroyed()).toBe(true);

		trigger.destroy();
		expect(trigger.length).toBeNull();
		expect(trigger.destroyed()).toBe(true);
	});

	it("fire()中でremoveAll()した場合でも正常に動作する", async () => {
		const trigger = new Trigger<void>();
		let count = 0;
		const { wait, resolve } = createWaiter();

		trigger.add((): void => {
			count++;
			trigger.removeAll();
		});
		trigger.add((): void => {
			count++;
		});
		trigger.add((): void => {
			count++;
		});
		trigger.add(async (): Promise<void> => {
			count++;
			resolve();
		});

		trigger.fire();
		await wait();

		expect(count).toBe(4);
	});

	it("fire()中でdestroy()した場合でも正常に動作する", async () => {
		const trigger = new Trigger<void>();
		let count = 0;
		const { wait, resolve } = createWaiter();

		trigger.add((): void => {
			count++;
			trigger.destroy();
		});
		trigger.add((): void => {
			count++;
		});
		trigger.add((): void => {
			count++;
		});
		trigger.add(async (): Promise<void> => {
			count++;
			resolve();
		});

		trigger.fire();
		await wait();

		trigger.fire();
		expect(count).toBe(4);
	});

	it("addOnce()でfire()中にdestroy()した場合でも正常に動作する ", () => {
		const trigger = new Trigger<void>();
		trigger.addOnce((): void => {
			trigger.destroy();
		});
		trigger.fire();
		expect(trigger.destroyed()).toBe(true);
		expect(trigger._handlers).toBeNull();
	});

	it("ハンドラが削除されれば、fireしても関数は動作しない", () => {
		let counter = 0;
		const mockHandle = (): void => {
			counter++;
		};
		const trigger = new Trigger<void>();
		trigger.add(mockHandle);
		trigger.fire();
		expect(counter).toBe(1);
		trigger.destroy();
		trigger.fire();
		expect(counter).toBe(1);
	});
});
