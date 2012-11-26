beforeEach(function () {
    // Always start with a connected network
    Connectivity.setState(true);
    // And remove any callbacks
    Connectivity.off();
});

describe("connectivity", function () {
    it("should raise an event when connectivity changes", function () {
        var eventCallback = sinon.spy();

        Connectivity.on("connectivityChange", eventCallback);

        Connectivity.setState(false);

        expect(Connectivity.getState()).to.be(false);

        expect(eventCallback.calledOnce).to.be.ok();

        // Set again to false -> souldn't call the callback again, because the state is not changing
        Connectivity.setState(false);

        expect(eventCallback.calledOnce).to.be.ok();

        // And now go to true, should call the callback
        Connectivity.setState(true);

        expect(eventCallback.calledTwice).to.be.ok();
    });

    it("shouldn't raise an event after calling off", function () {
        var callbacks = {
            cb1 : function () {},
            cb2 : function () {},
            cb3 : function () {}
        };

        sinon.spy(callbacks, "cb1");
        sinon.spy(callbacks, "cb2");
        sinon.spy(callbacks, "cb3");

        Connectivity.on("connectivityChange", callbacks.cb1);
        Connectivity.on("connectivityChange", callbacks.cb2);
        Connectivity.on("connectivityChange", callbacks.cb3);

        Connectivity.off("connectivityChange", callbacks.cb2);

        Connectivity.setState(false);

        expect(callbacks.cb1.calledOnce).to.be.ok();
        expect(callbacks.cb2.called).not.to.be.ok();
        expect(callbacks.cb3.calledOnce).to.be.ok();
    });
});