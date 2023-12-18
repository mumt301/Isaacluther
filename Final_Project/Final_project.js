
const apiKey = 'm9rfLaAaDPKd8Yy29tCsyIMFQT8AzsaDpLuBJNAu';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

//This allows me to keep track of the active audio sources for each instrument and layer

const activeSources = {
    drums: {1: [], 2: [], 3: [] },
    piano: {1: [], 2: [], 3: [] },
    guitar:{1: [], 2: [], 3: [] },
};

//fetches sound from Freesound.org

async function fetchSound(soundId) {
    const response = await fetch(`https://freesound.org/apiv2/sounds/${soundId}/?token=${apiKey}`);
    const data = await response.json();
    return data.previews['preview-hq-mp3'];
}

function searchSounds(query) {
    return fetch(`https://freesound.org/apiv2/search/text/?query=${query}&token=${apiKey}`)
    .then(response => response.json())
    .then(data => {
        return data.results.map(result => result.id);

    })
    .catch(error => {
        console.error('Error searching for sounds!', error);
        return [];
    });
}

function fetchRandomSound(soundIds) {
    const randomIndex = Math.floor(Math.random() * soundIds.length);
    const randomSoundId = soundIds[randomIndex];
    return fetchSound(randomSoundId);
}

function playRandomSound(instrument, layer, query) {
    searchSounds(query)
    .then(soundIds => fetchRandomSound(soundIds))
    .then(url => playSound(instrument, layer, url))
    .catch(error => console.error('error plauing random sound', error));
}

function playSound(instrument, layer, url) {
    const source = audioContext.createBufferSource();
    const currentTime = audioContext.currentTime;
    const timeUntilNextBeat = Math.ceil(currentTime) - currentTime;

    fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => audioContext.decodeAudioData(buffer))
        .then(audioBuffer => {
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.loop = true;
            source.start(currentTime + timeUntilNextBeat);
            activeSources[instrument][layer].push(source);
        })
        .catch(error => console.error('Error loading sound', error));
}

//This is my event listeners for my instrument BUTTONS

document.getElementById('drums').addEventListener('click', () => {
    playRandomSound('drums', 1, 'drum');
});

document.getElementById('piano').addEventListener('click', () => {
    playRandomSound('piano', 1, 'piano');
});

document.getElementById('guitar').addEventListener('click', () => {
    playRandomSound('guitar', 1, 'guitar');
});

document.getElementById('drums1').addEventListener('click', () => {
    playRandomSound('drums', 1, 'https://freesound.org/data/previews/668530/668530_2228282-lq.mp3');
});

document.getElementById('drums2').addEventListener('click', () => {
    playRandomSound('drums', 2, 'https://freesound.org/data/previews/668544/668544_2768345-lq.mp3');
});

document.getElementById('drums3').addEventListener('click', () => {
    playRandomSound('drums', 3, 'https://freesound.org/data/previews/668531/668531_2506416-lq.mp3');
});

document.getElementById('piano1').addEventListener('click', () => {
    playRandomSound('piano', 1, 'https://freesound.org/data/previews/629169/629169_2506416-lq.mp3');
});

document.getElementById('piano2').addEventListener('click', () => {
    playRandomSound('piano', 2, 'https://freesound.org/data/previews/629148/629148_1390841-lq.mp3');
});

document.getElementById('piano3').addEventListener('click', () => {
    playRandomSound('piano', 3, 'https://freesound.org/data/previews/629169/629169_2506416-lq.mp3');
});

document.getElementById('guitar1').addEventListener('click', () => {
    playRandomSound('guitar', 1, 'https://freesound.org/data/previews/575300/575300_1657641-lq.mp3');
});

document.getElementById('guitar2').addEventListener('click', () => {
    playRandomSound('guitar', 2, 'https://freesound.org/data/previews/712897/712897_1706724-lq.mp3');
});

document.getElementById('guitar3').addEventListener('click', () => {
    playRandomSound('guitar', 3, 'https://freesound.org/data/previews/433623/433623_1942535-lq.mp3');
});


// loop controlz
document.getElementById('play-button').addEventListener('click', () => {
    //play all active sourcee
    Object.values(activeSources).forEach(instrument => {
        Object.values(instrument).forEach(layer => {
            layer.forEach(source => source.start());
        });
    });
});

document.getElementById('stop-button').addEventListener('click', () => {
    //stop sources
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

document.getElementById('reset-button').addEventListener('click', () => {
    //stop and disconnect all active sources
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

document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query.trim() !== '') {
        searchSounds(query)
            .then(soundIds => {
                const resultsContainer = document.getElementById('search-results');
                resultsContainer.innerHTML = ''; 

                soundIds.forEach(soundId => {
                    const resultButton = document.createElement('div');
                    resultButton.classList.add('result-button');
                    resultButton.textContent = `Result ${soundId}`;
                    resultButton.addEventListener('click', () => {
                        playRandomSound('drums', 1, soundId); 
                    });

                    resultsContainer.appendChild(resultButton);
                });
            })
            .catch(error => console.error('Error performing search', error));
    }
});

function showSearchResults(results) {
    const searchList = document.getElementById('search-list');
    searchList.innerHTML = '';

    results.forEach(result => {
        const listItem = document.createElement('li');
        listItem.textContent = result.name;
        searchList.appendChild(listItem)
    });

}
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    searchSounds(query)
    .then(results => showSearchResults(results))
    .catch(error => console.error('eror looking for sounds', error));

});

