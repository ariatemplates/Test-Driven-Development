describe("Working connection", function () {
    var clock;
    before(function () {
        clock = sinon.useFakeTimers();

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
    after(function () {
        clock.restore();
    });

    it("should call the success callback", function () {
        var callbacks = {
            success : function () {},
            failure : function () {}
        };

        sinon.spy(callbacks, "success");
        sinon.spy(callbacks, "failure");

        var request = {
            method : "GET",
            url : "/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        expect(callbacks.success.called).not.to.be.ok();

        // Let the time flow
        clock.tick(100);

        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        expect(callbacks.success.firstCall.args[0]).to.eql(request);
        expect(callbacks.success.firstCall.args[1]).to.eql({
            status : 200,
            responseText : "OK"
        });
    });
});