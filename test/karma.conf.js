// karma.conf.js
module.exports = function(config) {
    config.set({
        basePath: '..',
        frameworks: ['jasmine'],
        //...

        file: [
            'test/public/*.specs.js'
        ]
    });
};