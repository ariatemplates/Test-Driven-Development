(function (exports) {
    var clock;
    var callbacks;
    exports.requestSuite = {
        setUp : function (callback) {
            clock = sinon.useFakeTimers();

            callbacks = {
                success : sinon.spy(),
                failure : sinon.spy()
            };

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

            callback();
        },

        tearDown : function (callback) {
            clock.restore();

            callback();
        },

        success : function (test) {
            test.expect(5);

            var request = {
                method : "GET",
                url : "/success"
            };

            Connectivity.send(request).then(callbacks.success, callbacks.failure);

            test.ok(!callbacks.success.called);

            // Let the time flow
            clock.tick(100);

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
})(this.test_request = {});