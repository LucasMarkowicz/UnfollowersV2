document.getElementById('zipFile').addEventListener('change', handleZipFile);

let followersData = null;
let followingData = null;

function handleZipFile(event) {
    const file = event.target.files[0];

    // Validar que el archivo es un ZIP
    if (!file.name.endsWith('.zip')) {
        alert("Por favor, cargue un archivo ZIP válido.");
        return;
    }

    // Validar el tamaño del archivo (limite de 5MB, puedes ajustarlo si es necesario)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert("El archivo ZIP es demasiado grande. El tamaño máximo permitido es de 5MB.");
        return;
    }

    const jszip = new JSZip();

    jszip.loadAsync(file).then(zip => {
        const folder = zip.folder("connections/followers_and_following");

        if (!folder) {
            alert("El archivo ZIP no contiene la estructura de carpetas requerida.");
            return;
        }

        const followersFile = folder.file("followers_1.json");
        const followingFile = folder.file("following.json");

        if (!followersFile || !followingFile) {
            alert("El archivo ZIP no contiene los archivos necesarios (followers_1.json y following.json) en la carpeta correcta.");
            return;
        }

        // Procesar archivos con manejo de errores
        followersFile.async("string").then(content => {
            try {
                followersData = JSON.parse(content);
                checkIfReady();
            } catch (error) {
                alert("Error al procesar followers_1.json. Asegúrese de que el archivo JSON esté correctamente formateado.");
                console.error(error);
            }
        });

        followingFile.async("string").then(content => {
            try {
                followingData = JSON.parse(content);
                checkIfReady();
            } catch (error) {
                alert("Error al procesar following.json. Asegúrese de que el archivo JSON esté correctamente formateado.");
                console.error(error);
            }
        });
    }).catch(error => {
        alert("Hubo un error al procesar el archivo ZIP.");
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
        resultContainer.innerText = "Todos los usuarios que sigues también te siguen.";
    } else {
        resultContainer.innerHTML = `
            <p>Los siguientes usuarios no te siguen de vuelta (${result.length}):</p>
            <ul>${result.map(user => `<li><a href="${user.link}" target="_blank">${user.username}</a></li>`).join('')}</ul>
        `;
    }
}

