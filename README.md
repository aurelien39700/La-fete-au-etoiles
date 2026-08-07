# 🎉 La Fête des Étoiles — serveur auto-hébergé

Un party game multijoueur façon Mario Party (plateau + 25 mini-jeux) où chacun joue depuis son téléphone.

## Les 3 cartes (3D isométrique, choisies par l'hôte dans le salon)

- 🎪 **Île de la Fête** : grande boucle + raccourci risqué, zones Fête Foraine / Bois Étoilé / Glacier Lunaire
- 🌀 **Spirale Céleste** : un « 8 » à deux boucles, zones Nébuleuse Rose / Ceinture d'Astéroïdes / Aurore Émeraude
- 🏝️ **Archipel Perdu** : deux îles (Plage Dorée, Jungle Sauvage) reliées par des ponts hantés par le Roi Fantôme

## Le plateau

- Boucles avec **carrefours 🧭** : tu choisis ton chemin !
- ⭐ **Étoiles** à acheter (20 🪙) — celle-ci se déplace à chaque achat
- 🛍️ **Boutique** : 5 objets (Champi Double, Dé Pipé, Aimant, Bouclier, Tuyau Magique)
- 👻 **Fantôme voleur** : paie-le pour voler pièces… ou une étoile !
- ⚔️ **Duel**, 🏦 **Banque** (dépôt en passant, jackpot en s'arrêtant), 🎰 **Chance Time**, 👹 **Roi Fantôme** (malus dramatiques), 🍀 chance, 🎁 événements
- 🔥 **Dé chaos** (0 ou 8–10) en alternative au dé classique
- 🚨 **Derniers tours** : événement spécial au tour 6 (cases doublées, étoile soldée ou rattrapage)
- 🌟 **2 étoiles bonus secrètes** révélées à la fin (Richissime, Champion, Voyageur, Aventurier)

## Les 28 mini-jeux

Réflexe, mémoire, calcul, tir, esquive, courses… dont des jeux à **déplacement tactile**
(vaisseau à piloter, panier à déplacer, fusée flappy, alunissage) et un **mode équipes**
🔵🔴 aléatoire à partir de 4 joueurs. Sons synthétisés (WebAudio), bouton 🔊/🔇 en haut à droite.

### 3 arènes EN DIRECT (temps réel, en ligne)

- ⚔️ **Bataille Spatiale** : équipes 🔵🔴, pilote au doigt, tirs automatiques, respawn
- 🏃 **Course Céleste LIVE** : sprint en alternant GAUCHE/DROITE, vous vous voyez courir en direct
- ⭐ **Ruée aux Étoiles** : rafle les étoiles avant les autres, évite les 💣 (spawns synchronisés)

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
