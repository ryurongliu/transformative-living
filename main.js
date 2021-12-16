
//********** GETTING CELLS ETC. **********************************************

//generated stuff display
var trebleDisplay = document.getElementById("trebleClef");
var bassDisplay = document.getElementById("bassClef");

//get initial chord radios
var keyRadio = document.getElementsByName("key");
var triadRadio = document.getElementsByName("triad");
var seventhRadio = document.getElementsByName("seventh");

//get initial chord display elements 
var keyDisplay = document.getElementById("keyDisplay");
var chordDisplay = document.getElementById("chordDisplay");

//initial chord vals
var key = 0;
var triad = 0;
var seventh = 0;

var genStarted = 0;




//get cell checkbox elements
var cellElements = [];
var numRows = 12;
var numCols = 12;
for (var i = 0; i < numRows; i++) {
    var row = [];
    for (var j = 0; j < numCols; j++) {
        if (i != 11) {
            var cellID = "c" + i.toString() + j.toString();
        }
        else {
            var cellID = "c" + i.toString() + "-" + j.toString()
        }

        row.push(document.getElementById(cellID));
    }
    cellElements.push(row);
}

//configure cellular reset button 
var resetButton = document.getElementById("resetButton");
resetButton.onclick = function () {
    for (var i = 0; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
            cellElements[i][j].checked = false; 
        }
    }
    trebleDisplay.innerHTML = "";
    bassDisplay.innerHTML = "";
    transformDisplay.innerHTML = "";
    keyRadio[0].checked = true;
    triadRadio[0].checked = true;
    seventhRadio[0].checked = true;
    keyDisplay.innerHTML = "C";
    chordDisplay.innerHTML = "M7";
    key = 0;
    triad = 0;
    seventh = 0;
    genStarted = 0;

    currCellState = initializeCellState();
    prevCellState = initializeCellState();

    cellsAlive = [];
    numAlive = 0;

    //for stepping composition
    currChord = [key, triad, seventh];
    firstNotated = 0; 
    defineKeySignature(currChord);
    totalTime = 0;
    stepsAdded = 0;
    chordTotalTime = 0;
    clearTitle();

}

//********** END GETTING CELLS ETC. *****************************************

//********** FOR GETTING + DISPLAYING INITIAL CHORD *********************




//index chord type as [triad_type][seventh_type]
//maj = 0
//min = 1
//dim = 2  
const chordMapForDisplay = [["M7", "dom7", "M6"], ["mM7", "m7", "m6"], ["dimM7", "&#189dim7", "dim7"]];

const triadPitches = [[0, 4, 7], [0, 3, 7], [0, 3, 6]];
const seventhPitches = [11, 10, 9];

const arpInds = [[0], [1], [2], [3], [0, 1],
                [0, 2], [0, 3], [1, 2], [1, 3],
                [2, 3], [0, 1, 2], [0, 1, 3],
                [0, 2, 3], [1, 2, 3]];

//key from pitch-set to key
const keyMap = {
    '0': "C", 
    '1': "Db", 
    '2': "D", 
    '3': "Eb", 
    '4': "E",  
    '5': "F", 
    '6': "F#", 
    '7': "G", 
    '8': "Ab", 
    '9': "A",
    '10': "Bb",
    '11': "B",
}

//notes allowed in melody for each chord, indexed as [triad][seventh][note]  


const scales = [[[0, 2, 4, 5, 6, 9, 11],
                 [0, 2, 4, 5, 7, 9, 11],
                 [0, 2, 4, 6, 7, 9, 11]],
                [[0, 2, 3, 5, 7, 8, 11],
                 [0, 2, 3, 5, 7, 8, 10],
                 [0, 2, 3, 5, 7, 9, 10]],
                [[0, 2, 3, 5, 6, 9, 11],
                 [0, 1, 3, 5, 6, 8, 10],
                 [0, 1, 3, 5, 6, 8, 9]]];


//display chord key
for (var i = 0; i < keyRadio.length; i++) {
    keyRadio[i].onclick = function () {
        key = getRadioVal(keyRadio);
        keyDisplay.innerHTML = keyMap[key];
    }
}

//display chord type
for (var i = 0; i < triadRadio.length; i++) {
    triadRadio[i].onclick = function () {
        triad = getRadioVal(triadRadio);
        chordDisplay.innerHTML = chordMapForDisplay[triad][seventh]; 
    }
}
for (var i = 0; i < seventhRadio.length; i++) {
    seventhRadio[i].onclick = function () {
        seventh = getRadioVal(seventhRadio);
        chordDisplay.innerHTML = chordMapForDisplay[triad][seventh];
    }
}


//to get radio value
function getRadioVal(radioname) {
    var n = radioname.length;
    for (var i = 0; i < n; i++) {
        if (radioname[i].checked)
            return radioname[i].value;
    }
    return null;

}
//************* END INITIAL CHORD STUFF ***************************


//************* GAME OF LIFE TIMESTEPPING *************************


var generateButton = document.getElementById("generateButton");

//for stepping automata
var currCellState = initializeCellState();
var prevCellState = initializeCellState();

var cellsAlive = [];
var numAlive = 0;

//for stepping composition
var currChord;

var title = "";

//on each timestep
generateButton.onclick = function () {

    

    //get initial cell states for first step (prev and curr are equal)  
    if (genStarted == 0) {
        currChord = [key, triad, seventh];
        displayFirst(currChord);
        defineKeySignature(currChord);
        getCellState(currCellState);
        createTitle(); 
        genStarted = 1; 
    }
    getCellState(currCellState);
    getCellState(prevCellState);
    if (numAlive == 0) {
        return;
    }
    numAlive = 0; 
    //update each automata cell
    for (var i = 0; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
            updateCell(currCellState, prevCellState, i, j);
        }
    }


    //right now, cellsAlive lists PREV state alive cells
    //numAlive counts CURR alive cells

    //get next chord
    var transform = getTransform(cellsAlive, numAlive, currChord);
    var nextChord = applyTransform(transform, currChord, cellsAlive);

    //get melody
    var melody = getMelody(cellsAlive, currCellState, currChord);

    //get chord arpeggiation + rhythm
    var chordSeq = getChordSeq(cellsAlive, currCellState, currChord);
    console.log(chordSeq);
    displayStep(nextChord, transform, melody, chordSeq);

    //update states and composition info 
    getCellState(currCellState);
    getCellState(prevCellState);
    currChord = nextChord; 

        
}




//make 12 x 12 array of zeros
function initializeCellState() {
    var cellState = [];
    for (var i = 0; i < numRows; i++) {
        var row = [];
        for (var j = 0; j < numCols; j++) {
            row.push(0)
        }
        cellState.push(row);
    }
    return cellState; 
}

//update state array with current cell states
//and update cellsAlive with indices of alive cells  
function getCellState(state) {
    cellsAlive = [];
    numAlive = 0;
    for (var i = 0; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
            var val = Number(cellElements[i][j].checked);
            state[i][j] = val;
            if (val == 1) {
                cellsAlive.push([i, j]);
                numAlive += 1;
            }
        }
    }
}

//update single cell in newStates based on values from oldStates
//also update visual
//and also update numAlive 
function updateCell(newStates, oldStates, x, y) {

    var curr = oldStates[x][y];

    var neighbors = [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]];
    var neighborSum = 0; 
    for (var i = 0; i < neighbors.length; i++) {
        if (neighbors[i][0] >= 0 && neighbors[i][0] < 12 && neighbors[i][1] >= 0 && neighbors[i][1] < 12) {
            neighborSum += oldStates[neighbors[i][0]][neighbors[i][1]]; //add up number of live neighbors
        }

    }

    //update based on neighbor count
    if (curr == 1 && (neighborSum == 2 || neighborSum == 3)) {
        newStates[x][y] = 1;
        numAlive += 1;
    }
    else if (curr == 1) {
        newStates[x][y] = 0;
        cellElements[x][y].checked = false;
    }
    else if (curr == 0 && neighborSum == 3) {
        newStates[x][y] = 1;
        cellElements[x][y].checked = true;
        numAlive += 1;
    }
    else if (curr == 0) {
        newStates[x][y] = 0;
    }

}


function getTransform(prevCellsAlive, currNumAlive, prevChord) {

    //pick transform from previous alive cells
    //using the current number of alive cells to index into prev. alive cells 
    var prevNumAlive = prevCellsAlive.length;
    var transform = prevCellsAlive[mod(currNumAlive, prevNumAlive)];
    console.log(transform);
    return transform;
}


function applyTransform(t, chord, prevAlive) {

    var x = t[0];
    var y = t[1];

    var oldKey = chord[0];
    var oldTriad = Number(chord[1]);
    var oldSeventh = Number(chord[2]);
    var newKey;
    var newTriad;
    var newSeventh;

    //apply key translation based on triad type:
    //major translation
    if (oldTriad == 0) {
        newKey = mod((oldKey + x), 12);

    }
    //minor translation
    else if (oldTriad == 1) {
        newKey = mod((oldKey + y), 12);
    }
    //dim translation
    else if (oldTriad == 2) {
        newKey = mod((oldKey + x - y), 12);
    }

    //apply triad flavor conversion
    var fac = x + y; 
    var triadFlav = Number(math.pow(-1, fac));
    console.log(oldTriad + triadFlav);
    newTriad = mod((oldTriad + triadFlav), 3);
    console.log(newTriad);

    //apply seventh flavor conversion
    //using factor based on difference in x indexes of first and seventh previously alive cells
    var factor = prevAlive[0][0] - prevAlive[mod(7, prevAlive.length)][0];
    console.log(factor);
    var seventhFlav = math.pow(-1, factor);
    newSeventh = mod((oldSeventh + seventhFlav),3);

    return [newKey, newTriad, newSeventh];
}



//melody notes given as [pitch, length]
//where pitch is in terms of 0=C, 1=C#, etc (normalized space)
//length is given in terms of sixteenth-note lengths
function getMelody(prevCellsAlive, currState, chord) {

    var k = chord[0];
    var tri = chord[1];
    var sev = chord[2];

    //get array of cells that stayed alive
    var survived = [];
    for (var i = 0; i < prevCellsAlive.length; i++) {
        var x = prevCellsAlive[i][0];
        var y = prevCellsAlive[i][1];
        //check against current state
        if (currState[x][y] == 1) {
            survived.push([x, y]);
        }
    }

    var notes = [];

    for (var i = 0; i < survived.length; i++) {

        var pitchInd = mod(survived[i][0], 8);
        if (pitchInd == 7) { var pitch = 12; }
        else { var pitch = mod(k + scales[tri][sev][pitchInd], 11); }
        var length = survived[i][1]+1;

        notes.push([length, pitch]);
    }

    return notes;

}

function getChordSeq(prevCellsAlive, currState, chord) {
    var k = chord[0];
    var tri = chord[1];
    var sev = chord[2];

    //get array of cells that stayed alive
    var survived = [];
    for (var i = 0; i < prevCellsAlive.length; i++) {
        var x = prevCellsAlive[i][0];
        var y = prevCellsAlive[i][1];
        //check against current state
        if (currState[x][y] == 1) {
            survived.push([x, y]);
        }
    }

    if (survived.length==0) {
        return []; 
    }

    var chordPitches = []; //in key space (not translated)   
    for (var i = 0; i < 3; i++) {
        chordPitches.push(triadPitches[tri][i]);
    }
    chordPitches.push(seventhPitches[sev]);

    var chordSeq = [];

    var firstNotes = [];
    for (var i = 0; i < 4; i++) {
        firstNotes.push(mod(chordPitches[i] + k, 12));
    }

    chordSeq.push([survived[0][0] + 1, firstNotes]);

    for (var i = 1; i < survived.length; i++) {
        var length = survived[i][0]+1;
        var arpIndForArpInds = mod(survived[i][0] + survived[i][1], 15);
        if (arpIndForArpInds == 14) { var oneTimeNotes = [12]; }
        else {
            var arpIndsForPitches = arpInds[arpIndForArpInds];
            var oneTimeNotes = [];
            for (var j = 0; j < arpIndsForPitches.length; j++) {
                oneTimeNotes.push(mod(chordPitches[arpIndsForPitches[j]] + k, 12));
            }
        }
        chordSeq.push([length, oneTimeNotes]);
    }
    return chordSeq; 

}

//notations for durations from 1 - 12/16ths   
const durNotations = [["16"], ["8"], ["8."], ["4"], ["4", "16"], ["4."], ["4", "8."], ["2"], ["2", "16"], ["2", "8"], ["2", "8."], ["2."]];

//to choose the key signature
const pitchNotationsKeyMajor = ["c", "des", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b"];
const pitchNotationsKeyMinor = ["c", "cis", "d", "ees", "e", "f", "fis", "g", "gis", "a", "bes", "b"];

//to choose how to notate, based on key signature (mostly by taste)
const pitchNotationsByKeyMajor = {
    "c": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "des": ["c", "des", "d", "ees", "e", "f", "ges", "g", "aes", "a", "bes", "b", "r"],
    "d": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "ees": ["c", "des", "d", "ees", "e", "f", "ges", "g", "aes", "a", "bes", "b", "r"],
    "e": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "bes", "b", "r"],
    "f": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "fis": ["c", "cis", "d", "dis", "e", "eis", "fis", "g", "gis", "a", "ais", "b", "r"],
    "g": ["c", "des", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "aes": ["c", "des", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "a": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "gis", "a", "bes", "b", "r"],
    "bes": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "b": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "b", "r"]
}

const pitchNotationsByKeyMinor = {
    "c": ["c", "cis", "d", "ees", "e", "f", "ges", "g", "aes", "a", "bes", "b", "r"],
    "cis": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "bes", "b", "r"],
    "d": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "ees": ["c", "des", "d", "ees", "e", "f", "ges", "g", "aes", "a", "bes", "ces", "r"],
    "e": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "bes", "b", "r"],
    "f": ["c", "des", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "fis": ["c", "cis", "d", "dis", "e", "eis", "fis", "g", "gis", "a", "ais", "b", "r"],
    "g": ["c", "des", "d", "ees", "e", "f", "fis", "g", "aes", "a", "bes", "b", "r"],
    "gis": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "b", "r"],
    "a": ["c", "cis", "d", "ees", "e", "f", "fis", "g", "gis", "a", "bes", "b", "r"],
    "bes": ["c", "des", "d", "ees", "e", "f", "ges", "g", "aes", "a", "bes", "b", "r"],
    "b": ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "b", "r"]
}

var pitchNotation;


function displayFirst(chord) {
    var oldStringBass = bassDisplay.innerHTML;

    var transformString = transformDisplay.innerHTML; 
    transformString += " Chord: <" + chord.toString() + "> " + keyMap[chord[0]] + chordMapForDisplay[chord[1]][chord[2]]; 
    transformDisplay.innerHTML = transformString;

    var oldStringTreble = trebleDisplay.innerHTML;
    oldStringTreble += "\\key ";
    if (chord[1] == 0) {//major chord  
        oldStringTreble += pitchNotationsKeyMajor[chord[0]] + " \\major";
    }
    else { //minor or diminished 
        oldStringTreble += pitchNotationsKeyMinor[chord[0]] + " \\minor";

    }
    oldStringTreble += " \\resetRelativeOctave c'";

    trebleDisplay.innerHTML = oldStringTreble;

}

function defineKeySignature(chord) {
    if (chord[1] == 0) {//major chord
        pitchNotation = pitchNotationsByKeyMajor[pitchNotationsKeyMajor[chord[0]]];
    }
    else { //minor or diminished 
        pitchNotation = pitchNotationsByKeyMinor[pitchNotationsKeyMajor[chord[0]]];
    }
}

var firstNotated = 0;
var totalTime = 0;
var stepsAdded = 0;
var chordTotalTime = 0;




var transformDisplay = document.getElementById("transform-info");


function displayStep(chord, t, m, s) {

    //if there's no notes, do nothing 
    if (m.length == 0) {
        return;
    }
    if (s.length == 0) {
        return;
    }

    var loopStart = 0;


    var oldStringTreble = trebleDisplay.innerHTML;
    var oldStringBass = bassDisplay.innerHTML;

    //display treble


    //loop over remaining notes and add to string 
    for (var i = 0; i < m.length; i++) {
        var noteDur = m[i][0];
        var notePitchString = pitchNotation[m[i][1]];

        if (totalTime % 4 != 0) {
            var roundTime = 4 - (totalTime % 4);
            if (noteDur <= roundTime) {
                //add normally
                durSteps = durNotations[noteDur - 1];
                oldStringTreble += " " + notePitchString + durSteps[0];
                if (durSteps.length > 1) {
                    if (notePitchString == "r") { oldStringTreble += " " + notePitchString + durSteps[1]; }
                    else { oldStringTreble += "~ " + notePitchString + durSteps[1]; }
                }
            }
            else {
                var remainingTime = noteDur - roundTime;
                durSteps = durNotations[roundTime - 1];
                oldStringTreble += " " + notePitchString + durSteps[0];
                if (durSteps.length > 1) {
                    if (notePitchString == "r") { oldStringTreble += " " + notePitchString + durSteps[1]; }
                    else { oldStringTreble += "~ " + notePitchString + durSteps[1]; }
                }
                durSteps = durNotations[remainingTime - 1];
                if (notePitchString == "r") { oldStringTreble += " " + notePitchString + durSteps[0]; }
                else { oldStringTreble += "~ " + notePitchString + durSteps[0]; }
                if (durSteps.length > 1) {
                    if (notePitchString == "r") { oldStringTreble += " " + notePitchString + durSteps[1]; }
                    else { oldStringTreble += "~ " + notePitchString + durSteps[1]; }
                }

                //add roundTime first + tie with remaining time
            }
        }
        else {
            //add normally  
            durSteps = durNotations[noteDur - 1];
            oldStringTreble += " " + notePitchString + durSteps[0];
            if (durSteps.length > 1) {
                if (notePitchString == "r") { oldStringTreble += " " + notePitchString + durSteps[1]; }
                else { oldStringTreble += "~ " + notePitchString + durSteps[1]; }
            }
        }
        totalTime += noteDur; 

    }
    




    //add chords

    for (var i = 0; i < s.length; i++) {
        var chordDur = s[i][0];
        var chordNotes = s[i][1];
        var chordNotesString = "&lt;";
        if (chordNotes.length == 1 && chordNotes[0] == 12) {
            chordNotesString = "r";
        }
        else {
            for (var j = 0; j < chordNotes.length; j++) {
                chordNotesString += pitchNotation[chordNotes[j]] + " ";
            }
            chordNotesString += "&gt;";
        }
        

        //if chords overrun melody, set the time to fill the gap and then stop adding  
        if (chordTotalTime + chordDur >= totalTime) {
            chordDur = totalTime - chordTotalTime;
            i = s.length;
        }

        //if we're looking at the last chord, make sure it fills up the remaining space
        if (i == s.length - 1) {
            chordDur = totalTime - chordTotalTime;
        }

        //if the space it needs to fill is too large, break it into smaller durations
        if (chordDur > 12) {
            var addedDur = chordDur - 12;
            chordDur = 12;
            s.push([addedDur, chordNotes]);
            console.log("chordDur too long");
        }

        if (chordTotalTime % 4 != 0) {
            var roundTime = 4 - (chordTotalTime % 4);
            if (chordDur <= roundTime) {
                //add normally
                durSteps = durNotations[chordDur - 1];
                oldStringBass += " " + chordNotesString + durSteps[0];
                if (durSteps.length > 1) {
                    if (chordNotesString == "r") {oldStringBass += " " + chordNotesString + durSteps[1];} //dont use tilde for r
                    else { oldStringBass += "~ " + chordNotesString + durSteps[1];}  
                }
            }
            else {
                var remainingTime = chordDur - roundTime;
                durSteps = durNotations[roundTime - 1];
                oldStringBass += " " + chordNotesString + durSteps[0];
                if (durSteps.length > 1) {
                    if (chordNotesString == "r") { oldStringBass += " " + chordNotesString + durSteps[1]; } //dont use tilde for r
                    else { oldStringBass += "~ " + chordNotesString + durSteps[1]; }
                }
                durSteps = durNotations[remainingTime - 1];
                if (chordNotesString == "r") { oldStringBass += chordNotesString + durSteps[0]; }
                else { oldStringBass += "~ " + chordNotesString + durSteps[0];}
                if (durSteps.length > 1) {
                    if (chordNotesString == "r") { oldStringBass += " " + chordNotesString + durSteps[1]; } //dont use tilde for r
                    else { oldStringBass += "~ " + chordNotesString + durSteps[1]; }
                }
                //add roundTime first + tie with remaining time
            }
        }
        else {
            durSteps = durNotations[chordDur - 1];
            oldStringBass += " " + chordNotesString + durSteps[0];
            if (durSteps.length > 1) {
                if (chordNotesString == "r") { oldStringBass += " " + chordNotesString + durSteps[1]; } //dont use tilde for r
                else { oldStringBass += "~ " + chordNotesString + durSteps[1]; }
            }
            //add normally   
        }
        chordTotalTime += chordDur;   
    }

    //check to make sure we end up with the same time
    console.log(chordTotalTime == totalTime);


    stepsAdded += 1;
    if (stepsAdded % 2 == 0) {
        oldStringTreble += " \\resetRelativeOctave c'";
        oldStringBass += " \\resetRelativeOctave c";
    }
    oldStringTreble += "<br\>";
    oldStringBass += "<br\>";


    var transformString = transformDisplay.innerHTML;
    transformString += "<br\> Melody: "
 
    for (var i = 0; i < m.length; i++) {
        transformString += " (" + m[i][0].toString() + ")" + m[i][1].toString() + " ";
    }

    transformString += "<br\> Chords: ";

    for (var i = 0; i < s.length; i++) {
        transformString += "(" + s[i][0].toString() + ") ";
        for (var j = 1; j < s[i].length; j++) {
            transformString += s[i][j].toString() + " ";
        }
        transformString += " | ";
    }

    transformString += "<br\> Transform: [" + t.toString() + "]--> Chord: <" + chord.toString() + "> " + keyMap[chord[0]] + chordMapForDisplay[chord[1]][chord[2]];

    console.log(totalTime);
    trebleDisplay.innerHTML = oldStringTreble;
    bassDisplay.innerHTML = oldStringBass;
    transformDisplay.innerHTML = transformString;
}








var titleSpan = document.getElementById("title");


function clearTitle() {
    titleSpan.innerHTML = ""; 
}







function createTitle() {
    if (numAlive == 0) {
        return;
    }
    var x = 0;
    var y = 0;
    for (var i = 0; i < cellsAlive.length; i++) {
        x += cellsAlive[i][0];

        y += cellsAlive[i][1];
    }
    title = x.toString() + keyMap[key][0] + y.toString() + chordMapForDisplay[triad][seventh][0] + numAlive.toString();
    titleSpan.innerHTML = title;

}


function mod(n, m) {
    return Number(((n % m) + m) % m);
}
