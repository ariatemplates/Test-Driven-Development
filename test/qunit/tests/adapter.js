(function () {
    var callbacks;
    // Create the namespace of libraries here to avoid failing a test when checking globals
    this.libraries = {};

    // By default Sinon+QUnit creates a sandboxed timer. Disable it to let the async fixture run
    sinon.config.useFakeTimers = false;

    module("adapter", {
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
        // Just to be sure that the assert actually run
        expect(6);

        // Using call we guarantee that the inner scope is the same as the sandboxed test
        asyncFixtureWithCallback.call(this, function () {
            var clock = this.sandbox.useFakeTimers();
            var server = sandboxedServer.call(this);

            var request = {
                url : "/success",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            clock.tick(100);
            server.respond();

            ok(callbacks.success.calledOnce);
            ok(!callbacks.failure.called);
            ok(!callbacks.timeout.called);

            // Let the timeout run
            clock.tick(1000);

            ok(callbacks.success.calledOnce);
            ok(!callbacks.failure.called);
            ok(!callbacks.timeout.called);

            server.restore();
            clock.restore();

            start();
        });
    });

    asyncTest("should call the fail callback", function () {
        expect(6);

        asyncFixtureWithCallback.call(this, function () {
            var clock = this.sandbox.useFakeTimers();
            var server = sandboxedServer.call(this);

            var request = {
                url : "/fail",
                timeout : 1000
            };

            Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

            // Time for a request
            clock.tick(100);
            server.respond();

            ok(!callbacks.success.called);
            ok(callbacks.failure.calledOnce);
            ok(!callbacks.timeout.called);

            // Let the timeout run
            clock.tick(1000);

            ok(!callbacks.success.called);
            ok(callbacks.failure.calledOnce);
            ok(!callbacks.timeout.called);

            server.restore();
            clock.restore();

            start();
        });
    });
})();