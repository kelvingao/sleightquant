# views.py

# aiohttp imports
from aiohttp import web

# ib_insync imports
from ib_insync import IB, util
from ib_insync.contract import *

import datetime, time
from datetime import timezone, timedelta

class History:

    def __init__(self, host, port, clientId):

        self.ib = IB()
        self.ib.connect(host, port, clientId)
    
    async def get_history_bars(self, request: web.Request) -> web.json_response:
        
        # symbol = request.rel_url.query['symbol']
        # resolution = request.rel_url.query['resolution']

        # ts_from =  request.rel_url.query['from']
        # ts_to = request.rel_url.query['to']

        """
        barSizeSetting: Time period of one bar. Must be one of:
                '1 secs', '5 secs', '10 secs' 15 secs', '30 secs',
                '1 min', '2 mins', '3 mins', '5 mins', '10 mins', '15 mins',
                '20 mins', '30 mins',
                '1 hour', '2 hours', '3 hours', '4 hours', '8 hours',
                '1 day', '1 week', '1 month'.
        """

        # endDateTime = datetime.datetime.fromtimestamp(ts_to)

        resp = {}

        contract = Future('NG', '201904', 'NYMEX')
        if( contract and self.ib.qualifyContracts(contract)):
            bars = self.ib.reqHistoricalData(
                contract,
                datetime.datetime(2019,3,9),
                durationStr = '150 D',
                barSizeSetting = '1 day',
                whatToShow = 'TRADES',
                useRTH = False,
                formatDate = 1
            )

            t = []
            c = []
            o = []
            h = []
            l = []
            v = []

            for b in bars:
                t.append(b.date.strftime('%s')) # trading view uses timestamp.
                c.append(b.close)
                o.append(b.open)
                h.append(b.high)
                l.append(b.low)
                v.append(b.volume)

            resp['s'] = 'ok'
            resp['t'] = t
            resp['c'] = c
            resp['o'] = o
            resp['h'] = h
            resp['l'] = l
            resp['v'] = v


        return web.json_response(resp)

    async def get_symbols(self, request: web.Request) -> web.json_response:

        resp = {
            "currency_code": "USD", 
            "data_status": "", 
            "description": "Natural Gas Futures", 
            "exchange": "NYMEX", 
            "expiration_date": "", 
            "expired": "", 
            "force_session_rebuild": "", 
            "fractional": False, 
            "has_daily": True, 
            "has_empty_bars": True, 
            "has_intraday": True, 
            "has_no_volume": False, 
            "has_seconds": False, 
            "has_weekly_and_monthly": False, 
            "industry": "", 
            "intraday_multipliers": [""], 
            "listed_exchange": "", 
            "minmov": 1, 
            "minmove2": 0, 
            "name": "NG", 
            "pricescale": 1000, 
            "pointvalue": 10000,
            "seconds_multipliers": "", 
            "sector": "", 
            "session": "1800-1700", 
            "supported_resolutions": [ 
                "D"
            ], 
            "ticker": "NG", 
            "timezone": "America/New_York", 
            "type": "futures", 
            "volume_precision": ""
        }

        return web.json_response(resp)

    async def get_config(self, request: web.Request) -> web.json_response:
        
        resp = { 
            "supports_search": True,
            "supports_group_request": False,
            "supported_resolutions": [ "D", "2D", "3D", "W", "3W", "M", "6M" ],
            "supports_marks": False,
            "supports_time": True          
        }

        return web.json_response(resp)

    def get_time(self, request: web.Request) -> web.Response:

        dt = self.ib.reqCurrentTime()

        # Fixme: below 2 ways are not correct
        # print(time.mktime(dt.timetuple()))
        # print(dt.strftime('%s'))

        # Convert datetime to timestamp
        return web.Response(body=str(dt.timestamp()))
