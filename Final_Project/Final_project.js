 //API Key
const apiKey = 'm9rfLaAaDPKd8Yy29tCsyIMFQT8AzsaDpLuBJNAu';

// Audio context for handling web audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Object to store active audio sources for different instruments and layers
const activeSources = {
    drums: { 1: [], 2: [], 3: [] },
    piano: { 1: [], 2: [], 3: [] },
    guitar: { 1: [], 2: [], 3: [] },
    custom: {},
};

// Variable to store the preview audio ( stopping previews)
let previewAudio;

// Function to play the entire loop
function playLoop() {
    let startTime = audioContext.currentTime + 0.1; // Add a small delay (should help with scheduling)

    Object.values(activeSources).forEach(instrument => {
        Object.values(instrument).forEach(layer => {
            layer.forEach(source => {
                source.start(startTime);
            });
        });
    });
}

// Function to stop the preview audio
function stopPreview() {
    if (previewAudio) {
        try {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        } catch (error) {
            console.error('Error stopping preview', error);
        }
    }
}

// Function to add a new sound to the custom loop section
function addSoundToLoopSection(instrument, soundId) {
    const loopSection = document.getElementById('beat-buttons');

    let layer = 1;
    while (activeSources.custom[layer]) {
        layer++;
    }

    const loopButton = createLoopButton(instrument, layer, soundId);
    loopSection.appendChild(loopButton);

    activeSources.custom[layer] = true;
}

// Function to create a loop button for the custom loop
function createLoopButton(instrument, layer, soundId) {
    const loopButton = document.createElement('div');
    loopButton.classList.add('beat-button');
    loopButton.id = `custom-loop-${layer}`;
    loopButton.textContent = `${instrument} loop ${layer}`;

    loopButton.addEventListener('click', () => {
        stopPreview();
        playRandomSound(instrument, layer, soundId);
    });

    loopButton.style.backgroundColor = 'red';
    setTimeout(() => {
        loopButton.style.backgroundColor = '';
    }, 1000);

    return loopButton;
}

// Function to search for sounds based on query
function searchSounds(query) {
    return fetch(`https://freesound.org/apiv2/search/text/?query=${query}&token=${apiKey}`)
        .then(response => response.json())
        .then(data => data.results.map(result => result.id))
        .catch(error => {
            console.error('Error searching for sounds!', error);
            return [];
        });
}

// Function to fetch random sounds based on an array of sound IDs
function fetchRandomSound(soundIds) {
    const randomIndex = Math.floor(Math.random() * soundIds.length);
    const randomSoundId = soundIds[randomIndex];
    return fetchSound(randomSoundId);
}

// Function to play a random sound based on instrument, layer, and query
function playRandomSound(instrument, layer, query) {
    searchSounds(query)
        .then(soundIds => fetchRandomSound(soundIds))
        .then(url => playSound(instrument, layer, url))
        .catch(error => console.error('Error playing random sound', error));
}

// Function to play a sound based on instrument, layer, and URL
function playSound(instrument, layer, url) {
    const source = audioContext.createBufferSource();
    const currentTime = audioContext.currentTime;
    const timeUntilNextBeat = Math.ceil(currentTime) - currentTime;

    fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => audioContext.decodeAudioData(buffer))
        .then(audioBuffer => {
            source.buffer = audioBuffer;

            // Create gain node for volume control
            const gainNode = audioContext.createGain();
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            source.gainNode = gainNode;

            source.loop = true;
            source.start(currentTime + timeUntilNextBeat);
            activeSources[instrument][layer].push(source);
            addSoundToLoopSection(instrument, layer, url);
        })
        .catch(error => console.error('Error loading or decoding sound', error));
}

// Function to fetch sound data from FreeSound.org based on a sound ID
function fetchSound(soundId) {
    return fetch(`https://freesound.org/apiv2/sounds/${soundId}/?token=${apiKey}`)
        .then(response => response.json())
        .then(data => data.previews['preview-hq-mp3']);
}

// Function to preview a sound based on sound ID
function previewSound(soundId) {
    fetchSound(soundId)
        .then(url => {
            stopPreview();
            previewAudio = new Audio(url);
            previewAudio.play();
        })
        .catch(error => console.error('Error previewing sound', error));
}

// Function to create a result button with preview and add-to-loop functionality
function createResultButton(soundId, onPreview, onAddToLoop) {
    const resultButton = document.createElement('div');
    resultButton.classList.add('result-button');

    const previewButton = createButton('Preview', () => {
        stopPreview();
        onPreview(soundId);
    });

    const addButton = createButton('Add to Loop', () => {
        stopPreview();
        onAddToLoop(soundId);
    });

    resultButton.appendChild(previewButton);
    resultButton.appendChild(addButton);

    return resultButton;
}

// Function to create a generic button with a label and click event
function createButton(label, onClick) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

// Event listeners for instrument buttons to play random sounds
document.getElementById('drums').addEventListener('click', () => {
    stopPreview();
    playRandomSound('drums', 1, 'drum');
});

document.getElementById('piano').addEventListener('click', () => {
    stopPreview();
    playRandomSound('piano', 1, 'piano');
});

document.getElementById('guitar').addEventListener('click', () => {
    stopPreview();
    playRandomSound('guitar', 1, 'guitar');
});

// Event listener for the search button to perform a sound search
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query.trim() !== '') {
        searchSounds(query)
            .then(soundIds => {
                const resultsContainer = document.getElementById('search-results');
                resultsContainer.innerHTML = '';

                soundIds.forEach(soundId => {
                    const resultButton = createResultButton(
                        soundId,
                        previewSound,
                        (id) => addSoundToLoopSection('custom', id)
                    );
                    resultsContainer.appendChild(resultButton);
                });
            })
            .catch(error => console.error('Error performing search', error));
    }
});

// Event listener for the play button to play the entire loop
document.getElementById('play-button').addEventListener('click', () => {
    playLoop();
});

// Event listener for the stop button to stop previews and clear active sources
document.getElementById('stop-button').addEventListener('click', () => {
    stopPreview();
    Object.values(activeSources).forEach(instrument => {
        Object.values(instrument).forEach(layer => {
            layer.forEach(source => {
                source.stop();
                source.disconnect();
                source.loop = false;
            });
            layer.length = 0;
        });
    });
});

// Event listener for the reset button to stop previews and clear all active sources
document.getElementById('reset-button').addEventListener('click', () => {
    stopPreview();
    Object.values(activeSources).forEach(instrument => {
        Object.values(instrument).forEach(layer => {
            layer.forEach(source => {
                source.stop();
                source.disconnect();
            });
            layer.length = 0;
        });
    });
});
