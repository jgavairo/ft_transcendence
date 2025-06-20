# CSS Customization Guide

## 1. Colors and Opacity
```css
/* Colors */
color: #ff0000;              /* Hexadecimal red */
color: rgb(255, 0, 0);       /* Red in RGB */
color: rgba(255, 0, 0, 0.5); /* Red with opacity */
color: red;                  /* Color name */
color: var(--my-variable);   /* CSS variable */

/* Opacity */
opacity: 0.5;                /* 0 = transparent, 1 = opaque */
```

## 2. Dimensions and Positioning
```css
/* Dimensions */
width: 100px;                /* Fixed width */
width: 100%;                 /* Relative width */
height: 100vh;               /* Height relative to window */
min-width: 200px;            /* Minimum width */
max-width: 800px;            /* Maximum width */

/* Positioning */
position: relative;          /* Relative position */
position: absolute;          /* Absolute position */
position: fixed;             /* Fixed position */
top: 10px;                   /* Distance from top */
left: 20px;                  /* Distance from left */
z-index: 1;                  /* Stacking order */
```

## 3. Layout (Flexbox)
```css
/* Flex Container */
display: flex;               /* Enable Flexbox */
flex-direction: row;         /* Horizontal direction */
flex-direction: column;      /* Vertical direction */
justify-content: center;     /* Horizontal alignment */
align-items: center;         /* Vertical alignment */
gap: 10px;                   /* Space between elements */

/* Flex Items */
flex: 1;                     /* Take available space */
flex-grow: 1;                /* Ability to grow */
flex-shrink: 0;              /* Ability to shrink */
flex-basis: 100px;           /* Base size */
```

## 4. Borders and Shadows
```css
/* Borders */
border: 1px solid black;     /* Simple border */
border-radius: 10px;         /* Rounded corners */
border-top: 2px dashed red;  /* Top border */

/* Shadows */
box-shadow: 0 0 10px rgba(0,0,0,0.5);  /* Box shadow */
text-shadow: 2px 2px 4px black;        /* Text shadow */
```

## 5. Text
```css
/* Text style */
font-family: Arial, sans-serif;  /* Font */
font-size: 16px;                 /* Size */
font-weight: bold;               /* Weight */
text-align: center;              /* Alignment */
text-decoration: underline;      /* Underline */
line-height: 1.5;                /* Line height */
letter-spacing: 2px;             /* Letter spacing */
```

## 6. Transitions and Animations
```css
/* Transitions */
transition: all 0.3s ease;       /* General transition */
transition-property: color;      /* Property to animate */
transition-duration: 0.3s;       /* Duration */
transition-timing-function: ease;/* Animation type */

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
transform: scale(1.5);           /* Scale */
transform: translate(100px);     /* Translation */
transform: skew(10deg);          /* Skew */
```

## 8. Background
```css
background-color: blue;          /* Background color */
background-image: url('image.jpg'); /* Background image */
background-size: cover;          /* Image size */
background-position: center;     /* Image position */
background-repeat: no-repeat;    /* Repeat */
```

## 9. Mouse Effects
```css
/* States */
:hover { color: red; }          /* On hover */
:active { color: blue; }        /* On click */
:focus { outline: 2px solid; }  /* On focus */
:disabled { opacity: 0.5; }     /* Disabled */
```

## 10. Media Queries (Responsive)
```css
/* Mobile screen */
@media (max-width: 768px) {
    .container { width: 100%; }
}

/* Tablet screen */
@media (min-width: 769px) and (max-width: 1024px) {
    .container { width: 80%; }
}

/* Desktop screen */
@media (min-width: 1025px) {
    .container { width: 60%; }
}
```

## 11. CSS Variables
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

## 12. Advanced Selectors
```css
/* Attribute selector */
[type="text"] { /* ... */ }

/* State selector */
input:checked { /* ... */ }

/* Position selector */
li:first-child { /* ... */ }
li:last-child { /* ... */ }
li:nth-child(2) { /* ... */ }

/* Relation selector */
.parent > .child { /* ... */ }
.sibling + .sibling { /* ... */ }
```

## 13. Pseudo-elements
```css
::before { content: "→"; }      /* Before the element */
::after { content: "←"; }       /* After the element */
::first-letter { font-size: 2em; } /* First letter */
::selection { background: yellow; } /* Selected text */
```