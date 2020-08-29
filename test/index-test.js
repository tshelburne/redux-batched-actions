import {batchActions, enableBatching, batchDispatchMiddleware} from '../src';
import sinon from 'sinon';
import chai, {expect} from 'chai';
import sinonChai from 'sinon-chai';
import { createStore, applyMiddleware } from 'redux';
import { createMiddlewareSpy, createReducerSpy } from './redux-spy';

chai.use(sinonChai);

describe('batching actions', function() {

	it('wraps actions in a batch action', function() {
		const action1 = {type: 'ACTION_1'}
		const action2 = {type: 'ACTION_2'}
		expect(batchActions([action1, action2])).to.deep.equal({
			type: 'BATCHING_REDUCER.BATCH',
			meta: { batch: true },
			payload: [action1, action2]
		})
	})

	it('uses a custom type, if provided', function() {
		const action1 = {type: 'ACTION_1'}
		const action2 = {type: 'ACTION_2'}
		expect(batchActions([action1, action2], 'CUSTOM_ACTION')).to.deep.equal({
			type: 'CUSTOM_ACTION',
			meta: { batch: true },
			payload: [action1, action2]
		})
	})

})

describe('enabling batching', function() {
	const action1 = {type: 'ACTION_1'}
	const action2 = {type: 'ACTION_2'}
	const reducer = sinon.stub()
	reducer.withArgs(0, action1).returns(1)
	reducer.withArgs(1, action2).returns(2)
	reducer.withArgs(2, action2).returns(5)
	const batchedReducer = enableBatching(reducer)

	it('passes actions through that are not batched', function() {
		expect(batchedReducer(0, action1)).to.equal(1)
		expect(reducer).to.have.been.calledWithExactly(0, action1)
	})

	it('passes actions through that are batched', function() {
		expect(batchedReducer(0, batchActions([action1, action2]))).to.equal(2)
		expect(reducer).to.have.been.calledWithExactly(0, action1)
		expect(reducer).to.have.been.calledWithExactly(1, action2)
	})

	it('handles nested batched actions', function() {
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

describe('batch middleware by itself', function() {
	const action1 = {type: 'ACTION_1'}
	const action2 = {type: 'ACTION_2'}
	const store = function () { return { dispatch: sinon.spy() } }

	it('dispatches all batched actions', function() {
		const s = store()
		const next = sinon.stub()
		const batchAction = batchActions([action1, action2])
		batchDispatchMiddleware(s)(next)(batchAction)

		expect(s.dispatch).to.have.been.calledWithMatch(sinon.match(action1))
		expect(s.dispatch).to.have.been.calledWithMatch(sinon.match(action2))
		expect(s.dispatch).to.have.been.calledTwice
	})

	it('calls next only once, on the batchedAction', function() {
		const s = store()
		const next = sinon.spy()
		const batchAction = batchActions([action1, action2])
		batchDispatchMiddleware(s)(next)(batchAction)

		expect(next).to.have.been.calledWithExactly(batchAction)
		expect(next).to.have.callCount(1)
	})

	it('handles nested batched actions', function() {
		const batchedAction = batchActions([
		  batchActions([action1, action2]),
		  action2
		])
		const s = store()
		const next = sinon.stub()
		batchDispatchMiddleware(s)(next)(batchedAction)

		expect(s.dispatch).to.have.been.calledThrice
		expect(s.dispatch).to.have.been.calledWithMatch(sinon.match(action1))
		expect(s.dispatch).to.have.been.calledWithMatch(sinon.match(action2))
	})

	it('calls next but not dispatch for non-batched actions', function() {
		const s = store()
		const next = sinon.spy()
		batchDispatchMiddleware(s)(next)(action1)

		expect(next).to.have.been.calledWithMatch(sinon.match(action1))
		expect(s.dispatch).to.not.have.been.called
	})
})

describe('batch middleware applied in a real redux store', function () {
	const action1 = { type: 'ACTION_1' }
	const action2 = { type: 'ACTION_2' }

	const initialState = null;
	const doNothingReducer = (state, action) => state
	
	it('sends only the batched action to the reducer', function () {
		const { reducer, reducerOnRecieveActionSpy } = createReducerSpy()
		const store = createStore(reducer, initialState, applyMiddleware(batchDispatchMiddleware))
		const batchedAction = batchActions([action1, action2])

		store.dispatch(batchedAction)

		expect(reducerOnRecieveActionSpy).to.have.been.calledWithExactly(batchedAction)
		expect(reducerOnRecieveActionSpy).to.have.been.calledOnce
	})

	it('sends only the batched action to the reducer, even with nested actions', function () {
		const { reducer, reducerOnRecieveActionSpy } = createReducerSpy()
		const store = createStore(reducer, initialState, applyMiddleware(batchDispatchMiddleware))
		const batchedAction = batchActions([
			batchActions([action1, action2]),
			action2
		])

		store.dispatch(batchedAction)

		expect(reducerOnRecieveActionSpy).to.have.been.calledWithExactly(batchedAction)
		expect(reducerOnRecieveActionSpy).to.have.been.calledOnce
	})

	it('sends non-batched action to reducer', function () {
		const { reducer, reducerOnRecieveActionSpy } = createReducerSpy()
		const store = createStore(reducer, initialState, applyMiddleware(batchDispatchMiddleware))

		store.dispatch(action1)

		expect(reducerOnRecieveActionSpy).to.have.been.calledWithExactly(action1)
		expect(reducerOnRecieveActionSpy).to.have.been.calledOnce
	})

	it('sends every bundled action to previous middlewares', function () {
		const { middleware, middlewareOnRecieveActionSpy } = createMiddlewareSpy()
		const store = createStore(doNothingReducer, initialState, applyMiddleware(middleware, batchDispatchMiddleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithExactly(batchAction)
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithMatch(sinon.match(action1))
		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithMatch(sinon.match(action2))
		expect(middlewareOnRecieveActionSpy).to.have.callCount(3)
	})

	it('only sends the batch action (not bundled actions) to subsequent middlewares', function () {
		const { middleware, middlewareOnRecieveActionSpy } = createMiddlewareSpy()

		const store = createStore(doNothingReducer, initialState, applyMiddleware(batchDispatchMiddleware, middleware))
		const batchAction = batchActions([action1, action2])

		store.dispatch(batchAction)

		expect(middlewareOnRecieveActionSpy).to.have.been.calledWithExactly(batchAction)
		expect(middlewareOnRecieveActionSpy).to.have.been.calledOnce
	})
})

describe('full middleware usage with enableBatching', function () {
	const action1 = { type: 'ACTION_1' }
	const action2 = { type: 'ACTION_2' }

	let reduceAction, store;
	beforeEach(function() {
		const { reducer, reducerOnRecieveActionSpy } = createReducerSpy()
		reduceAction = reducerOnRecieveActionSpy
		store = createStore(enableBatching(reducer), null, applyMiddleware(batchDispatchMiddleware))
	})

	it('reduces each bundled action', function () {
		const batchedAction = batchActions([action1, action2])

		store.dispatch(batchedAction)

		expect(reduceAction).to.have.been.calledWithExactly(action1)
		expect(reduceAction).to.have.been.calledWithExactly(action2)
		expect(reduceAction).to.have.been.calledTwice
	})

	it('passes through non-batched actions', function () {
		store.dispatch(action1)

		expect(reduceAction).to.have.been.calledWithExactly(action1)
		expect(reduceAction).to.have.been.calledOnce
	})
})