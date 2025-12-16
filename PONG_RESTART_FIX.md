# Fix du Bug de Restart du Jeu Pong

## 🐛 Problème Identifié

Lorsqu'on mettait en pause et qu'on redémarrait un match Pong (via le bouton "RESTART"), la page buggait car les états du jeu n'étaient pas correctement réinitialisés à 0. Ce problème affectait à la fois les matchs normaux et les matchs de tournoi.

### Symptômes
- Les scores restaient affichés après un restart
- Les états "ready" des joueurs n'étaient pas réinitialisés
- Les timers continuaient de tourner en arrière-plan
- Les statistiques de match étaient corrompues
- La page pouvait devenir instable

## 🔍 Cause Racine

La fonction `initBoard()` ne réinitialisait que :
- La position de la balle
- Les positions des paddles
- Les bounces (partiellement)

Elle **NE réinitialisait PAS** :
- Les scores des joueurs
- Les états ready (p1, p2)
- Les timers (rallyStartAt, pauseStartAt, countdownTimerId)
- Les statistiques de match (effects, paddleHits, currentWins, etc.)
- Les durées de rally

## ✅ Solution Implémentée

### 1. Nouvelle fonction `resetGameStats()` dans `state.ts`

Création d'une fonction dédiée qui réinitialise **tous** les états du jeu :

```typescript
export function resetGameStats(state: GameState) {
    // Reset ready states
    state.ready.p1 = false;
    state.ready.p2 = false;

    // Reset player stats (scores, effects, bounces, speeds, etc.)
    state.stats.p1.score = 0;
    state.stats.p1.effects = 0;
    // ... tous les autres champs
    
    state.stats.p2.score = 0;
    state.stats.p2.effects = 0;
    // ... tous les autres champs

    // Reset match stats
    state.stats.lastScorer = undefined;
    state.stats.currentBounces = 0;
    state.stats.totalBounces = 0;
    state.stats.totalRallies = 0;

    // Reset timers
    state.stats.rallyStartAt = undefined;
    state.stats.rallyDurationsMs = [];
    state.stats.pauseStartAt = undefined;
    state.stats.totalPauseMs = 0;

    // IMPORTANT: Preserve tournament information
    // tournamentCode, tournamentId, tournamentMode, tournamentName, 
    // matchRound, matchStatus and matchId are NOT reset
}
```

**Point clé** : Les informations de tournoi sont **préservées** pour ne pas affecter le gameplay des tournois.

### 2. Modification du case "RESTART" dans `controller.ts`

Amélioration complète de la logique de restart :

```typescript
case "RESTART":
    // Clean up any running timers
    if (this.domOverlay.countdownTimerId !== null) {
        clearInterval(this.domOverlay.countdownTimerId);
        this.domOverlay.countdownTimerId = null;
    }

    // Stop the game loop if running
    if (this.loopCtrl && this.loopCtrl.running) {
        this.loopCtrl.stop();
    }

    // Reset all game stats (scores, timers, ready states, etc.)
    // This preserves tournament information
    resetGameStats(this.state);

    // Reset board (ball and paddles positions)
    initBoard(this.state);

    // Refresh UI
    this.refreshTerminal();
    this.view.playersBox.replaceChildren(createPlayersBox(this.state));

    // Go to WAITING phase
    this.setPhase("WAITING");
    break;
```

### 3. Corrections supplémentaires

- Ajout du champ `id` manquant dans `initPlayersInfo()`
- Correction de `initState()` pour utiliser `paddleHits` et `currentWins` au lieu de `ralliesWon` et `ralliesLost`

## 📋 Fichiers Modifiés

1. **`frontend/src/content/pong/game/state.ts`**
   - Ajout de `resetGameStats()`
   - Correction de `initPlayersInfo()`
   - Correction de `initState()`

2. **`frontend/src/content/pong/controller.ts`**
   - Import de `resetGameStats`
   - Refonte complète du case "RESTART"

### 4. Corrections supplémentaires suite aux tests

**Problème 1 : La balle n'était pas relancée après restart**
- Ajout de `launchBall(this.state, this.getNextServer(this.state), 1000)` dans le case "RESTART"
- La balle est maintenant correctement positionnée et prête à être lancée

**Problème 2 : Impossible de retourner à la page d'accueil**
- Ajout d'un case "START" dans `onKeyDown` pour gérer la touche Escape
- Appel de `unwireControls()` pour permettre la navigation vers la page d'accueil

**Problème 3 : CRITIQUE - Les matchs de tournoi étaient traités comme des matchs 1v1**
- **Cause:** Dans `handleStats()`, la vérification utilisait `this.state.matchId` au lieu de `this.state.stats.matchId`
- **Impact:** Les matchs de tournoi n'appelaient pas la route `finishMatch()` et ne passaient pas au match suivant
- **Solution:**
  - Ajout de `matchId?: string;` dans l'interface `LiveMatchStats` (uiTypes.ts)
  - Initialisation de `matchId: undefined` dans `initState()` (state.ts)
  - Correction de la condition dans `handleStats()`: `if (tCode && this.state.stats.matchId)`
- **Résultat:** Les matchs de tournoi appellent maintenant correctement `finishMatch()` pour progresser dans le tournoi

## 🎯 Résultats Attendus

Après ces modifications :
- ✅ Les scores sont réinitialisés à 0-0
- ✅ Les états ready sont réinitialisés (les joueurs doivent appuyer sur leurs touches)
- ✅ Tous les timers sont arrêtés et nettoyés
- ✅ Toutes les statistiques sont remises à zéro
- ✅ La balle est correctement relancée après un restart
- ✅ L'UI est rafraîchie correctement
- ✅ Le contexte de tournoi est préservé (matchId, tournamentCode, etc.)
- ✅ Possibilité de retourner à la page d'accueil avec Escape
- ✅ Pas de bugs de page
- ✅ Le gameplay des tournois n'est pas affecté

## 🧪 Tests Recommandés

1. **Match Normal**
   - Démarrer un match
   - Marquer quelques points
   - Mettre en pause (SPACE)
   - Cliquer sur RESTART
   - Vérifier que les scores sont à 0-0
   - Vérifier que les joueurs doivent se déclarer ready

2. **Match de Tournoi**
   - Démarrer un match de tournoi
   - Marquer quelques points
   - Mettre en pause (SPACE)
   - Cliquer sur RESTART
   - Vérifier que les scores sont à 0-0
   - Vérifier que le contexte du tournoi est préservé
   - Vérifier que le match peut se terminer normalement

3. **Depuis GAMEOVER**
   - Finir un match (atteindre le score max)
   - Cliquer sur RESTART
   - Vérifier que tout est réinitialisé correctement

## 🔒 Sécurité

Les informations de tournoi suivantes sont **préservées** lors du restart :
- `tournamentCode`
- `tournamentId`
- `tournamentMode`
- `tournamentName`
- `matchRound`
- `matchStatus`
- `matchId`

Cela garantit que le restart ne casse pas le contexte du tournoi et que les statistiques peuvent être correctement enregistrées en base de données.
