describe("Working connection", function () {
    beforeEach(function () {
        jasmine.Clock.useMock();

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
    });

    it("should call the success callback", function () {
        var callbacks = {
            success : function () {},
            failure : function () {}
        };

        spyOn(callbacks, "success");
        spyOn(callbacks, "failure");

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
});