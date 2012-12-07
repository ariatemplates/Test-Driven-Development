describe("integration", function () {
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
                    return "Spy " + this.actual.identity + (!this.isNot ? " should" : " shouldn't")
                            + " be called once, called " + this.actual.calls.length + " times";
                };

                return this.actual.calls.length === 1;
            },
            toBeConnected : function () {
                this.message = function () {
                    return "Expected connectivity state to be " + this.isNot ? "disconnected" : "connected";
                };

                return this.actual.getState();
            }
        });

        Connectivity.setState(true);
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

    var fixtureComplete = function () {
        clock.tick(10);
        return !!Connectivity.Adapter;
    };

    it("should call the success callback", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(fixtureComplete, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/success",
                timeout : 1000
            };

            Connectivity.on("connectivityChange", callbacks.timeout);
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            server.respond();

            // Lot of things might happen, just let the time flow
            clock.tick(3000);

            expect(callbacks.success).toHaveBeenCalledOnce();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            expect(callbacks.success.calls[0].args[0]).toEqual(request);
            expect(callbacks.success.calls[0].args[1]).toEqual({
                status : 200,
                responseText : '[{ "ok": true }]'
            });

            expect(Connectivity).toBeConnected();
        });
    });

    it("should call the fail callback", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(fixtureComplete, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/fail",
                timeout : 1000
            };

            Connectivity.on("connectivityChange", callbacks.timeout);
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            server.respond();

            // Lot of things might happen, just let the time flow
            clock.tick(3000);

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).toHaveBeenCalledOnce();
            expect(callbacks.timeout).not.toHaveBeenCalled();

            expect(callbacks.failure.calls[0].args[0]).toEqual(request);
            expect(callbacks.failure.calls[0].args[1]).toEqual({
                status : 404,
                responseText : '[{ "ok": false }]'
            });

            expect(Connectivity).toBeConnected();
        });
    });

    it("should change the connectivity state", function () {
        // Since we don't have async fixture we're going to make it part of the test
        runs(asyncFixture);

        waitsFor(fixtureComplete, "there should be an adapter", 1000);

        runs(function () {
            var request = {
                url : "/timeout",
                timeout : 1000
            };

            Connectivity.on("connectivityChange", callbacks.timeout);
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            // no server response

            clock.tick(1500);

            // second request
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            clock.tick(15000);

            // this accounts for the yelding inside the Adapter
            clock.tick(100);

            expect(callbacks.success).not.toHaveBeenCalled();
            expect(callbacks.failure).not.toHaveBeenCalled();
            expect(callbacks.timeout).toHaveBeenCalledOnce();

            expect(Connectivity).not.toBeConnected();
        });
    });
});