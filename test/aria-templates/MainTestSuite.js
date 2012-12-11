Aria.classDefinition({
    $classpath : "MainTestSuite",
    $extends : "aria.jsunit.TestSuite",
    $constructor : function () {
        this.$TestSuite.constructor.call(this);

        this.addTests("tests.EventEmitter");
        this.addTests("tests.Request");
        this.addTests("tests.Queue");
        this.addTests("tests.Adapter");

        this.addTests("tests.integration.Adapter");
    }
});