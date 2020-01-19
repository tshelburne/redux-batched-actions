export const BATCH = 'BATCHING_REDUCER.BATCH';

function combineBatchedActionTypes(actions) {
	return `${BATCH}: ${actions
		.map(({ type }) => type)
		.join(" & ")}`
}


export function batchActions(actions, type = combineBatchedActionTypes(actions)) {
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

export function batchDispatchMiddleware(store) {
	function dispatchChildActions(store, action) {
		if(action.meta && action.meta.batch) {
			action.payload.forEach(function(childAction) {
				dispatchChildActions(store, childAction)
			})
		} else {
			store.dispatch(action)
		}
	}

	return function(next) {
		return function(action) {
			if (action && action.meta && action.meta.batch) {
				dispatchChildActions(store, action)
			}
			return next(action)
		}
	}
}
