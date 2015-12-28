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

TypeScript
----------

Télécharger les librairies 

    npm install -g typescript
    
Aller dans TypeScript "Language" du menu Webstorm et ajouter le dossier lib installé. Par exemple ```C:\Users\mlavigne\AppData\Roaming\npm\node_modules\typescript\lib```.

Ajouter les options pour la compilation

    --target es5

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