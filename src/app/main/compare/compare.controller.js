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
        tickerData.analysis.standardDeviation = calculateStandardDeviation(valueHistory);
        tickerData.analysis.bullishProbability = calculateBullishProbability(valueHistory);
        tickerData.analysis.lateralProbability = calculateLateralProbability(valueHistory);
        tickerData.analysis.bearishProbability = calculateBearishProbability(valueHistory);
        tickerData.analysis.bullishValue = calculateBullishValue(valueHistory);
        tickerData.analysis.lateralValue = calculateLateralValue(valueHistory);
        tickerData.analysis.bearishValue = calculateBearishValue(valueHistory);

        return tickerData;
      });

      calculateBestChoice(vm.tickersHistory);
    }

    /**
     * Compute the standard deviation for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} standard deviation of the dataset
     */
    function calculateStandardDeviation(valueHistory){
      return math.std(valueHistory);
    }

    /**
     * Compute the bullish probability for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} bullish probability of the dataset
     */
    function calculateBullishProbability(valueHistory){
      //TODO: calculate BullishProbability
      return 60;
    }

    /**
     * Compute the lateral probability for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} lateral probability of the dataset
     */
    function calculateLateralProbability(valueHistory){
      //TODO: calculate LateralProbability
      return 15;
    }

    /**
     * Compute the bearish probability for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} bearish probability of the dataset
     */
    function calculateBearishProbability(valueHistory){
      //TODO: calculate BearishProbability
      return 25;
    }

    /**
     * Compute the bullish value for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} bullish value of the dataset
     */
    function calculateBullishValue(valueHistory){
      //TODO: calculate BullishValue
      return valueHistory[valueHistory.length - 1] + _.random(5,10);
    }

    /**
     * Compute the lateral value for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} lateral value of the dataset
     */
    function calculateLateralValue(valueHistory){
      //TODO: calculate LateralValue
      return valueHistory[valueHistory.length - 1];
    }

    /**
     * Compute the bearish value for the historical prices
     * @param valueHistory - Prices historical
     * @returns {number} bearish value of the dataset
     */
    function calculateBearishValue(valueHistory){
      //TODO: calculate BearishValue
      return valueHistory[valueHistory.length - 1] - _.random(5,10);
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
        var lateralValueDelta = tickerData.analysis.lateralValue - currentValue;
        var bearishValueDelta = tickerData.analysis.bearishValue - currentValue;

        var bullishGain = bullishValueDelta * (tickerData.analysis.bullishProbability / 100);
        var lateralGain = lateralValueDelta * (tickerData.analysis.lateralProbability / 100);
        var bearishGain = bearishValueDelta * (tickerData.analysis.bearishProbability / 100);

        var optionGain = bullishGain + lateralGain + bearishGain;

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
