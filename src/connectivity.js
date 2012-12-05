(function (global, undefined) {
    /**
     * List of event callbacks, organized by event name. Map an event to a list of callbacks.
     * @type Object
     */
    var callbacks = {};

    /**
     * Raise an event. This will call all callbacks registered for that event (if any)
     * @param {String} name Event name
     */
    function raiseEvent (name) {
        if (callbacks[name]) {
            var backs = callbacks[name].slice(0, callbacks[name].length);

            for (var i = 0; i < backs.length; i += 1) {
                backs[i].call();
            }
        }
    }

    /**
     * Connectivity state. True if network is available. If goes to false when two requests times out and goes back to
     * true when one succedes. <br>
     * Connectivity raises the event 'connectivityChange' when this value changes.
     * @type Boolean
     */
    var internalState = true;

    /**
     * Map of pending requests. The key is the request identifier and the value is the promised request.
     * @type Object
     */
    var pending = {};

    /**
     * Called when a request is terminated successfully
     * @param {PromisedRequest} promise Promised request
     */
    function requestSuccess (promise, response) {
        delete pending[promise.id];

        promise.callbacks.success.call({}, promise.request, response);
    }

    /**
     * Called when a request is terminated with an error. The server responded to our request
     * @param {PromisedRequest} promise Promised request
     */
    function requestFail (promise, response) {

    }

    /**
     * Called when a request times out. This is different from a failure becasue we queue the request for retry
     * @param {PromisedRequest} promise Promised request
     */
    function requestTimeout (promise, response) {

    }

    global.Connectivity = {
        /**
         * Interval between retries ni milliseconds. A queued request is sent again when this timer expires
         * @type Integer
         */
        retry : 1000,

        /**
         * Register an event listener
         * @param {String} event Event Name
         * @param {Function} callback Callback function
         */
        on : function (event, callback) {
            if (!callbacks[event]) {
                callbacks[event] = [];
            }
            callbacks[event].push(callback);
        },

        /**
         * Remove an event listener. If no event is passed, all callbacks are removed.
         * @param {String} event Event Name
         * @param {Function} callback Callback function
         */
        off : function (event, callback) {
            if (!event) {
                callbacks = {};
                return;
            }

            for (var i = 0; i < callbacks[event].length; i += 1) {
                if (callbacks[event][i] == callback) {
                    callbacks[event].splice(i, 1);
                    return;
                }
            }
        },

        /**
         * Get the current connectivity state. Returns true if the network is available.
         * @return Boolean
         */
        getState : function () {
            return internalState;
        },

        /**
         * Set the current connectivity state. Calls the callbacks if the value has changed.
         * @param {Boolean} state New connectivity state
         * @return
         */
        setState : function (state) {
            var oldState = internalState;
            internalState = !!state;

            if (internalState !== oldState) {
                raiseEvent("connectivityChange");
            }
        },

        /**
         * Send a request (tentatively). The request is tried indefinetely at intervals of Connectivity.retry
         * milliseconds until either a response is received from the server or the connection is aborted.
         * @param {Object} request
         *
         * <pre>
         * url : {String} Target URL
         * method : {String} HTTP method (GET, POST, ...)
         * data : {String} Optional data in the request body
         * headers : {Object} Map of request headers
         * timeout : {Integer} Timeout in milliseconds
         * </pre>
         *
         * @return {String} Request identifier
         */
        send : function (request) {
            var promise = new PromisedRequest(request);

            pending[promise.id] = promise;

            this.Adapter.send(request).then(function (response) {
                requestSuccess(promise, response);
            }, function (response) {
                requestFail(promise, response);
            }, function (response) {
                requestTimeout(promise, response);
            });

            return promise.promise;
        }
    };

    /**
     * Promised request. This class has a reference to the user defined callbacks and the original request.
     */
    var PromisedRequest = function (request) {
        PromisedRequest.prototype.ID += 1;

        /**
         * Request identifier
         * @type Integer
         */
        this.id = "r" + this.ID;

        /**
         * Request object
         * @type Object
         */
        this.request = request;

        /**
         * User defined callbacks
         * @type Object
         */
        var callbacks = {};
        this.callbacks = callbacks;

        /**
         * Promise exposed to the user
         * @type Object
         */
        this.promise = {
            then : function (success, failure) {
                callbacks.success = success;
                callbacks.failure = failure;
            }
        };
    };
    PromisedRequest.prototype.ID = 0;
})(window);