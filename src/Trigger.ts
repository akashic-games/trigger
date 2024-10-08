import { isPromise } from "./isPromise.js";
import type {
	HandlerFunction,
	TriggerHandler,
	TriggerAddParameters,
	TriggerRemoveConditions,
	TriggerSearchConditions,
	TriggerLike
} from "./TriggerLike.js";

/**
 * イベント通知機構クラス。
 */
export class Trigger<T = void> implements TriggerLike<T> {
	/**
	 * 登録されているイベントハンドラの数。
	 */
	length: number;

	/**
	 * 登録されたすべてのハンドラ。
	 * @private
	 */
	_handlers: TriggerHandler<T>[];

	constructor() {
		this._handlers = [];
		this.length = 0;
	}

	/**
	 * このTriggerにハンドラを追加する。
	 * @param func ハンドラの関数
	 * @param owner ハンドラのオーナー。 `func` を呼び出す時に `this` として用いられる値
	 */
	add(func: HandlerFunction<T>, owner?: unknown): void;
	/**
	 * このTriggerにハンドラを追加する。
	 * @param params 登録するハンドラの情報
	 */
	add(params: TriggerAddParameters<T>): void;
	add(paramsOrFunc: any, owner?: unknown): void {
		if (typeof paramsOrFunc === "function") {
			this._addHandler({
				func: paramsOrFunc as HandlerFunction<T>,
				owner,
				once: false,
				name: undefined,
				filter: undefined,
			});
		} else {
			const params = paramsOrFunc as TriggerAddParameters<T>;
			const index = typeof params.index === "number" ? params.index : undefined;
			this._addHandler({
				func: params.func,
				owner: params.owner,
				once: false,
				name: params.name,
				filter: params.filter,
			}, index);
		}

		this.length = this._handlers.length;
	}

	/**
	 * このTriggerにハンドラを追加する。
	 * 本メソッドにより追加されたハンドラは実行後に破棄される。
	 * @param func ハンドラの関数
	 * @param owner ハンドラのオーナー。 `func` を呼び出す時に `this` として用いられる値
	 */
	addOnce(func: HandlerFunction<T>, owner?: unknown): void;
	/**
	 * このTriggerにハンドラを追加する。
	 * 本メソッドにより追加されたハンドラは実行後に破棄される。
	 * @param params 登録するハンドラの情報
	 */
	addOnce(params: TriggerAddParameters<T>): void;
	addOnce(paramsOrFunc: any, owner?: unknown): void {
		if (typeof paramsOrFunc === "function") {
			this._addHandler({
				func: paramsOrFunc as HandlerFunction<T>,
				owner,
				once: true,
				name: undefined,
				filter: undefined,
			});
		} else {
			const params = paramsOrFunc as TriggerAddParameters<T>;
			const index = typeof params.index === "number" ? params.index : undefined;
			this._addHandler({
				func: params.func,
				owner: params.owner,
				once: true,
				name: params.name,
				filter: params.filter
			}, index);
		}

		this.length = this._handlers.length;
	}

	/**
	 * このTriggerにハンドラを追加する。
	 * @deprecated 互換性のために残されている。代わりに `add()` を利用すべきである。
	 */
	handle(owner: any, func?: HandlerFunction<T>, name?: string): void {
		this.add(func ? { owner, func, name } : { func: owner });
	}

	/**
	 * このTriggerを発火する。
	 *
	 * 登録された全ハンドラの関数を、引数 `arg` を与えて呼び出す。
	 * 呼び出し後、次のいずれかの条件を満たす全ハンドラの登録は解除される。
	 * * ハンドラが `addOnce()` で登録されていた場合
	 * * ハンドラが `add()` で登録される際に `once: true` オプションが与えられていた場合
	 * * ハンドラが Promise 以外の truthy な値を返した場合
	 *
	 * @param arg ハンドラに与えられる引数
	 */
	fire(arg: T): void {
		if (! this._handlers || ! this._handlers.length)
			return;

		const handlers = this._handlers.concat();
		for (let i = 0; i < handlers.length; i++) {
			const handler = handlers[i];
			if (handler.filter && !handler.filter(handler)) continue;
			const ret = handler.func.call<unknown, [T], void | boolean | Promise<unknown>>(handler.owner, arg);
			const returnedTruthy = !isPromise(ret) && !!ret;
			if (returnedTruthy || handler.once) {
				if (!this._handlers)
					continue;
				const index = this._handlers.indexOf(handler);
				if (index !== -1)
					this._handlers.splice(index, 1);
			}
		}

		if (this._handlers != null) this.length = this._handlers.length;
	}

	/**
	 * 指定した条件に一致したハンドラが登録されているかを返す。
	 * 指定されなかった条件は、条件として無視される(登録時の値に関わらず一致するとみなされる)。
	 *
	 * @param func 条件として用いるハンドラの関数
	 * @param owner 条件として用いるハンドラのオーナー
	 */
	contains(func: HandlerFunction<T> | null, owner?: unknown): boolean;
	/**
	 * 指定した条件に一致したハンドラが登録されているかを返す。
	 * 指定されなかった条件は、条件として無視される(登録時の値に関わらず一致するとみなされる)。
	 *
	 * @param params 検索の条件
	 */
	contains(params: TriggerSearchConditions<T>): boolean;
	contains(paramsOrFunc: any, owner?: unknown): boolean {
		const condition = typeof paramsOrFunc === "function" ? { func: paramsOrFunc, owner } : paramsOrFunc;

		for (let i = 0; i < this._handlers.length; i++) {
			if (this._comparePartial(condition, this._handlers[i])) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 関数が `func` であり、かつオーナーが `owner` であるハンドラを削除する。
	 * 同じ組み合わせで複数登録されている場合、index が最も小さいハンドラのみ削除する。
	 *
	 * @param func 削除条件として用いるハンドラの関数
	 * @param owner 削除条件として用いるハンドラのオーナー。省略した場合、 `undefined`
	 */
	remove(func: HandlerFunction<T>, owner?: unknown): void;
	/**
	 * 指定した条件に完全一致するハンドラを削除する。
	 * 同じ組み合わせで複数登録されている場合、index が最も小さいハンドラのみ削除する。
	 *
	 * @param params 削除するハンドラの条件
	 */
	remove(params: TriggerRemoveConditions<T>): void;
	remove(paramsOrFunc: any, owner?: unknown): void {
		const condition: TriggerRemoveConditions<T> = typeof paramsOrFunc === "function" ? { func: paramsOrFunc, owner } : paramsOrFunc;
		for (let i = 0; i < this._handlers.length; i++) {
			const handler = this._handlers[i];
			if (
				condition.func === handler.func &&
				condition.owner === handler.owner &&
				condition.name === handler.name &&
				condition.filter === handler.filter
			) {
				this._handlers.splice(i, 1);
				--this.length;
				return;
			}
		}
	}

	/**
	 * 指定した条件に部分一致するイベントハンドラを削除する。
	 *
	 * 本メソッドは引数に与えた条件に一致したイベントハンドラを全て削除する。
	 * 引数の条件を一部省略した場合、その値の内容が登録時と異なっていても対象のイベントハンドラは削除される。
	 * 引数に与えた条件と完全に一致したイベントハンドラのみを削除したい場合は `this.remove()` を用いる。
	 * 引数を省略した場合は全てのイベントハンドラを削除する。
	 *
	 * @param params 削除するイベントハンドラの条件
	 */
	removeAll(params?: TriggerRemoveConditions<T>): void {
		const handlers: TriggerHandler<T>[] = [];

		if (params) {
			for (let i = 0; i < this._handlers.length; i++) {
				const handler = this._handlers[i];
				if (! this._comparePartial(params, handler)) {
					handlers.push(handler);
				}
			}
		}

		this._handlers = handlers;
		this.length = this._handlers.length;
	}

	/**
	 * このTriggerを破棄する。
	 */
	destroy(): void {
		this._handlers = null!;
		this.length = null!;
	}

	/**
	 * このTriggerが破棄されているかを返す。
	 */
	destroyed(): boolean {
		return this._handlers === null;
	}

	/**
	 * @private
	 */
	_addHandler(params: TriggerHandler<T>, index?: number): void {
		if (index == null) {
			this._handlers.push({
				func: params.func,
				owner: params.owner,
				once: params.once,
				name: params.name,
				filter: params.filter,
			});
		} else {
			this._handlers.splice(index, 0, {
				func: params.func,
				owner: params.owner,
				once: params.once,
				name: params.name,
				filter: params.filter,
			});
		}
	}

	/**
	 * @private
	 */
	_comparePartial(target: TriggerSearchConditions<T>, compare: TriggerSearchConditions<T>): boolean {
		if (target.func !== undefined && target.func !== compare.func)
			return false;
		if (target.owner !== undefined && target.owner !== compare.owner)
			return false;
		if (target.name !== undefined && target.name !== compare.name)
			return false;
		if (target.filter !== undefined && target.filter !== compare.filter)
			return false;

		return true;
	}
}
