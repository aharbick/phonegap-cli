/*!
 * Module dependencies.
 */

var Command = require('./util/command'),
    cordova = require('cordova'),
    util = require('util');

/*!
 * Command setup.
 */

module.exports = {
    init: function(phonegap) {
        return new RunCommand(phonegap);
    }
};

function RunCommand(phonegap) {
    return Command.apply(this, arguments);
}

util.inherits(RunCommand, Command);

/**
 * Runs an App.
 *
 * Automatically detects if local SDK exists.
 *  - true: run application on the local system.
 *  - false: run the application remotely.
 *
 * Options:
 *
 *   - `options` {Object}
 *     - `platforms` {Array} is a list of platforms (limited to 1).
 *   - [`callback`] {Function} is triggered after completion.
 *     - `e` {Error} is null unless there is an error.
 *
 * Returns:
 *
 *   {PhoneGap} for chaining.
 */

RunCommand.prototype.init = function(options, callback) {
    // require options
    if (!options) throw new Error('requires option parameter');
    if (!options.platforms) throw new Error('requires option.platforms parameter');

    // optional callback
    callback = callback || function() {};

    // run app
    this.execute(options, callback);

    return this.phonegap;
};

/*!
 * Execute.
 */

RunCommand.prototype.execute = function(options, callback) {
    var platform = options.platforms[0],
        self = this;

    // detect the platform support
    self.phonegap.emit('log', 'detecting', platform, 'SDK environment...');

    cordova.platform.supports(platform, function(supported) {
        // invoke local or remote build
        var env = (supported) ? 'local' : 'remote';
        self.phonegap.emit('log', 'using the', env, 'environment');
        self.phonegap[env].run(options, callback);
    });
};