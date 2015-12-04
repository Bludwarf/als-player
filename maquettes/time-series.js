// Learn about API authentication here: https://plot.ly/nodejs/getting-started
// Find your api_key here: https://plot.ly/settings/api
var api = {
	username: 'Bludwarf',
	api_key : 'r2410fgm1d'
};
var plotly = require('plotly')(api.username, api.api_key); // 1.0.5

var data = [
  {
    x: ["2013-10-04 22:23:00", "2013-11-04 22:23:00", "2013-12-04 22:23:00"],
    y: [1, 3, 6],
    type: "scatter"
  }
];
var graphOptions = {filename: "date-axes", fileopt: "overwrite"};
plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
});