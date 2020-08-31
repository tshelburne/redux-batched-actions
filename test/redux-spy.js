import sinon from 'sinon';

export function createMiddlewareSpy() {
    const middlewareOnRecieveActionSpy = sinon.spy()
    const middleware = store => next => action => {
        middlewareOnRecieveActionSpy(action)
        next(action)
    }
    return { middleware, middlewareOnRecieveActionSpy }
}

function isInternalReduxAction(action) {
    return action.type.startsWith('@@');
}

export function createReducerSpy() {
    const reducerOnRecieveActionSpy = sinon.spy()
    const reducer = (state, action) => {
        if (!isInternalReduxAction(action)) {
            reducerOnRecieveActionSpy(action)
        }
        return state
    }
    return { reducer, reducerOnRecieveActionSpy }
}