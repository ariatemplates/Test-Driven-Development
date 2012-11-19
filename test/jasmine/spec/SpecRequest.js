describe("Connection", function () {
    var callbacks;

    beforeEach(function () {
        jasmine.Clock.useMock();

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

        callbacks = {
            success : function () {},
            failure : function () {}
        };

        spyOn(callbacks, "success");
        spyOn(callbacks, "failure");
    });

    it("should call the success callback", function () {
        var request = {
            method : "GET",
            url : "/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        expect(callbacks.success).not.toHaveBeenCalled();

        // Let the time flow
        jasmine.Clock.tick(100);

        expect(callbacks.success).toHaveBeenCalled();
        expect(callbacks.failure).not.toHaveBeenCalled();

        expect(callbacks.success.calls[0].args[0]).toEqual(request);
        expect(callbacks.success.calls[0].args[1]).toEqual({
            status : 200,
            responseText : "OK"
        });
    });

    it("should call the fail callback", function () {
        var request = {
            method : "GET",
            url : "/fail"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        expect(callbacks.failure).not.toHaveBeenCalled();

        // Let the time flow
        jasmine.Clock.tick(100);

        expect(callbacks.success).not.toHaveBeenCalled();
        expect(callbacks.failure).toHaveBeenCalled();

        expect(callbacks.failure.calls[0].args[0]).toEqual(request);
        expect(callbacks.failure.calls[0].args[1]).toEqual({
            status : 404,
            responseText : ""
        });
    });
});