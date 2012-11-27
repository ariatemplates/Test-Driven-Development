describe("Working connection", function () {
    var clock;
    var callbacks;
    before(function () {
        clock = sinon.useFakeTimers();

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
    });
    after(function () {
        clock.restore();
    });
    beforeEach(function () {
        callbacks = {
            success : sinon.spy(),
            failure : sinon.spy()
        };
    });

    it("should call the success callback", function () {
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

    it("should call the fail callback", function () {
        var request = {
            method : "GET",
            url : "/fail"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        expect(callbacks.failure.called).not.to.be.ok();

        // Let the time flow
        clock.tick(100);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.calledOnce).to.be.ok();

        expect(callbacks.failure.firstCall.args[0]).to.eql(request);
        expect(callbacks.failure.firstCall.args[1]).to.eql({
            status : 404,
            responseText : ""
        });
    });
});