describe("Integration Adapter", function () {
    var callbacks;
    var server;
    var clock;

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

    beforeEach(function () {
        callbacks = {
            success : sinon.spy(),
            failure : sinon.spy(),
            timeout : sinon.spy()
        };

        Connectivity.setState(true);
    });

    after(function () {
        clock.restore();
        Connectivity.Adapter = null;
    });

    it("should call the success callback", function () {
        var request = {
            url : "/success",
            timeout : 1000
        };

        Connectivity.on("connectivityChange", callbacks.timeout);
        Connectivity.send(request).then(callbacks.success, callbacks.failure);
        server.respond();

        // Lot of things might happen, just let the time flow
        clock.tick(3000);

        expect(callbacks.success.calledOnce).to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();

        expect(callbacks.success.firstCall.args[0]).to.eql(request);
        expect(callbacks.success.firstCall.args[1]).to.eql({
            status : 200,
            responseText : '[{ "ok": true }]'
        });

        expect(Connectivity.getState()).to.be(true);
    });

    it("should call the fail callback", function () {
        var request = {
            url : "/fail",
            timeout : 1000
        };

        Connectivity.on("connectivityChange", callbacks.timeout);
        Connectivity.send(request).then(callbacks.success, callbacks.failure);
        server.respond();

        // Lot of things might happen, just let the time flow
        clock.tick(3000);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.calledOnce).to.be.ok();
        expect(callbacks.timeout.called).not.to.be.ok();

        expect(callbacks.failure.firstCall.args[0]).to.eql(request);
        expect(callbacks.failure.firstCall.args[1]).to.eql({
            status : 404,
            responseText : '[{ "ok": false }]'
        });

        expect(Connectivity.getState()).to.be(true);
    });

    it("should change the connectivity state", function () {
        var request = {
            url : "/timeout",
            timeout : 1000
        };

        Connectivity.on("connectivityChange", callbacks.timeout);
        Connectivity.send(request).then(callbacks.success, callbacks.failure);
        // no server response

        clock.tick(1500);

        // second request
        Connectivity.send(request).then(callbacks.success, callbacks.failure);
        clock.tick(15000);

        // this accounts for the yelding inside the Adapter
        clock.tick(100);

        expect(callbacks.success.called).not.to.be.ok();
        expect(callbacks.failure.called).not.to.be.ok();
        expect(callbacks.timeout.calledOnce).to.be.ok();

        expect(Connectivity.getState()).to.be(false);
    });
});