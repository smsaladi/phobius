(function(){
    function encodeParams(obj) {
        return JSON.stringify(obj, function (key, value) {
            var body;
            if (value instanceof Function || typeof value === 'function') {
                body = value.toString();
                return body;
            }

            return value;
        });
    }

    function ModuleWrapper() {}

    ModuleWrapper.prototype.instantiate = (function(Module, args, files, print, printErr) {
        const module_worker = new Worker('worker.js');
        var params = [Module, args, files, print, printErr];
        var encoded = encodeParams(params);
        module_worker.postMessage(encoded);

        module_worker.onmessage = function(e) {
            const message = e.data;
            if(message.isError) {
                printErr(message.text)
            } else {
                print(message.text)
            }
        }
    });

    window.ModuleWrapper = new ModuleWrapper();
}());
