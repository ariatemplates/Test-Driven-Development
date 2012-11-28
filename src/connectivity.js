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

    global.Connectivity = {
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
        }
    };
})(window);