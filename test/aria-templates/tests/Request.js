(function (exports) {
    var clock;
    var callbacks;

    Aria.classDefinition({
        $classpath : "tests.Request",
        $extends : "aria.jsunit.TestCase",
        $dependencies : ["aria.utils.Json"],
        $prototype : {
            setUp : function () {
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
            },

            tearDown : function (callback) {
                clock.restore();
            },

            testSuccess : function (test) {
                var request = {
                    method : "GET",
                    url : "/success"
                };

                Connectivity.send(request).then(callbacks.success, callbacks.failure);

                this.assertFalse(callbacks.success.called);

                // Let the time flow
                clock.tick(100);

                this.assertTrue(callbacks.success.calledOnce);
                this.assertFalse(callbacks.failure.called);

                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[0], request));
                this.assertTrue(aria.utils.Json.equals(callbacks.success.firstCall.args[1], {
                    status : 200,
                    responseText : "OK"
                }));
            },

            testFail : function (test) {
                var request = {
                    method : "GET",
                    url : "/fail"
                };

                Connectivity.send(request).then(callbacks.success, callbacks.failure);

                this.assertFalse(callbacks.failure.called);

                // Let the time flow
                clock.tick(100);

                this.assertFalse(callbacks.success.called);
                this.assertTrue(callbacks.failure.calledOnce);

                this.assertTrue(aria.utils.Json.equals(callbacks.failure.firstCall.args[0], request));
                this.assertTrue(aria.utils.Json.equals(callbacks.failure.firstCall.args[1], {
                    status : 404,
                    responseText : ""
                }));
            }
        }
    });
})();