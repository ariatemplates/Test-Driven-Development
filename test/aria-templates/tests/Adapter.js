(function () {
    var clock;
    var callbacks;
    var server;

    Aria.classDefinition({
        $classpath : "tests.Adapter",
        $extends : "aria.jsunit.TestCase",
        $dependencies : ["libraries.ConnectivityAdapter"],
        $constructor : function () {
            this.$TestCase.constructor.call(this);

            sinon.FakeXMLHttpRequest.useFilters = true;
            sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
                return "./success./fail./timeout.".indexOf(url) === -1;
            });

            Connectivity.Adapter = libraries.ConnectivityAdapter;

            server = sinon.fakeServerWithClock.create();
            server.respondWith("/success", [200, {
                        "Content-Type" : "application/json"
                    }, '[{ "ok": true }]']);
            server.respondWith("/fail", [404, {
                        "Content-Type" : "application/json"
                    }, '[{ "ok": false }]']);
            server.autoRespondAfter = 100;
        },
        $destructor : function () {
            Connectivity.Adapter = null;
            server.restore();

            this.$TestCase.$destructor.call(this);
        },
        $prototype : {
            setUp : function () {
                clock = sinon.useFakeTimers();

                callbacks = {
                    success : sinon.spy(),
                    failure : sinon.spy(),
                    timeout : sinon.spy()
                };
            },

            tearDown : function () {
                clock.restore();
            },

            testSuccessCallback : function () {
                var request = {
                    url : "/success",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);
                server.respond();

                this.assertTrue(callbacks.success.calledOnce);
                this.assertFalse(callbacks.failure.called);
                this.assertFalse(callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                this.assertTrue(callbacks.success.calledOnce);
                this.assertFalse(callbacks.failure.called);
                this.assertFalse(callbacks.timeout.called);
            },

            testFailCallback : function () {
                var request = {
                    url : "/fail",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);
                server.respond();

                this.assertFalse(callbacks.success.called);
                this.assertTrue(callbacks.failure.calledOnce);
                this.assertFalse(callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                this.assertFalse(callbacks.success.called);
                this.assertTrue(callbacks.failure.calledOnce);
                this.assertFalse(callbacks.timeout.called);
            },

            testTimeoutCallback : function () {
                var request = {
                    url : "/timeout",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);

                this.assertFalse(callbacks.success.called);
                this.assertFalse(callbacks.failure.called);
                this.assertFalse(callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                this.assertFalse(callbacks.success.called);
                this.assertFalse(callbacks.failure.called);
                this.assertTrue(callbacks.timeout.calledOnce);
            }
        }
    });
})();