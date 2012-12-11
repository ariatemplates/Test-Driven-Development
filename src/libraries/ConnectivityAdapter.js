(function () {
    var success = function (response, promise) {
        // Yelds to guarantees asynchronous callbacks
        later(promise.callbacks.success, response);
    };
    var fail = function (response, promise) {
        if (response.statusText === aria.core.IO.TIMEOUT_ERROR) {
            later(promise.callbacks.timeout, response);
        } else {
            later(promise.callbacks.fail, response);
        }
    };
    var later = function (callback, response) {
        setTimeout(function () {
            callback.call(null, normalizeResponse(response));
        }, 4);
    };
    var normalizeResponse = function (response) {
        return {
            status : response.status || 0,
            responseText : response.responseText
        };
    };

    var AdapterPromise = function (request) {
        /**
         * Request object
         * @type Object
         */
        this.request = request;

        /**
         * Callbacks passed to the promise object
         * @type Object
         */
        var callbacks = {};
        this.callbacks = callbacks;

        /**
         * Promised method
         * @type Function
         */
        this.promise = {
            then : function (success, fail, timeout) {
                callbacks.success = success;
                callbacks.fail = fail;
                callbacks.timeout = timeout;
            }
        };
    };

    Aria.classDefinition({
        $classpath : "libraries.ConnectivityAdapter",
        $singleton : true,
        $prototype : {
            /**
             * Send a request to the underlying IO method.<br>
             * Returns a promise-like object with a <code>then</code> method that accepts three parameters:
             * <ul>
             * <li>success callback</li>
             * <li>fail callback</li>
             * <li>timeout callback</li>
             * </ul>
             * Usage:
             *
             * <pre>
             * libraries.ConnectivityAdapter.send(request).then(success, fail, timeout)
             * </pre>
             *
             * @param {Object} request Request object containing
             * <ul>
             * <li>url</li>
             * <li>method (GET - POST ...)</li>
             * <li>data : optional data in the request body</li>
             * <li>headers : an object containing request header</li>
             * <li>timeout (in milliseconds)</li>
             * </ul>
             * @return {Object}
             */
            send : function (request) {
                var promise = new AdapterPromise(request);

                var ioRequest = {
                    url : request.url,
                    method : request.method,
                    data : request.data,
                    headers : request.headers,
                    timeout : request.timeout,
                    callback : {
                        fn : success,
                        scope : this,
                        onerror : fail,
                        args : promise
                    }
                };

                aria.core.IO.asyncRequest(ioRequest);

                return promise.promise;
            }
        }
    });
})();