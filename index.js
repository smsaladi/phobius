// The html element we output console messages to
const output = document.getElementById('console');
// holds the current instance of the Phobius module.  Used to load files
var Module;
const default_args = ["preload/phobius.options", "preload/phobius.model", null]

function clearConsole() {
    output.innerHTML = "";
}

function logConsole(message, is_error) {
    // Output to JS console
    if (is_error) {
        console.error(message);
    } else {
        console.log(message);
    }

    // Output to console html element
    output.innerHTML = output.innerHTML + formatText(message, is_error);

    // Scroll to the end of the console
    output.scrollTop = output.scrollHeight;
}

//
//  Formats text to print correctly in HTML
//
function formatText(text, is_error) {
    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace('\n', '<br>', 'g');
    text = text.replace(/ /g, '&nbsp;');

    if(is_error) {
        return "<span class=error-text>" + text + "</span><br>"
    } else {
        return text + "<br>";
    }
}

function downloadConsole() {
    download("console.txt", output.innerText);
}

function download(filename, data) {
    var blob = new Blob([data], {type: 'text/csv'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

function updateFileLabel(element) {
    const file = element.files[0]
    const label = document.getElementById(element.id + "-label");
    const selector = document.getElementById(element.id + "-selector");

    if(file) {
        selector.classList.add("green");
        label.innerHTML = "(" + file.name + ")"
    } else {
        selector.classList.remove("green");
        label.innerHTML = "(default)"
    }
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
    inputs = document.querySelectorAll("input[type=file]");
    files = [];
    for (input of inputs) {
        files.push(await getFileData(input));
    }

    if(!files[files.length - 1]) {
        const sequence = document.getElementById("sequence-input").value;
        files[files.length - 1] = {name: "seq.txt", data: btoa(sequence)};
    }

    return files;
}

//
//  Initialize the module parameters given the input files
//
function initModuleParams(files, extra_args) {
    // Build the program arguments
    let args = ["-f"];
    let i = 0;
    for(const file of files) {
        // Fail if we are missing a file
        if(!file && !default_args[i]) {
            return false;
        }

        args.push(file ? file.name : default_args[i]);
        i++;
    }

    return {
        arguments: args.concat(extra_args),
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

function getExtraArgs() {
    const raw = document.getElementById("args").value;
    const formatted = raw.replace(/\s\s+/g, ' ').trim();
    return formatted.length > 0 ? formatted.split(" ") : [];
}

//
//  Sets up and runs the Phobius module
//
async function runPhobius() {
    files = await getFiles();
    extra_args = getExtraArgs();

    const module_parameters = initModuleParams(files, extra_args)
    if(module_parameters) {
        clearConsole();
        logConsole("Loading...", false);
        Module = Phobius(module_parameters);
    } else {
        logConsole("You must provide an input sequence!", true);
    }
}
