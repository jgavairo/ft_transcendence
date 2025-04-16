const api = {
    get: (url: string) => fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    }),

    post: (url: string, data: any) => fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }),

    postFormData: (url: string, data: FormData) => fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: data,
    })
};

export default api;
//post envoie les données au serveur
//get récupère les données du serveur
//credentials: 'include' signifie que le cookie est inclus dans la requête
//headers: { 'Content-Type': 'application/json' } signifie que le contenu est du json
//body: JSON.stringify(data) signifie que le corps de la requête est le json data

