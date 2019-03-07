# app.py

# aiohttp imports
from aiohttp import web
import aiohttp_cors

# ib_insync imports
import asyncio
from ib_insync import util
util.patchAsyncio()

# sleight imports
from views import History

# logging import and setup
import logging

log_format = '%(asctime)s %(levelname)-5.5s [%(name)s-%(funcName)s:%(lineno)d][%(threadName)s] %(message)s'
logging.basicConfig(format=log_format, level=logging.INFO)

log = logging.getLogger(__name__)

async def init_app() -> web.Application:
    # instantiate a web app
    app = web.Application()
    
    # instantiate a view
    history = History("127.0.0.1", 4002, clientId = 2)
    
    # set up routes
    add_route = app.router.add_route
    add_route("GET", "/symbols", history.get_symbols)
    add_route("GET", "/history", history.get_history_bars)
    add_route("GET", "/config", history.get_config)
    add_route("GET", "/time", history.get_time)
    
    # configure default CORS settings
    cors = aiohttp_cors.setup(app, defaults = {
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials = True,
            expose_headers = "*",
            allow_headers = "*",
        )
    })

    # configure CORS on all routes
    for route in list(app.router.routes()):
        cors.add(route)

    return app

if __name__ == '__main__':

    app = init_app()

    web.run_app(app, port=5000)
    asyncio.get_event_loop().run_forever()
