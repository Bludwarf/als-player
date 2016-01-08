/**
 * Created by mlavigne on 24/11/2015.
 */
var songs = [
    {
        title: "L'horloge biologique",
        /*drive: {
         id: '0B2bkDQNfrAz8WGVINHdlTWVsRXM'
         },*/
        /*structure : {
            secDuration: 215,
            beatDuration: 544,
            patterns: [
                {
                    secTime: 0,
                    beatTime: 0,
                    color: 32,
                    name: 'Intro'
                },
                {
                    secTime: 25.7,
                    beatTime: 64,
                    color: 16,
                    name: 'Couplet 1'
                },
                {
                    secTime: 69,
                    beatTime: 160,
                    color: 16,
                    name: 'Couplet 2'
                },
                {
                    secTime: 101,
                    beatTime: 240,
                    color: 0,
                    name: 'Solo 1'
                },
                {
                    secTime: 132,
                    beatTime: 336,
                    color: 16,
                    name: 'Couplet 3'
                },
                {
                    secTime: 176,
                    beatTime: 448,
                    color: 0,
                    name: 'Solo 2'
                }//,
                 {
                 secTime: 215,
                 beatTime: 560,
                 color: 32,
                 name: '(fin)'
                 }
            ]
        }*/
    },
    {
        title: "She don't care",
        drive: {
            id: '0B2bkDQNfrAz8dzlNV0NIZHNHWDA'
        }
    },
    {
        title: "Stop fantasy",
        drive: {
            id: '0B2bkDQNfrAz8Q2dsQVhIUmt5Tmc'
        }
    },
    {
        title: "All I want",
        drive: {
            id: '0B2bkDQNfrAz8WEw5c25kbm91NnM'
        }
    },
    {
        title: "Guess who's back",
        drive: {
            id: '0B2bkDQNfrAz8U1IyZjVpVU5XaG8'
        }
    },
    {
        title: "Downtown",
        drive: {
            id: '0B2bkDQNfrAz8YjB6bXZQVmhZTDQ'
        }
    },
    {
        title: "Voyage",
        drive: {
            id: '0B2bkDQNfrAz8S2o3UG8ta0g2VGc'
        },
        dropbox: 'Musiques\\Funk Pierre\\Répètes\\Voyage - 20151022.mp3'
        /*live: {
            warpMarkers: warpMarkers['Voyage']
        }*/
    },
    {
        title: "Nickie's boogie",
        drive: {
            id: '0B2bkDQNfrAz8a2RJU09CR0xMNnc'
        }
    },
    {
        title: "Prends moi la main (ou dans l'os)",
        drive: {
            id: '0B2bkDQNfrAz8QUhGYVQ3UXQzYm8'
        }
    }
];

// song.als
for (var i = 0; i < songs.length; ++i) {
    var song = songs[i];
    var set = _.findWhere(als.sets, {name: song.title});
    if (set) {
        song.als = set;

        // Structure
        var structure = {
            secDuration: set.secDuration,
            beatDuration: set.beatDuration
        };
        song.structure = structure;

        // Sections
        var sections = [];
        structure.sections = sections;
        for (var s = 0; s < set.patterns.length; ++s) {
            var sectionLive = set.patterns[s];
            var section = {
                secTime: sectionLive.secTime,
                beatTime: sectionLive.beatTime,
                color: sectionLive.colorIndex,
                name: sectionLive.name,
                song: song,
                style: sectionLive.style
            };

            // measures
            (function(sectionLive) {
                Object.defineProperty(section, 'measures', {
                    get: function() {
                        var measures = sectionLive.measures;

                        // déjà appelé ?
                        if (measures && measures[0] && !measures[0].style) {
                            if (this.beatDuration % 4 != 0) console.warn('Nombre de battement non multiple de 4 pour la section %s', this.name);

                            var n = Math.ceil(this.beatDuration / 4);
                            console.log(this.beatDuration);
                            measures = new Array(n);
                            for (var i = 0; i < measures.length; ++i) {
                                var ratio = i / n;
                                measures[i] = {
                                    style: {
                                        left: (ratio * 100) + '%', // incorrect si non multiple de 4
                                        width: (1 / n * 100) + '%'
                                    }
                                    //secTime: ratio *
                                };
                            }
                            console.dir(measures);
                        }

                        return measures;
                    }
                });
            })(sectionLive);

            sections.push(section);
        }
    }
}