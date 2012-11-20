module("Connectivity", {
    setup : function () {
        // Always start with a connected network
        Connectivity.setState(true);
        // And remove any callbacks
        Connectivity.off();
    }
});

test("raise event when connectivity changes", function () {
    var eventCallback = this.spy();

    Connectivity.on("connectivityChange", eventCallback);

    Connectivity.setState(false);

    ok(!Connectivity.getState());

    ok(eventCallback.calledOnce, "Event callback was not called");

    // Set again to false -> souldn't call the callback again, because the state is not changing
    Connectivity.setState(false);

    ok(eventCallback.calledOnce, "Event callback was not called once but " + eventCallback.callCount);

    // And now go to true, should call the callback
    Connectivity.setState(true);

    ok(eventCallback.calledTwice, "Event callback should be called twice");
});

test("raise event after calling off", function () {
    var callbacks = {
        cb1 : this.spy(),
        cb2 : this.spy(),
        cb3 : this.spy()
    };

    Connectivity.on("connectivityChange", callbacks.cb1);
    Connectivity.on("connectivityChange", callbacks.cb2);
    Connectivity.on("connectivityChange", callbacks.cb3);

    Connectivity.off("connectivityChange", callbacks.cb2);

    Connectivity.setState(false);

    ok(callbacks.cb1.calledOnce);
    ok(!callbacks.cb2.called);
    ok(callbacks.cb3.calledOnce);
});

test("callbacks called when unsubscribing from within one of them", function () {
    function unsubscribe () {
        // Remove all callbacks
        Connectivity.off();
    }
    var callbacks = {
        cb1 : unsubscribe,
        cb2 : unsubscribe,
        cb3 : unsubscribe
    };

    this.spy(callbacks, "cb1");
    this.spy(callbacks, "cb2");
    this.spy(callbacks, "cb3");

    Connectivity.on("connectivityChange", callbacks.cb1);
    Connectivity.on("connectivityChange", callbacks.cb2);
    Connectivity.on("connectivityChange", callbacks.cb3);

    Connectivity.setState(false);
    ok(callbacks.cb1.calledOnce);
    ok(callbacks.cb2.calledOnce);
    ok(callbacks.cb3.calledOnce);
});