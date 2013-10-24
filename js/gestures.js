function showActive(box) {
    $('.' + box).addClass('anim');

    setTimeout(function() {
        $('.' + box).removeClass('anim');
    }, 1000)
}

var main = {
    init: function() {
        this.timeLimit = Date.now();
        this.dateTime = Date.now();
        this.overlayLoaded = 'not-loaded';
        this.controllerOptions = {enableGestures: true};
        this.lastGest = {
           time: 0,
           type: ''
        };

        this.startLeapLoop();

    },

    startLeapLoop: function() {
        var that = this,
            controller = new Leap.Controller(),
            connectionTried = false;

        controller.connection.startReconnection = _.bind(function() {
            if (!connectionTried && !this.connection.socket) {
                connectionTried = true;
                // this.connect returns immediately  if already connected.
                setTimeout(_.bind(this.connect, this), 1000);
                setTimeout(_.bind(this.connect, this), 3000);
                setTimeout(_.bind(this.connect, this), 5000);
            }
        }, controller);

        controller.on('deviceConnected', _.bind(function() {
            Leap.loop(this.controllerOptions, function(frame) {

                if (that.previousFrame) {

                    var noGestures = frame.gestures.length === 0;
                    var timestamp = Date.now();

                    //Load Overlay
                    if (frame.pointables.length >= 3 && that.previousFrame.pointables.length >= 3 && that.overlayLoaded === 'not-loaded' && timestamp > that.dateTime + 300 && noGestures) {
                        that.dateTime = timestamp;
                        showActive('open');
                    }

                    if (that.previousFrame.pointables.length >= 3 && that.overlayLoaded === 'loaded' ) {
                        that.timeLimit = timestamp;
                    }

                    //Remove Overlay
                    if (frame.pointables.length === 0 && timestamp < that.timeLimit + 140 && that.overlayLoaded === 'loaded' && timestamp > that.dateTime + 300 && noGestures && frame.hands.length > 0 && Math.abs(frame.hands[0].palmVelocity[0]) < 50 && timestamp > that.lastGest.time + 1000) {
                        that.dateTime = timestamp;
                        that.overlayLoaded = 'delay';
                        showActive('close');
                    }

                    if (!noGestures && that.overlayLoaded === 'loaded') {

                        var gesture = frame.gestures[0];

                        //Single finger gestures
                        if (frame.pointables.length === 1) {

                            if (gesture.type === "circle" && timestamp > that.dateTime + 300) {

                                that.dateTime = timestamp;
                                that.lastGest.time = timestamp;

                                var vol = 50; //Random num to simulate volume.

                                if (gesture.normal[2] <= 0) {
                                    that.lastGest.type = 'circle:clockwise';
                                    vol += 7.3333;
                                    showActive('up');
                                } else {
                                    that.lastGest.type = 'circle:counterclockwise';
                                    vol -= 7.3333;
                                    showActive('down');
                                }

                                return false;
                            }

                            if (gesture.type === "keyTap" && timestamp > that.dateTime + 500) {
                                that.dateTime = timestamp;
                                that.lastGest.time = timestamp;

                                that.lastGest.type = 'keyTap';
                                showActive('tap');

                                return false;
                            }
                        }

                        //Five finger gestures
                        if (frame.pointables.length >= 2) {

                            if (gesture.type === "swipe") {

                                var isRight = gesture.position[0] > gesture.startPosition[0];
                                var hasBeenSec = timestamp > that.lastGest.time + 1000;
                                var hasBeenHalfSec = timestamp > that.lastGest.time + 500;

                                if (timestamp > that.dateTime + 500) {

                                    if (isRight && (that.lastGest.type !== 'swipe:left' || hasBeenSec)) {
                                        that.dateTime = timestamp;
                                        that.lastGest.time = timestamp;
                                        that.lastGest.type = 'swipe:right';
                                        showActive('right');

                                    } else if (!isRight && (that.lastGest.type !== 'swipe:right' || hasBeenSec)) {
                                        that.dateTime = timestamp;
                                        that.lastGest.time = timestamp;
                                        that.lastGest.type = 'swipe:left';
                                        showActive('left');

                                    }

                                }

                                //Catch accidental swipes when the hand swings back
                                that.lastGest.time = timestamp;

                                if (isRight) {
                                    if (that.lastGest.type === 'swipe:right') {
                                        return false;
                                    } else if (hasBeenHalfSec) {
                                        that.lastGest.type = 'swipe:right';
                                    }
                                } else {
                                    if (that.lastGest.type === 'swipe:left') {
                                        return false;
                                    } else if (hasBeenHalfSec) {
                                        that.lastGest.type = 'swipe:left';
                                    }
                                }
                            }
                        }
                    }
                }
                that.previousFrame = frame;
            });
        }, this));
        controller.connect();
    }
};

main.init();