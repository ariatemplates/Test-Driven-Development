describe("adapter", function () {
    var callbacks;
    var server;
    var clock;

    beforeEach(function () {
        clock = sinon.useFakeTimers();
        sinon.FakeXMLHttpRequest.useFilters = true;
        sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
            return "./success./fail./timeout.".indexOf(url) === -1;
        });
        server = sinon.fakeServerWithClock.create();

        server.respondWith("/success", [200, {
                    "Content-Type" : "application/json"
                }, '[{ "ok": true }]']);
        server.respondWith("/fail", [404, {
                    "Content-Type" : "application/json"
                }, '[{ "ok": false }]']);
        server.autoRespondAfter = 100;

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
    afterEach(function () {
        server.restore();
        clock.restore();
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
            clock.tick(10);
            return !!Connectivity.Adapter;
        }, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/success",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            clock.tick(100);
            server.respond();

            expect(callbacks.success).toHaveBeenCalledOnce();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            // Let the timeout run
            clock.tick(1000);

            expect(callbacks.success).toHaveBeenCalledOnce();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();
        });
    });

    it("should call the fail callback", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(function () {
            // we are waiting for an Aria.load, that is asynchronous, but we also mocked time, let the time flow
            clock.tick(10);
            return !!Connectivity.Adapter;
        }, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/fail",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            clock.tick(100);
            server.respond();

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).toHaveBeenCalledOnce();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            // Let the timeout run
            clock.tick(1000);

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).toHaveBeenCalledOnce();
            expect(callbacks.timeout).not.toHaveBeenCalled();
        });
    });

    it("should call the timeout callback", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(function () {
            // we are waiting for an Aria.load, that is asynchronous, but we also mocked time, let the time flow
            clock.tick(10);
            return !!Connectivity.Adapter;
        }, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/timeout",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            clock.tick(100);

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            // Let the timeout run
            clock.tick(1000);

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).toHaveBeenCalledOnce();
        });
    });
});