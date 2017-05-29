'use strict';
(function (angular) {
    var sbxLib = angular.module('sbx.cloud-nglib', []);

    sbxLib.factory('sbxCommonSrv', ['$http', sbxCommonSrv]);

    function sbxCommonSrv($http) {

        let sbxCommonSrv = { maps: {} };

        sbxCommonSrv.urls = {
            api: 'https://sbxcloud.com/api',
            update_password: '/user/v1/password',
            login: '/user/v1/login',
            register: '/user/v1/register',
            row: '/data/v1/row',
            find: '/data/v1/row/find',
            update: '/data/v1/row/update',
            delete: '/data/v1/row/delete',
            uploadFile: '/content/v1/upload',
            addFolder: '/content/v1/folder',
            folderList: '/content/v1/folder',
            send_mail: '/email/v1/send',
            payment_customer: '/payment/v1/customer',
            payment_card: '/payment/v1/card',
            payment_token: '/payment/v1/token',
            password: '/user/v1/password/request'
        };

        sbxCommonSrv.toMap = function (array, mapName, key) {

            if (!sbxCommonSrv.maps[mapName]) {
                sbxCommonSrv.maps[mapName] = {};
            }

            for (var i = 0; i < array.length; i++) {
                sbxCommonSrv.maps[mapName][array[i][key]] = array[i];
            }
            return sbxCommonSrv.maps[mapName];
        };

        sbxCommonSrv.getHeaders = function () {
            return sbxCommonSrv.headers
        }

        sbxCommonSrv.upper = function (val) {
            return val == null ? '' : val.toUpperCase();
        }

        sbxCommonSrv.setHeaders = function (token) {
            sbxCommonSrv.headers = {
                'Authorization': 'Bearer ' + token,
                'App-Key': sbxCommonSrv.app_key.dev
            };
        }

        sbxCommonSrv.request = function (options) {
            return $http({
                method: options.method,
                url: sbxCommonSrv.urls.api + options.url,
                params: options.params || null,
                data: options.data || null,
                headers: sbxCommonSrv.getHeaders()
            }).then(function (response) {
                return response;
            }, function (errResponse) {
                return errResponse;
            })
        }

        sbxCommonSrv.method = {
            get: function (urlRequest, params) {
                return $sbxCommonSrv.request({
                    method: 'GET',
                    url: urlRequest,
                    params: params
                });
            },
            post: function (urlRequest, params) {
                return $http({
                    method: 'POST',
                    url: urlRequest,
                    params: params
                });
            },
            query: function (urlRequest, send_query) {
                return $http({
                    method: 'POST',
                    url: urlRequest,
                    data: send_query
                });
            },
            put: function (urlRequest, params) {
                return $http({
                    method: 'PUT',
                    url: urlRequest,
                    data: params,
                });
            }
        }

        sbxCommonSrv.loadPage = function (query, page, onSuccess, onError) {
            if (console.count) {
                console.count('loadPage-->' + query.row_model);
            } else {
                console.log('loadPage-->' + query.row_model, page);
            }
            query.page = page;

            sbxCommonSrv.method.query(sbxCommonSrv.urls.find, query).then(function (response) {

                var res = response.data;

                if (res.success) {
                    onSuccess(res);
                } else {
                    onError(new Error(res.error));
                }

            });

        };


        /**
         * Loads all the pages for a given entity
         * Also wires de fetched entities using the wireFetch function
         * @param query
         * @param onSuccess (with a results objects that contains {results:[], fetched_results:{}}
         * @param onError
         */
        sbxCommonSrv.loadAllPages = function (query, onSuccess, onError) {

            // always load from the first page
            query.page = 1;
            query.size = 100;

            if (!query.where) {
                onError(new Error('Invalid value: ' + value));
                return;
            }

            async.waterfall([
                function (cb) {

                    let items = [];

                    let fetched_results = {};

                    sbxCommonSrv.loadPage(query, 1, function (data) {

                        // console.log(data.fetched_results);

                        items = items.concat(data.results);

                        if (data.fetched_results) {
                            fetched_results = data.fetched_results;
                        }

                        cb(null, items, data.total_pages, fetched_results);
                    }, function (err) {
                        cb(err);
                    });

                }, function (items, total_pages, fetched, cb) {

                    let fetched_results = fetched;

                    // no more pages pending
                    if (total_pages < 2) {
                        cb(null, items, fetched_results);
                        return;
                    }

                    // create an array with integers from 2..total_pages, like: [2,3,4...]
                    //let pages = new Array(total_pages).fill().map((_, i) => i + 1).slice(1);

                    let pages = [];

                    for (let i = 2; i <= total_pages; i++) {
                        pages.push(i);
                    }


                    async.eachSeries(pages, function (index, cbIter) {

                        sbxCommonSrv.loadPage(query, index, function (data) {


                            if (data.fetched_results) {

                                Object.keys(data.fetched_results).forEach(function (type_name) {

                                    if (!fetched_results.hasOwnProperty(type_name)) {
                                        fetched_results[type_name] = {};
                                    }

                                    for (let key in data.fetched_results[type_name]) {
                                        if (data.fetched_results[type_name].hasOwnProperty(key)) {
                                            fetched_results[type_name][key] = data.fetched_results[type_name][key];
                                        }
                                    }

                                });

                            }

                            items = items.concat(data.results);

                            cbIter(null);
                        }, function (err) {
                            cbIter(err);
                        });

                    }, function (errIter) {
                        cb(errIter, items, fetched_results);
                    });


                }], function (err, items, fetched_results) {

                    if (err) {
                        onError(err);
                    } else {
                        //console.log(JSON.stringify(items));
                        onSuccess({ results: items, fetched_results: fetched_results });
                    }

                });


        };

        sbxCommonSrv.queryBuilder = QueryBuilder;

        sbxCommonSrv.register = function (query, onSuccess, onError) {
            sbxCommonSrv.method.get(sbxCommonSrv.urls.register, query)
                .then(function (response) {
                    var response = sbxCommonSrv.response.get.data;
                    if (response.success) {
                        onSuccess(response);
                    } else {
                        onError('Cannot register user');
                    }
                });
        }

        sbxCommonSrv.login = function (form_data, onSuccess, onError) {
            $http.get(common.urls.api + common.urls.login, { params: form_data })
                .then(function (response) {
                    var res = response.data;
                    if (res.success) {
                        onSuccess(res)
                    } else {

                    }


                });
        }

        sbxCommonSrv.checkPicture = function (url, elem) {
            var deferred = $q.defer();
            elem.def = deferred;

            var image = new Image();
            image.onerror = function () {
                deferred.resolve(false);
            };
            image.onload = function () {
                deferred.resolve(true);
            };
            image.src = url;
            return deferred.promise;
        }

        sbxCommonSrv.onSuccessDefault = function (res) {
            console.log(res);
        }

        sbxCommonSrv.onErrorDefault = function (err) {
            if (console.error) {
                console.error(err);
            } else {
                console.log(err);
            }
        }

        return sbxCommonSrv;
    }
})(angular)