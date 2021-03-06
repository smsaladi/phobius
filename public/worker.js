var InstantiateModule = (function(Module, args, files) {
    var Instance = null;

    const params = {
        arguments: args,
        preRun: [function() {
            // Mount the files to the Module
            let mounted_files = {};
            for(const file of files) {
                // Don't load the same file twice
                if(!file || mounted_files[file.name]) {
                    continue;
                }

                try {
                    mounted_files[file.name] =
                        Instance["FS_createDataFile"](".", file.name, file.data, true, true);
                } catch (e) {
                    sendConsoleMessage("Could not load file " + file.name, true);
                    console.error(e);
                }
            }
        }],
        postRun: [function() {
            postMessage({
                type: "complete"
            });
        }],
        print: function(text) {
            if (arguments.length > 1) {
                text = Array.prototype.slice.call(arguments).join(' ');
            }
            sendConsoleMessage(text, false)
        },
        printErr: function(text) {
            if (arguments.length > 1) {
                text = Array.prototype.slice.call(arguments).join(' ');
            }
            sendConsoleMessage(text, true)
        }
    }

    Instance = Module(params);
});

function decodeParams(str) {
    return JSON.parse(str, function (key, value) {
        if (typeof value !== 'string' || value.length < 8) {
            return value;
        }

        let prefix = value.substring(0, 8);
        if (prefix === 'function') {
            header = `(function() {
                var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
                return (`

            return eval(header + value + ');})();');
        }

        return value;
    });
}

function sendConsoleMessage(message, isError) {
    postMessage({
        type: "console",
        isError: isError,
        text: message
    });
}

onmessage = function(e) {
    params = decodeParams(e.data)
    InstantiateModule(params[0], params[1], params[2], params[3], params[4]);
}
