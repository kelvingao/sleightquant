<template>
    <div id="tv_chart_container">
    </div>
</template>

<script>
// import { widget } from '../../public/static/charting_library/charting_library.min'

function getParameterByName(name) {
    name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export default {
    name: 'TVBrokerSample',
    data() {
        return {
            datafeed: null,
            widget: null,
            widgetOption: {},
            brokers: null
        }
    },

    created() {
        // TradingView.onready(()=>{})
        this.datafeed = new window.Datafeeds.UDFCompatibleDatafeed("https://demo_feed.tradingview.com");
        
        this.widgetOption = {
                fullscreen: true,
                symbol: 'AAPL',
                interval: 'D',
                container_id: "tv_chart_container",
                //	BEWARE: no trailing slash is expected in feed URL
                datafeed: this.datafeed,
                library_path: "/static/charting_library/",
                locale: getParameterByName('lang') || "zh",
                //	Regression Trend-related functionality is not implemented yet, so it's hidden for a while
                drawings_access: { type: 'black', tools: [ { name: "Regression Trend" } ] },
                disabled_features: ["use_localstorage_for_settings"],
                enabled_features: ["study_templates", 'dome_widget'],
                charts_storage_url: 'https://saveload.tradingview.com',
                charts_storage_api_version: "1.1",
                client_id: 'trading_platform_demo',
                user_id: 'public_user',

                widgetbar: {
                    details: true,
                    news: true,
                    watchlist: true,
                    watchlist_settings: {
                        default_symbols: ["MSFT", "IBM", "AAPL"]
                    }
                },

                rss_news_feed: {
                    "default": [ {
                        url: "https://demo_feed.tradingview.com/news?symbol={SYMBOL}",
                        name: "Yahoo Finance"
                    } ]
                },

                brokerFactory: (host) => { return new window.Brokers.BrokerSample(host, this.datafeed); },
					brokerConfig: {
						configFlags: {
							supportBottomWidget: true,
							supportReversePosition: true,
							supportClosePosition: true,
							supportPLUpdate: true,
							supportLevel2Data: false,
							showQuantityInsteadOfAmount: true,
							supportEditAmount: false,
						},
						durations: [{ name: 'DAY', value: 'DAY' }, { name: 'GTC', value: 'GTC' }]
					}

        };

    },

    mounted() {
        this.widget = window.tvWidget = new window.TradingView.widget(this.widgetOption)
        window.TradingView.onready(()=>{})
        

    }
}

</script>

<style>
</style>
