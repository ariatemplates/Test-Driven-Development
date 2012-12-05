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
            }
        }
    });
})();