# Fix Pong Restart Bug - TODO List

## Objectif
Corriger le bug où le restart d'un match Pong ne réinitialise pas correctement les états du jeu.

## ✅ Modifications Complétées

### 1. Fichier `frontend/src/content/pong/game/state.ts`
- [x] Ajout de la fonction `resetGameStats(state: GameState)`
  - Réinitialise tous les scores (p1.score, p2.score)
  - Réinitialise tous les compteurs (effects, maxEffects, maxBounces, etc.)
  - Réinitialise les statistiques (fastestWonRally, fastestLostRally, paddleHits, currentWins)
  - Réinitialise les états ready (p1, p2)
  - Réinitialise les timers (rallyStartAt, pauseStartAt, rallyDurationsMs, totalPauseMs)
  - Réinitialise les compteurs de match (currentBounces, totalBounces, totalRallies, lastScorer)
  - **PRÉSERVE** les informations de tournoi (tournamentCode, tournamentId, tournamentMode, tournamentName, matchRound, matchStatus, matchId)

- [x] Correction de `initPlayersInfo()` pour inclure le champ `id`
- [x] Correction de `initState()` pour utiliser les bonnes propriétés (`paddleHits`, `currentWins` au lieu de `ralliesWon`, `ralliesLost`)

### 2. Fichier `frontend/src/content/pong/controller.ts`
- [x] Import de la fonction `resetGameStats`
- [x] Modification du case "RESTART" dans `setPhase()`:
  - Nettoyage du `countdownTimerId` (clearInterval)
  - Arrêt du `loopCtrl` si en cours d'exécution
  - Appel de `resetGameStats()` pour réinitialiser tous les états
  - Appel de `initBoard()` pour réinitialiser les positions
  - Rafraîchissement de l'UI (terminal et playersBox)
  - Transition vers la phase "WAITING"

### 3. Vérifications effectuées
- [x] Le `countdownTimerId` est bien nettoyé dans PAUSED (déjà présent)
- [x] Le `countdownTimerId` est bien nettoyé dans RESTART (ajouté)
- [x] Les timers de rally sont gérés par `resetGameStats()`
- [x] Le `loopCtrl` est arrêté avant le restart

## 🔧 Corrections Supplémentaires

### 4. Ajout de `launchBall()` dans le case "RESTART"
- [x] Problème identifié: La balle n'était pas relancée après un restart
- [x] Solution: Ajout de `launchBall(this.state, this.getNextServer(this.state), 1000)` après `initBoard()`
- [x] La balle est maintenant correctement positionnée et prête à être lancée

### 5. Gestion de la touche Escape dans "START"
- [x] Problème identifié: Impossible de retourner à la page d'accueil
- [x] Solution: Ajout d'un case "START" dans `onKeyDown` pour gérer la touche Escape
- [x] Appel de `unwireControls()` pour permettre la navigation

### 6. Correction CRITIQUE: matchId dans les tournois
- [x] Problème identifié: Les matchs de tournoi étaient traités comme des matchs 1v1 normaux
- [x] Cause: `handleStats()` vérifiait `this.state.matchId` au lieu de `this.state.stats.matchId`
- [x] Solution: 
  - Ajout de `matchId?: string;` dans l'interface `LiveMatchStats`
  - Initialisation de `matchId: undefined` dans `initState()`
  - Correction de la vérification dans `handleStats()` pour utiliser `this.state.stats.matchId`
- [x] Les matchs de tournoi appellent maintenant correctement la route `finishMatch()` pour passer au match suivant

## 🧪 Tests à effectuer

- [ ] Tester restart depuis PAUSED (match normal)
  - [ ] Vérifier que la balle est relancée
  - [ ] Vérifier que les scores sont à 0
- [ ] Tester restart depuis GAMEOVER (match normal)
  - [ ] Vérifier que la balle est relancée
  - [ ] Vérifier que les scores sont à 0
- [ ] Tester restart depuis PAUSED (tournoi)
  - [ ] Vérifier que la balle est relancée
  - [ ] Vérifier que le contexte tournoi est préservé
- [ ] Tester restart depuis GAMEOVER (tournoi)
  - [ ] Vérifier que la balle est relancée
  - [ ] Vérifier que le contexte tournoi est préservé
- [ ] Tester la touche Escape depuis l'écran START
  - [ ] Vérifier qu'on peut retourner à la page d'accueil
- [ ] Vérifier que les états ready sont réinitialisés
- [ ] Vérifier que le gameplay des tournois n'est pas affecté
- [ ] Vérifier qu'il n'y a plus de bugs de page

## 📝 Résumé
Le bug était causé par le fait que la fonction `initBoard()` ne réinitialisait que les positions de la balle et des paddles, mais pas les scores, les états ready, ni les timers. La nouvelle fonction `resetGameStats()` réinitialise complètement l'état du jeu tout en préservant les informations de tournoi, ce qui permet de restart proprement sans affecter le contexte du tournoi.
