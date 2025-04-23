# Guide de Personnalisation CSS

## 1. Couleurs et Opacité
```css
/* Couleurs */
color: #ff0000;              /* Rouge en hexadécimal */
color: rgb(255, 0, 0);       /* Rouge en RGB */
color: rgba(255, 0, 0, 0.5); /* Rouge avec opacité */
color: red;                  /* Nom de couleur */
color: var(--ma-variable);   /* Variable CSS */

/* Opacité */
opacity: 0.5;                /* 0 = transparent, 1 = opaque */
```

## 2. Dimensions et Positionnement
```css
/* Dimensions */
width: 100px;                /* Largeur fixe */
width: 100%;                 /* Largeur relative */
height: 100vh;               /* Hauteur relative à la fenêtre */
min-width: 200px;            /* Largeur minimale */
max-width: 800px;            /* Largeur maximale */

/* Positionnement */
position: relative;          /* Position relative */
position: absolute;          /* Position absolue */
position: fixed;             /* Position fixe */
top: 10px;                   /* Distance depuis le haut */
left: 20px;                  /* Distance depuis la gauche */
z-index: 1;                  /* Ordre d'empilement */
```

## 3. Mise en Page (Flexbox)
```css
/* Conteneur Flex */
display: flex;               /* Active Flexbox */
flex-direction: row;         /* Direction horizontale */
flex-direction: column;      /* Direction verticale */
justify-content: center;     /* Alignement horizontal */
align-items: center;         /* Alignement vertical */
gap: 10px;                   /* Espace entre les éléments */

/* Éléments Flex */
flex: 1;                     /* Prend l'espace disponible */
flex-grow: 1;                /* Capacité à grandir */
flex-shrink: 0;              /* Capacité à rétrécir */
flex-basis: 100px;           /* Taille de base */
```

## 4. Bordures et Ombres
```css
/* Bordures */
border: 1px solid black;     /* Bordure simple */
border-radius: 10px;         /* Coins arrondis */
border-top: 2px dashed red;  /* Bordure supérieure */

/* Ombres */
box-shadow: 0 0 10px rgba(0,0,0,0.5);  /* Ombre portée */
text-shadow: 2px 2px 4px black;        /* Ombre de texte */
```

## 5. Texte
```css
/* Style de texte */
font-family: Arial, sans-serif;  /* Police */
font-size: 16px;                 /* Taille */
font-weight: bold;               /* Épaisseur */
text-align: center;              /* Alignement */
text-decoration: underline;      /* Soulignement */
line-height: 1.5;                /* Hauteur de ligne */
letter-spacing: 2px;             /* Espacement des lettres */
```

## 6. Transitions et Animations
```css
/* Transitions */
transition: all 0.3s ease;       /* Transition générale */
transition-property: color;      /* Propriété à animer */
transition-duration: 0.3s;       /* Durée */
transition-timing-function: ease;/* Type d'animation */

/* Animations */
@keyframes slide {
    from { transform: translateX(0); }
    to { transform: translateX(100px); }
}
animation: slide 1s infinite;    /* Animation */
```

## 7. Transformations
```css
transform: rotate(45deg);        /* Rotation */
transform: scale(1.5);           /* Échelle */
transform: translate(100px);     /* Translation */
transform: skew(10deg);          /* Inclinaison */
```

## 8. Arrière-plan
```css
background-color: blue;          /* Couleur de fond */
background-image: url('image.jpg'); /* Image de fond */
background-size: cover;          /* Taille de l'image */
background-position: center;     /* Position de l'image */
background-repeat: no-repeat;    /* Répétition */
```

## 9. Effets de Souris
```css
/* États */
:hover { color: red; }          /* Au survol */
:active { color: blue; }        /* Au clic */
:focus { outline: 2px solid; }  /* Au focus */
:disabled { opacity: 0.5; }     /* Désactivé */
```

## 10. Media Queries (Responsive)
```css
/* Écran mobile */
@media (max-width: 768px) {
    .container { width: 100%; }
}

/* Écran tablette */
@media (min-width: 769px) and (max-width: 1024px) {
    .container { width: 80%; }
}

/* Écran desktop */
@media (min-width: 1025px) {
    .container { width: 60%; }
}
```

## 11. Variables CSS
```css
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --spacing-unit: 8px;
}

.element {
    color: var(--primary-color);
    margin: var(--spacing-unit);
}
```

## 12. Sélecteurs Avancés
```css
/* Sélection par attribut */
[type="text"] { /* ... */ }

/* Sélection par état */
input:checked { /* ... */ }

/* Sélection par position */
li:first-child { /* ... */ }
li:last-child { /* ... */ }
li:nth-child(2) { /* ... */ }

/* Sélection par relation */
.parent > .child { /* ... */ }
.sibling + .sibling { /* ... */ }
```

## 13. Pseudo-éléments
```css
::before { content: "→"; }      /* Avant l'élément */
::after { content: "←"; }       /* Après l'élément */
::first-letter { font-size: 2em; } /* Première lettre */
::selection { background: yellow; } /* Texte sélectionné */
``` 