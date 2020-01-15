import { TriggerLike } from "./TriggerLike";

/**
 * 他のTriggerLikeに反応して発火するイベント通知機構。
 */
export interface ChainTriggerLike<T> extends TriggerLike<T> {
	/**
	 * fireするきっかけとなる TriggerLike
	 */
	chain: TriggerLike<T>;

	filter?: (args?: T) => boolean | undefined;
	filterOwner: any;
}
