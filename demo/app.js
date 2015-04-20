angular.module('myApp', ['ngPAIA'])
.controller('myController', ['$scope','$http','PAIA','ngPAIA.version',
  function ($scope, $http, PAIA, version) {
    $scope.version = version;
    $scope.response = { };

    function copy2scope(data, fields) {
        angular.forEach(fields, function(name) {
            $scope[name] = data[name];
        });
    }

    function showResponse(data) {
        $scope.response.data = data;
        return data;
    }

    var paia;

    $http.get('credentials.json').success(
        function(credentials) {
            $scope.paia_url = credentials.paia;

            paia = new PAIA({
                url: credentials.paia, 
                preflight: false
            });

            paia.auth.login(credentials)
            .then( showResponse, showResponse )
            .then(
                function (data) {
                    console.log(data);
                    copy2scope(data,['patron','access_token','expires_in','scope']);
                    console.log("OK");
                    paia.core.patron();
                }
            );
        })
  }
]);
