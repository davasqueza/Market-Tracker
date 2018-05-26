(function() {
  'use strict';

  angular
    .module('App')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastrConfig, $mdIconProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Toastr display configuration
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 7000;
    toastrConfig.positionClass = 'toast-bottom-center';
    toastrConfig.progressBar = true;

    //Icons configuration
    $mdIconProvider
      .icon("business", "assets/icons/business.svg", 24)
      .icon("chart", "assets/icons/chart.svg", 24)
      .icon("compare", "assets/icons/compare.svg", 24);
  }

})();
