(function() {
  'use strict';

  angular
    .module('App')
    .service('MainService', MainService);

  function MainService(GenericRESTResource, $resource, QUANDL_APIKEY, QUANDL_DATATABLE_URL, dateFilter) {
    var service = {
      getTickerList: getTickerList,
      getTickersHistory: getTickersHistory
    };

    var resources = {
      tickers: $resource("./assets/data/tickers.json", {}, GenericRESTResource),
      tickersHistory: $resource(QUANDL_DATATABLE_URL, {}, GenericRESTResource)
    };

    return service;

    function getTickerList() {
      return resources.tickers.query().$promise
    }

    function getTickersHistory(tickers, fromDate, toDate) {
      var payload = {
        "ticker": _.map(tickers, _.property("ticker")).join(),
        "qopts.columns": "ticker,date,adj_close",
        "date.gte": dateFilter(fromDate, "yyyy-MM-dd"),
        "date.lte": dateFilter(toDate, "yyyy-MM-dd"),
        "api_key": QUANDL_APIKEY
      };

      return resources.tickersHistory.show(payload).$promise
    }
  }
})();
