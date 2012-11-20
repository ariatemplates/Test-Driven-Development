(function () {
    var callbacks;

    module("Queue", {
        setup : function () {
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
        }
    });

    test("work the second time", function () {
        var clock = this.sandbox.useFakeTimers();

        var request = {
            url : "/timeout/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        ok(!callbacks.success.called);
        ok(!callbacks.failure.called);

        // retry timeout
        clock.tick(Connectivity.retry);

        ok(callbacks.success.calledOnce);
        ok(!callbacks.failure.called);

        deepEqual(callbacks.success.firstCall.args[0], request);
        deepEqual(callbacks.success.firstCall.args[1], {
            status : 200,
            responseText : "OK"
        });

        clock.restore();
    });

    test("work when we are back to normal connectivity", function () {
        var clock = this.sandbox.useFakeTimers();
        var request = {
            url : "/timeout/timeout/success"
        };

        callbacks.event = this.spy();

        Connectivity.on("connectivityChange", callbacks.event);

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        ok(!callbacks.success.called);
        ok(!callbacks.failure.called);

        // retry timeout
        clock.tick(Connectivity.retry);

        ok(!callbacks.success.called);
        ok(!callbacks.failure.called);

        // retry again (one timeout + time to get the response)
        clock.tick(Connectivity.retry + 100);

        ok(callbacks.event.calledTwice);
        ok(callbacks.success.calledOnce);
        deepEqual(callbacks.success.firstCall.args[0], request);
        deepEqual(callbacks.success.firstCall.args[1], {
            status : 200,
            responseText : "OK"
        });

        clock.restore();
    });

    test("work when we are back to normal connectivity even on failure", function () {
        var clock = this.sandbox.useFakeTimers();
        var request = {
            url : "/timeout/timeout/fail"
        };

        callbacks.event = this.spy();

        Connectivity.on("connectivityChange", callbacks.event);

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        ok(!callbacks.success.called);
        ok(!callbacks.failure.called);

        // retry timeout
        clock.tick(Connectivity.retry);

        ok(!callbacks.success.called);
        ok(!callbacks.failure.called);

        // two time outs -> change state
        ok(callbacks.event.calledOnce);

        // retry again (one timeout + time to get the response)
        clock.tick(Connectivity.retry + 100);

        ok(callbacks.event.calledTwice);
        ok(callbacks.failure.calledOnce);
        deepEqual(callbacks.failure.firstCall.args[0], request);
        deepEqual(callbacks.failure.firstCall.args[1], {
            status : 404,
            responseText : "FAIL"
        });
    });
})();