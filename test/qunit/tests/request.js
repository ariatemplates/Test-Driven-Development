(function () {
    var callbacks;
    module("Working connection", {
        setup : function () {
            callbacks = {
                success : sinon.spy(),
                failure : sinon.spy()
            };

            // This adapter always makes the connection pass
            Connectivity.Adapter = {
                send : function (request) {
                    var later = {
                        success : null,
                        failure : null
                    };

                    console.log("adding");
                    setTimeout(function () {
                        console.log("calling");
                        if (request.url === "/success") {
                            later.success.call(null, {
                                status : 200,
                                responseText : "OK"
                            });
                        } else {
                            later.failure.call(null, {
                                status : 404,
                                responseText : ""
                            });
                        }
                    }, 50);

                    // Basic implementation of promises!
                    return {
                        then : function (success, fail) {
                            later.success = success;
                            later.failure = fail;
                        }
                    };
                }
            };
        }
    });

    test("call the success callback", function () {
        var clock = this.sandbox.useFakeTimers();

        var request = {
            method : "GET",
            url : "/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        ok(!callbacks.success.called);

        // Let the time flow
        clock.tick(100);

        ok(callbacks.success.calledOnce);
        ok(!callbacks.failure.called);

        deepEqual(callbacks.success.firstCall.args[0], request);
        deepEqual(callbacks.success.firstCall.args[1], {
            status : 200,
            responseText : "OK"
        });

        clock.restore();
    });

    test("call the fail callback", function () {
        var clock = this.sandbox.useFakeTimers();

        var request = {
            method : "GET",
            url : "/fail"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        ok(!callbacks.failure.called);

        // Let the time flow
        clock.tick(100);

        ok(!callbacks.success.called);
        ok(callbacks.failure.calledOnce);

        deepEqual(callbacks.failure.firstCall.args[0], request);
        deepEqual(callbacks.failure.firstCall.args[1], {
            status : 404,
            responseText : ""
        });

        clock.restore();
    });
})();