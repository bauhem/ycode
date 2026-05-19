# Bauhem Ycode Constitution

## Core Principles

### I. Ycode Native First
Toute fonctionnalité, tout design et toute donnée doit prioritairement utiliser les fonctionnalités natives de Ycode (Designer, CMS, Forms, Auth). Le système est conçu pour fonctionner intégralement au sein de l'écosystème Ycode, sans dépendance nécessaire à des front-ends externes.

### II. Approche Hybride (Statique & Dynamique)
Le système supporte et encourage la cohabitation de deux modes de création de pages :
- **Pages Statiques :** Construites directement et librement dans le Designer pour les pages uniques, sur-mesure ou très visuelles.
- **Pages Dynamiques (Modular Page Building) :** Générées à partir du CMS (via des routes dynamiques de type `[...slug]`), en assemblant des "Blocs" (Composants Ycode) insérés dans des champs Texte Riche, à la manière d'un CMS moderne (Structured Text).

### III. Flexibilité Éditoriale
Les éditeurs (clients ou équipe) ont la liberté de travailler à la fois dans le CMS (pour le contenu structuré, régulier et modulaire) et dans le Designer (pour des ajustements visuels, des lancements de campagnes ou des pages statiques). L'interface doit rester claire, bien nommée et maintenable dans les deux contextes.

### IV. Composabilité et Props (Variables)
Chaque Composant Ycode créé (qu'il soit destiné au Designer ou au CMS) doit être pensé de manière modulaire. Il doit exposer des "Variables" (Props) claires et typées (Texte, Image, Couleur, Lien) pour permettre son injection dynamique et faciliter sa réutilisation partout sur le site.

## Workflow de Développement

Toute création de fonctionnalité ou de nouveau type de page suit ces étapes :
1. **Choix de l'Approche :** Déterminer si le besoin nécessite une approche purement Designer (statique) ou CMS (dynamique modulaire).
2. **Design System (Composants) :** Création des Composants Ycode (Blocs) nécessaires et définition de leurs Variables, afin qu'ils puissent servir aussi bien dans les pages statiques que dans les articles du CMS.
3. **Implémentation :** Soit création de la page dans le Designer, soit modélisation des collections CMS et configuration du template dynamique (page CMS).

## Governance

Cette constitution dicte l'architecture du projet Bauhem. Elle prône un équilibre parfait entre la liberté créative du Designer visuel de Ycode et la scalabilité d'un CMS modulaire orienté composants. 

**Version**: 1.1.0 | **Ratified**: 2026-05-19
