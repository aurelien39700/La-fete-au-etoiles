# 🎉 La Fête des Étoiles — serveur auto-hébergé

Un party game multijoueur (plateau + 12 mini-jeux) où chacun joue depuis son téléphone.

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
