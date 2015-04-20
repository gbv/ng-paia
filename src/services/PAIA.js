/**
 * @ngdoc service
 * @name ng-suggest.service:PAIA
 * @description
 */
angular.module('ngPAIA')
.factory('PAIA', ['$http','$q',function($http,$q) {

    // this helper method may better be written with $httpProvider
    function _http(method, url, data, token, language) {
        var req = {
            method: method,
            url: url,
            headers: { },
        };

        // This could be cleaned up when https://github.com/gbv/paia/issues/46 is solved
        if (method == 'POST') {
            // req.headers['Content-Type'] = 'application/json; charset=utf-8';
            // req.data = data;
            req.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
            req.data = $.param(data); // requires jQuery
            if (token) {
                req.headers.access_token = token;
            }
        } else { // If PAIA server does not support OPTIONS, we must not add custom headers
            if (token) {
                req.params = { access_token: token };
            }
        }
        if (language) {
            req.headers['Accept-Language'] = language;
        }
        return $http(req);
    }

    // the two decoupled services could become independent angularjs modules

    function PAIA_auth(url) {
        this.url = url;
    }
    PAIA_auth.prototype = {
        login: function(req) {
            var auth = this;

            var data = {
                username: req.username,
                password: req.password,
                grant_type: "password",
            };
            if ("scope" in req) {
                data.scope = req.scope; 
            }

            var def = $q.defer();

            _http('POST', this.url+'/login', data, undefined)
                .success(function(data) {                    
                    self.access = data.access;
                    if (auth.grant) {
                        auth.grant.access = {
                            patron: data.patron,
                            token: data.access_token,
                            scope: data.scope,
                        }
                    }
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
                });

            return def.promise;
        },
        // logout, cancel...
    };


    function PAIA_core(url, access) {
        this.url = url;
        this.access = access ? access : { };
    }

    PAIA_core.prototype = {
        patron: function() {
            var def = $q.defer();
            
            var url = this.url+'/'+window.encodeURI(this.access.patron);
            _http('GET', url, undefined, this.access.token )
                .success(function(data) {                    
                    def.resolve(data);
                })
                .error(function(data) {
                    def.reject(data);
                });

            return def.promise;
        },
        // ...
    };

    // PAIA service constructor
    function PAIA(config) {
        if (typeof config == 'string') {
            config.url = config;
        }
        this.core = new PAIA_core(config.core ? config.core : config.url + '/core');
        this.auth = new PAIA_auth(config.auth ? config.auth : config.url + '/auth');
        this.preflight = typeof config.preflight === 'undefined' ? true : config.preflight;
        this.auth.grant = this.core;
    };

    return PAIA;
}]);
