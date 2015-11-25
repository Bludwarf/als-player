Intégration des fichiers JSON
=============================

  - Dans als-sets.js ajouter :
  
        als.sets.push(new als.Set("Bee In My Beer", {
            audioClips: null,
            warpMarkers: null
        }));
        
  - Remplacer les valeurs null par le contenu des fichiers générés
  - Dans songs.js ajouter le titre du morceau