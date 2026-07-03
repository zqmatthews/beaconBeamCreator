let finder;
let maker;

window.onload = function() {
    customColorBuild();
    buildSlider();
    createFinder();
    createMaker();
    updateStartBeacon();
    updateTargetBeacon();
}

function createFinder(){
    finder = new Worker("find-color.js");
    finder.onmessage = function(event){
        if(event.data.status === 'complete'){
            if(event.data.foundTarget){
                buildOutput(true, true, event.data.targetColor, true, 
                    event.data.foundColor, event.data.foundColor, 
                    event.data.combination, event.data.combination, 
                    event.data.deltaE, event.data.deltaE, 
                    event.data.depth, event.data.colsFound);
            } else if(event.data.rgbAndCIELABEqual){
                buildOutput(true, false, event.data.targetColor, true, 
                    event.data.foundColor, event.data.foundColor, 
                    event.data.combination, event.data.combination, 
                    event.data.deltaE, event.data.deltaE, 
                    event.data.depth, event.data.colsFound);
            } else {
                buildOutput(true, false, event.data.targetColor, false, 
                    event.data.foundColorRGB, event.data.foundColorCIELAB, 
                    event.data.combinationRGB, event.data.combinationCIELAB, 
                    event.data.deltaE_RGB, event.data.deltaE_CIELAB, 
                    event.data.depth, event.data.colsFound);
            }
        }
        if(event.data.status === 'inprogress'){
            if(event.data.foundTarget){
                buildOutput(false, true, event.data.targetColor, true, 
                    event.data.foundColor, event.data.foundColor, 
                    event.data.combination, event.data.combination, 
                    event.data.deltaE, event.data.deltaE, 
                    event.data.depth, event.data.colsFound);
            } else if(event.data.rgbAndCIELABEqual){
                buildOutput(false, false, event.data.targetColor, true, 
                    event.data.foundColor, event.data.foundColor, 
                    event.data.combination, event.data.combination, 
                    event.data.deltaE, event.data.deltaE, 
                    event.data.depth, event.data.colsFound);
            } else {
                buildOutput(false, false, event.data.targetColor, false, 
                    event.data.foundColorRGB, event.data.foundColorCIELAB, 
                    event.data.combinationRGB, event.data.combinationCIELAB, 
                    event.data.deltaE_RGB, event.data.deltaE_CIELAB, 
                    event.data.depth, event.data.colsFound);
            }
        }
        if(event.data.status === 'noglass'){
            alert("No Glass Selected!");
            abortFinder();
        }
    }
}

function abortFinder(){
    finder.terminate();
    createFinder();
    document.getElementById('startColor').disabled = false;
    document.getElementById('targetColor').disabled = false;
    document.getElementById('find').disabled = false;
    document.getElementById('modes').disabled = false;
    getColors(false);
    document.getElementById('selectColorMode').disabled = false;
    document.getElementById('glass-limit').disabled = false;

    document.getElementById('finalNumberInfo').style.display = 'block';
    document.getElementById('finalNumberInfo').style.minWidth = "0px";
    document.getElementById('finalNumberInfo').style.maxWidth = "" + (document.getElementById('rgbBeaconCompare').scrollWidth - 10) + "px";
    document.getElementById('finalNumberInfo').innerHTML = '<b>Calculations Aborted!</b>';
    document.getElementById('finalNumberInfo').style.backgroundColor = "#c80000"
    document.getElementById('in-progress').style.display = 'none';
}

function createMaker(){
    maker = new Worker("make-color.js");
    maker.onmessage = function(event){
        makerBeacon(event.data.beaconWhite, event.data.finalRGB, event.data.beaconCombo);
    }
    getColors();
}

function makerButtons(glass){
    let optionElement = document.getElementById('glassOptions');
    let optionContainer = document.createElement('div');
    for(var g = 0; g < glass.length; g++){
        let newOption = document.createElement('img');
        newOption.src = glass[g].img64;
        newOption.title = glass[g].name + " Stained Glass (Click to Add) [" + glass[g].hex + "]";
        newOption.alt = glass[g].name + " Stained Glass (Click to Add)";
        let optionGlass = glass[g];
        newOption.onclick = function() {makerAddGlass(optionGlass)}
        newOption.style.padding = "2px";
        newOption.style.borderWidth = "2px";
        newOption.style.borderStyle = "dashed";
        newOption.style.borderColor = "#ffffff";
        optionContainer.append(newOption);
    }
    optionElement.replaceWith(optionContainer);
    optionContainer.id = 'glassOptions';
    optionContainer.style.maxWidth = "288px";
}

function clearBeacon(){
    maker.postMessage({
        action: 'justBeacon'
    })
}

function makerAddGlass(glass){
    maker.postMessage({
        action: 'addGlass',
        glass: glass
    })
    document.getElementById('clearMaker').style.display = '';
}

function removeGlass(index){
    maker.postMessage({
        action: 'removeGlass',
        index: index
    })
}

function makerBeacon(defaultWhite, finalColor, combination){
    let beaconHolder = document.createElement('div');
    beaconHolder.style.position = "relative";
    beaconHolder.style.width = "64px";

    let minSegments = Math.ceil(document.getElementById('beaconBuildInfo').scrollHeight/64) - 3;
    let simplyBeam = 2;
    if(combination.length < minSegments || typeof combination.length === 'undefined'){
        if(typeof combination.length === 'undefined'){
            simplyBeam += minSegments;
            document.getElementById('clearMaker').style.display = 'none';
        } else {
            simplyBeam += minSegments - combination.length;
        }
    }

    for(var i = 0; i < simplyBeam; i++){
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(finalColor),(finalColor),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        section.style.height = "64px";
        beaconHolder.append(section);
    }

    /*Deal With Combo*/
    for(var g = (combination.length-1); g > -1; g--){
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        let glass = document.createElement('img');
        glass.src = combination[g].glass.img64;
        glass.title = combination[g].glass.name + " Stained Glass (Click to Remove)";
        glass.alt = combination[g].glass.name + " Stained Glass (Click to Remove)";
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(combination[g].color),(combination[g].color),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        let localIndex = g;
        section.onclick = function() {removeGlass(localIndex)};
        glass.style.position = "absolute";
        glass.style.top = "0";
        glass.style.left = "0";
        section.style.height = "64px";
        section.append(glass);
        beaconHolder.append(section);
    }

    let beaconSection = document.createElement('div');
    let defaultWhiteBeam = document.createElement('canvas');
    let beacon = document.createElement('img');
    beacon.src = "./imgs/64x64/beacon_block.png";
    beacon.title = "Minecraft Beacon Block";
    beacon.alt = "Minecraft Beacon Block";
    beaconSection.append(defaultWhiteBeam);
    defaultWhiteBeam = beaconCanvas(defaultWhiteBeam, "Default Beacon Beam", defaultWhite,"./imgs/beam_with_transparent_beam.png",64);
    beaconSection.style.position = "relative";
    beacon.style.position = "absolute";
    beacon.style.top = "0";
    beacon.style.left = "0";
    beaconSection.style.height = "64px";
    beaconSection.append(beacon);
    beaconHolder.append(beaconSection);

    document.getElementById('madeBeacon').replaceWith(beaconHolder);
    beaconHolder.id = 'madeBeacon';
    beaconHolder.className = 'optionCell';
    beaconHolder.style.marginLeft = "auto";
    beaconHolder.style.marginRight = "auto";

    document.querySelector('#beaconColor').textContent = rgbToHex(finalColor).toUpperCase();
    beaconCanvas(document.getElementById('madeBeaconDisplay'),("Beacon Beam, Color: " + rgbToHex(finalColor)),finalColor,"./imgs/beacon_beam.png",128);
}

function beaconCanvas(canvas, title, inputRGB, imgSrc, size){
    // const canvas = document.getElementById(elementID);
    const sketcher = canvas.getContext("2d", {willReadFrequently: true});
    canvas.title = title;
    canvas.alt = title;

    const newImage = new Image();
    newImage.src = imgSrc;
    newImage.onload = () => {
        canvas.width = size;
        canvas.height = size;
        sketcher.imageSmoothingEnabled = false;
        sketcher.drawImage(newImage, 0, 0, size, size);

        const newTexture = sketcher.getImageData(0,0,canvas.width,canvas.height);
        const newData = newTexture.data;
        for(let v = 0; v < newData.length; v += 4){
            let r = newData[v];
            let g = newData[v + 1];
            let b = newData[v + 2];

            newData[v] = Math.floor((r * inputRGB[0])/255);
            newData[v + 1] = Math.floor((g * inputRGB[1])/255);
            newData[v + 2] = Math.floor((b * inputRGB[2])/255);
        };
        sketcher.putImageData(newTexture,0,0);
    }
}

function makeBeacon(maxBeaconBlocks, combination){
    let comboLength = combination.length;
    let fullHeight = maxBeaconBlocks
    if(comboLength > fullHeight){
        fullHeight = comboLength;
    }
    fullHeight += 3;

    let beaconHolder = document.createElement('div');
    beaconHolder.style.position = "relative";
    beaconHolder.style.width = "64px";

    for(var i = 0; i < (fullHeight-comboLength-1); i++){
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(combination[combination.length-1].color),(combination[combination.length-1].color),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        section.style.height = "64px";
        beaconHolder.append(section);
    }

    for(var g = combination.length-1; g > 0; g--){
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        let glass = document.createElement('img');
        glass.src = combination[g].glass.img64;
        glass.title = combination[g].glass.name + " Stained Glass";
        glass.alt = combination[g].glass.name + " Stained Glass";
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(combination[g].color),(combination[g].color),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        glass.style.position = "absolute";
        glass.style.top = "0";
        glass.style.left = "0";
        section.style.height = "64px";
        section.append(glass);
        beaconHolder.append(section);
    }

    if(combination[0].glass === -1){
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(combination[0].color),(combination[0].color),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        section.style.height = "64px";
        beaconHolder.append(section);
    } else {
        let section = document.createElement('div');
        let beacon_Section = document.createElement('canvas');
        let glass = document.createElement('img');
        glass.src = combination[g].glass.img64;
        glass.title = combination[g].glass.name + " Stained Glass";
        glass.alt = combination[g].glass.name + " Stained Glass";
        section.append(beacon_Section);
        beacon_Section = beaconCanvas(beacon_Section, rgbToHex(combination[g].color),(combination[g].color),"./imgs/beam_with_transparent_beam.png",64);
        section.style.position = "relative";
        glass.style.position = "absolute";
        glass.style.top = "0";
        glass.style.left = "0";
        section.style.height = "64px";
        section.append(glass);
        beaconHolder.append(section);

        let beaconSection = document.createElement('div');
        let defaultWhiteBeam = document.createElement('canvas');
        let beacon = document.createElement('img');
        beacon.src = "./imgs/64x64/beacon_block.png";
        beacon.title = "Minecraft Beacon Block";
        beacon.alt = "Minecraft Beacon Block";
        beaconSection.append(defaultWhiteBeam);
        const colorModeSelected = document.querySelector("#selectColorMode").value;
        if(colorModeSelected == 'java'){
            defaultWhiteBeam = beaconCanvas(defaultWhiteBeam, "Default Beacon Beam", data.colors.whiteJava.rgb,"./imgs/beam_with_transparent_beam.png",64);
        } else if(colorModeSelected == 'bedrock'){
            defaultWhiteBeam = beaconCanvas(defaultWhiteBeam, "Default Beacon Beam", data.colors.whiteBedrock.rgb,"./imgs/beam_with_transparent_beam.png",64);
        } else {
            defaultWhiteBeam = beaconCanvas(defaultWhiteBeam, "Default Beacon Beam", hexToRGB(document.getElementById('white').value),"./imgs/beam_with_transparent_beam.png",64);
        }
        beaconSection.style.position = "relative";
        beacon.style.position = "absolute";
        beacon.style.top = "0";
        beacon.style.left = "0";
        beaconSection.style.height = "64px";
        beaconSection.append(beacon);
        beaconHolder.append(beaconSection);
    }
    return beaconHolder;
}

function textBeacon(combination){
    let runningElement = document.createElement('div');
    runningElement.className = "center";
    let cellHolder = document.createElement('div');
    cellHolder.className = "centeredCells";

    let hexCell = document.createElement('div');
    hexCell.className = "optionCell";
    hexCell.style.padding = "0px";
    hexCell.style.paddingRight = "5px";
    hexCell.append((rgbToHex(combination[combination.length - 1].color)).toUpperCase() + "  = ");
    cellHolder.append(hexCell);
    
    let startingIndex = 0;
    let startingStep = document.createElement('div');
    startingStep.className = "optionCell";
    startingStep.style.padding = "0px";
    startingStep.style.paddingRight = "5px";
    if(combination[0].glass === -1){
        startingStep.append("Starting Color ");
        let startingColor = document.createElement('canvas');
        startingStep.append(startingColor);
        startingColor = beaconCanvas(startingColor,rgbToHex(combination[0].color),(combination[0].color),"./imgs/beacon_beam.png",16);
        startingIndex++;
    } else {
        startingStep.append("Beacon ");
        let beaconImg = new Image();
        beaconImg.src = "./imgs/16x16/beacon.png";
        beaconImg.title = "Beacon";
        beaconImg.alt = "Minecraft Beacon";
        beaconImg.width = 16;
        beaconImg.height = 16;
        startingStep.append(beaconImg);
    }
    cellHolder.append(startingStep);
    for(var i = startingIndex; i < combination.length; i++){
        let nextStep = document.createElement('div');
        nextStep.className = "optionCell";
        nextStep.style.padding = "0px";
        nextStep.style.paddingRight = "5px";
        nextStep.append("+ ");
        nextStep.append(combination[i].glass.name + " ");
        let glassImg = new Image();
        glassImg.src = combination[i].glass.img16;
        glassImg.title = combination[i].glass.name;
        glassImg.alt = combination[i].glass.name + " Stained Glass";
        glassImg.width = 16;
        glassImg.height = 16;
        nextStep.append(glassImg);
        cellHolder.append(nextStep);
    }
    runningElement.append(cellHolder);
    return runningElement;
}

function buildOutput(final, foundTarget, targetColor, rgbAndCIELABEqual,
    foundColorRGB, foundColorCIELAB,
    combinationRGB, combinationCIELAB,
    deltaE_RGB, deltaE_CIELAB,
    depth, numOfCol
){
    document.getElementById('results').style.display = 'flex';
    document.getElementById('in-progress').style.display = 'block';

    let maxBeaconBlocks = combinationRGB.length;
    if(combinationCIELAB.length > maxBeaconBlocks){
        maxBeaconBlocks = combinationCIELAB.length;
    }
    if(final){
        document.getElementById('finalNumberInfo').style.display = 'block';
        document.getElementById('finalNumberInfo').style.minWidth = "0px";
        document.getElementById('finalNumberInfo').style.maxWidth = "" + (document.getElementById('rgbBeaconCompare').scrollWidth - 10) + "px";
        document.getElementById('inprogressLayers').style.display = 'none';
        document.getElementById('finalLayers').style.display = 'block';
        if(foundTarget){
            document.getElementById('finalNumberInfo').innerHTML = "<b>Exact Color Found!</b>";
            document.getElementById('finalNumberInfo').style.backgroundColor = "#007d00"
        } else {
            if(document.querySelector('#glass-limit').value == depth){
                document.getElementById('finalNumberInfo').innerHTML = '<b>Max Glass Reached!</b><br><br>More Colors Maybe Be Possible With More Glass';
                document.getElementById('finalNumberInfo').style.backgroundColor = "#c83c00"
            } else {
                document.getElementById('finalNumberInfo').innerHTML = "<b>All Possible Colors Located, Closest Match Provided</b>";
                document.getElementById('finalNumberInfo').style.backgroundColor = "#007d00"
            }
        }

        /*Re-enable inputs:*/
        document.getElementById("in-progress").style.display="none";
        document.getElementById('startColor').disabled = false;
        document.getElementById('targetColor').disabled = false;
        document.getElementById('find').disabled = false;
        document.getElementById('modes').disabled = false;
        getColors(false);
        document.getElementById('selectColorMode').disabled = false;
        document.getElementById('glass-limit').disabled = false;
    }

    if(foundTarget){
        /*Update Relevant Beacon Color Displays*/
        beaconCanvas(document.getElementById("jColor"),("Beacon Beam, Color: " + rgbToHex(foundColorRGB)),foundColorRGB,"./imgs/beacon_beam.png",128);
        let newBeacon = makeBeacon(maxBeaconBlocks, combinationRGB);
        document.getElementById('foundMadeBeacon').replaceWith(newBeacon);
        newBeacon.id = 'foundMadeBeacon';
        newBeacon.style.marginLeft = "auto";
        newBeacon.style.marginRight = "auto";
        newBeacon.style.marginBottom = "10px";

        let beaconInstruction = textBeacon(combinationRGB);
        document.getElementById('exactCombo').replaceWith(beaconInstruction);
        beaconInstruction.id = 'exactCombo';
        beaconInstruction.style.maxWidth = "320px";

        /*Set Visible Elements:*/
        document.getElementById('justColor').style.display='flex';
        document.getElementById('targetBeaconCompare').style.display='none';
        document.getElementById('foundBeaconCompare').style.display='none';
        document.getElementById('cielabBeaconCompare').style.display='none';
        document.getElementById('rgbBeaconCompare').style.display='none';

        document.getElementById('fmBeacon').style.display = 'flex';
        document.getElementById('fBeacon').style.display = 'none';
        document.getElementById('cBeacon').style.display = 'none';
        document.getElementById('rBeacon').style.display = 'none';
    } else if(rgbAndCIELABEqual){
        /*Update Relevant Beacon Color Displays*/
        beaconCanvas(document.getElementById("tbCompare"),("Target Beacon Beam, Color: " + rgbToHex(targetColor)),targetColor,"./imgs/beacon_beam.png",128);
        beaconCanvas(document.getElementById("fbCompare"),("Closest Beacon Beam Found, Color: " + rgbToHex(foundColorRGB)),foundColorRGB,"./imgs/beacon_beam.png",128);
        document.querySelector('#fbDelta').textContent = Math.floor(deltaE_RGB*1000)/1000;
        document.querySelector('#foundDelta').textContent = Math.floor(deltaE_RGB*1000)/1000;
        let newBeacon = makeBeacon(maxBeaconBlocks, combinationRGB);
        document.getElementById('foundBeacon').replaceWith(newBeacon);
        newBeacon.id = 'foundBeacon';
        newBeacon.style.marginLeft = "auto";
        newBeacon.style.marginRight = "auto";

        let beaconInstruction = textBeacon(combinationRGB);
        document.getElementById('foundCombo').replaceWith(beaconInstruction);
        beaconInstruction.id = 'foundCombo';
        beaconInstruction.style.maxWidth = "320px";

        /*Set Visible Elements:*/
        document.getElementById('justColor').style.display='none';
        document.getElementById('targetBeaconCompare').style.display='flex';
        document.getElementById('foundBeaconCompare').style.display='flex';
        document.getElementById('cielabBeaconCompare').style.display='none';
        document.getElementById('rgbBeaconCompare').style.display='none';

        document.getElementById('fmBeacon').style.display = 'none'
        document.getElementById('fBeacon').style.display = 'flex'
        document.getElementById('cBeacon').style.display = 'none'
        document.getElementById('rBeacon').style.display = 'none'
    } else {
        /*Update Relevant Beacon Color Displays*/
        beaconCanvas(document.getElementById("tbCompare"),("Target Beacon Beam, Color: " + rgbToHex(targetColor)),targetColor,"./imgs/beacon_beam.png",128);
        beaconCanvas(document.getElementById("cbCompare"),("Closest CIELAB Beacon Beam Found, Color: " + rgbToHex(foundColorCIELAB)),foundColorCIELAB,"./imgs/beacon_beam.png",128);
        beaconCanvas(document.getElementById("rbCompare"),("Closest RGB Beacon Beam Found, Color: " + rgbToHex(foundColorRGB)),foundColorRGB,"./imgs/beacon_beam.png",128);
        document.querySelector('#cbDelta').textContent = Math.floor(deltaE_CIELAB*1000)/1000;
        document.querySelector('#rbDelta').textContent = Math.floor(deltaE_RGB*1000)/1000;
        document.querySelector('#cielabDelta').textContent = Math.floor(deltaE_CIELAB*1000)/1000;
        document.querySelector('#rgbDelta').textContent = Math.floor(deltaE_RGB*1000)/1000;
        let newCIELABBeacon = makeBeacon(maxBeaconBlocks, combinationCIELAB);
        document.getElementById('cielabBeacon').replaceWith(newCIELABBeacon);
        newCIELABBeacon.id = 'cielabBeacon';
        newCIELABBeacon.style.marginLeft = "auto";
        newCIELABBeacon.style.marginRight = "auto";
        let newRGBBeacon = makeBeacon(maxBeaconBlocks, combinationRGB);
        document.getElementById('rgbBeacon').replaceWith(newRGBBeacon);
        newRGBBeacon.id = 'rgbBeacon';
        newRGBBeacon.style.marginLeft = "auto";
        newRGBBeacon.style.marginRight = "auto";

        let beaconCIELABInstruction = textBeacon(combinationCIELAB);
        document.getElementById('cielabCombo').replaceWith(beaconCIELABInstruction);
        beaconCIELABInstruction.id = 'cielabCombo';
        beaconCIELABInstruction.style.maxWidth = "320px";
        let beaconRGBInstruction = textBeacon(combinationRGB);
        document.getElementById('rgbCombo').replaceWith(beaconRGBInstruction);
        beaconRGBInstruction.id = 'rgbCombo';
        beaconRGBInstruction.style.maxWidth = "320px";

        /*Set Visible Elements:*/
        document.getElementById('justColor').style.display='none';
        document.getElementById('targetBeaconCompare').style.display='flex';
        document.getElementById('foundBeaconCompare').style.display='none';
        document.getElementById('cielabBeaconCompare').style.display='flex';
        document.getElementById('rgbBeaconCompare').style.display='flex';
        
        document.getElementById('fmBeacon').style.display = 'none'
        document.getElementById('fBeacon').style.display = 'none'
        document.getElementById('cBeacon').style.display = 'flex'
        document.getElementById('rBeacon').style.display = 'flex'
    }

    document.querySelector('#glassAmount1').textContent = depth;
    document.querySelector('#glassAmount2').textContent = depth;
    document.querySelector('#numOfCols').textContent = numOfCol.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    document.getElementById('statusBoard').style.display = 'block';
}

function customColorBuild(){
    document.getElementById('white').value = data.colors.whiteJava.hex;
    document.getElementById('orange').value = data.colors.orange.hex;
    document.getElementById('magenta').value = data.colors.magenta.hex;
    document.getElementById('light_blue').value = data.colors.light_blue.hex;
    document.getElementById('yellow').value = data.colors.yellow.hex;
    document.getElementById('lime').value = data.colors.lime.hex;
    document.getElementById('pink').value = data.colors.pink.hex;
    document.getElementById('gray').value = data.colors.gray.hex;
    document.getElementById('light_gray').value = data.colors.light_gray.hex;
    document.getElementById('cyan').value = data.colors.cyan.hex;
    document.getElementById('purple').value = data.colors.purple.hex;
    document.getElementById('blue').value = data.colors.blue.hex;
    document.getElementById('brown').value = data.colors.brown.hex;
    document.getElementById('green').value = data.colors.green.hex;
    document.getElementById('red').value = data.colors.red.hex;
    document.getElementById('black').value = data.colors.black.hex;
    document.getElementById("startColor").value = "#c4c4c4"//data.colors.red.hex;
    document.getElementById('targetColor').value = "#9dd7ea";//data.colors.pink.hex;
}

function buildSlider(){
    const value = document.querySelector('#glassLimitValue');
    const input = document.querySelector('#glass-limit');
    value.textContent = input.value;
    input.addEventListener("input", (event) => {value.textContent = event.target.value;});
}

function updateColorMode(selected){
    const modeSelcted = selected.value;
    if(modeSelcted == 'custom'){
        document.getElementById('custom-colors').style.display='block';
    } else {
        document.getElementById('custom-colors').style.display='none';
    }
    getColors(false);
}

/*Code taken from: https://learnersbucket.com/examples/interview/convert-hex-color-to-rgb-in-javascript/ */
function hexToRGB(hex){
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);

    return [r,g,b];
}

function rgbToHex(rgb) {
  return "#" + (1 << 24 | rgb[0] << 16 | rgb[1] << 8 | rgb[2]).toString(16).slice(1);
}

function rgbToDec(red, green, blue){
    return red << 16 | green << 8 | blue;
}

function updateStartBeacon(){
    beaconCanvas(document.getElementById("startBeacon"),"Starting Beacon Beam Color",hexToRGB(document.getElementById('startColor').value),"./imgs/beacon_beam.png",64);
}

function updateTargetBeacon(){
    beaconCanvas(document.getElementById("targetBeacon"),"Target Beacon Beam Color",hexToRGB(document.getElementById('targetColor').value),"./imgs/beacon_beam.png",64);
}

function getColors(disableInputs){
    let rgbColor = [];
    let makerColor = [];
    let beaconWhite;
    const colorModeSelected = document.querySelector("#selectColorMode").value;
    if(colorModeSelected == 'java' || colorModeSelected == 'bedrock'){
        if(colorModeSelected == 'java'){
            rgbColor[0] = data.colors.whiteJava;
            makerColor[12] = data.colors.whiteJava;
            beaconWhite = data.colors.whiteJava.rgb;
        } else {
            rgbColor[0] = data.colors.whiteBedrock;
            makerColor[12] = data.colors.whiteBedrock;
            beaconWhite = data.colors.whiteBedrock.rgb;
        }
        rgbColor[1] = data.colors.orange;
        rgbColor[2] = data.colors.magenta;
        rgbColor[3] = data.colors.light_blue;
        rgbColor[4] = data.colors.yellow;
        rgbColor[5] = data.colors.lime;
        rgbColor[6] = data.colors.pink;
        rgbColor[7] = data.colors.gray;
        rgbColor[8] = data.colors.light_gray;
        rgbColor[9] = data.colors.cyan;
        rgbColor[10] = data.colors.purple;
        rgbColor[11] = data.colors.blue;
        rgbColor[12] = data.colors.brown;
        rgbColor[13] = data.colors.green;
        rgbColor[14] = data.colors.red;
        rgbColor[15] = data.colors.black;
        
        makerColor[1] = data.colors.orange;
        makerColor[9] = data.colors.magenta;
        makerColor[6] = data.colors.light_blue;
        makerColor[2] = data.colors.yellow;
        makerColor[3] = data.colors.lime;
        makerColor[10] = data.colors.pink;
        makerColor[14] = data.colors.gray;
        makerColor[13] = data.colors.light_gray;
        makerColor[5] = data.colors.cyan;
        makerColor[8] = data.colors.purple;
        makerColor[7] = data.colors.blue;
        makerColor[11] = data.colors.brown;
        makerColor[4] = data.colors.green;
        makerColor[0] = data.colors.red;
        makerColor[15] = data.colors.black;
    } else {
        let colorInputIds = ["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"];
        let colorNames = ["White","Orange","Magenta","Light Blue","Yellow","Lime","Pink","Gray","Light Gray","Cyan","Purple","Blue","Brown","Green","Red","Black"];
        var inputLocation = 0;
        for(var g = 0; g < colorInputIds.length; g++){
            if(document.getElementById(colorInputIds[g]+"Checked").checked){
                var inputHex = document.getElementById(colorInputIds[g]).value;
                document.getElementById(colorInputIds[g]).disabled = disableInputs;
                var inputRGB = hexToRGB(inputHex);
                var inputDec = rgbToDec(inputRGB[0], inputRGB[1], inputRGB[2]);
                rgbColor[inputLocation] = {
                    name: colorNames[g],
                    dec: inputDec,
                    hex: inputHex,
                    rgb: inputRGB,
                    img16: "./imgs/16x16/" + colorInputIds[g] + "_stained_glass.png",
                    img64: "./imgs/64x64/" + colorInputIds[g] + "_stained_glass.png"
                };
                inputLocation++;
            }
            document.getElementById(colorInputIds[g]+"Checked").disabled = disableInputs;
        }

        let makerInputIds = ["red","orange","yellow","lime","green","cyan","light_blue","blue","purple","magenta","pink","brown","white","light_gray","gray","black"];
        let makerNames = ["Red","Orange","Yellow","Lime","Green","Cyan","Light Blue","Blue","Purple","Magenta","Pink","Brown","White","Light Gray","Gray","Black"];
        var makerLocation = 0;
        beaconWhite = hexToRGB(document.getElementById("white").value);
        for(var g = 0; g < makerInputIds.length; g++){
            if(document.getElementById(makerInputIds[g]+"Checked").checked){
                var inputHex = document.getElementById(makerInputIds[g]).value;
                var inputRGB = hexToRGB(inputHex);
                var inputDec = rgbToDec(inputRGB[0], inputRGB[1], inputRGB[2]);
                makerColor[makerLocation] = {
                    name: makerNames[g],
                    dec: inputDec,
                    hex: inputHex,
                    rgb: inputRGB,
                    img16: "./imgs/16x16/" + makerInputIds[g] + "_stained_glass.png",
                    img64: "./imgs/64x64/" + makerInputIds[g] + "_stained_glass.png"
                };
                makerLocation++;
            }
        }
    }
    maker.postMessage({
        action: 'updateColorValues',
        white: beaconWhite,
        glass: makerColor
    });
    makerButtons(makerColor);

    return rgbColor;
}

function updateMode(selected){
    const modeSelcted = selected.value;
    if(modeSelcted == 'b->c'){
        document.getElementById('results').style.display='flex';
        document.getElementById('glassConnections').style.display='block';
        document.getElementById('combinationToColor').style.display='none';
        document.getElementById('targetColors').style.display='flex';
        document.getElementById('targetBeacon').style.display='block';
        document.getElementById('targetColumn').className='flexCenteredColumn';
        document.getElementById('startingColor').style.display='none';
        document.getElementById('startBeacon').style.display='none';
        document.getElementById('spacingStartBeaconBlank').style.display='block';
        document.getElementById('calculateButton').style.display='block';
    } else if(modeSelcted == 'g->c'){
        document.getElementById('results').style.display='none';
        document.getElementById('glassConnections').style.display='none';
        document.getElementById('combinationToColor').style.display='flex';
        document.getElementById('targetColors').style.display='none';
        document.getElementById('targetBeacon').style.display='none';
        document.getElementById('startingColor').style.display='none';
        document.getElementById('startBeacon').style.display='none';
        document.getElementById('spacingStartBeaconBlank').style.display='none';
        document.getElementById('calculateButton').style.display='none';
        getColors(false);
    } else {
        document.getElementById('results').style.display='flex';
        document.getElementById('glassConnections').style.display='block';
        document.getElementById('combinationToColor').style.display='none';
        document.getElementById('targetColors').style.display='flex';
        document.getElementById('targetBeacon').style.display='block';
        document.getElementById('targetColumn').className='flexColumnRight';
        document.getElementById('startingColor').style.display='flex';
        document.getElementById('startBeacon').style.display='block';
        document.getElementById('spacingStartBeaconBlank').style.display='none';
        document.getElementById('calculateButton').style.display='block';
    }
}

function findCombination() {
    document.getElementById('startColor').disabled = true;
    document.getElementById('targetColor').disabled = true;
    document.getElementById('find').disabled = true;
    document.getElementById('modes').disabled = true;
    document.getElementById('selectColorMode').disabled = true;
    document.getElementById('glass-limit').disabled = true;
    document.getElementById('finalNumberInfo').style.display = 'none';
    document.getElementById('inprogressLayers').style.display = 'block';
    document.getElementById('finalLayers').style.display = 'none';


    const inputGlass = getColors(true);
    const targetHex = document.getElementById('targetColor').value;
    const processSelected = document.querySelector("#modes").value;
    const maxGlass = document.querySelector('#glass-limit').value;

    if(processSelected == 'b->c'){
        finder.postMessage({
            process: processSelected,
            glass: inputGlass,
            max: maxGlass,
            targetRGB: hexToRGB(targetHex)
        });
    } else if(processSelected == 'c->c'){
        const startingHex = document.getElementById('startColor').value;
        finder.postMessage({
            process: processSelected,
            glass: inputGlass,
            max: maxGlass,
            targetRGB: hexToRGB(targetHex),
            startingRGB: hexToRGB(startingHex)
        });
    }
}
