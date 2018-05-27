(function() {
  'use strict';

  angular
    .module('App')
    .config(routeConfig);

  function routeConfig($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/main/landing/landing.html',
        controller: 'LandingController',
        controllerAs: 'vm'
      })
      .when('/analyze', {
        templateUrl: 'app/main/compare/compare.html',
        controller: 'CompareController',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  }

})();
