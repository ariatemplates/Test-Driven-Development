describe("Adapter", function () {
    var callbacks;
    var clock;
    var server;

    before(function (callback) {
        sinon.FakeXMLHttpRequest.useFilters = true;
        sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
            return "./success./fail./timeout.".indexOf(url) === -1;
        });

        Connectivity.Adapter = null;

        Aria.load({
            classes : ["libraries.ConnectivityAdapter"],
            oncomplete : {
                fn : function () {
                    this.Adapter = libraries.ConnectivityAdapter;

                    clock = sinon.useFakeTimers();

                    server = sinon.fakeServerWithClock.create();
                    server.respondWith("/success", [200, {
                                "Content-Type" : "application/json"
                            }, '[{ "ok": true }]']);
                    server.respondWith("/fail", [404, {
                                "Content-Type" : "application/json"
                            }, '[{ "ok": false }]']);
                    server.autoRespondAfter = 100;

                    callback();
                },
                scope : Connectivity
            }
        });
    });

    after(function () {
        clock.restore();
        Connectivity.Adapter = null;
    });

    beforeEach(function () {
        callbacks = {
            success : sinon.spy(),
            failure : sinon.spy(),
            timeout : sinon.spy()
        };
    });

    it("should call the success callback", function () {
        var request = {
            url : "/success",
            timeout : 1000
        };

        Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

        // Time for a request
        clock.tick(100);
        server.respond();

        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();

        // Let the timeout run
        clock.tick(1000);

        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();
    });

    it("should call the fail callback", function () {
        var request = {
            url : "/fail",
            timeout : 1000
        };

        Connectivity.Adapter.send(request).then(callbacks.success, callbacks.failure, callbacks.timeout);

        // Time for a request
        clock.tick(100);
        server.respond();

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.calledOnce).to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();

        // Let the timeout run
        clock.tick(1000);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.calledOnce).to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();
    });
});