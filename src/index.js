export const BATCH = 'BATCHING_REDUCER.BATCH';

export function batchActions(actions, type) {
	let typeName = BATCH;
	if(type !== undefined){
		typeName = type;
	}

	return {type: typeName, meta: { batch: true }, payload: actions}
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
