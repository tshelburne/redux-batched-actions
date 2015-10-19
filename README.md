redux-batched-actions
=====================

[![Build Status](https://travis-ci.org/tshelburne/redux-batched-actions.svg)](https://travis-ci.org/tshelburne/redux-batched-actions)

Batching action creator and associated higher order reducer for [redux](https://github.com/gaearon/redux) that enables batching subscriber notifications for an array of actions.

```js
npm install --save redux-batched-actions
```

## Usage

```js
import {createStore} from 'redux';
import {batchActions, enableBatching} from 'redux-batched-actions';
import {createAction} from 'redux-actions';

const doThing = createAction('DO_THING')
const doOther = createAction('DO_OTHER')

const store = createStore(enableBatching(reducer), intialState)

store.dispatch(batchActions([doThing(), doOther()]))
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
		dispatch(loggingIn());

		authenticate(credentials)
			.then(user => {
				dispatch(batchActions([
					setUser(user),
					unsetLoading()
				]))
			})
		})
	}
}
```

In this example, the subscribers would be notified twice: once when the state is loading, and then again once the user has been loaded.

## Thanks

Thanks to [Dan Abramov](https://github.com/gaearon) for help in Redux best practices and original idea.
