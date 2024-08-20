import type { ChainTriggerLike, ChainTriggerFilterFunction } from "./ChainTriggerLike.js";
import { Trigger } from "./Trigger.js";
import type { TriggerLike, TriggerRemoveConditions, HandlerFunction, TriggerAddParameters } from "./TriggerLike.js";

/**
 * 他のTriggerLikeに反応して発火するイベント通知機構。
 */
export class ChainTrigger<T> extends Trigger<T> implements ChainTriggerLike<T> {
	/**
	 * fireするきっかけとなる `TriggerLike` 。
	 * この値は参照のためにのみ公開されている。外部から変更してはならない。
	 */
	chain: TriggerLike<T>;

	/**
	 * フィルタ。
	 * `chain` がfireされたときに実行される。この関数が真を返した時のみ、このインスタンスはfireされる。
	 */
	filter: ChainTriggerFilterFunction<T> | null;

	/**
	 * フィルタのオーナー。
	 * `filter` の呼び出し時、 `this` として与えられる。
	 */
	filterOwner: unknown;

	/**
	 * `chain`に実際に`add`されているか否か。
	 * @private
	 */
	_isActivated: boolean;

	/**
	 * `ChainTrigger` のインスタンスを生成する。
	 *
	 * このインスタンスは、 `chain` がfireされたときに `filter` を実行し、真を返した場合に自身をfireする。
	 * @param chain このインスタンスがfireするきっかけとなる TriggerLike
	 * @param filter `chain` がfireされたときに実行される関数。省略された場合、または本関数の戻り値が真の場合、このインスタンスをfireする。
	 * @param filterOwner `filter` 呼び出し時に使われる `this` の値。
	 */
	constructor(chain: TriggerLike<T>, filter?: ChainTriggerFilterFunction<T>, filterOwner?: unknown) {
		super();

		this.chain = chain;
		this.filter = filter != null ? filter : null;
		this.filterOwner = filterOwner;
		this._isActivated = false;
	}

	add(func: HandlerFunction<T>, owner?: unknown): void;
	add(params: TriggerAddParameters<T>): void;
	add(paramsOrHandler: any, owner?: unknown): void {
		super.add(paramsOrHandler, owner);

		if (! this._isActivated) {
			this.chain.add(this._onChainTriggerFired, this);
			this._isActivated = true;
		}
	}

	addOnce(func: HandlerFunction<T>, owner?: unknown): void;
	addOnce(params: TriggerAddParameters<T>): void;
	addOnce(paramsOrHandler: any, owner?: unknown): void {
		super.addOnce(paramsOrHandler, owner);

		if (! this._isActivated) {
			this.chain.add(this._onChainTriggerFired, this);
			this._isActivated = true;
		}
	}

	remove(func: HandlerFunction<T>, owner?: unknown): void;
	remove(params: TriggerRemoveConditions<T>): void;
	remove(paramsOrFunc: any, owner?: unknown): void {
		super.remove(paramsOrFunc, owner);

		if (this.length === 0 && this._isActivated) {
			this.chain.remove(this._onChainTriggerFired, this);
			this._isActivated = false;
		}
	}

	removeAll(params?: TriggerRemoveConditions<T>): void {
		super.removeAll(params);

		if (this.length === 0 && this._isActivated) {
			this.chain.remove(this._onChainTriggerFired, this);
			this._isActivated = false;
		}
	}

	destroy(): void {
		super.destroy();
		this.chain.remove(this._onChainTriggerFired, this);
		this.filter = null;
		this.filterOwner = null;
		this._isActivated = false;
	}

	/**
	 * @private
	 */
	_onChainTriggerFired(args: T): void {
		if (!this.filter || this.filter.call(this.filterOwner, args)) {
			this.fire(args);
		}
	}
}
