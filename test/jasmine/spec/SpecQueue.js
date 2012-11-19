describe("Queued requests", function () {
    var callbacks;

    beforeEach(function () {
        jasmine.Clock.useMock();

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

        callbacks = {
            success : function () {},
            failure : function () {}
        };

        spyOn(callbacks, "success");
        spyOn(callbacks, "failure");
    });

    it("should work the second time", function () {
        var request = {
            url : "/timeout/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        jasmine.Clock.tick(100);

        expect(callbacks.success).not.toHaveBeenCalled();
        expect(callbacks.failure).not.toHaveBeenCalled();

        // retry timeout
        jasmine.Clock.tick(Connectivity.retry);

        expect(callbacks.success).toHaveBeenCalled();
        expect(callbacks.failure).not.toHaveBeenCalled();

        expect(callbacks.success.calls[0].args[0]).toEqual(request);
        expect(callbacks.success.calls[0].args[1]).toEqual({
            status : 200,
            responseText : "OK"
        });
    });
});