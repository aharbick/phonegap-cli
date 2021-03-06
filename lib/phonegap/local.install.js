/*!
 * Module dependencies
 */

var Command = require('./util/command'),
    project = require('./util/project'),
    platforms = require('./util/platform'),
    shell = require('shelljs'),
    util = require('util');

/*!
 * Command setup.
 */

module.exports = {
    create: function(phonegap) {
        return new LocalInstallCommand(phonegap);
    }
};

function LocalInstallCommand(phonegap) {
    return Command.apply(this, arguments);
}

util.inherits(LocalInstallCommand, Command);

/**
 * Install a Local App.
 *
 * Install an app from the local system.
 *
 * Options:
 *
 *   - `options` {Object}
 *     - `platforms` {Array} is a list of platforms (limited to 1).
 *     - [`device`] {Boolean} is true when only using device.
 *     - [`emulator`] {Boolean} is true when only using emulator.
 *     - [`target`] {String} way to pass device arguments to emulator
 *   - [`callback`] {Function} is triggered after completion.
 *     - `e` {Error} is null unless there is an error.
 *
 * Returns:
 *
 *   {PhoneGap} for chaining.
 */

LocalInstallCommand.prototype.run = function(options, callback) {
    // require options
    if (!options) throw new Error('requires option parameter');
    if (!options.platforms) throw new Error('requires option.platforms parameter');

    // optional callback
    callback = callback || function() {};

    // install app
    this.execute(options, callback);

    return this.phonegap;
};

/*!
 * Execute.
 */

LocalInstallCommand.prototype.execute = function(options, callback) {
    var self = this,
        platform = platforms.names(options.platforms)[0];

    // change to project directory and delegate errors
    if (!project.cd({ emitter: self.phonegap, callback: callback })) return;

    // simplfy callback
    var _callback = function(e) {
        if (e) {
            self.phonegap.emit('error', e);
        }
        callback(e);
    };

    // install app to device
    if (options.device) {
        self.phonegap.emit('log', 'installing app onto device');
        self.phonegap.cordova.raw.run([ platform.local ], _callback);
    }
    // instal app to emulator
    else if (options.emulator) {
        self.phonegap.emit('log', 'installing app onto emulator');
        cordovaEmulate(self, platform);
        emulate_opts = [ platform.local ];
        if (options.target)  {
            emulate_opts = {platforms: [ platform.local ],
                            options: "--target="+options.target};
        }
        self.phonegap.cordova.raw.emulate(emulate_opts, _callback);
    }
    // when no target is specified: try device and fallback on emulator
    else {
        self.phonegap.emit('log', 'trying to install app onto device');
        self.phonegap.cordova.raw.run([ platform.local ], function(e) {
            if (e) {
                self.phonegap.emit('log', 'no device was found');
                self.phonegap.emit('log', 'trying to install app onto emulator');
                cordovaEmulate(self, platform);
                emulate_opts = [ platform.local ];
                if (options.target)  {
                    emulate_opts = {platforms: [ platform.local ],
                                    options: "--target="+options.target};
                }
                self.phonegap.cordova.raw.emulate(emulate_opts, function(e) {
                    if (!e) {
                        self.phonegap.emit('log', 'successfully installed onto emulator');
                    }
                    _callback(e);
                });
            }
            else {
                self.phonegap.emit('log', 'successfully installed onto device');
                _callback(null);
            }
        });
    }
};

/**
 * Validate the emulate requirements.
 *
 * This can be removed when Xcode 5 replaces ios-sim.
 *
 * Options:
 *
 *   - `self` {Object} is `this` of the calling Command.
 *   - `platform` {Object} is the platform to check.
 */

function cordovaEmulate(self, platform) {
    // warn about missing ios-sim requirement
    if (platform.local === 'ios' && !shell.which('ios-sim')) {
        self.phonegap.emit('warn', 'missing ios-sim');
        self.phonegap.emit('warn', 'install ios-sim from',
                                   'http://github.com/phonegap/ios-sim');
    }
}
