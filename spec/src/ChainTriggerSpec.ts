import { Trigger } from "../../lib/Trigger";
import { ChainTrigger } from "../../lib/ChainTrigger";

describe("ChainTriggerの正常系テスト", () => {
	it("初期化", () => {
		const trigger = new Trigger();
		const filterOwner = {};
		const filter = () => true;
		const chainTrigger = new ChainTrigger(trigger, filter, filterOwner);

		expect(chainTrigger.chain).toBe(trigger);
		expect(chainTrigger.filterOwner).toBe(filterOwner);
		expect(chainTrigger.filter).toBe(filter);
	});

	it("fire()できる", () => {
		const trigger = new Trigger<boolean>();

		const filter = (e: boolean) => e;
		const filterOwner = {};
		const chainTrigger = new ChainTrigger<boolean>(trigger, filter, filterOwner);
		let counter = 0;
		const handler = (param: boolean) => { counter++; };
		chainTrigger.add(handler);

		trigger.fire(false);
		expect(counter).toBe(0);
		trigger.fire(true);
		expect(counter).toBe(1);
		trigger.fire(false);
		expect(counter).toBe(1);
		trigger.fire(true);
		expect(counter).toBe(2);
		trigger.fire(true);
		expect(counter).toBe(3);
	});

	it("addOnce()できる", () => {
		const trigger = new Trigger<void>();

		const filter = () => true;
		const filterOwner = {};
		const chainTrigger = new ChainTrigger<void>(trigger, filter, filterOwner);
		let counter = 0;
		const handler = () => counter++;
		chainTrigger.addOnce(handler);

		trigger.fire();
		expect(counter).toBe(1);

		trigger.fire();
		expect(counter).toBe(1);
	});

	it("filter内のthisが正常に解決されている", () => {
		const trigger = new Trigger<void>();
		let that: any;

		const handler = () => {};
		// thisを束縛しないためにfunction構文を利用
		const filter = function() {
			that = this;
			return true;
		};
		const filterOwner = {};
		const chainTrigger = new ChainTrigger<void>(trigger, filter, filterOwner);
		chainTrigger.add(handler);

		trigger.fire();
		expect(that).toBe(filterOwner);
	});

	it("remove()できる", () => {
		const trigger = new Trigger<void>();
		const chainTrigger = new ChainTrigger<void>(trigger);
		let result = "";
		const handler1 = () => { result += "1"; };
		const handler2 = () => { result += "2"; };
		expect(trigger.length).toBe(0);
		chainTrigger.add(handler1);
		expect(trigger.length).toBe(1);
		chainTrigger.add(handler2);
		expect(trigger.length).toBe(1);

		trigger.fire();
		expect(result).toBe("12");

		chainTrigger.remove({ func: handler1 });
		expect(trigger.length).toBe(1);

		trigger.fire();
		expect(result).toBe("122");

		chainTrigger.remove(handler2);
		expect(trigger.length).toBe(0);
	});

	it("removeAll()できる", () => {
		const trigger = new Trigger<void>();
		const chainTrigger = new ChainTrigger<void>(trigger);
		let result = "";
		const handler1 = () => { result += "1"; };
		const handler2 = () => { result += "2"; };
		expect(trigger.length).toBe(0);
		chainTrigger.add(handler1);
		expect(trigger.length).toBe(1);
		chainTrigger.add(handler2);
		expect(trigger.length).toBe(1);

		trigger.fire();
		expect(result).toBe("12");

		chainTrigger.removeAll({ func: handler1 });
		expect(trigger.length).toBe(1);

		trigger.fire();
		expect(result).toBe("122");

		chainTrigger.removeAll({ func: handler2 });
		expect(trigger.length).toBe(0);
	});

	it("destroy()できる", () => {
		const trigger = new Trigger<void>();

		let counter = 0;
		const handler = () => {
			counter++;
		};
		const filter = () => true;
		const filterOwner = {};
		const chainTrigger = new ChainTrigger<void>(trigger, filter, filterOwner);

		chainTrigger.add(handler);
		expect(chainTrigger.contains(handler)).toBe(true);
		expect(chainTrigger.destroyed()).toBe(false);
		expect(counter).toBe(0);

		trigger.fire();
		expect(counter).toBe(1);

		chainTrigger.destroy();
		expect(chainTrigger.destroyed()).toBe(true);

		trigger.fire();
		expect(counter).toBe(1);
	});
});
