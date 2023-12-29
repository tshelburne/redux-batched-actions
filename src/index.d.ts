import * as Redux from 'redux';

export declare type BatchActionType = 'BATCHING_REDUCER.BATCH';
export declare const BATCH: BatchActionType;

export interface BatchAction extends Redux.UnknownAction {
  type: BatchActionType;
  payload: Redux.UnknownAction[];
  meta: {
    batch: true
  }
}

export declare function batchActions(actions: Redux.UnknownAction[], type?: string): BatchAction;

export declare function enableBatching<S>(reduce: Redux.Reducer<S>): Redux.Reducer<S>;

export declare const batchDispatchMiddleware: Redux.Middleware;
