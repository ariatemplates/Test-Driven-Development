(function (exports) {
    var callbacks;
    var clock;

    exports.queue = {
        setUp : function (callback) {
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

            callback();
        },

        tearDown : function (callback) {
            clock.restore();

            callback();
        },

        success : function (test) {
            test.expect(6);

            var request = {
                url : "/timeout/success"
            };

            Connectivity.send(request).then(callbacks.success, callbacks.failure);

            // Just the time to make a single request
            clock.tick(100);

            test.ok(!callbacks.success.called);
            test.ok(!callbacks.failure.called);

            // retry timeout
            clock.tick(Connectivity.retry);

            test.ok(callbacks.success.calledOnce);
            test.ok(!callbacks.failure.called);

            test.deepEqual(callbacks.success.firstCall.args[0], request);
            test.deepEqual(callbacks.success.firstCall.args[1], {
                status : 200,
                responseText : "OK"
            });

            test.done();
        }
    };
})(this.test_queue = {});