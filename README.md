# claude-mods

Mods pour Claude Code.

## usage-band

Affiche ton utilisation restante au-dessus de la zone de saisie : une barre par fenêtre de limite
(5 heures et 7 jours), le pourcentage restant et le temps avant la remise à zéro. La couleur passe
du vert à l'orange (moins de 30 %) puis au rouge (moins de 10 %). Le même résumé s'affiche dans la
ligne de statut, et une notification prévient quand il reste moins de 20 %.

Nécessite un abonnement Claude (Pro ou Max) : avec une clé API, il n'y a pas de limites à afficher.

### Installation

Dans un terminal Claude Code :

```
/plugin install usage-band --marketplace famickael/claude-mods
```

Réponds `y` pour ajouter le marketplace, puis choisis la portée (utilisateur, conseillé).

Depuis un shell :

```
claude plugin install usage-band --marketplace famickael/claude-mods
```

Dans l'application de bureau : clique sur **+** à côté de la zone de saisie, puis **Plugins**,
**Add marketplace** avec `famickael/claude-mods`, puis **Add plugin**.
