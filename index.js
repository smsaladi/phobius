// The html element we output console messages to
const output = document.getElementById('console');
// holds the current instance of the Phobius module.  Used to load files
var Instance;

function clearConsole() {
    output.innerHTML = "";
}

function logConsole(message, is_error) {
    // Format message to print correctly in HTML
    message = message.replace(/&/g, "&amp;");
    message = message.replace(/</g, "&lt;");
    message = message.replace(/>/g, "&gt;");
    message = message.replace('\n', '<br>', 'g');

    if (is_error) {
        console.error(message);
        output.innerHTML = output.innerHTML + "<span class=error-text>" + message + "</span><br>";
    } else {
        console.log(message);
        output.innerHTML = output.innerHTML + message + "<br>";
    }

    // Scroll to the end of the console
    output.scrollTop = output.scrollHeight;
}

//
//  Reads file data from the input_element and base 64 encodes it
//
async function getFileData(input_element) {
    return new Promise(function(resolve, reject) {
        // Get the file from the html element
        const file = input_element.files[0];
        if(!file) {
            resolve(null);
        }

        // Start reading from the file
        const reader = new FileReader();
        reader.readAsDataURL(file);

        // Wait until we finish reading the file
        reader.addEventListener("load", function() {
            // Trim the padding on the data
            base64_data = reader.result.substring(reader.result.indexOf(",") + 1);
            resolve({name: file.name, data: base64_data});
        }, false);
    });
}

//
//  Synchronously reads file data from all input elements on the page
//
async function getFiles() {
    inputs = document.getElementsByTagName('input');
    files = [];
    for (input of inputs) {
        files.push(await getFileData(input));
    }
    return files;
}

//
//  Initialize the module parameters given the input files
//
function initModuleParams(files) {
    // Build the program arguments
    let args = ["-f"];
    for(const file of files) {
        // Fail if we are missing a file
        if(!file) {
            return false;
        }

        args.push(file.name);
    }

    return {
        arguments: args,
        preRun: [function() {
            // Mount the files to the Module
            let mounted_files = {};
            for(const file of files) {
                // Don't load the same file twice
                if(mounted_files[file.name]) {
                    continue;
                }

                try {
                    mounted_files[file.name] =
                        Module["FS_createDataFile"](".", file.name, atob(file.data), true, true);
                    logConsole("Loaded file " + file.name + " successfully", false)
                } catch (e) {
                    logConsole("Could not load file " + file.name, true);
                    console.error(e);
                }
            }
            clearConsole();
        }],
        postRun: [],
        print: function(text) {
            if (arguments.length > 1) {
                text = Array.prototype.slice.call(arguments).join(' ');
            }
            logConsole(text, false);
        },
        printErr: function(text) {
            if (arguments.length > 1) {
                text = Array.prototype.slice.call(arguments).join(' ');
            }
            logConsole(text, true);
        }
    }
}

//
//  Sets up and runs the Phobius module
//
async function runPhobius() {
    files = await getFiles();

    const module_parameters = initModuleParams(files)
    if(module_parameters) {
        clearConsole();
        logConsole("Loading...", false);
        Module = Phobius(module_parameters);
    } else {
        logConsole("You must provide a model, options, and sequence file!", true);
    }
}
