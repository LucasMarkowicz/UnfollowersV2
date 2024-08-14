document.getElementById('zipFile').addEventListener('change', handleZipFile);

let followersData = null;
let followingData = null;

function handleZipFile(event) {
    const file = event.target.files[0];
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

        followersFile.async("string").then(content => {
            followersData = JSON.parse(content);
            checkIfReady();
        });

        followingFile.async("string").then(content => {
            followingData = JSON.parse(content);
            checkIfReady();
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
        resultContainer.innerHTML = `<p>Los siguientes usuarios no te siguen de vuelta:</p><ul>${result.map(user => `<li><a href="${user.link}" target="_blank">${user.username}</a></li>`).join('')}</ul>`;
    }
}
