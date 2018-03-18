import {batchActions, enableBatching, batchDispatchMiddleware} from '../src';
import sinon from 'sinon';
import chai, {expect} from 'chai';
import sinonChai from 'sinon-chai';
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

describe('dispatching middleware', function() {
	const action1 = {type: 'ACTION_1'}
	const action2 = {type: 'ACTION_2'}
	const store = function () { return { dispatch: sinon.spy() } }

	it('dispatches all batched actions', function() {
		const s = store()
		const next = sinon.stub()
		const batchAction = batchActions([action1, action2])
		batchDispatchMiddleware(s)(next)(batchAction)

		expect(s.dispatch).to.have.been.calledWithExactly(action1)
		expect(s.dispatch).to.have.been.calledWithExactly(action2)
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
		expect(s.dispatch).to.have.been.calledWithExactly(action1)
		expect(s.dispatch).to.have.been.calledWithExactly(action2)
	})

	it('calls next but not dispatch for non-batched actions', function() {
		const s = store()
		const next = sinon.spy()
		batchDispatchMiddleware(s)(next)(action1)

		expect(next).to.have.been.calledWithExactly(action1)
		expect(s.dispatch).to.not.have.been.called
	})
})
