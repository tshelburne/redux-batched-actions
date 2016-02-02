export const BATCH = 'BATCHING_REDUCER.BATCH';

export function batchActions(actions) {
	return {type: BATCH, payload: actions}
}

export function enableBatching(reduce) {
	return function batchingReducer(state, action) {
		switch (action.type) {
			case BATCH:
				return action.payload.reduce(batchingReducer, state);
			default:
				return reduce(state, action);
		}
	}
}
