(function () {
    var callbacks;
    var clock;

    Aria.classDefinition({
        $classpath : "tests.Queue",
        $extends : "aria.jsunit.TestCase",
        $prototype : {
            setUp : function () {
                clock = sinon.useFakeTimers();

                callbacks = {
                    success : sinon.spy(),
                    failure : sinon.spy()
                };

                // Retry a connection in 1 second
                Connectivity.retry = 1000;
                Connectivity.off();
                Connectivity.setState(true);

                var times = {};
                Connectivity.Adapter = {
                    send : function (request) {
                        var later = {
                            success : null,
                            failure : null,
                            timeout : null
                        };
                        if (!times[request.url]) {
                            times[request.url] = 0;
                        }
                        times[request.url] += 1;

                        setTimeout(function () {
                            var howManyTimes = times[request.url];
                            var action = request.url.split("/")[howManyTimes];

                            if (action === "success") {
                                later.success.call(null, {
                                    status : 200,
                                    responseText : "OK"
                                });
                            } else if (action === "fail") {
                                later.failure.call(null, {
                                    status : 404,
                                    responseText : "FAIL"
                                });
                            } else {
                                later.timeout.call();
                            }
                        }, 50);

                        // Basic implementation of promises!
                        return {
                            then : function (success, fail, timeout) {
                                later.success = success;
                                later.failure = fail;
                                later.timeout = timeout;
                            }
                        };
                    }
                };
            },

            tearDown : function () {
                clock.restore();
            },

            testSuccess : function () {
                var request = {
                    url : "/timeout/success"
                };

                Connectivity.send(request).then(callbacks.success, callbacks.failure);

                // Just the time to make a single request
                clock.tick(100);

                this.assertFalse(callbacks.success.called);
                this.assertFalse(callbacks.failure.called);

                // retry timeout
                clock.tick(Connectivity.retry);

                this.assertTrue(callbacks.success.calledOnce);
                this.assertFalse(callbacks.failure.called);

                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[0], request));
                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[1], {
                    status : 200,
                    responseText : "OK"
                }));
            }
        }

    });
})();