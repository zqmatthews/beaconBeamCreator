let glass;
let targetRGB;
let maxGlass;
let bestFoundRGB;
let bestFoundRGBDec;
let bestFoundCIELAB;
let bestFoundCIELABDec;
let bestFoundComboRGB;
let bestFoundComboCIELAB;
let bestDifferenceRGB;
let bestDifferenceCIELAB;
let found = [];
let depth = 0;

onmessage = onmessage = event => {
    this.glass = event.data.glass;
    this.targetRGB = event.data.targetRGB;
    this.maxGlass = event.data.max;
    this.bestFoundRGB = undefined;
    this.bestFoundRGBDec = undefined;
    this.bestFoundCIELAB = undefined;
    this.bestFoundCIELAB = undefined;
    this.bestFoundComboRGB = undefined;
    this.bestFoundComboCIELAB = undefined;
    this.bestDifferenceRGB = undefined;
    this.bestDifferenceCIELAB = undefined;
    this.found = [];
    this.depth = 0;
    if(event.data.process === 'b->c'){
        findFromBeacon();
    }
    if(event.data.process === 'c->c'){
        findFromColor(event.data.startingRGB);
    }
}

function postFinalResults(actual){
    if(actual){
        postMessage({
            status: "complete",
            foundTarget: actual,
            targetColor: this.targetRGB,
            foundColor: this.bestFoundRGB,
            combination: this.bestFoundComboRGB,
            deltaE: this.bestDifferenceCIELAB,
            depth: this.depth
        });
    } else if(this.bestFoundRGBDec === this.bestFoundCIELABDec){
        postMessage({
            status: "complete",
            foundTarget: actual,
            targetColor: this.targetRGB,
            rgbAndCIELABEqual: true,
            foundColor: this.bestFoundRGB,
            combination: this.bestFoundComboRGB,
            deltaE: this.bestDifferenceCIELAB,
            depth: this.depth
        });
    } else {
        postMessage({
            status: "complete",
            foundTarget: actual,
            targetColor: this.targetRGB,
            rgbAndCIELABEqual: false,
            foundColorRGB: this.bestFoundRGB,
            foundColorCIELAB: this.bestFoundCIELAB,
            combinationRGB: this.bestFoundComboRGB,
            combinationCIELAB: this.bestFoundComboCIELAB,
            deltaE_RGB: colorDifference(this.bestFoundRGB),
            deltaE_CIELAB: this.bestDifferenceCIELAB,
            depth: this.depth
        });
    }

    this.found = [];
}

function postInProgressResults(){
    if(this.bestFoundRGBDec === this.bestFoundCIELABDec){
        postMessage({
            status: "inprogress",
            targetColor: this.targetRGB,
            rgbAndCIELABEqual: true,
            foundColor: this.bestFoundRGB,
            combination: this.bestFoundComboRGB,
            deltaE: this.bestDifferenceCIELAB,
            depth: this.depth
        });
    } else {
        postMessage({
            status: "inprogress",
            targetColor: this.targetRGB,
            rgbAndCIELABEqual: false,
            foundColorRGB: this.bestFoundRGB,
            foundColorCIELAB: this.bestFoundCIELAB,
            combinationRGB: this.bestFoundComboRGB,
            combinationCIELAB: this.bestFoundComboCIELAB,
            deltaE_RGB: colorDifference(this.bestFoundRGB),
            deltaE_CIELAB: this.bestDifferenceCIELAB,
            depth: this.depth
        });
    }
}

function postNoGlassSelected(){
    postMessage({
        status: "noglass"
    })
}

function findFromBeacon(){
    let query = [];
    this.depth++;
    if(this.glass.length > 0){
        query.push(this.glass[0].rgb);
        this.found[this.glass[0].dec] = [this.glass[0],-1];
        this.bestFoundRGB = this.glass[0].rgb;
        this.bestFoundRGBDec = rgbToDec(this.bestFoundRGB);
        this.bestFoundCIELAB = this.glass[0].rgb;
        this.bestFoundCIELABDec = rgbToDec(this.bestFoundCIELAB);
        this.bestFoundComboRGB = [{
            color: this.glass[0].rgb,
            glass: this.glass[0]
        }];
        this.bestFoundComboCIELAB = [{
            color: this.glass[0].rgb,
            glass: this.glass[0]
        }];
        this.bestDifferenceRGB = rgbDifference(this.bestFoundRGB);
        this.bestDifferenceCIELAB = colorDifference(this.bestFoundCIELAB);
    } else {
        postNoGlassSelected();
        return;
    }
    for(var g = 1; g < this.glass.length; g++){
        query.push(this.glass[g].rgb);
        this.found[this.glass[g].dec] = [this.glass[g],-1];
        updateBestDifference(this.glass[g].rgb);
    }

    if(this.bestDifferenceRGB === 0){
        postFinalResults(true);
    } else if(this.maxGlass > this.depth) {
        postFinalResults(breadthFirstSearch(query));
    } else {
        postFinalResults(false);
    }
}

function findFromColor(startingRGB){
    let query = [];
    if(this.glass.length === 0){
        postNoGlassSelected();
        return;
    }
    query.push(startingRGB);
    this.found[rgbToDec(startingRGB)] = [-1,-1];
    this.bestFoundRGB = startingRGB;
    this.bestFoundRGBDec = rgbToDec(this.bestFoundRGB);
    this.bestFoundCIELAB = startingRGB;
    this.bestFoundCIELABDec = rgbToDec(this.bestFoundCIELAB);
    this.bestFoundComboRGB = [{
            color: startingRGB,
            glass: -1
        }];
    this.bestFoundComboCIELAB = [{
            color: startingRGB,
            glass: -1
        }];
    this.bestDifferenceRGB = rgbDifference(this.bestFoundRGB);
    this.bestDifferenceCIELAB = colorDifference(this.bestFoundCIELAB);
    postInProgressResults();

    if(this.bestDifferenceRGB === 0){
        postFinalResults(true);
    } else if(this.maxGlass > this.depth) {
        postFinalResults(breadthFirstSearch(query));
    } else {
        postFinalResults(false);
    }
}

function rgbToDec(rgb){
    let red = rgb[0];
    let green = rgb[1];
    let blue = rgb[2];
    return red << 16 | green << 8 | blue;
}

function colorToCIELAB(red, green, blue){
    let rgb = [(red/255.0),(green/255.0),(blue/255.0)];
    /*Based on https://www.easyrgb.com/en/math.php*/
    /*rgb to xyz*/
    for(var v = 0; v < 3; v++){
        if(rgb[v] > 0.04045){
            rgb[v] = Math.pow(((rgb[v] + 0.055) / 1.055), 2.4);
        } else {
            rgb[v] /= 12.92;
        }
    }

    let x = ((rgb[0] * 0.4124)
        + (rgb[1] * 0.3576)
        + (rgb[2] * 0.1805));
    let y = ((rgb[0] * 0.2126)
        + (rgb[1] * 0.7152)
        + (rgb[2] * 0.0722));
    let z = ((rgb[0] * 0.0193)
        + (rgb[1] * 0.1192)
        + (rgb[2] * 0.9505));

    /*References Taken from https://www.easyrgb.com/en/math.php; 
    Using the reference of Equal Energy*/
    let referenceX = 100;
    let referenceY = 100;
    let referenceZ = 100;

    let xyzReference = [referenceX,referenceY,referenceZ];
    let xyzColor = [x,y,z];

    //Convert XYZ to CIELab color space: https://www.easyrgb.com/en/math.php
    for(var v = 0; v < 3; v++){
        xyzColor[v] /= xyzReference[v];

        if(xyzColor[v] > 0.008856){
            xyzColor[v] = Math.pow(xyzColor[v], 1/3);
        } else {
            xyzColor[v] = ((7.787 * xyzColor[v]) + (16/116));
        }
    }

    let L = (116 * xyzColor[1]);
    let a = 500 * (xyzColor[0] - xyzColor[1]);
    let b = 200 * (xyzColor[1] - xyzColor[2]);

    let LabColor = [L,a,b];
    return LabColor;
}

function rgbDifference(checkRGB){
    if((this.targetRGB[0] == checkRGB[0]) && (this.targetRGB[1] == checkRGB[1]) && (this.targetRGB[2] == checkRGB[2])){
        return 0;
    }

    let difference = Math.sqrt(
        Math.pow((this.targetRGB[0]-checkRGB[0]),2) +
        Math.pow((this.targetRGB[1]-checkRGB[1]),2) +
        Math.pow((this.targetRGB[2]-checkRGB[2]),2)
    );

    return difference;
}

function colorDifference(checkRGB){
    if((this.targetRGB[0] == checkRGB[0]) && (this.targetRGB[1] == checkRGB[1]) && (this.targetRGB[2] == checkRGB[2])){
        return 0;
    }

    let cieLabTarget = colorToCIELAB(this.targetRGB[0],this.targetRGB[1],this.targetRGB[2]);
    let cieLabCheck = colorToCIELAB(checkRGB[0],checkRGB[1],checkRGB[2]);

    let difference = Math.sqrt(
        Math.pow((cieLabTarget[0]-cieLabCheck[0]),2) +
        Math.pow((cieLabTarget[1]-cieLabCheck[1]),2) +
        Math.pow((cieLabTarget[2]-cieLabCheck[2]),2)
    );

    return difference;
}

function getComboFromFound(rgbEnd){
    let decEnd = rgbToDec(rgbEnd)
    let checkRGB = this.found[decEnd][1];
    let checkDec;
    if(checkRGB === -1){
        checkDec = -1;
    } else {
        checkDec = rgbToDec(checkRGB);
    }
    let combo = [{
        color: rgbEnd,
        glass: this.found[decEnd][0]
    }];
    while(checkDec !== -1){
        combo.unshift({
            color: checkRGB,
            glass: this.found[checkDec][0]
        });
        checkRGB = this.found[checkDec][1]
        if(checkRGB === -1){
            checkDec = -1;
        } else {
            checkDec = rgbToDec(checkRGB);
        }
    }
    return combo;
}

function updateBestDifference(checkRGB){
    let sendUpdate = false;
    let checkDifferenceCIELAB = colorDifference(checkRGB);
    if(this.bestDifferenceCIELAB > checkDifferenceCIELAB){
        this.bestDifferenceCIELAB = checkDifferenceCIELAB;
        this.bestFoundCIELAB = checkRGB;
        this.bestFoundCIELABDec = rgbToDec(this.bestFoundCIELAB);
        this.bestFoundComboCIELAB = getComboFromFound(checkRGB);
        sendUpdate = true;
    }
    let checkDifferenceRGB = rgbDifference(checkRGB);
    if(this.bestDifferenceRGB > checkDifferenceRGB){
        this.bestDifferenceRGB = checkDifferenceRGB;
        this.bestFoundRGB = checkRGB;
        this.bestFoundRGBDec = rgbToDec(this.bestFoundRGB);
        this.bestFoundComboRGB = getComboFromFound(checkRGB);
    }
    if(sendUpdate){
        postInProgressResults();
    }
}

function newColor(rgb1, rgb2){
    const newRGB = [((rgb1[0] + rgb2[0])/2.0),((rgb1[1] + rgb2[1])/2.0),((rgb1[2] + rgb2[2])/2.0)];
    return [Math.floor(newRGB[0]),Math.floor(newRGB[1]),Math.floor(newRGB[2])];
}

function breadthFirstSearch(query){
    let newQuery = [];
    this.depth++;
    for(var q = 0; q < query.length; q++){
        for(var g = 0; g < this.glass.length; g++){
            var newRGB = newColor(query[q], this.glass[g].rgb);
            var newDec = rgbToDec(newRGB);
            if(typeof this.found[newDec] === 'undefined'){
                this.found[newDec] = [this.glass[g],query[q]];
                newQuery.push(newRGB);
                updateBestDifference(newRGB);
                if(this.bestDifferenceRGB === 0){
                    return true;
                }
            }
        }
    }
    if(this.maxGlass > this.depth && newQuery.length > 0){
        postInProgressResults();
        return breadthFirstSearch(newQuery);
    } else {
        return false;
    }
}