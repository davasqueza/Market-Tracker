(function() {
  'use strict';

  angular
    .module('App')
    .controller('LandingController', LandingController);

  /** @ngInject */
  function LandingController(MainService, toastr, $log, $mdDialog, $location) {
    var vm = this;

    vm.addToCompare = addToCompare;
    vm.selectedTickers = [];
    vm.compareStocks = compareStocks;

    /**
     * Load the list of available tickers data
     */
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

    /**
     * Loads historical prices value from a random sample of tickers
     * @param tickers - List of tickers
     */
    function loadTickersHistory(tickers) {
      var tickerSample = _.sample(tickers, 10);

      var toDate = new Date();
      var fromDate = new Date().setFullYear(toDate.getFullYear() - 1);

      MainService.getTickersHistory(tickerSample, fromDate, toDate)
        .then(function (queryResult) {
          vm.tickersHistory = processTickersData(queryResult);
        })
        .catch(function (err) {
          toastr.warning("Hubo un error al cargar el historial de precios de los códigos bursátiles, inténtelo más tarde");
          $log.error(err);
        });
    }

    /**
     * Process the data for render on charts
     * @param queryResult - Data retrieved from Quandl
     */
    function processTickersData(queryResult) {
      return _
        .chain(queryResult.datatable.data)
        .groupBy(_.first)
        .map(function (tickerHistory, tickerName) {
          var tickerDetail = {};
          tickerDetail.history = processHistoryData(tickerHistory);
          tickerDetail.ticker = tickerName;
          tickerDetail.company = getCompanyByTicker(tickerName);

          return tickerDetail
        })
        .value();
    }

    /**
     * Search the company data associated with a ticker name
     * @param ticker - Name of the ticker
     * @returns {Object} Company data
     */
    function getCompanyByTicker(ticker) {
      var tickerData = _.find(vm.tickers, function (tickerData) {
        return tickerData.ticker === ticker;
      });

      return tickerData ? tickerData.company : ticker;
    }

    /**
     * Process a list of historical prices for render on a chart
     * @param history - List of historical prices
     * @returns {Object} Processed list of prices
     */
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

    /**
     * Add a ticker to the comparison list
     * @param tickerData - Ticker to add
     */
    function addToCompare(tickerData) {
      if(vm.selectedTickers.length === 3){
        vm.selectedTickers.shift();
      }
      vm.selectedTickers.push(tickerData);
    }

    /**
     * Open a modal to retrieve a range of dates for initialize
     * @param ev
     */
    function compareStocks(ev) {
      $mdDialog.show({
        controller: DialogController,
        controllerAs: 'vm',
        templateUrl: 'app/main/templates/analyze-stock.html',
        targetEvent: ev,
        allowClose:false,
        clickOutsideToClose: false
      }).then(function (dateRange) {
        var search = {
          tickers: _.map(vm.selectedTickers, _.property("ticker")).join(),
          toDate: dateRange.toDate.getTime(),
          fromDate: dateRange.fromDate.getTime()
        };

        $location.url("/analyze");
        $location.search(search);
      });
    }

    /**
     * Controller for compare stocks dialog
     * @param $mdDialog - mdDialog Service
     * @constructor
     */
    function DialogController($mdDialog) {
      var vm = this;

      vm.compare = compare;
      vm.toDate = new Date();
      vm.fromDate = new Date(new Date().setFullYear(vm.toDate.getFullYear() - 1));

      function compare() {
        $mdDialog.hide({
          toDate: vm.toDate,
          fromDate: vm.fromDate
        });
      }
    }

    loadTickers();
  }
})();
