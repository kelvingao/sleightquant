# views.py

from aiohttp import web

class History:

    def get_config(self, request: web.Request) -> web.Response:
        return web.Response(text="Got config!")
