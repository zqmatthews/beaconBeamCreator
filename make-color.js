let defaultWhite = [249,255,254];
let rgbVal;
let glass;
let combo;
let colorsNames = ["Red","Orange","Yellow","Lime","Green","Cyan","Light Blue","Blue","Purple","Magenta","Pink","Brown","White","Light Gray","Gray","Black"];
let activeColors;
let nameGlassLoc;
let firstRun = true;

onmessage = onmessage = event => {
    if(event.data.action === 'updateColorValues'){
        this.defaultWhite = event.data.white;
        this.glass = event.data.glass;
        updateBeaconGlass();
    }
    if(event.data.action === 'justBeacon'){
        noGlassBeacon();
    }
    if(event.data.action === 'removeGlass'){
        removeGlass(event.data.index);
    }
    if(event.data.action === 'addGlass'){
        addGlass(event.data.glass);
    }
}

function noGlassBeacon(){
    this.rgbVal = this.defaultWhite;
    this.combo = [];
    postMessage({
        finalRGB: this.rgbVal,
        beaconWhite: this.defaultWhite,
        beaconCombo: -1
    });
}

function postBeacon() {
    postMessage({
        finalRGB: this.rgbVal,
        beaconWhite: this.defaultWhite,
        beaconCombo: this.combo
    });
}

function newColor(rgb1, rgb2){
    const newRGB = [((rgb1[0] + rgb2[0])/2.0),((rgb1[1] + rgb2[1])/2.0),((rgb1[2] + rgb2[2])/2.0)];
    return [Math.floor(newRGB[0]),Math.floor(newRGB[1]),Math.floor(newRGB[2])];
}

function updateComboRGB() {
    if(this.combo.length < 1){
        noGlassBeacon();
    } else {
        let runningRGB = this.combo[0].glass.rgb;
        this.combo[0] = {
            color: runningRGB,
            glass: this.combo[0].glass
        };
        for(var i = 1; i < this.combo.length; i++){
            runningRGB = newColor(runningRGB, this.combo[i].glass.rgb);
            this.combo[i] = {
                color: runningRGB,
                glass: this.combo[i].glass
            };
        }
        this.rgbVal = runningRGB;
        postBeacon();
    }
}

function addGlass(addedGlass){
    this.combo.push({
        color: addedGlass.rgb,
        glass: addedGlass
    })
    updateComboRGB();
}

function removeGlass(index){
    this.combo.splice(index,1);
    updateComboRGB();
}

function updateActiveColors(){
    let runningG = 0;
    this.nameGlassLoc = [];
    this.activeColors = [];
    for(var v = 0; v < colorsNames.length; v++){
        if(typeof this.glass[runningG] === 'undefined'){
            this.activeColors[v] = false;
        }else{
            if(colorsNames[v] === this.glass[runningG].name){
                this.activeColors[v] = true;
                this.nameGlassLoc[v] = runningG;
                runningG++;
            } else {
                this.activeColors[v] = false;
            }
        }
    }
}

function updateBeaconGlass(){
    updateActiveColors();
    if(typeof this.combo !== 'undefined' && this.combo.length > 0){
        let newCombo = [];
        for(var g = 0; g < this.combo.length; g++){
            let nameIndex = colorsNames.indexOf(this.combo[g].glass.name);
            if(this.activeColors[nameIndex]){
                let updatedGlass = this.glass[this.nameGlassLoc[nameIndex]];
                newCombo.push({
                    color: updatedGlass.rgb,
                    glass: updatedGlass
                })
            }
        }
        this.combo = newCombo;
        updateComboRGB();
    } else {
        noGlassBeacon();
    }
}