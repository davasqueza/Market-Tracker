(function() {
  'use strict';

  angular
    .module('App')
    .controller('LandingController', LandingController);

  /** @ngInject */
  function LandingController(MainService, toastr, $log) {
    var vm = this;

    vm.addToCompare = addToCompare;
    vm.selectedTickers = [];

    function loadTickers() {
      MainService.getTickerList()
        .then(function (tickers) {
          vm.tickers = tickers;

          loadTickersHistory(tickers);
        })
        .catch(function (err) {
          toastr.warning("Hubo un error al cargar el listado de códigos bursátiles, inténtelo más tarde");
          $log.error(err);
        });
    }

    function loadTickersHistory(tickers) {
      var tickerSample = _.sample(tickers, 10);

      var toDate = new Date();
      var fromDate = new Date().setFullYear(toDate.getFullYear() - 1);

      MainService.getTickersHistory(tickerSample, fromDate, toDate)
        .then(function (queryResult) {
          vm.tickersHistory = _
            .chain(queryResult.datatable.data)
            .groupBy(_.first)
            .map(function (tickerHistory, tickerName) {
              var tickerDetail = {};
              tickerDetail.history = processHistoryData(tickerHistory);
              tickerDetail.name = tickerName;
              tickerDetail.company = getCompanyByTicker(tickerName);

              return tickerDetail
            })
            .value();
        })
        .catch(function (err) {
          toastr.warning("Hubo un error al cargar el historial de precios de los códigos bursátiles, inténtelo más tarde");
          $log.error(err);
        });
    }

    function getCompanyByTicker(ticker) {
      var tickerData = _.find(vm.tickers, function (tickerData) {
        return tickerData.ticker === ticker;
      });

      return tickerData ? tickerData.company : ticker;
    }

    function processHistoryData(history) {
      var processedHistory = {};

      processedHistory.label = _.map(history, function (dayValue) {
        return dayValue[1];
      });
      processedHistory.serie = [history[0][0]];
      processedHistory.data = [_.map(history, function (dayValue) {
        return dayValue[2];
      })];

      return processedHistory;
    }

    function addToCompare(tickerData) {
      if(vm.selectedTickers.length === 3){
        vm.selectedTickers.shift();
      }
      vm.selectedTickers.push(tickerData);
    }

    loadTickers();
  }
})();
