### Pour Yoann
- J ai cree le fichier backend/src/utils/jwt.ts car necessaire pour mon fichier
backend/src/middleware/authentication.ts mais tu peux verif de ton cote si ca semble logique

Modif 30 oct 

- Creation de backend/src
server.ts deplace dans backend/src

- Creation de backend/src/types && backend/src/utils
Modif package.json :
    - Ajout de "build": "tsc"
    - Modification de "start": "node dist/src/server.js" (car tsc compile vers dist/src/)
    - Ajout de @types/node et prisma dans devDependencies (nécessaires pour la compilation)

- rm "version: "3.9"" dans docker-compose.dev (obsolete avec Docker Compose v2)

### TODO  
- cd backend; npm install
- npm install pino-pretty --save-dev // ?
- include FormattedUser in formatters.ts
- modules/users/users.service.ts

### refacto project-strucutre

- Arborescence propose 

backend/
├── src/
│   ├── app.ts                      # Configuration de l'app Fastify
│   ├── server.ts                   # Point d'entrée (lance le serveur)
│   ├── fastify.d.ts 
│   ├── modules/                    # Modules métier (feature-based)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts  # Routes & handlers
│   │   │   ├── auth.service.ts     # Logique métier
│   │   │   ├── auth.model.ts       # Types/Interfaces spécifiques
│   │   │   └── index.ts            # Export du module
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.model.ts
│   │   │   └── index.ts
│   │   │
│   │   └── game/
│   │       ├── game.controller.ts
│   │       ├── game.service.ts
│   │       ├── game.model.ts
│   │       └── index.ts
│   │
│   ├── shared/                     # Code partagé entre modules
│   │   ├── config/
│   │   │   └── environment.ts      # Variables d'environnement
│   │   │
│   │   ├── database/
│   │   │   └── prisma.ts           # Client Prisma singleton
│   │   │
│   │   ├── errors/
│   │   │   ├── AppError.ts         # Classe de base
│   │   │   ├── ValidationError.ts
│   │   │   ├── AuthError.ts
│   │   │   ├── NotFoundError.ts
│   │   │   ├── ConflictError.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts     # Global error handler
│   │   │   ├── authentication.ts   # JWT verification
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.ts              # JWT helpers
│   │   │   ├── password.ts         # Bcrypt helpers
│   │   │   └── formatters.ts       # Formatage des réponses
│   │   │
│   │   └── types/
│   │       ├── common.ts           # Types partagés
│   │       └──        # Extensions TypeScript Fastify
│   │
│   └── plugins/                    # Plugins Fastify personnalisés
│       ├── cors.ts
│       ├── helmet.ts
│       └── index.ts
│
├── prisma/
│   └── schema.prisma
│
├── database/                       # Base de données SQLite
│   └── dev.db
│
├── package.json
├── tsconfig.json
└── Dockerfile.prod


### Explications modif tsconfig.json
```
{
  "compilerOptions": {
    // ==========================================
    // CIBLE JAVASCRIPT
    // ==========================================
    
    // ✅ MODIFIÉ: ES2021 → ES2022
    // Pourquoi: ES2022 est plus récent et supporte mieux les features modernes
    // (top-level await, class fields, etc.)
    "target": "ES2022",
    
    // ==========================================
    // SYSTÈME DE MODULES
    // ==========================================
    
    // ✅ CONSERVÉ: ESNext (bon choix)
    // Pourquoi: On utilise les modules ES modernes (import/export)
    // au lieu de CommonJS (require/module.exports)
    "module": "ESNext",
    
    // ✅ MODIFIÉ: "Node" → "bundler"
    // Pourquoi: 
    // - "Node" est incompatible avec "module": "ESNext"
    // - "bundler" permet à TypeScript de comprendre les imports avec .js
    // - Compatible avec les outils modernes (Vite, esbuild, etc.)
    // Alternative possible: "NodeNext" (plus strict pour Node.js pur)
    "moduleResolution": "bundler",
    
    // ==========================================
    // DOSSIERS DE SORTIE
    // ==========================================
    
    // ✅ CONSERVÉ: dist
    // Pourquoi: Les fichiers .ts compilés iront dans ./dist
    "outDir": "dist",
    
    // ✅ CONSERVÉ: src
    // Pourquoi: Tous nos fichiers sources .ts sont dans ./src
    "rootDir": "src",
    
    // ==========================================
    // STRICTNESS (Validation stricte)
    // ==========================================
    
    // ✅ CONSERVÉ: true (excellent!)
    // Pourquoi: Active toutes les vérifications strictes TypeScript
    // - null/undefined checks
    // - no implicit any
    // - strict function types
    "strict": true,
    
    // ✅ AJOUTÉ: Détecte les variables/paramètres non utilisés
    // Pourquoi: Évite le code mort et améliore la qualité
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    
    // ✅ AJOUTÉ: Force les return dans toutes les branches
    // Pourquoi: Évite les bugs où on oublie de return quelque chose
    "noImplicitReturns": true,
    
    // ✅ AJOUTÉ: Force les break dans les switch
    // Pourquoi: Évite les bugs de "fallthrough" accidentels
    "noFallthroughCasesInSwitch": true,
    
    // ==========================================
    // INTEROPÉRABILITÉ
    // ==========================================
    
    // ✅ CONSERVÉ: true
    // Pourquoi: Permet d'importer des modules CommonJS dans ESM
    // Exemple: import express from 'express' (au lieu de import * as express)
    "esModuleInterop": true,
    
    // ✅ AJOUTÉ: Permet les imports par défaut
    // Pourquoi: Rend les imports plus simples et cohérents
    "allowSyntheticDefaultImports": true,
    
    // ✅ AJOUTÉ: Permet d'importer des fichiers .json
    // Pourquoi: Utile pour importer package.json ou des configs JSON
    "resolveJsonModule": true,
    
    // ✅ AJOUTÉ: Chaque fichier est un module isolé
    // Pourquoi: Meilleure compatibilité avec les bundlers et compilation plus rapide
    "isolatedModules": true,
    
    // ==========================================
    // PERFORMANCE
    // ==========================================
    
    // ✅ CONSERVÉ: true (excellent!)
    // Pourquoi: Ne vérifie pas les types dans node_modules
    // → Compilation beaucoup plus rapide!
    "skipLibCheck": true,
    
    // ==========================================
    // TYPES
    // ==========================================
    
    // ✅ CONSERVÉ: ["node"]
    // Pourquoi: Charge les types Node.js (process, Buffer, etc.)
    "types": ["node"],
    
    // ==========================================
    // PATH ALIASES (SUPPRIMÉS)
    // ==========================================
    
    // ❌ SUPPRIMÉ: "baseUrl" et "paths"
    // Pourquoi supprimé:
    // - Ne fonctionne pas bien avec les modules ESM et les imports .js
    // - Nécessite des outils supplémentaires au runtime (tsconfig-paths, tsx, etc.)
    // - Les imports relatifs sont plus simples et universels pour un backend
    //
    // Avant (avec path alias):
    //   import { AuthService } from '@/modules/auth'
    //
    // Maintenant (import relatif):
    //   import { AuthService } from './modules/auth/index.js'
    //
    // Avantage: Fonctionne partout sans config supplémentaire
  },
  
  // ==========================================
  // FICHIERS À INCLURE
  // ==========================================
  
  // ✅ CONSERVÉ: src/**/*.ts
  // Pourquoi: Compile tous les fichiers .ts dans src/ et ses sous-dossiers
  "include": [
    "src/**/*.ts"
  ],
  
  // ==========================================
  // FICHIERS À EXCLURE
  // ==========================================
  
  // ✅ CONSERVÉ: node_modules, dist, prisma
  // Pourquoi:
  // - node_modules: Pas besoin de compiler les dépendances
  // - dist: C'est notre dossier de sortie, pas d'input
  // - prisma: Les fichiers générés par Prisma sont déjà compilés
  "exclude": [
    "node_modules",
    "dist",
    "prisma"
  ]
}
```
### Old tsconfig.json

{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",           // ✅ Changé de "." à "src"
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*.ts"               // ✅ Simplifié
  ],
  "exclude": [
    "node_modules",
    "dist",
    "prisma"
  ]
}