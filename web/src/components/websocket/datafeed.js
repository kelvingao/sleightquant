"use strict";
import { logMessage } from './helpers';
import DataSocketProvider from './data-socket-provider';

/**
 * This class implements interaction with WebSocket datafeed.
 */
class Datafeed {
    constructor(datafeedUrl) {

        this._configuration = defaultConfiguration();
        this._symbolInfo = defaultSymbol();
        this._dataProvider = new DataSocketProvider(datafeedUrl);
    }

    onReady(callback) {
        return new Promise((resolve, reject) => {
            let configuration = this._configuration;
            resolve(configuration)
            logMessage("Datafeed: Initialized with " + JSON.stringify(this._configuration));
          }).then(data => callback(data))
    };

    resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
        return new Promise((resolve, reject) => {
            let symbolInfo = this._symbolInfo;
            resolve(symbolInfo)
          }).then(data => onSymbolResolvedCallback(data)).catch(err => onResolveErrorCallback(err))
    }

    searchSymbol(userInput, exchange, symbolType, onResultReadyCallback) {
        return undefined;
    }

    getBars(symbolInfo, resolution, from, to, onHistoryCallBack, onErrorCallback) {
        this._dataProvider.getBars(symbolInfo, resolution, from, to, onHistoryCallBack, onErrorCallback)
    }

    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
        this._dataProvider.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID);
    }

    unsubscribeBars(subscriberUID) {
        this._dataProvider.unsubscribeBars(subscriberUID);
    }

    calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
        return undefined;
    }

    getMarks(symbolInfo, startDate, endDate, onDataCallback, resolution) {
        return undefined;
    }

    getTimescaleMarks(symbolInfo, startDate, endDate, onDataCallback, resolution) {
        return undefined;
    }

    getServerTime(callback) {
        return undefined;
    }

}
export default Datafeed;
function defaultConfiguration() {
    return {
      supports_search: true,
      supports_group_request: false,
      supported_resolutions: ["1","3","5","15","30", "D","2D","3D", "W","3W","M","6M"],
      supports_marks: true,
      supports_timescale_marks: true,
      supports_time: true
    }
};
function defaultSymbol() {
    return {
      name: 'BTCUSDT',
      timezone: 'Asia/Shanghai',
      minmov: 1,
      minmov2: 0,
      pointvalue: 1,
      fractional: false,
      session: '24x7',
      has_intraday: true,
      has_no_volume: false,
      description: 'BTCUSDT',
      pricescale: 1,
      ticker: 'BTCUSDT',
      supported_resolutions: ["1","3","5","15","30","D","2D","3D","W","3W","M","6M"]
    }
  }

