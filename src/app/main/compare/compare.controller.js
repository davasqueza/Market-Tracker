(function() {
  'use strict';

  angular
    .module('App')
    .controller('CompareController', CompareController);

  /** @ngInject */
  function CompareController(MainService, $location, $log, toastr) {
    var vm = this;

    /**
     * Reads from URL the compare parameters and initialize the loading of historical data
     */
    function readCompareParameters() {
      var parameters = $location.search();
      var tickersSelected = _.map(parameters.tickers.split(","), function (ticker) {
        return {ticker: ticker}
      });
      vm.fromDate = new Date(Number(parameters.fromDate));
      vm.toDate = new Date(Number(parameters.toDate));

      MainService.getTickerList()
        .then(function (tickers) {
          vm.tickers = tickers;

          loadSelectedTickersHistory(tickersSelected, vm.fromDate, vm.toDate);
        })
        .catch(function (err) {
          toastr.warning("Hubo un error al cargar el listado de códigos bursátiles, inténtelo más tarde");
          $log.error(err);
        });
    }

    /**
     * Load historical price data from selected tickers
     * @param tickers - List of selected tickers
     * @param fromDate - Date of initial date range
     * @param toDate - Date of final date range
     */
    function loadSelectedTickersHistory(tickers, fromDate, toDate) {
      MainService.getTickersHistory(tickers, fromDate, toDate)
        .then(function (queryResult) {
          var tickersHistory = _
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

          analyzeTickers(tickersHistory);
        })
        .catch(function (err) {
          toastr.warning("Hubo un error al cargar el historial de precios de los códigos bursátiles, inténtelo más tarde");
          $log.error(err);
        });
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
     * Process historical price data to calculate trend probability
     * @param tickersHistory
     */
    function analyzeTickers(tickersHistory) {

      vm.tickersHistory = _.map(tickersHistory, function (tickerData) {
        var valueHistory = tickerData.history.data[0];

        tickerData.analysis = {};
        tickerData.analysis.currentValue = valueHistory[valueHistory.length - 1];
        tickerData.analysis.standardDeviation = calculateStandardDeviation(tickerData);
        tickerData.analysis.bearishProbability = calculateBearishProbability(tickerData);
        tickerData.analysis.bullishProbability = calculateBullishProbability(tickerData);
        tickerData.analysis.bearishValue = calculateBearishValue(tickerData);
        tickerData.analysis.bullishValue = calculateBullishValue(tickerData);

        return tickerData;
      });

      calculateBestChoice(vm.tickersHistory);
    }

    /**
     * Compute the standard deviation for the historical prices
     * @param tickerData - Data of the ticker
     * @returns {number} standard deviation of the dataset
     */
    function calculateStandardDeviation(tickerData){
      var valueHistory = tickerData.history.data[0];
      return math.std(valueHistory);
    }

    /**
     * Compute the bearish probability for the historical prices
     * @param tickerData - Data of the ticker
     * @returns {number} bearish probability of the dataset
     */
    function calculateBearishProbability(tickerData){
      var valueHistory = tickerData.history.data[0];
      var currentValue = tickerData.analysis.currentValue;
      var mean = math.mean(valueHistory);
      var standardDeviation = tickerData.analysis.standardDeviation;

      return computeCumulativeDistribution(currentValue, mean, standardDeviation);
    }

    /**
     * Compute the bullish probability for the historical prices
     * @param tickerData - Data of the ticker
     * @returns {number} bullish probability of the dataset
     */
    function calculateBullishProbability(tickerData){
      return 1 - tickerData.analysis.bearishProbability;
    }

    /**
     * Compute the bullish value for the historical prices
     * @param tickerData - Data of the ticker
     * @returns {number} bullish value of the dataset
     */
    function calculateBullishValue(tickerData){
      return tickerData.analysis.currentValue + tickerData.analysis.standardDeviation;
    }

    /**
     * Compute the bearish value for the historical prices
     * @param tickerData - Data of the ticker
     * @returns {number} bearish value of the dataset
     */
    function calculateBearishValue(tickerData){
      return tickerData.analysis.currentValue - tickerData.analysis.standardDeviation;
    }

    /**
     * compute cumulative distribution, based on https://stackoverflow.com/a/41638885
     * @param x - value to compute if will take a value less than or equal
     * @param mean - mean of the dataset
     * @param standardDeviation - standard deviation of the dataset
     * @returns {number}
     */
    function computeCumulativeDistribution(x, mean, standardDeviation) {
      return (1 - math.erf((mean - x ) / (Math.sqrt(2) * standardDeviation))) / 2;
    }

    /**
     * Compute the best choice based on the decision theory
     * @param tickers
     */
    function calculateBestChoice(tickers) {
      var gainValue = [];
      var bestOption = {gain: -Infinity};

      _.each(tickers, function (tickerData) {
        var currentValue = tickerData.analysis.currentValue;
        var bullishValueDelta = tickerData.analysis.bullishValue - currentValue;
        var bearishValueDelta = tickerData.analysis.bearishValue - currentValue;

        var bullishGain = bullishValueDelta * tickerData.analysis.bullishProbability;
        var bearishGain = bearishValueDelta * tickerData.analysis.bearishProbability;

        var optionGain = bullishGain + bearishGain;

        gainValue.push(optionGain);
      });

      _.each(gainValue, function (gain, tickerIndex) {
        if(bestOption.gain < gain){
          bestOption.gain = gain;
          bestOption.ticker = tickers[tickerIndex];
        }
      });

      vm.bestOption = bestOption;
    }

    readCompareParameters();
  }
})();
