(function (exports) {
    var callbacks;
    var clock;
    var server;

    exports.Integration_Adapter = {

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

                Connectivity.setState(true);

                callback();
            },

            successCallback : function (test) {
                test.expect(6);

                var request = {
                    url : "/success",
                    timeout : 1000
                };

                Connectivity.on("connectivityChange", callbacks.timeout);
                Connectivity.send(request).then(callbacks.success, callbacks.failure);
                server.respond();

                // Lot of things might happen, just let the time flow
                clock.tick(3000);

                test.ok(callbacks.success.calledOnce);
                test.ok(!callbacks.failure.called);
                test.ok(!callbacks.timeout.called);

                test.deepEqual(callbacks.success.firstCall.args[0], request);
                test.deepEqual(callbacks.success.firstCall.args[1], {
                    status : 200,
                    responseText : '[{ "ok": true }]'
                });

                test.ok(Connectivity.getState());

                test.done();
            },

            failCallback : function (test) {
                test.expect(6);

                var request = {
                    url : "/fail",
                    timeout : 1000
                };

                Connectivity.on("connectivityChange", callbacks.timeout);
                Connectivity.send(request).then(callbacks.success, callbacks.failure);
                server.respond();

                // Lot of things might happen, just let the time flow
                clock.tick(3000);

                test.ok(!callbacks.success.called);
                test.ok(callbacks.failure.calledOnce);
                test.ok(!callbacks.timeout.called);

                test.deepEqual(callbacks.failure.firstCall.args[0], request);
                test.deepEqual(callbacks.failure.firstCall.args[1], {
                    status : 404,
                    responseText : '[{ "ok": false }]'
                });

                test.ok(Connectivity.getState());

                test.done();
            },

            connectivityState : function (test) {
                test.expect(4);

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

                test.ok(!callbacks.success.called);
                test.ok(!callbacks.failure.called);
                test.ok(callbacks.timeout.calledOnce);

                test.ok(!Connectivity.getState());

                test.done();
            }
        }
    };
})(this.test_integration_adapter = {});