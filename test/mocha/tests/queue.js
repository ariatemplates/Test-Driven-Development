describe("Queued requests", function () {
    var callbacks;
    var clock;

    before(function () {
        clock = sinon.useFakeTimers();

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
    });
    beforeEach(function () {
        callbacks = {
            success : sinon.spy(),
            failure : sinon.spy()
        };
    });

    it("should work the second time", function () {
        var request = {
            url : "/timeout/success"
        };

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        // retry timeout
        clock.tick(Connectivity.retry);

        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        expect(callbacks.success.firstCall.args[0]).to.eql(request);
        expect(callbacks.success.firstCall.args[1]).to.eql({
            status : 200,
            responseText : "OK"
        });
    });

    it("shuold work when we are back to normal connectivity", function () {
        var request = {
            url : "/timeout/timeout/success"
        };

        callbacks.event = sinon.spy();

        Connectivity.on("connectivityChange", callbacks.event);

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        // retry timeout
        clock.tick(Connectivity.retry);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        // two time outs -> change state
        expect(callbacks.event.calledOnce).to.be.ok();

        // retry again (one timeout + time to get the response)
        clock.tick(Connectivity.retry + 100);

        expect(callbacks.event.calledTwice).to.be.ok();
        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.success.firstCall.args[0]).to.eql(request);
        expect(callbacks.success.firstCall.args[1]).to.eql({
            status : 200,
            responseText : "OK"
        });
    });

    it("shuold work when we are back to normal connectivity even on failure", function () {
        var request = {
            url : "/timeout/timeout/fail"
        };

        callbacks.event = sinon.spy();

        Connectivity.on("connectivityChange", callbacks.event);

        Connectivity.send(request).then(callbacks.success, callbacks.failure);

        // Just the time to make a single request
        clock.tick(100);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        // retry timeout
        clock.tick(Connectivity.retry);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();

        // two time outs -> change state
        expect(callbacks.event.calledOnce).to.be.ok();

        // retry again (one timeout + time to get the response)
        clock.tick(Connectivity.retry + 100);

        expect(callbacks.event.calledTwice).to.be.ok();
        expect(callbacks.failure.calledOnce).to.be.ok();
        expect(callbacks.failure.firstCall.args[0]).to.eql(request);
        expect(callbacks.failure.firstCall.args[1]).to.eql({
            status : 404,
            responseText : "FAIL"
        });
    });
});