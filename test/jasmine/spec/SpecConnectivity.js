beforeEach(function () {
    this.addMatchers({
        toBeConnected : function () {
            this.message = function () {
                return "Expected connectivity state to be " + this.isNot ? "disconnected" : "connected";
            };

            return this.actual.getState();
        }
    });

    // Always start with a connected network
    Connectivity.setState(true);
    // And remove any callbacks
    Connectivity.off();
});

describe("connectivity", function () {
    it("should raise an event when connectivity changes", function () {
        var eventCallback = jasmine.createSpy("eventCallback");

        Connectivity.on("connectivityChange", eventCallback);

        Connectivity.setState(false);

        expect(Connectivity).not.toBeConnected();

        expect(eventCallback).toHaveBeenCalled();

        // Set again to false -> souldn't call the callback again, because the state is not changing
        Connectivity.setState(false);

        expect(eventCallback.calls.length).toEqual(1);

        // And now go to true, should call the callback
        Connectivity.setState(true);

        expect(eventCallback.calls.length).toEqual(2);
    });

    it("shouldn't raise an event after calling off", function () {
        var callbacks = {
            cb1 : function () {},
            cb2 : function () {},
            cb3 : function () {}
        };

        spyOn(callbacks, "cb1");
        spyOn(callbacks, "cb2");
        spyOn(callbacks, "cb3");

        Connectivity.on("connectivityChange", callbacks.cb1);
        Connectivity.on("connectivityChange", callbacks.cb2);
        Connectivity.on("connectivityChange", callbacks.cb3);

        Connectivity.off("connectivityChange", callbacks.cb2);

        Connectivity.setState(false);

        expect(callbacks.cb1).toHaveBeenCalled();
        expect(callbacks.cb2).not.toHaveBeenCalled();
        expect(callbacks.cb3).toHaveBeenCalled();
    });

    it("should call all callbacks when unsubscribing from within one of them", function () {
        function unsubscribe () {
            // Remove all callbacks
            Connectivity.off();
        }
        var callbacks = {
            cb1 : unsubscribe,
            cb2 : unsubscribe,
            cb3 : unsubscribe
        };

        spyOn(callbacks, "cb1").andCallThrough();
        spyOn(callbacks, "cb2").andCallThrough();
        spyOn(callbacks, "cb3").andCallThrough();

        Connectivity.on("connectivityChange", callbacks.cb1);
        Connectivity.on("connectivityChange", callbacks.cb2);
        Connectivity.on("connectivityChange", callbacks.cb3);

        Connectivity.setState(false);
        expect(callbacks.cb1).toHaveBeenCalled();
        expect(callbacks.cb2).toHaveBeenCalled();
        expect(callbacks.cb3).toHaveBeenCalled();
    });
});