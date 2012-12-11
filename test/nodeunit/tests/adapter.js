(function (exports) {
    var callbacks;
    var clock;
    var server;

    exports.suiteAdapter = {

        setUp : function (callback) {
            // We use nested groups, this setUp is equivalent to a 'before'

            sinon.FakeXMLHttpRequest.useFilters = true;
            sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
                return "./success./fail./timeout.".indexOf(url) === -1;
            });

            Connectivity.Adapter = null;

            Aria.load({
                classes : ["libraries.ConnectivityAdapter"],
                oncomplete : {
                    fn : function () {
                        this.Adapter = libraries.ConnectivityAdapter;

                        clock = sinon.useFakeTimers();

                        server = sinon.fakeServerWithClock.create();
                        server.respondWith("/success", [200, {
                                    "Content-Type" : "application/json"
                                }, '[{ "ok": true }]']);
                        server.respondWith("/fail", [404, {
                                    "Content-Type" : "application/json"
                                }, '[{ "ok": false }]']);
                        server.autoRespondAfter = 100;

                        callback();
                    },
                    scope : Connectivity
                }
            });
        },

        tearDown : function (callback) {
            clock.restore();
            Connectivity.Adapter = null;
            callback();
        },

        tests : {
            setUp : function (callback) {
                // In this inner group, this setUp is equivalent to a 'beforeEach'

                callbacks = {
                    success : sinon.spy(),
                    failure : sinon.spy(),
                    timeout : sinon.spy()
                };

                callback();
            },

            successCallback : function (test) {
                test.expect(6);

                var request = {
                    url : "/success",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);
                server.respond();

                test.ok(callbacks.success.calledOnce);
                test.ok(!callbacks.failure.called);
                test.ok(!callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                test.ok(callbacks.success.calledOnce);
                test.ok(!callbacks.failure.called);
                test.ok(!callbacks.timeout.called);

                test.done();
            },

            failCallback : function (test) {
                test.expect(6);

                var request = {
                    url : "/fail",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);
                server.respond();

                test.ok(!callbacks.success.called);
                test.ok(callbacks.failure.calledOnce);
                test.ok(!callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                test.ok(!callbacks.success.called);
                test.ok(callbacks.failure.calledOnce);
                test.ok(!callbacks.timeout.called);

                test.done();
            },

            timeoutCallback : function (test) {
                test.expect(6);

                var request = {
                    url : "/timeout",
                    timeout : 1000
                };

                Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

                // Time for a request
                clock.tick(100);

                test.ok(!callbacks.success.called);
                test.ok(!callbacks.failure.called);
                test.ok(!callbacks.timeout.called);

                // Let the timeout run
                clock.tick(1000);

                test.ok(!callbacks.success.called);
                test.ok(!callbacks.failure.called);
                test.ok(callbacks.timeout.calledOnce);

                test.done();
            }
        }
    };
})(this.test_adapter = {});