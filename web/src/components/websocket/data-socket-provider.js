"use strict";
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getErrorMessage, logMessage } from './helpers';

// REFS https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
class DataSocketProvider {
    constructor(datafeedUrl) {
        
        // WebSocket Object
        this._socket = new ReconnectingWebSocket(datafeedUrl);

        // WebSocket events handler
        this._socket.onopen = evt => logMessage('Socket: WebSocket is open now.');
        this._socket.onerror = err => logMessage('Socket: WebSocket error observed.');
        this._socket.onclose = evt => logMessage('Socket: Websocket is closed.');
        this._socket.onmessage = msg => this._onMessageCallback(msg);
        
        // History Data
        this._cacheBars = {};
       
        this._requestsPending = 0;
        this._subscribers = {};
        this._subscribedTopic = null;
    }
    
    _sendRequest(data) {
        if ( this._socket.readyState != WebSocket.OPEN ) {
            logMessage('Socket: WebSocket not open yet.');
            return;
        }

        logMessage('Socket: ' + JSON.stringify(data));
        this._socket.send(JSON.stringify(data));
    }
    
    _onMessageCallback(msg) {
        try {
            const payload = JSON.parse(msg.data);
            // Requested Data
            if (payload.data && payload.data.length) {
                let list = [];
                let topic = payload.id;
                payload.data.forEach( item => {
                  list.push({
                    time: item.id * 1000,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.quote_vol
                  })
                });
                
                this._cacheBars[topic] = list;
                
                // subscribe this topic
                // Note: do not repeat subscribe.
                const that = this;
                (function () {
                    //console.log('socket subscribe: ', topic);
                    that._sendRequest({ cmd: 'sub', args: [topic], });
                })(topic);
                //this._subscribeBars(topic);
            }
            
            // Subscribed Data
            if (payload.type) {
                // console.log(' >> sub:', data.type)
                this._updateData()
                let topic = payload.type;
                const barsData = {
                    time: payload.id * 1000,
                    open: payload.open,
                    high: payload.high,
                    low: payload.low,
                    close: payload.close,
                    volume: payload.quote_vol
                }
                if (this._cacheBars[topic] && this._cacheBars[topic].length) {
                    if ( barsData.time >= this._cacheBars[topic][this._cacheBars[topic].length -1].time )
                    this._cacheBars[topic].push(barsData);
                }
            }
        } catch (err) {
            console.error(' >> Data parsing error:', err)
        }
      
    }

    // https://developer.fcoin.com/zh.html
    getBars(symbolInfo, resolution, from, to, onHistoryCallback) {
        var topic = makeFcoinTopic(symbolInfo, resolution);

        if (this._subscribedTopic && this._subscribedTopic != topic) {
            this._sendRequest({ cmd : 'unsub', args: [this._subscribedTopic]});
        }
        
        if( this._cacheBars[topic] ) {
            const newBars = []
            this._cacheBars[topic].forEach(item => {
                if (item.time >= from * 1000 && item.time <= to * 1000) {
                    newBars.push(item)
                }
            })
            onHistoryCallback(newBars);
            delete this._cacheBars[topic];
        } else {
            let limit = periodsCount(resolution, from, to);
            this._sendRequest({ cmd: 'req', args: [ topic, limit, to], id: topic });
            
            let _this = this;
            setTimeout(function () {
                _this.getBars(symbolInfo, resolution, from, to, onHistoryCallback)
            }, 1000)
        }
    }

    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID) {
        if (this._subscribers.hasOwnProperty(subscriberUID)) {
            logMessage("DataProvider: already has subscriber with id=" + subscriberUID);
            return;
        }
        this._subscribedTopic = makeFcoinTopic(symbolInfo, resolution);
        this._subscribers[subscriberUID] = {
            lastBarTime: null,
            listener: onRealtimeCallback,
            resolution: resolution,
            symbolInfo: symbolInfo,
        };
        logMessage("DataProvider: subscribed for #" + subscriberUID + " - {" + symbolInfo.name + ", " + resolution + "}");
    }

    unsubscribeBars(listenerGuid) {
        delete this._subscribers[listenerGuid];
        logMessage("DataProvider: unsubscribed for #" + listenerGuid);

    };

    _updateData() {
        var _this = this;
        if (this._requestsPending > 0) {
            return;
        }
        this._requestsPending = 0;
        var _loop_1 = function (listenerGuid) {
            this_1._requestsPending += 1;
            this_1._updateDataForSubscriber(listenerGuid)
                .then(function () {
                _this._requestsPending -= 1;
                logMessage("DataProvider: data for #" + listenerGuid + " updated successfully, pending=" + _this._requestsPending);
            })
                .catch(function (reason) {
                _this._requestsPending -= 1;
                logMessage("DataProvider: data for #" + listenerGuid + " updated with error=" + getErrorMessage(reason) + ", pending=" + _this._requestsPending);
            });
        };
        var this_1 = this;
        for (var listenerGuid in this._subscribers) {
            _loop_1(listenerGuid);
        }
    }

    _updateDataForSubscriber(listenerGuid) {
        
        return new Promise((resolve, reject) => {
            var subscriptionRecord = this._subscribers[listenerGuid];
            var rangeEndTime = parseInt((Date.now() / 1000).toString());
            // BEWARE: please note we really need 2 bars, not the only last one
            // see the explanation below. `10` is the `large enough` value to work around holidays
            var rangeStartTime = rangeEndTime - periodLengthSeconds(subscriptionRecord.resolution, 10)
            this.getBars(subscriptionRecord.symbolInfo, subscriptionRecord.resolution, rangeStartTime, rangeEndTime,
              bars => {
                this._onSubscriberDataReceived(listenerGuid, bars)
                resolve()
              },
              () => {
                reject()
              }
            )
          })
        

        //
        //var _this = this;
        //var subscriptionRecord = this._subscribers[listenerGuid];
        //var rangeEndTime = parseInt((Date.now() / 1000).toString());
        
        // var rangeStartTime = rangeEndTime - periodLengthSeconds(subscriptionRecord.resolution, 10);
        // return this.getBars(subscriptionRecord.symbolInfo, subscriptionRecord.resolution, rangeStartTime, rangeEndTime)
        //     .then(function (result) {
        //     _this._onSubscriberDataReceived(listenerGuid, result);
        // });
    }

    _onSubscriberDataReceived(listenerGuid, bars) {
        // means the subscription was cancelled while waiting for data
        if (!this._subscribers.hasOwnProperty(listenerGuid)) {
            logMessage("DataProvider: Data comes for already unsubscribed subscription #" + listenerGuid);
            return;
        }

        if (bars.length === 0) {
            return;
        }

        var lastBar = bars[bars.length - 1];
        var subscriptionRecord = this._subscribers[listenerGuid];
        if (subscriptionRecord.lastBarTime !== null && lastBar.time < subscriptionRecord.lastBarTime) {
            return;
        }
        var isNewBar = subscriptionRecord.lastBarTime !== null && lastBar.time > subscriptionRecord.lastBarTime;
        // Pulse updating may miss some trades data (ie, if pulse period = 10 secods and new bar is started 5 seconds later after the last update, the
        // old bar's last 5 seconds trades will be lost). Thus, at fist we should broadcast old bar updates when it's ready.
        if (isNewBar) {
            if (bars.length < 2) {
                throw new Error('Not enough bars in history for proper pulse update. Need at least 2.');
            }
            var previousBar = bars[bars.length - 2];
            subscriptionRecord.listener(previousBar);
        }
        subscriptionRecord.lastBarTime = lastBar.time;
        subscriptionRecord.listener(lastBar);
    }

}

export default DataSocketProvider;

function periodLengthSeconds(resolution, requiredPeriodsCount) {
    var daysCount = 0;
    if (resolution === 'D' || resolution === '1D') {
        daysCount = requiredPeriodsCount;
    }
    else if (resolution === 'M' || resolution === '1M') {
        daysCount = 31 * requiredPeriodsCount;
    }
    else if (resolution === 'W' || resolution === '1W') {
        daysCount = 7 * requiredPeriodsCount;
    }
    else {
        daysCount = requiredPeriodsCount * parseInt(resolution) / (24 * 60);
    }
    return daysCount * 24 * 60 * 60;
}

function periodsCount(resolution, from, to) {
    let periodSeconds = 0;
    switch(resolution) {
        case 'D':
        case '1D':
            periodSeconds = 24 * 60 * 60;
            break;
        case 'M':
        case '1M':
            periodSeconds = 31 * 24 * 60 * 60;
            break;
        case 'W':
        case '1W':
            periodSeconds = 7 * 24 * 60 * 60;
            break;
        default:
            periodSeconds = parseInt(resolution) * 60;
    }
    return Math.floor((to - from) / periodSeconds);
}

function makeFcoinTopic(symbolInfo, resolution) {
        var subTopic = null;
        switch (resolution) {
            case '1':
                subTopic = `candle.M${resolution}.${symbolInfo.ticker.toLowerCase()}`;
                break;
            case '5':
                subTopic = `candle.M${resolution}.${symbolInfo.ticker.toLowerCase()}`;
                break;
            default:
                return;
        }
        return subTopic;
}