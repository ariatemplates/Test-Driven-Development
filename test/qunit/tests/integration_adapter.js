(function () {
    var callbacks;
    // Create the namespace of libraries here to avoid failing a test when checking globals
    this.libraries = {};

    // By default Sinon+QUnit creates a sandboxed timer. Disable it to let the async fixture run
    sinon.config.useFakeTimers = false;

    module("Integration Adapter", {
        setup : function () {
            sinon.FakeXMLHttpRequest.useFilters = true;
            sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
                return "./success./fail./timeout.".indexOf(url) === -1;
            });

            callbacks = {
                success : sinon.spy(),
                failure : sinon.spy(),
                timeout : sinon.spy()
            };

            Connectivity.setState(true);
            Connectivity.Adapter = null;
        },
        teardown : function () {
            Connectivity.Adapter = null;
        }
    });

    var asyncFixtureWithCallback = function (callback) {
        var scope = this;

        Aria.load({
            classes : ["libraries.ConnectivityAdapter"],
            oncomplete : {
                fn : function () {
                    this.Adapter = libraries.ConnectivityAdapter;
                    callback.call(scope);
                },
                scope : Connectivity
            }
        });

    };
    var sandboxedServer = function () {
        this.sandbox.serverPrototype = sinon.fakeServerWithClock;
        var server = this.sandbox.useFakeServer();

        server.respondWith("/success", [200, {
                    "Content-Type" : "application/json"
                }, '[{ "ok": true }]']);
        server.respondWith("/fail", [404, {
                    "Content-Type" : "application/json"
                }, '[{ "ok": false }]']);
        server.autoRespondAfter = 100;

        return server;
    };

    asyncTest("call the success callback", function () {
        expect(6);

        asyncFixtureWithCallback.call(this, function () {
            var clock = this.sandbox.useFakeTimers();
            var server = sandboxedServer.call(this);

            var request = {
                url : "/success",
                timeout : 1000
            };

            Connectivity.on("connectivityChange", callbacks.timeout);
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            server.respond();

            // Lot of things might happen, just let the time flow
            clock.tick(3000);

            ok(callbacks.success.calledOnce);
            ok(!callbacks.failure.called);
            ok(!callbacks.timeout.called);

            deepEqual(callbacks.success.firstCall.args[0], request);
            deepEqual(callbacks.success.firstCall.args[1], {
                status : 200,
                responseText : '[{ "ok": true }]'
            });

            ok(Connectivity.getState());

            server.restore();
            clock.restore();

            start();
        });
    });

    asyncTest("call the fail callback", function () {
        expect(6);

        asyncFixtureWithCallback.call(this, function () {
            var clock = this.sandbox.useFakeTimers();
            var server = sandboxedServer.call(this);

            var request = {
                url : "/fail",
                timeout : 1000
            };

            Connectivity.on("connectivityChange", callbacks.timeout);
            Connectivity.send(request).then(callbacks.success, callbacks.failure);
            server.respond();

            // Lot of things might happen, just let the time flow
            clock.tick(3000);

            ok(!callbacks.success.called);
            ok(callbacks.failure.calledOnce);
            ok(!callbacks.timeout.called);

            deepEqual(callbacks.failure.firstCall.args[0], request);
            deepEqual(callbacks.failure.firstCall.args[1], {
                status : 404,
                responseText : '[{ "ok": false }]'
            });

            ok(Connectivity.getState());

            server.restore();
            clock.restore();

            start();
        });
    });

    asyncTest("change the connectivity state", function () {
        expect(4);

        asyncFixtureWithCallback.call(this, function () {
            var clock = this.sandbox.useFakeTimers();
            var server = sandboxedServer.call(this);

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

            ok(!callbacks.success.called);
            ok(!callbacks.failure.called);
            ok(callbacks.timeout.calledOnce);

            ok(!Connectivity.getState());

            server.restore();
            clock.restore();

            start();
        });
    });
})();