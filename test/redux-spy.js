import sinon from 'sinon';

const defaultEnhancer = (storeCreator) => storeCreator
export const createStore = (reducer, initialState = undefined, enhancer = defaultEnhancer) => {
    const enhancedCreateStore = enhancer(baseCreateStore)
    return enhancedCreateStore(reducer, initialState);
}

const baseCreateStore = (reducer, initialState = undefined) => {
    let state = initialState;
    const updateStateWithAction = function (action) {
        state = reducer(state, action)
    }

    const store = {
        getState: () => state,
        dispatch: sinon.spy(updateStateWithAction)
    }

    return store;
}

export const applyMiddleware = (...middlewares) => {
    const storeEnhancer = (storeCreator) => {
        const enhancedStoreCreator = (reducer, initialState = undefined) => {
            const store = storeCreator(reducer, initialState);
            const oldDispatch = store.dispatch;
            const passActionThroughMiddlewaresToDispatch = middlewares.reverse().reduce(
                (next, middleware) => middleware(store)(next),
                oldDispatch
            );
            store.dispatch = sinon.spy(passActionThroughMiddlewaresToDispatch)
            return store;
        }
        return enhancedStoreCreator;
    }
    return storeEnhancer;
}

export const createMiddlewareSpy = () => {
    const middlewareOnRecieveActionSpy = sinon.spy()
    const middleware = store => next => action => {
        middlewareOnRecieveActionSpy(action)
        next(action)
    }
    return { middleware, middlewareOnRecieveActionSpy }
}

export const createReducerSpy = () => {
    const reducerOnRecieveActionSpy = sinon.spy()
    const reducer = (state, action) => {
        reducerOnRecieveActionSpy(action)
        return state
    }
    return { reducer, reducerOnRecieveActionSpy }
}