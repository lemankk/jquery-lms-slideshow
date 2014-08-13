;
(function ($) {
    var Scaler = function (prop /* = 0 */ , maxWidth /* = 0 */ , maxHeight /* = 0 */ , func /* = 'fit' */ , options) {

        var scale = 1;
        if (typeof func == 'string' && typeof Scaler[func] == 'function') func = Scaler[func];
        if (typeof func != 'function') func = Scaler.fit;

        var srcWidth = 0,
            srcHeight = 0;
        if (typeof prop.width == 'function') srcWidth = prop.width();
        else if (!isNaN(prop.width)) srcWidth = prop.width;

        if (typeof prop.height == 'function') srcHeight = prop.height();
        else if (!isNaN(prop.height)) srcHeight = prop.height;

        if (typeof func == 'function') scale = func(maxWidth, maxHeight, srcWidth, srcHeight, options);

        if (options != null && typeof options.maxScale != 'undefined') {
            if (options.maxScale < scale) scale = options.maxScale;
        }
        if (options != null && typeof options.minScale != 'undefined') {
            if (options.minScale > scale) scale = options.minScale;
        }

        var newProp = {};
        newProp.width = srcWidth * scale;
        newProp.height = srcHeight * scale;
        newProp.left = maxWidth * 0.5 - newProp.width * 0.5;
        newProp.top = maxHeight * 0.5 - newProp.height * 0.5;
        return newProp;
    };
    // Not larger then boundary
    Scaler.fit = function (maxWidth, maxHeight, srcWidth, srcHeight, options) {
        var scale = 1;
        if (srcWidth * scale > maxWidth) scale = maxWidth / srcWidth;
        if (srcHeight * scale > maxHeight) scale = maxHeight / srcHeight;
        return scale;
    };
    // Not smaller then boundary
    Scaler.fill = function (maxWidth, maxHeight, srcWidth, srcHeight, options) {
        var scale = 1;
        //if(srcWidth * scale < maxWidth)
        scale = maxWidth / srcWidth;
        if (srcHeight * scale < maxHeight) scale = maxHeight / srcHeight;
        return scale;
    };
    var LMS_Slide_counter = 0;
    var LMS_Slide = function (elm, options) {

        this.elm = elm;
        this.options = options;
        this.id = LMS_Slide_counter++;
        var self = this;
        var $elm = $(elm);

        self.width = 0;
        self.height = 0;

        var curOffset = -1;
        var autoSlideFired = function () {
            return gotoSlide(curOffset + 1);
        };
        var nextSlide = function () {
            gotoSlide(curOffset + 1);
            return reloadTimer();
        };
        var prevSlide = function () {

            gotoSlide(curOffset - 1);
            return reloadTimer();
        };
        var slideshowTimer = 0;
        var startedAutoslide = false;
        var setDelayTime = function (delayTime) {

            options.delay = delayTime;
            return reloadTimer();
        };

        var reloadTimer = function () {

            if (slideshowTimer > 0) clearInterval(slideshowTimer);
            if (startedAutoslide && parseFloat(options.delay) > 0) slideshowTimer = setInterval(autoSlideFired, parseFloat(options.delay) * 1000);
            return self;
        };
        var startAutoslide = function () {
            //console.log('Start Auto Slideshow' , self);
            startedAutoslide = true;
            setDelayTime(parseInt(options.delay));
            return self;
        };
        var stopAutoslide = function () {
            //console.log('Stop Auto Slideshow' , self);
            startedAutoslide = false;
            clearInterval(slideshowTimer);
            return self;
        };
        var moveToOffset = function (offset) {

            $('.lmsSlideBody', $elm).css('left', -offset * self.width);
            return self;
        };
        var gotoSlideAnimateTimer = 0;
        var gotoSlide = function (offset) {
            stageResize();

            clearTimeout(gotoSlideAnimateTimer);
            //console.log('Goto Slide ',offset);
            var $items = $('.slide', $elm);

            if ($items.length < 2) {
                $elm.addClass('no-control');
            } else {
                $elm.removeClass('no-control');
            }

            offset = offset;
            if (offset >= $items.length) offset = 0;
            if (offset < 0) offset = $items.length - 1;
            if (offset == curOffset) {
                //console.log('Ignored. Same Offset');
                winResize();
                return self;
            }
            curOffset = offset;

            $items.removeClass('active');

            var $slide = $items.eq(offset);

            $slide.addClass('active');

            $elm.addClass('animating');
            gotoSlideAnimateTimer = setTimeout(function () {
                $elm.removeClass('animating');
            }, 600);

            moveToOffset(offset);
            slideResize($slide);

            return self;
        };

        var slideResize = function (slide) {
            var $slide = $(slide);
            var $content = $('.content', $slide);
            var $img = $('.content img', $slide);


            //$img.attr('width','').attr('height','');
            var data = {
                imageWidth: $slide.data('imageWidth'),
                imageHeight: $slide.data('imageHeight')
            };
            if (typeof data.imageWidth == 'undefined' || data.imageWidth < 1) data.imageWidth = $img.prop('naturalWidth') != null ? $img.prop('naturalWidth') : $img.prop('width');
            if (typeof data.imageHeight == 'undefined' || data.imageHeight < 1) data.imageHeight = $img.prop('naturalHeight') != null ? $img.prop('naturalHeight') : $img.prop('height');

            if (data.imageWidth < 1 && data.imageHeight < 1) {
                //$('.lmsSlideWrap',$elm).height(newRect.imageHeight);
                //console.log( 'loadStart', self.id, $('.lmsSlideWrap',$elm).height());
                $img.on('load', function () {

                    //console.log( 'loadComplete', self.id, $('.lmsSlideWrap',$elm).height());
                    slideResize(slide);
                });
                return;
            }
            //console.log( 'slideResize', $slide.offset(), self.id, data.imageWidth, data.imageHeight);

            //console.log($img, data);

            $slide.data(data);

            var newRect = Scaler({
                width: data.imageWidth,
                height: data.imageHeight
            }, self.width, self.height, options.fill == 'fill' ? 'fill' : 'fit');

            //console.log(newRect, self.height, options.fill);

            newRect.top = options.fill == 'fill' ? parseInt(newRect.top) : 0;
            newRect.left = parseInt(newRect.left);
            newRect.width = parseInt(newRect.width);
            newRect.height = parseInt(newRect.height);

            if ($slide.index() == curOffset) {
                $('.lmsSlideWrap', $elm).height(newRect.height);
                //console.log( 'slideResize, newOffset', self.id,newRect.height);
            }
            //$slide.width(self.width);
            $slide.height(newRect.height);
            $content.css(newRect);
            return self;
        };

        var stageResize = function () {
            var data = $elm.data();
            self.width = $('.lmsSlideWrap', $elm).width();
            self.height = $elm.height();

            if (typeof data.targetHeight != 'undefined') {
                var $tar = $(data.targetHeight == 'window' ? window : data.targetHeight);
                if ($tar.length > 0) {
                    self.height = $tar.eq(0).height();
                }
            }

            if (typeof data.maxHeight != 'undefined') {
                var maxHeight = parseFloat(data.maxHeight);
                if (self.height > maxHeight) self.height = maxHeight;
            }

            if (typeof data.minHeight != 'undefined') {
                var minHeight = data.minHeight;
                if (self.height < minHeight) self.height = minHeight;
            }

            if (typeof data.parentHeight != 'undefined') {
                var $tar = $elm.parents(data.parentHeight);
                if ($tar.length > 0) {
                    self.height = $tar.eq(0).height();
                }
            }
            var $slides = $elm.find('.slide');
            $slides.width(self.width);
            $elm.find('.lmsSlideBody').width(self.width * ($slides.length + 2));

            return self;
        };

        var winResize = function () {
            stageResize();
            return allSlideResize();
        };

        var allSlideResize = function () {

            $('.lmsSlideWrap', $elm).height(self.height);

            $('.slide', $elm).each(function () {
                slideResize(this);
            });

            moveToOffset(curOffset);
            return self;
        };

        var resizeDelayTimer = 0;
        $(window).on('resize.lmsSlide', function () {
            clearTimeout(resizeDelayTimer);
            resizeDelayTimer = setTimeout(winResize, 300);
        });

        var data = $elm.data();

        if ($('.thumbnails li.item', $elm).length > 0) $('.thumbnails li.item', $elm).eq(curOffset).addClass('active');
        $elm.on('click.lmsSlide', '.prev', function (evt) {
            evt.preventDefault();
            prevSlide();
        }).on('click.lmsSlide', '.next', function (evt) {
            evt.preventDefault();
            nextSlide();
        });

        $('.thumbnails', $elm).on('click.lmsSlide', '.image', function () {
            var $cell = $(this);
            var data = $cell.data();
            var offset = $cell.data('index');
            gotoSlide(offset);
        });

        this.next = nextSlide;
        this.previous = prevSlide;
        this.gotoAt = gotoSlide;
        this.start = startAutoslide;
        this.stop = stopAutoslide;
        this.getIndex = function () {
            return curOffset;
        };
        this.destroy = function () {
            stopAutoslide();
            $(window).off('resize.lmsSlide');
            $elm.off('click.lmsSlide', '.prev');
            $elm.off('click.lmsSlide', '.next');
            $('.thumbnails', $elm).off('click.lmsSlide', '.image');
        };

        this.handleArguments = function () {
            if (arguments.length < 1) return self;
            if (arguments[0] == 'start') {
                startAutoslide();
                return self;
            } else if (arguments[0] == 'stop') {
                stopAutoslide();
                return self;
            } else if (arguments[0] == 'goTo' && arguments.length > 0) {
                gotoSlide(arguments[1]);
                return self;
            } else if (arguments[0] == 'next') {
                nextSlide();
                return self;
            } else if (arguments[0] == 'previous' || arguments[0] == 'prev') {
                prevSlide();
                return self;
            } else if (arguments[0] == 'getIndex') {
                return curOffset;
            } else if (arguments[0] == 'update') {
                winResize();
                return self;
            }
        };
        gotoSlide(0);
        setDelayTime.apply(this, [options.delay]);

        if (options.autoslide == 'yes') startAutoslide.apply(this, null);

    };

    $.lmsSlide = {
        defaults: {
            fill: 'fit',
            delay: 5,
            autoslide: 'no'
        }
    };
    $.fn.lmsSlide = function (options) {
        return $(this).each(function () {
            var elm = this;
            var $elm = $(elm);
            var ins = $elm.data('lmsSlide');

            if (ins) {
                return ins.handleArguments.apply(ins, arguments);
            }
            var _options = $.extend({}, $.lmsSlide.defaults, options);

            var data = $elm.data();
            if (typeof data.delay != 'undefined') _options.delay = parseFloat(data.delay);
            if (typeof data.autoslide != 'undefined') _options.autoslide = data.autoslide;
            if (typeof data.fill != 'undefined') _options.fill = data.fill;

            var ins = new LMS_Slide(elm, _options);
            $elm.data('lmsSlide', ins);
        });
    };

    var LMS_SlideVideo = function (elm, options) {
        var self = this;
        this.options = options;
        this.elm = elm;
        var $elm = this.$elm = $(elm);


        this.install = function () {
            var data = $elm.data();
            var url = null;
            if (data.type == 'youtube') {
                url = '//www.youtube.com/embed/' + data.id;
            }
            if (data.type == 'vimeo') {
                url = '//player.vimeo.com/video/' + data.id;
            }

            if (url != null) $elm.empty().append('<iframe src="' + url + '" frameborder="0" allowfullscreen />');
        };

        this.handleArguments = function () {};
        this.install();
    };

    $.fn.lmsSlideVideo = function (options) {
        return $(this).each(function () {
            var elm = this;
            var $elm = $(elm);
            var ins = $elm.data('lmsSlideVideo');
            if (ins) {
                return ins.handleArguments.apply(ins, arguments);
            }

            var ins = new LMS_SlideVideo(elm, options);
            $elm.data('lmsSlideVideo', ins);
        });
    };
    $(function () {
        $('.lmsSlide').lmsSlide();
        $('.lmsSlide .video').lmsSlideVideo();
    });


})(jQuery);
