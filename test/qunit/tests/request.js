module("Working connection", {
    setup : function () {
        // This adapter always makes the connection pass
        Connectivity.Adapter = {
            send : function (request) {
                var later = null;

                setTimeout(function () {
                    if (later) {
                        later.call(null, {
                            status : 200,
                            responseText : "OK"
                        });
                    }
                }, 50);

                // Basic implementation of promises!
                return {
                    then : function (success) {
                        later = success;
                    }
                };
            }
        };
    }
});

test("call the success callback", function () {

    var clock = this.sandbox.useFakeTimers();

    var callbacks = {
        success : function () {},
        failure : function () {}
    };

    this.spy(callbacks, "success");
    this.spy(callbacks, "failure");

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
});