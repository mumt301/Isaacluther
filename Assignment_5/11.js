"use strict";

var oscillator; // We make the oscillator object as global
var reverb; // We make the reverb effect object as global
var autotune = false; // we set autotune to false by default
const userGestureEvents = [
   'contextmenu',
   'auxclick',
   'dblclick',
   'mousedown',
   'mouseup',
   'pointerup',
   'keyup',
   'keydown',
   'click',
   'touchend',
];

var userInteraction = false;
const unlockAudio = () => {
    userGestureEvents.forEach(eventName => {
        document.removeEventListener(eventName, unlockAudio);
        userInteraction = true;
    });
};

// This turns the Theremin on
function thereminOn(oscillator) {
    oscillator.play();
    if (userInteraction == false) { window.alert("Please click on the page to activate the theremin/broswer can enable audio playback"); }
}

// Lets me control the theremin
function thereminControl(e, oscillator, theremin) {
    let x = e.offsetX;  
    let y = e.offsetY;
    console.log(x, y);

    let minFrequency = 220.0;
    let maxFrequency = 880.0;
    let freqRange = maxFrequency - minFrequency;
    let thereminFreq = minFrequency + (x / theremin.clientWidth) * freqRange;
    let thereminVolume = 1.0 - (y / theremin.clientHeight);

    if (autotune) {
        var midiNote = Math.floor(frequencyToMidi(thereminFreq));
        thereminFreq = midiToFrequency(midiNote, 440);
    }

    oscillator.frequency = thereminFreq;
    var frequency = document.querySelector('#frequency .info');
    frequency.innerHTML = thereminFreq;

    oscillator.volume = thereminVolume;
    var volumeElement = document.querySelector('#volume .info');
    var volumeValue = Math.round(thereminVolume * 10);
    volumeElement.innerHTML = volumeValue;

    var noteNameFromFrequency = noteFromFrequency(thereminFreq, true);
    var noteName = document.querySelector('#note-name .info');
    noteName.innerHTML = noteNameFromFrequency;
}

// This turns the theremin off
function thereminOff(oscillator) {
    oscillator.stop();
}

// This runs a new instance of oscillator when changing options
function startNewOscillator(waveType) {
    // Instantiate a sine wave with pizzicato.js
    oscillator = new Pizzicato.Sound({
        source: 'wave',
        options: {
            type: waveType,
            frequency: 220
        }
    });
}

function startEffect(effectType) {
    reverb = new Pizzicato.Effects.Reverb({
        time: 1,
        decay: 2,
        reverse: true,
        mix: 0.5
    });
    oscillator.addEffect(reverb);
}

function runAfterLoadingPage() {
    startNewOscillator('sine');

    userGestureEvents.forEach(eventName => {
        document.addEventListener(eventName, unlockAudio);
    });

    // This gets the theremin div from the HTML
    const theremin = document.getElementById("thereminZone");

    // This lets the theremin play when the mouse enters the div
    theremin.addEventListener("mouseenter", function () {
        thereminOn(oscillator);
    });

    // This lets the theremin be controlled when the mouse is inside the div
    theremin.addEventListener("mousemove", function (e) {
        thereminControl(e, oscillator, theremin);
    });

    // This makes the theremin stop when it leaves the div
    theremin.addEventListener("mouseleave", function () {
        thereminOff(oscillator);
    });

    // This detects if NOTE checkbox is changes
    let chromatic = document.getElementById("autotune");
    chromatic.addEventListener("change", () => {
        autotune = chromatic.checked;
    });

    // This detects if wave type dropdown changes
    // If this is the case, it restarts Oscillator 
    var waveTypeDropdown = document.getElementById("wave-type");
    waveTypeDropdown.addEventListener('change', function () {
        startNewOscillator(waveTypeDropdown.value);
    });

    // This detects if REVERB checkbox changes
    let effect = document.getElementById("reverb");
    effect.addEventListener("change", () => {
        if (effect.checked) {
            startEffect('reverb');
        } else {
            oscillator.removeEffect(reverb);
        }
    });
}

window.onload = runAfterLoadingPage;
