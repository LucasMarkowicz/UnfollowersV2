document.getElementById('zipFile').addEventListener('change', handleZipFile);

let followersData = null;
let followingData = null;

function handleZipFile(event) {
    const file = event.target.files[0];

    // Validar que el archivo es un ZIP
    if (!file.name.endsWith('.zip')) {
        alert("Please upload a valid .zip file.");
        return;
    }

    // Validar el tamaño del archivo (limite de 5MB, puedes ajustarlo si es necesario)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert("The .zip file is to big. The max size is 5MB.");
        return;
    }

    const jszip = new JSZip();

    jszip.loadAsync(file).then(zip => {
        const folder = zip.folder("connections/followers_and_following");

        if (!folder) {
            alert("The .zip file you uploaded doesn't have the required structure.");
            return;
        }

        const followersFile = folder.file("followers_1.json");
        const followingFile = folder.file("following.json");

        if (!followersFile || !followingFile) {
            alert("The .zip file doesn't have the required files (followers_1.json y following.json).");
            return;
        }

        // Procesar archivos con manejo de errores
        followersFile.async("string").then(content => {
            try {
                followersData = JSON.parse(content);
                checkIfReady();
            } catch (error) {
                alert("Error on processing followers_1.json. Please make sure the JSON file is correctly formmated.");
                console.error(error);
            }
        });

        followingFile.async("string").then(content => {
            try {
                followingData = JSON.parse(content);
                checkIfReady();
            } catch (error) {
                alert("Error on processing following.json. Please make sure the JSON file is correctly formmated.");
                console.error(error);
            }
        });
    }).catch(error => {
        alert("There was an error on processing the .zip file.");
        console.error(error);
    });
}

function checkIfReady() {
    if (followersData && followingData) {
        document.getElementById('compareButton').disabled = false;
    }
}

document.getElementById('compareButton').addEventListener('click', function() {
    const result = compareFollowers(followersData, followingData);
    displayResult(result);
});

function compareFollowers(followers, following) {
    const followersSet = new Set(
        followers.map(follower => follower.string_list_data[0].value)
    );

    const notFollowingBack = following.relationships_following.filter(person => {
        const username = person.string_list_data[0].value;
        return !followersSet.has(username);
    }).map(person => ({
        username: person.string_list_data[0].value,
        link: person.string_list_data[0].href
    }));

    return notFollowingBack;
}

function displayResult(result) {
    const resultContainer = document.getElementById('result');

    if (result.length === 0) {
        resultContainer.innerText = "You follow all these users but they don't follow you back.";
    } else {
        resultContainer.innerHTML = `
            <p>The following users doesn't follow you back (${result.length}):</p>
            <ul>${result.map(user => `<li><a href="${user.link}" target="_blank">${user.username}</a></li>`).join('')}</ul>
        `;
    }
}

