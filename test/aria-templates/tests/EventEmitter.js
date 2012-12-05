Aria.classDefinition({
    $classpath : "tests.EventEmitter",
    $extends : "aria.jsunit.TestCase",
    $prototype : {
        setUp : function () {
            // Always start with a connected network
            Connectivity.setState(true);
            // And remove any callbacks
            Connectivity.off();
        },

        testChangeState : function () {
            var eventCallback = sinon.spy();

            Connectivity.on("connectivityChange", eventCallback);

            Connectivity.setState(false);

            this.assertFalse(Connectivity.getState());

            this.assertTrue(eventCallback.calledOnce);

            // Set again to false -> souldn't call the callback again, because the state is not changing
            Connectivity.setState(false);

            this.assertTrue(eventCallback.calledOnce);

            // And now go to true, should call the callback
            Connectivity.setState(true);

            this.assertTrue(eventCallback.calledTwice);
        },

        testOff : function () {
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

            this.assertTrue(callbacks.cb1.calledOnce);
            this.assertFalse(callbacks.cb2.called);
            this.assertTrue(callbacks.cb3.calledOnce);
        }
    }
});