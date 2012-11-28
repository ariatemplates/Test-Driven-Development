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
                    var later = {
                        success : null,
                        failure : null
                    };

                    setTimeout(function () {
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
        },

        fail : function (test) {
            test.expect(5);

            var request = {
                method : "GET",
                url : "/fail"
            };

            Connectivity.send(request).then(callbacks.success, callbacks.failure);

            test.ok(!callbacks.failure.called);

            // Let the time flow
            clock.tick(100);

            test.ok(!callbacks.success.called);
            test.ok(callbacks.failure.calledOnce);

            test.deepEqual(callbacks.failure.firstCall.args[0], request);
            test.deepEqual(callbacks.failure.firstCall.args[1], {
                status : 404,
                responseText : ""
            });

            test.done();
        }
    };
})(this.test_request = {});