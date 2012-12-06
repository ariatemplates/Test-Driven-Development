describe("adapter", function () {
    var callbacks;

    beforeEach(function () {
        jasmine.Clock.useMock();

        callbacks = {
            success : function () {},
            failure : function () {},
            timeout : function () {}
        };
        spyOn(callbacks, "success");
        spyOn(callbacks, "failure");
        spyOn(callbacks, "timeout");

        this.addMatchers({
            toHaveBeenCalledOnce : function () {
                this.message = function () {
                    return "Spy " + (!this.isNot ? "should" : "shouldn't") + " be called once, called "
                            + this.actual.calls.length + " times";
                };

                return this.actual.calls.length === 1;
            }
        });

        Connectivity.Adapter = null;
    });

    var asyncFixture = function () {
        Aria.load({
            classes : ["libraries.ConnectivityAdapter"],
            oncomplete : {
                fn : function () {
                    this.Adapter = libraries.ConnectivityAdapter;
                },
                scope : Connectivity
            }
        });
    };

    it("should call the success callback", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(function () {
            // we are waiting for an Aria.load, that is asynchronous, but we also mocked time, let the time flow
            jasmine.Clock.tick(10);
            return !!Connectivity.Adapter;
        }, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/success",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            jasmine.Clock.tick(100);

            expect(callbacks.success).toHaveBeenCalledOnce();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            // Let the timeout run
            jasmine.Clock.tick(1000);

            expect(callbacks.success).toHaveBeenCalledOnce();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();
        });
    });
});