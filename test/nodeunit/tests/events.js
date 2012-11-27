(function (exports) {
    exports.suiteEvents = {
        setUp : function (callback) {
            // Always start with a connected network
            Connectivity.setState(true);
            // And remove any callbacks
            Connectivity.off();

            callback();
        },

        changeState : function (test) {
            test.expect(4);

            var eventCallback = sinon.spy();

            Connectivity.on("connectivityChange", eventCallback);

            Connectivity.setState(false);

            test.equal(Connectivity.getState(), false, "Connectivity state should be false");

            test.ok(eventCallback.calledOnce);

            // Set again to false -> souldn't call the callback again, because the state is not changing
            Connectivity.setState(false);

            test.ok(eventCallback.calledOnce);

            // And now go to true, should call the callback
            Connectivity.setState(true);

            test.ok(eventCallback.calledTwice);

            test.done();
        },

        off : function (test) {
            test.expect(3);

            var callbacks = {
                cb1 : sinon.spy(),
                cb2 : sinon.spy(),
                cb3 : sinon.spy()
            };

            Connectivity.on("connectivityChange", callbacks.cb1);
            Connectivity.on("connectivityChange", callbacks.cb2);
            Connectivity.on("connectivityChange", callbacks.cb3);

            Connectivity.off("connectivityChange", callbacks.cb2);

            Connectivity.setState(false);

            test.ok(callbacks.cb1.calledOnce);
            test.ok(!callbacks.cb2.called);
            test.ok(callbacks.cb3.calledOnce);

            test.done();
        }
    };
})(this.test_events = {});