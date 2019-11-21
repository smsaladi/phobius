// The html element we output console messages to
const console_element = document.getElementById('console');
// The default options and model files to fall back to
const default_files = ["preload/phobius.options", "preload/phobius.model"]
// The element ids of the file selectors containing the options and model files
const file_elements = ["options", "model"]

const default_sequence = `>tr|M1VDK2|M1VDK2_CYAM1
SVMLPPVAFLPQPVRPGTRSKRKPEARVKRQKRALRRRVPCQSSLTPSRSQAPKALFPGDVEAWLRAAAKRRQRLQSPDSGVLLVLAALVGAGTGLGVTLFKTAIRGVSDFGYGDTVAGALLPFVGSLNLIAVPTMGGACVSFLKLRFGALDGGIEAMLRSMEKNERFQSAGAIVKAIAAVFTLGSGCSLGPEGPSVEIGASVARLIPQWASERLQWRLSSERLRQLFACGCAAGVAAGFNAPFAGVLFANEIAQRAGGNHTESGTGASTTPALLVASALSSLVARLGLGERPAFSIPNYDLRNPLLELPLYLGLGFLAGLASLGFRKALLLGQNLYQCTGLRRIPVAWRPLCGGLLNGMVGFVFPQILFFGYDMLDALLADTNFSIPLLAGLLFLKPLMTAASLGSGLVGGTFAPALFVGANLGALYCKSIECAGNALLAIVFKTLGATTATALSGSIPIAGPPAYAMVGMAAVLAGMFRAPLTGCLLLFEMTRDYRIILPLMAGVGVSTWIADDTRQQVRASPSAYATKRNEGPSPLYLGLRPDAEFRSVAACLSVRDGLSPLKPVFLDAQCSVSVALERFRPLEHGCILVTTTMPVEQIQGLVTVRDLLRAKSEFGALQGITLGEICSTDFESISLEEPLVRALEILESNSAPLLPVVVGTTTEERGRSEQPNGAYESPSRMKISPSMVCGFVDLTSIERAVQFSRLQMAAREPDGPS`
document.getElementById("sequence-input").value = default_sequence;

/*******************************************************************************
 *                                                                             *
 *                              CONSOLE FUNCTIONS                              *
 *                                                                             *
 ******************************************************************************/

/**
 *  This function clears out all text in the console
 */
function clearConsole() {
    console_element.innerHTML = "";
}

/**
 *  This function prints text to the console
 *
 *  @param text the text to print to the console
 */
function printText(text) {
    console.log(text);
    console_element.innerHTML += formatText(text);

    // Scroll to the end of the console
    console_element.scrollTop = console_element.scrollHeight;
}

/**
 *  This function prints an error message to the console
 *
 *  @param text the error text to print to the console
 */
function printError(text) {
    console.error(text);
    console_element.innerHTML += "<span class=error-text>" + formatText(text) + "</span>";

    // Scroll to the end of the console
    console_element.scrollTop = console_element.scrollHeight;
}

function printCommand(text) {
    console_element.innerHTML += "<span class=console-command>" + formatText(text) + "</span>";

    // Scroll to the end of the console
    console_element.scrollTop = console_element.scrollHeight;
}

/**
 *  This function formats text to print correctly in HTML
 */
function formatText(text) {
    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace('\n', '<br>', 'g');
    text = text.replace(/ /g, '&nbsp;');

    return text + "<br>";
}

/**
 *  This function downloads the text currently in the console
 */
function downloadConsole() {
    const filename = "console.txt";
    const data = console_element.innerText;

    // Write the console data to a new blob
    const blob = new Blob([data], {type: 'text/csv'});

    // Download the blob
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}


/*******************************************************************************
 *                                                                             *
 *                           FILE SELECTOR FUNCTIONS                           *
 *                                                                             *
 ******************************************************************************/

/**
 *  This function updates the label of a file selector
 */
function updateFileLabel(element, default_text) {
    const file = element.files[0]
    const label = document.getElementById(element.id + "-label");
    const selector = document.getElementById(element.id + "-selector");

    if(file) {
        selector.classList.add("green");
        label.innerHTML = "(" + file.name + ")"
    } else {
        selector.classList.remove("green");
        label.innerHTML = "(" + default_text + ")"
    }
}

/**
 *  This function reads file data from the input_element and base 64 encodes it
 */
async function getFileData(input_element) {
    return new Promise(function(resolve, reject) {
        // Get the file from the html element
        const file = input_element.files[0];
        if(!file) {
            resolve(null);
        }

        // Start reading from the file
        const reader = new FileReader();
        reader.readAsText(file);

        // Wait until we finish reading the file
        reader.addEventListener("load", function() {
            // Trim the padding on the data
            filedata = reader.result.substring(reader.result.indexOf(",") + 1);
            resolve({name: file.name, data: filedata});
        }, false);
    });
}

/**
 *  This function gets the options and model files the user specified
 *
 *  @param files an array that the files should be added to
 *  @param args an array containing the command line arguments passed to phobius
 */
async function getFiles(files, args) {
    args.push("-f");
    for(let i = 0; i < file_elements.length; i++) {
        const file_element = document.getElementById(file_elements[i]);
        const file = await getFileData(file_element);
        if(file) {
            args.push(file.name);
            files.push(file);
        } else {
            args.push(default_files[i]);
        }
    }
}

/**
 *  This function gets the sequence data specified by the user from the file
 *  selector or the textarea
 *
 *  @param files an array that the files should be added to
 *  @param args an array containing the command line arguments passed to phobius
 */
async function getSequenceData(files, args) {
    const sequence_element = document.getElementById("sequence");
    sequence_file = await getFileData(sequence_element);
    if(!sequence_file) {
        const sequence_data = document.getElementById("sequence-input").value;
        sequence_file = {name: "seq.txt", data: sequence_data};
    }
    args.push(sequence_file.name);
    files.push(sequence_file);
}

/**
 *  This function gets extra program arguments from the args field
 */
function getUserArgs() {
    const raw = document.getElementById("args").value;
    const formatted = raw.replace(/\s\s+/g, ' ').trim();
    return formatted.length > 0 ? formatted.split(" ") : [];
}

/*******************************************************************************
 *                                                                             *
 *                             GRAPHICS FUNCTIONS                              *
 *                                                                             *
 ******************************************************************************/

/**
 *  This function sets up the graphics to display given the output from phobius
 *
 *  @param output the output from phobius
 */
function createGraphics(output) {
    const graphics_element = document.getElementById("graphics");
    console.log(output)

    // TODO: replace placeholder image with actual graphics
    graphics_element.innerHTML = "<h2>Title here</h2>";
    graphics_element.innerHTML += "<img src='placeholder.png' width='100%'>";

    // TODO: return true if the graphics were created successfully, false if
    // something was wrong with the input
    return true;
}

/**
 *  This function shows the graphics modal
 */
function showGraphics() {
    const graphics = document.querySelector(".graphics");
    const graphics_container = document.querySelector(".graphics-container");

    document.querySelector(".show-graphics").classList.remove("hidden");
    graphics_container.classList.remove("hidden");

    graphics.classList.remove("fadeOutUp");
    graphics.classList.add("fadeInDown");
    graphics_container.classList.remove("fadeOut");
    graphics_container.classList.add("fadeIn");
}

/**
 *  This function hides the graphics modal
 */
function hideGraphics() {
    const graphics = document.querySelector(".graphics");
    const graphics_container = document.querySelector(".graphics-container");

    graphics.classList.add("fadeOutUp");
    graphics.classList.remove("fadeInDown");
    graphics_container.classList.add("fadeOut");
    graphics_container.classList.remove("fadeIn");

    setTimeout(()=>graphics_container.classList.add("hidden"), 250);
}

/**
 *  This function sets up and runs the phobius module
 */
async function runPhobius() {
    let files = [], args = [];

    // Get options and model files
    await getFiles(files, args);

    // Get sequence file
    await getSequenceData(files, args);

    // Add user specified arguments
    args = args.concat(getUserArgs());

    // Log the command we are using
    clearConsole();
    printCommand("$ ./decodeanhmm " + args.join(" "));

    await ModuleWrapper.instantiate(Phobius, args, files, printText, printError);

    if(createGraphics(console_element.innerText)) {
        showGraphics();
    }
}
