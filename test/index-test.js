import { batchActions, enableBatching, batchDispatchMiddleware } from '../src';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { createStore, applyMiddleware, createMiddlewareSpy, createReducerSpy } from './redux-spy';
chai.use(sinonChai);

describe('batching actions', function () {

	it('wraps actions in a batch action', function () {
		const action1 = { type: 'ACTION_1' }
		const action2 = { type: 'ACTION_2' }
		expect(batchActions([action1, action2])).to.deep.equal({
			type: 'BATCHING_REDUCER.BATCH',
			meta: { batch: true },
			payload: [action1, action2]
		})
	})

	it('uses a custom type, if provided', function () {
		const action1 = { type: 'ACTION_1' }
		const action2 = { type: 'ACTION_2' }
		expect(batchActions([action1, action2], 'CUSTOM_ACTION')).to.deep.equal({
			type: 'CUSTOM_ACTION',
			meta: { batch: true },
			payload: [action1, action2]
		})
	})

})

describe('enabling batching', function () {
	const action1 = { type: 'ACTION_1' }
	const action2 = { type: 'ACTION_2' }
	const reducer = sinon.stub()
	reducer.withArgs(0, action1).returns(1)
	reducer.withArgs(1, action2).returns(2)
	reducer.withArgs(2, action2).returns(5)
	const batchedReducer = enableBatching(reducer)

	it('passes actions through that are not batched', function () {
		expect(batchedReducer(0, action1)).to.equal(1)
		expect(reducer).to.have.been.calledWithExactly(0, action1)
	})

	it('passes actions through that are batched', function () {
		expect(batchedReducer(0, batchActions([action1, action2]))).to.equal(2)
		expect(reducer).to.have.been.calledWithExactly(0, action1)
		expect(reducer).to.have.been.calledWithExactly(1, action2)
	})

	it('handles nested batched actions', function () {
		const batchedAction = batchActions([
			batchActions([action1, action2]),
			action2
		])
		expect(batchedReducer(0, batchedAction)).to.equal(5)
		expect(reducer).to.have.been.calledWithExactly(0, action1)
		expect(reducer).to.have.been.calledWithExactly(1, action2)
		expect(reducer).to.have.been.calledWithExactly(2, action2)
	})

})

describe('dispatching middleware', function () {
	const action1 = { type: 'ACTION_1' }
	const action2 = { type: 'ACTION_2' }

	const initialState = null;
	const doNothingReducer = (state, action) => state

	it('dispatches batched actions', function () {
		const store = createStore(doNothingReducer, initialState, applyMiddleware(batchDispatchMiddleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(store.dispatch).to.have.callCount(3)
		expect(store.dispatch).to.have.been.calledWithExactly(batchAction)
		expect(store.dispatch).to.have.been.calledWithMatch(sinon.match(action1))
		expect(store.dispatch).to.have.been.calledWithMatch(sinon.match(action2))
	})

	it('handles nested batched actions', function () {
		const store = createStore(doNothingReducer, initialState, applyMiddleware(batchDispatchMiddleware))

		const batchedAction = batchActions([
			batchActions([action1, action2]),
			action2
		])

		store.dispatch(batchedAction)

		expect(store.dispatch).to.have.callCount(4)
		expect(store.dispatch).to.have.been.calledWithExactly(batchedAction)
		expect(store.dispatch).to.have.been.calledWithMatch(sinon.match(action1))
		expect(store.dispatch).to.have.been.calledWithMatch(sinon.match(action2))
	})

	it('passes through non-batched actions without extra dispatches', function () {
		const store = createStore(doNothingReducer, initialState, applyMiddleware(batchDispatchMiddleware))

		store.dispatch(action1)

		expect(store.dispatch).to.have.callCount(1)
		expect(store.dispatch).to.have.been.calledWithExactly(action1)
	})

	it('sends every batched action to previous middlewares', function () {
		const { middleware, middlewareOnRecieveActionSpy } = createMiddlewareSpy()
		const store = createStore(doNothingReducer, initialState, applyMiddleware(middleware, batchDispatchMiddleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(middlewareOnRecieveActionSpy).to.have.callCount(3)
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithExactly(batchAction)
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithMatch(sinon.match(action1))
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithMatch(sinon.match(action2))
	})

	it('sends only the batched action to the reducer', function () {
		const { reducer, reducerOnRecieveActionSpy } = createReducerSpy()
		const store = createStore(reducer, initialState, applyMiddleware(batchDispatchMiddleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(reducerOnRecieveActionSpy).to.have.been.calledWithExactly(batchAction)
		expect(reducerOnRecieveActionSpy).to.have.callCount(1)
	})

	it('does not send any batched actions to subsequent middlewares', function () {
		const { middleware, middlewareOnRecieveActionSpy } = createMiddlewareSpy()

		const store = createStore(doNothingReducer, initialState, applyMiddleware(batchDispatchMiddleware, middleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(middlewareOnRecieveActionSpy).to.have.callCount(1)
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithExactly(batchAction)
	})
})
