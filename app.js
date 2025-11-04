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
        // Buscar los archivos en cualquier ubicación del ZIP
        let followersFile = zip.file("followers_1.json");
        let followingFile = zip.file("following.json");

        // Si no están en la raíz, buscar en la carpeta común
        if (!followersFile || !followingFile) {
            const folder = zip.folder("connections/followers_and_following");
            if (folder) {
                followersFile = folder.file("followers_1.json");
                followingFile = folder.file("following.json");
            }
        }

        // También buscar solo en la raíz o en cualquier subcarpeta
        if (!followersFile) {
            const allFiles = Object.keys(zip.files);
            const followersPath = allFiles.find(path => path.includes("followers_1.json"));
            const followingPath = allFiles.find(path => path.includes("following.json"));
            
            if (followersPath) followersFile = zip.file(followersPath);
            if (followingPath) followingFile = zip.file(followingPath);
        }

        if (!followersFile || !followingFile) {
            alert("The .zip file doesn't have the required files (followers_1.json and following.json).");
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
    // Crear un Set con los usernames de los seguidores
    const followersSet = new Set(
        followers.map(follower => follower.string_list_data[0].value)
    );

    // Filtrar los que sigues pero no te siguen de vuelta
    const notFollowingBack = following.relationships_following.filter(person => {
        // El username está en el campo 'title' en el nuevo formato
        const username = person.title;
        return !followersSet.has(username);
    }).map(person => ({
        username: person.title,
        link: person.string_list_data[0].href
    }));

    return notFollowingBack;
}

function displayResult(result) {
    const resultContainer = document.getElementById('result');

    if (result.length === 0) {
        resultContainer.innerText = "Everyone you follow also follows you back!";
    } else {
        resultContainer.innerHTML = `
            <p>The following users don't follow you back (${result.length}):</p>
            <ul>${result.map(user => `<li><a href="${user.link}" target="_blank">${user.username}</a></li>`).join('')}</ul>
        `;
    }
}

