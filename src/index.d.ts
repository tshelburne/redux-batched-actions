import * as Redux from 'redux';

export declare type BatchActionType = 'BATCHING_REDUCER.BATCH';
export declare const BATCH: BatchActionType;

export interface BatchAction {
  type: BatchActionType;
  payload: Redux.Action[];
}

export declare function batchActions(actions: Redux.Action[]): BatchAction;

export declare function enableBatching<S>(reduce: Redux.Reducer<S>): Redux.Reducer<S>;
