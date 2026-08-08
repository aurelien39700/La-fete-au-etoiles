# 🎉 La Fête des Étoiles — serveur auto-hébergé

Un party game multijoueur façon Mario Party (plateau + 25 mini-jeux) où chacun joue depuis son téléphone.

## Les 10 héros

Des personnages vectoriels dessinés main (Cosmo l'astronaute, Roboto, Zigzag l'alien,
Fantômio, Griffou le chat, Étincelle la licorne, Krokos le dino, Stella l'étoile,
Frisquet le pingouin, Braise le phénix),
chacun teinté par la **couleur d'aura** choisie (9 couleurs dont 3 à débloquer) — 90 combinaisons.

## Les 4 cartes GÉANTES (48-53 cases, 4-6 carrefours, choisies par l'hôte)

- 🎪 **Île de la Fête** (53 cases, 5 carrefours) : boucle extérieure + grand-huit intérieur reliés par des échangeurs
- 🌀 **Spirale Céleste** (50 cases, 4 carrefours) : spirale descendante, ponts stellaires entre les spires, Cœur du Vortex
- 🏝️ **Archipel Perdu** (51 cases, 5 carrefours) : plusieurs îles tropicales, routes alternatives entre elles
- 🌋 **Volcan Maudit** (48 cases, 4 carrefours) : pentes + rivière de lave traversante + Caldera Interdite — étoiles à 15 🪙

## Le plateau

- Boucles avec **carrefours 🧭** : tu choisis ton chemin !
- ⭐ **Étoiles** à acheter (20 🪙) — celle-ci se déplace à chaque achat
- 🛍️ **Boutique** : 8 objets (Champi Double, Dé Pipé, Aimant, Bouclier, Bombe Piégée,
  Dé Triple, OVNI, Tuyau Magique)
- 😂 **Émotes en direct** pendant la partie (barre à gauche), écran toujours allumé (wake lock),
  musique d'ambiance discrète
- 👻 **Fantôme voleur** : paie-le pour voler pièces… ou une étoile !
- ⚔️ **Duel**, 🏦 **Banque** (dépôt en passant, jackpot en s'arrêtant), 🎰 **Chance Time**, 👹 **Roi Fantôme** (malus dramatiques), 🍀 chance, 🎁 événements
- 🔥 **Dé chaos** (0 ou 8–10) en alternative au dé classique
- 🚨 **Derniers tours** : événement spécial au tour 6 (cases doublées, étoile soldée ou rattrapage)
- 🌟 **2 étoiles bonus secrètes** révélées à la fin (Richissime, Champion, Voyageur, Aventurier)

## Les 39 mini-jeux

Réflexe, mémoire, calcul, tir, esquive, courses… dont des jeux à **déplacement tactile**
(vaisseau à piloter, panier à déplacer, fusée flappy, alunissage) et un **mode équipes**
🔵🔴 aléatoire à partir de 4 joueurs. Sons synthétisés (WebAudio), bouton 🔊/🔇 en haut à droite.

### 9 arènes EN DIRECT (temps réel, en ligne)

Dont le mode **UN CONTRE TOUS** ⚔️ : un joueur tiré au sort affronte tout le monde
(Le Tireur Fou 🎯, Gardien du Trésor 👹) — parfait à 3 joueurs ! Et des arènes iso :
Dalles Piégées ⬛ (le sol s'effondre), Sumo des Glaces 🧊, Roi de la Colline 👑.

- ⚔️ **Bataille Spatiale** : équipes 🔵🔴, pilote au doigt, tirs automatiques, respawn
- 🏃 **Course Céleste LIVE** : sprint en alternant GAUCHE/DROITE, vous vous voyez courir en direct
- ⭐ **Ruée aux Étoiles** : rafle les étoiles avant les autres, évite les 💣 (spawns synchronisés)
- 🚩 **Capture d'Étoile** : équipes 🔵🔴, rapporte l'étoile dans ta base, tacle le porteur adverse

En fin de partie : **duel de dés en mort subite** en cas d'égalité parfaite, et
**📊 Mes exploits** sur l'accueil (stats persistantes et titres de rang).

## Rejouabilité

- ⚙️ **Réglages par l'hôte** (salon et mode local) : 6/8/10/12 tours, pièces de
  départ 5/10/20, mini-jeux à chaque tour ou un tour sur deux
- 🏆 **Mode tournoi** : 3 manches courtes, le vainqueur de chaque manche gagne une
  couronne 👑 (les pièces/étoiles repartent de zéro, les couronnes restent) —
  premier à 2 couronnes, écran de champion
- 🎖️ **11 succès à débloquer** (par téléphone) : Première Couronne, Complice du
  Fantôme, Mains Vides, Globe-Trotteur… avec **3 auras spéciales en récompense**
  (Or Céleste, Rubis Ardent, Diamant Lunaire) dans le créateur de personnage

## Installation (une seule fois)

1. Installe **Node.js** (version 18 ou plus) : https://nodejs.org
2. Ouvre un terminal dans ce dossier, puis :
   ```
   npm install
   ```

## Lancer une partie

```
node server.js
```

Le serveur affiche l'adresse à partager, par exemple `http://192.168.1.10:3000`.

Chaque joueur (toi compris) ouvre cette adresse **dans le navigateur de son téléphone**,
crée son personnage, puis :
- l'hôte appuie sur **Créer une partie en ligne** → un code à 4 lettres s'affiche
- les autres appuient sur **Rejoindre avec un code** et tapent le code

⚠️ Tout le monde doit être **sur le même Wi-Fi** que l'ordinateur qui fait tourner le serveur.

## Jouer par Internet (amis à distance)

Deux options :
- **Redirection de port** : dans l'interface de ta box, redirige le port 3000 (TCP) vers
  ton ordinateur, puis partage `http://TON-IP-PUBLIQUE:3000`.
- **Hébergement** : dépose ce dossier sur n'importe quel hébergeur Node.js
  (VPS, Render, Railway, etc.) — le jeu et le serveur sont servis ensemble.

## Dépannage

- **"Impossible de joindre le serveur"** : vérifie que `node server.js` tourne, que le
  pare-feu de l'ordinateur autorise le port 3000, et que vous êtes sur le même réseau.
- **La page en https ne se connecte pas** : c'est normal, les navigateurs bloquent
  `ws://` depuis une page https. Ouvre le jeu via `http://ADRESSE:3000` (le serveur
  sert lui-même le jeu, c'est fait pour ça).
- **Un joueur a perdu la connexion** : le jeu se reconnecte tout seul, ou il peut
  retaper le code de la partie pour la reprendre en cours.
