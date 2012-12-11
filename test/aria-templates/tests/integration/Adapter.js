(function () {
    var clock;
    var callbacks;
    var server;

    Aria.classDefinition({
        $classpath : "tests.integration.Adapter",
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

                Connectivity.setState(true);
            },

            tearDown : function () {
                clock.restore();
            },

            testSuccessCallback : function () {
                var request = {
                    url : "/success",
                    timeout : 1000
                };

                Connectivity.on("connectivityChange", callbacks.timeout);
                Connectivity.send(request).then(callbacks.success, callbacks.failure);
                server.respond();

                // Lot of things might happen, just let the time flow
                clock.tick(3000);

                this.assertTrue(callbacks.success.calledOnce);
                this.assertFalse(callbacks.failure.called);
                this.assertFalse(callbacks.timeout.called);

                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[0], request));
                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[1], {
                    status : 200,
                    responseText : '[{ "ok": true }]'
                }));

                this.assertTrue(Connectivity.getState());
            },

            testFailCallback : function (test) {
                var request = {
                    url : "/fail",
                    timeout : 1000
                };

                Connectivity.on("connectivityChange", callbacks.timeout);
                Connectivity.send(request).then(callbacks.success, callbacks.failure);
                server.respond();

                // Lot of things might happen, just let the time flow
                clock.tick(3000);

                this.assertFalse(callbacks.success.called);
                this.assertTrue(callbacks.failure.calledOnce);
                this.assertFalse(callbacks.timeout.called);

                this.assertTrue(aria.utils.Json.equals(callbacks.failure.firstCall.args[0], request));
                this.assertTrue(aria.utils.Json.equals(callbacks.failure.firstCall.args[1], {
                    status : 404,
                    responseText : '[{ "ok": false }]'
                }));

                this.assertTrue(Connectivity.getState());
            },

            testConnectivityState : function (test) {
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

                this.assertFalse(callbacks.success.called);
                this.assertFalse(callbacks.failure.called);
                this.assertTrue(callbacks.timeout.calledOnce);

                this.assertTrue(!Connectivity.getState());
            }
        }
    });
})();