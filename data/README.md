LiveSet
=======
On ne doit regrouper dans un même Set Live que les version qui ont exactement la même structure.
  - **name**        : nom du morceaux tel qu'il apparait dans une Playlist pour un concert (exemple : "Voyage")
  - **version**     : souvent on utilise la date de l'enregistrement Audio au format aaaammjj (exemple : "20151231") 
  - **alsJsonFile** : fichier JSON converti de XML vers JSON par als.js#xml2json() (via zlib et xml2js 0.4.15) à partir d'un fichier *.als