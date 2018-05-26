(function() {
  'use strict';

  angular
    .module('App')
    .constant('GenericRESTResource', {
      query: { method: 'GET', isArray: true},
      create: { method: 'POST'},
      consult: { method: 'POST', isArray: true},
      consultObj: { method: 'POST'},
      show: { method: 'GET'},
      update: { method: 'PUT', params: {id: '@id'}},
      delete: { method: 'DELETE', params: {id: '@id'}}
    })
    .constant('QUANDL_APIKEY', 'aRVuE6pXyzymuobWzQ3h')
    .constant('QUANDL_DATATABLE_URL', 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json');

})();
