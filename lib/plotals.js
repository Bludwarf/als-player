/**
 * Created by mlavigne on 30/12/2015.
 */

var colors = {
    orange: "rgba(255, 127, 14, 0.5)"
};

/**
 * Graphe à partir d'un ALS complet. Prend uniquement en compte le premier AudioClip.
 * @param json
 * @param cb
 */
function plot(json, cb) {
    getWarpMarkers(json, function(err, warpMarkers) {
        plotWarpMarkers({
            warpMarkers: warpMarkers
        }, cb);
    });
}

/**
 * Graphe uniquement à partir de WarpMarkers.
 * @param json {{name, version, warpMarkers}}
 * @param cb
 */
function plotWarpMarkers(json, cb) {
    var warpMarkers = json.warpMarkers;
    json.name = json.name || "All I Want";
    json.version = json.version || "20151119";

    getData(warpMarkers, function(err, data) {
        if (err) throw err;

        var api = {
            username: 'Bludwarf',
            api_key : 'r2410fgm1d'
        };
        var plotly = require('plotly')(api.username, api.api_key); // 1.0.5

        var graphOptions = {
            filename: json.name + " - " + json.version,
            fileopt: "overwrite",
            layout: {
                // Axe principal des Y
                yaxis: {
                    title: "bpm"
                },

                // Ajoute un axe orange "accélération" sur la droite avec le même X
                yaxis2: {
                    title:"bpm/b",
                    overlaying: "y",
                    side: "right",
                    anchor: "x",
                    type: "linear",
                    autorange: true,
                    zeroline: true,
                    zerolinecolor: colors.orange,
                    showgrid:false, // sinon illisible
                    tickfont: {
                        color: colors.orange
                    },
                    titlefont: {
                        color: colors.orange
                    }
                }
            }
        };
        graphOptions.layout.title = graphOptions.filename;
        console.log(graphOptions);
        plotly.plot(data, graphOptions, cb);
    });
}

function getWarpMarkers(json, cb) {
    var firstAudioTrack = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0];
    var mainSequencer = firstAudioTrack.DeviceChain[0].MainSequencer[0];
    var events = mainSequencer.Sample[0].ArrangerAutomation[0].Events[0];

    var audioClips = events.AudioClip;
    if (!audioClips) throw new Error('JSON incorrect');

    // On garde que les WarpMarkers du premier AudioClip dans un fichier séparé
    var warpMarkers = audioClips[0].WarpMarkers[0].WarpMarker;

    cb(null, warpMarkers);
}

function getData(warpMarkers, cb) {

    // Calcul du tempo moyen et instantané
    var data = [

        // tempo à partir d'un BeatMarker
        {
            name: "Tempo",
            x: [], //["2013-10-04 22:23:00", "2013-11-04 22:23:00", "2013-12-04 22:23:00"],
            y: [], //[1, 3, 6],
            type: "scatter",
            line: {
                shape: "hv"
            }
        },

        // diff
        {
            name: "acc.",
            y: [],
            type:"scatter",
            line:{
                width: 1,
                color: colors.orange
            },
            yaxis: "y2"
        }
    ];

    // Les données de diff sont les mêmes que le tempo
    data[1].x = data[0].x;

    // On ignore le premier et le dernier marker
    for (var i = 1; i+1 < warpMarkers.length; ++i) {
        var m = warpMarkers[i];

        // data
        data[0].x.push("" + m.beatTime);
        data[0].y.push(m.tempo);
        data[1].y.push(m.acceleration);

        console.log('%s: %s (acc: %s)', m.beatTime, m.tempo.toFixed(2), m.acceleration.toFixed(2));
    }

    // Tempo moyen (pondéré)
    console.log('Tempo moyen: %s', warpMarkers.tempo);

    cb(null, data);

}

module.exports = {
    plot: plot,
    plotWarpMarkers: plotWarpMarkers,
    colors: colors
};