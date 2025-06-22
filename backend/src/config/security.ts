// Configuration de sécurité pour l'upload de fichiers
export const UPLOAD_SECURITY_CONFIG = {
    // Types d'images autorisés
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    
    // Extensions autorisées
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    
    // Taille maximale des fichiers (5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    
    // Dimensions maximales des images
    MAX_IMAGE_DIMENSIONS: {
        width: 1920,
        height: 1080
    },
    
    // Dimensions minimales des images
    MIN_IMAGE_DIMENSIONS: {
        width: 1,
        height: 1
    },
    
    // Messages d'erreur
    ERROR_MESSAGES: {
        NO_FILE: 'No file sent',
        FILE_TOO_LARGE: (maxSize: number) => `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        INVALID_MIME_TYPE: 'The file must be an image',
        INVALID_FORMAT: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed',
        INVALID_EXTENSION: 'Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp are allowed',
        EXTENSION_MISMATCH: 'File extension does not match the actual file type',
        INVALID_DIMENSIONS: (maxWidth: number, maxHeight: number) => 
            `Image dimensions must be between 1x1 and ${maxWidth}x${maxHeight}`,
        SERVER_ERROR: 'Server error while changing profile picture'
    }
};

// Configuration pour les dossiers d'upload
export const UPLOAD_PATHS = {
    PROFILE_PICTURES: 'uploads/profile_pictures',
    TEMP: 'uploads/temp'
};

// Configuration pour la validation des fichiers
export const FILE_VALIDATION = {
    // Vérifier les magic bytes
    CHECK_MAGIC_BYTES: true,
    
    // Vérifier les dimensions
    CHECK_DIMENSIONS: true,
    
    // Vérifier l'extension
    CHECK_EXTENSION: true,
    
    // Vérifier le type MIME
    CHECK_MIME_TYPE: true,
    
    // Vérifier la taille
    CHECK_FILE_SIZE: true
}; 