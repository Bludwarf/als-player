Intégration des fichiers JSON
=============================

  - Dans als-sets.js ajouter :
  
        als.sets.push(new als.Set("Bee In My Beer", {
            audioClips: null,
            warpMarkers: null
        }));
        
  - Remplacer les valeurs null par le contenu des fichiers générés
  - Dans songs.js ajouter le titre du morceau
  
Installation
============

Midi
----

Faire

	npm install node-gyp -g
	
Puis

	node-gyp rebuild --python 2.7.2
	
TODO : ne marche toujours pas !

Node pour afficher des tablatures, partitions ou même du streching : http://www.vexflow.com/
D'autres exemples : https://github.com/adius/awesome-sheet-music
  
Objet song
==========
  - 