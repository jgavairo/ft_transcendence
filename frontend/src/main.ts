// src/main.ts
console.log("Hello, TypeScript!");
// Fonction pour afficher un message dans l'élément avec l'ID 'app'
function displayMessage() {
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = '<p>Hello, TypeScript!</p>';
    }
}

// Appeler la fonction pour afficher le message lorsque le script est chargé
displayMessage();
