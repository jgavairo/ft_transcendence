# Guide Fastify - Fonctions et Requêtes

## Table des matières
1. [Types de Requêtes](#types-de-requêtes)
2. [Fonctions de Gestion des Utilisateurs](#fonctions-de-gestion-des-utilisateurs)
3. [Middleware d'Authentification](#middleware-dauthentification)
4. [Gestion des Erreurs](#gestion-des-erreurs)

## Types de Requêtes

### FastifyRequest
```typescript
interface FastifyRequest {
    // Propriétés de base
    id: string;              // ID unique de la requête
    params: any;             // Paramètres d'URL
    query: any;              // Paramètres de requête
    body: any;               // Corps de la requête
    headers: any;            // En-têtes HTTP
    cookies: any;            // Cookies
    raw: any;                // Requête HTTP brute

    // Méthodes utiles
    log: any;                // Logger
    server: any;             // Instance du serveur
}
```

### AuthenticatedRequest
```typescript
interface AuthenticatedRequest extends FastifyRequest 
{
    user: 
    {
        id: number;          // ID de l'utilisateur authentifié
    };
}
```

## Fonctions de Gestion des Utilisateurs

### getInfosHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Récupère les informations de l'utilisateur
    // Requête: GET /api/user/infos
    // Retourne: { success: boolean, user: UserInfo }
}
```

### getUserLibraryHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Récupère la bibliothèque de jeux de l'utilisateur
    // Requête: GET /api/user/library
    // Retourne: { success: boolean, library: Game[] }
}
```

### addGameHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Ajoute un jeu à la bibliothèque de l'utilisateur
    // Requête: POST /api/user/addGame
    // Corps: { gameId: number }
    // Retourne: { success: boolean, message: string }
}
```

### changePictureHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Change la photo de profil de l'utilisateur
    // Requête: POST /api/profile/changePicture
    // Corps: FormData avec l'image
    // Retourne: { success: boolean, message: string }
}
```

### updateBioHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Met à jour la bio de l'utilisateur
    // Requête: POST /api/profile/updateBio
    // Corps: { bio: string }
    // Retourne: { success: boolean, message: string }
}
```

### getAllUsersHandler
```typescript
async (request: FastifyRequest, reply: FastifyReply) => {
    // Récupère tous les utilisateurs
    // Requête: GET /api/users
    // Retourne: { success: boolean, users: User[] }
}
```

## Middleware d'Authentification

### authMiddleware
```typescript
async (request: AuthenticatedRequest, reply: FastifyReply) => {
    // Vérifie le token JWT dans les cookies
    // Ajoute l'ID de l'utilisateur à la requête
    // Retourne une erreur 401 si non authentifié
}
```

## Gestion des Erreurs

### Codes HTTP Courants
- 200: Succès
- 400: Mauvaise requête
- 401: Non authentifié
- 403: Interdit
- 404: Non trouvé
- 500: Erreur serveur

### Format de Réponse d'Erreur
```typescript
{
    success: false,
    message: "Message d'erreur détaillé"
}
```

## Bonnes Pratiques

1. **Typage**
   - Utiliser des interfaces pour les types de requêtes
   - Définir clairement les types de retour
   - Utiliser le type assertion (`as`) avec précaution

2. **Sécurité**
   - Toujours vérifier l'authentification avec `authMiddleware`
   - Valider les entrées utilisateur
   - Utiliser HTTPS en production

3. **Gestion des Erreurs**
   - Toujours utiliser try/catch
   - Logger les erreurs détaillées
   - Renvoyer des messages d'erreur clairs

4. **Performance**
   - Utiliser `async/await` pour les opérations asynchrones
   - Éviter les requêtes inutiles à la base de données
   - Mettre en cache quand possible 