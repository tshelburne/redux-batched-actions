export const BATCH = 'BATCHING_REDUCER.BATCH';

export function batchActions(actions, type = BATCH) {
	return {type, meta: { batch: true }, payload: actions}
}

export function enableBatching(reduce) {
	return function batchingReducer(state, action) {
		if (action && action.meta && action.meta.batch) {
			return action.payload.reduce(batchingReducer, state);
		}
		return reduce(state, action);
	}
}
