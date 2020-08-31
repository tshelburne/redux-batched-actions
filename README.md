redux-batched-actions
=====================

[![Build Status](https://travis-ci.org/tshelburne/redux-batched-actions.svg)](https://travis-ci.org/tshelburne/redux-batched-actions)

Batching action creator and associated higher order reducer for [redux](https://github.com/gaearon/redux) that enables batching subscriber notifications for an array of actions.

```js
npm install --save redux-batched-actions
```

## Usage

```js
import {createStore, applyMiddleware} from 'redux';
import {batchActions, enableBatching, batchDispatchMiddleware} from 'redux-batched-actions';
import {createAction} from 'redux-actions';

const doThing = createAction('DO_THING')
const doOther = createAction('DO_OTHER')

function reducer(state, action) {
	switch (action.type) {
		case 'DO_THING': return 'thing'
		case 'DO_OTHER': return 'other'
		default: return state
	}
}

// Handle bundled actions in reducer
const store = createStore(enableBatching(reducer), initialState)

store.dispatch(batchActions([doThing(), doOther()]))
// OR
store.dispatch(batchActions([doThing(), doOther()], 'DO_BOTH'))

```

## Recipes

### Async

Usage for action creators that return objects is trivial, but it also works well with [thunks](https://github.com/gaearon/redux-thunk) to perform large reductions on multiple asynchronous actions, or actions that rely on external services. For example:

```js
const setLoading = createAction('SET_LOADING')
const setUser = createAction('SET_USER')
const unsetLoading = createAction('UNSET_LOADING')

function login(credentials) {
	return function(dispatch) {
		dispatch(setLoading());

		authenticate(credentials)
			.then(user => {
				dispatch(batchActions([
					setUser(user),
					unsetLoading()
				], 'LOGIN_SUCCESS'))
			})
		})
	}
}
```

In this example, the subscribers would be notified twice: once when the state is loading, and then again once the user has been loaded.

### Middleware integration

You can add a middleware to dispatch each of the bundled actions. This can be used if other middlewares are listening for one of the bundled actions to be dispatched.  
**Note:** Only the middlewares *before* the batch middleware will receive each of the bundled actions. *All* middlewares will receive the batch action.

```js
const store = createStore(
		enableBatching(reducer),
		initialState,
		applyMiddleware(middlewareThatNeedsEachBundledAction, batchDispatchMiddleware, middlewareThatDoesNotNeedEachBundledAction)
)
```

`enableBatching` should still be used on the reducer as the reducer will only receive the batched action, not each bundled action.

## Thanks

Thanks to [Dan Abramov](https://github.com/gaearon) for help in Redux best practices and original idea.
