import type { TriggerLike } from "./TriggerLike";

export type ChainTriggerFilterFunction<T> = ((args: T) => void | boolean | undefined);

/**
 * 他のTriggerLikeに反応して発火するイベント通知機構。
 */
export interface ChainTriggerLike<T> extends TriggerLike<T> {
	/**
	 * fireするきっかけとなる TriggerLike
	 */
	chain: TriggerLike<T>;

	filter: ChainTriggerFilterFunction<T> | null;
	filterOwner: any;
}
