/**
* Zoom shows a contextual reference to an augmented version of main declared image.
* @name Zoom
* @class Zoom
* @augments ch.Floats
* @requires ch.Positioner
* @requires ch.onImagesLoads
* @memberOf ch
* @param {Object} [conf] Object with configuration properties.
* @param {Boolean} [conf.fx] Enable or disable fade effect on show. By default, the effect are disabled.
* @param {Boolean} [conf.context] Sets a reference to position of component that will be considered to carry out the position. By default is the anchor of HTML snippet.
* @param {String} [conf.points] Sets the points where component will be positioned, specified by configuration or "lt rt" by default.
* @param {String} [conf.offset] Sets the offset in pixels that component will be displaced from original position determined by points. It's specified by configuration or "20 0" by default.
* @param {String} [conf.message] This message will be shown when component needs to communicate that is in process of load. It's "Loading zoom..." by default.
* @param {Number} [conf.width] Width of floated area of zoomed image. Example: 500, "500px", "50%". Default: 350.
* @param {Number} [conf.height] Height of floated area of zoomed image. Example: 500, "500px", "50%". Default: 350.
* @returns itself
* @see ch.Modal
* @see ch.Tooltip
* @see ch.Layer
*/

ch.zoom = function (conf) {
	/**
	* Reference to an internal component instance, saves all the information and configuration properties.
	* @private
	* @name ch.Zoom#that
	* @type itself
	*/
	var that = this;

/**
*	Constructor
*/
	conf = ch.clon(conf);

	conf.fx = conf.fx || false;
	
	conf.cache = false;

	// WAI-ARIA
	conf.aria = {};
	conf.aria.role = "tooltip";
	conf.aria.identifier = "aria-describedby";

	// Position
	conf.position = {};
	conf.position.context = conf.context || that.$element;
	conf.position.offset = conf.offset || "20 0";
	conf.position.points = conf.points || "lt rt";
	conf.reposition = false;

	// Transition message and size
	conf.message = conf.message || "Loading zoom...";
	conf.width = conf.width || 300;
	conf.height = conf.height || 300;

	// Closable configuration
	conf.closable = false;

	that.conf = conf;

/**
*	Inheritance
*/

	that = ch.floats.call(that);
	that.parent = ch.clon(that);

/**
*	Private Members
*/

	/**
	* Element showed before zoomed image is load. It's a transition message and its content can be configured through parameter "message".
	* @private
	* @name ch.Zoom#$loading
	* @type Object
	*/
	var $loading = $("<p class=\"ch-zoom-loading ch-hide\">" + conf.message + "</p>").appendTo(that.$element),

	/**
	* Position of main anchor. It's for calculate cursor position hover the image.
	* @private
	* @name ch.Zoom#offset
	* @type Object
	*/
		offset = that.$element.offset(),

	/**
	* Visual element that follows mouse movement for reference to zoomed area into original image.
	* @private
	* @name ch.Zoom#seeker
	* @type Object
	*/
		seeker = {
			/**
			* Element shown as seeker.
			* @private
			* @name shape
			* @memberOf ch.Zoom#seeker
			* @type Object
			*/
			"$shape": $("<div class=\"ch-zoom-seeker ch-hide\">"),

			/**
			* Half of width of seeker element. It's only half to facilitate move calculations.
			* @private
			* @name width
			* @memberOf ch.Zoom#seeker
			* @type Number
			*/
			"width": 0,

			/**
			* Half of height of seeker element. It's only half to facilitate move calculations.
			* @private
			* @name height
			* @memberOf ch.Zoom#seeker
			* @type Number
			*/
			"height": 0
		},

	/**
	* Reference to main image declared on HTML code snippet.
	* @private
	* @name ch.Zoom#original
	* @type Object
	*/
		original = (function () {
			// Define the content source
			var $img = that.$element.children("img");

			// Grab some data when image loads
			$img.onImagesLoads(function () {

				// Grab size of original image
				original.width = $img.prop("width");
				original.height = $img.prop("height");

				// Anchor size (same as image)
				that.$element.css({
					"width": original.width,
					"height": original.height
				});

				// Loading position centered at anchor
				$loading.css({
					"left": (original.width - $loading.width()) / 2,
					"top": (original.height - $loading.height()) / 2
				});

			});

			return {
				/**
				* Reference to HTML Element of original image.
				* @private
				* @name img
				* @memberOf ch.Zoom#original
				* @type Object
				*/
				"$image": $img,

				/**
				* Position of original image relative to viewport.
				* @private
				* @name offset
				* @memberOf ch.Zoom#original
				* @type Object
				*/
				"offset": {},

				/**
				* Width of original image.
				* @private
				* @name width
				* @memberOf ch.Zoom#original
				* @type Number
				*/
				"width": 0,

				/**
				* Height of original image.
				* @private
				* @name height
				* @memberOf ch.Zoom#original
				* @type Number
				*/
				"height": 0
			};
		}()),

	/**
	* Relative size between zoomed and original image.
	* @private
	* @name ch.Zoom#ratio
	* @type Object
	*/
		ratio = {
			/**
			* Relative size of X axis.
			* @private
			* @name width
			* @memberOf ch.Zoom#ratio
			* @type Number
			*/
			"width": 0,

			/**
			* Relative size of Y axis.
			* @private
			* @name height
			* @memberOf ch.Zoom#ratio
			* @type Number
			*/
			"height": 0
		},

	/**
	* Reference to the augmented version of image, that will be displayed into a floated element.
	* @private
	* @name ch.Zoom#zoomed
	* @type Object
	*/
		zoomed = (function () {
			// Define the content source
			var $img = that.source = $("<img src=\"" + that.element.href + "\">");

			// Grab some data when zoomed image loads
			$img.onImagesLoads(function () {

				// Save the zoomed image size
				zoomed.width = $img.prop("width");
				zoomed.height = $img.prop("height");

				// Save the zoom ratio
				ratio.width = zoomed.width / original.width;
				ratio.height = zoomed.height / original.height;

				// Seeker: Size relative to zoomed image respect zoomed area
				var w = ~~(conf.width / ratio.width),
					h = ~~(conf.height / ratio.height);

				// Seeker: Save half width and half height
				seeker.width = w / 2;
				seeker.height = h / 2;

				// Seeker: Set size and append it
				seeker.$shape.css({"width": w, "height": h}).appendTo(that.$element);

				// Remove loading
				$loading.remove();

				// Change zoomed image status to Ready
				zoomed.ready = true;

				// TODO: MAGIC here! if mouse is over image show seeker and make all that innerShow do
			});

			return {
				/**
				* Reference to HTML Element of augmented image.
				* @private
				* @name img
				* @memberOf ch.Zoom#zoomed
				* @type Object
				*/
				"$image": $img,

				/**
				* Status of augmented image. When it's load, the status is "true".
				* @private
				* @name ready
				* @memberOf ch.Zoom#zoomed
				* @type Boolean
				*/
				"ready": false,

				/**
				* Width of augmented image.
				* @private
				* @name width
				* @memberOf ch.Zoom#zoomed
				* @type Number
				*/
				"width": 0,

				/**
				* Height of augmented image.
				* @private
				* @name height
				* @memberOf ch.Zoom#zoomed
				* @type Number
				*/
				"height": 0
			};
		}()),

	/**
	* Calculates movement limits and sets it to seeker and augmented image.
	* @private
	* @function
	* @name ch.Zoom#move
	* @param {Event} event Mouse event to take the cursor position.
	*/
		move = function (event) {

			var x, y;

			// Left side of seeker LESS THAN left side of image
			if (event.pageX - seeker.width < offset.left) {
				x = 0;
			// Right side of seeker GREATER THAN right side of image
			} else if (event.pageX + seeker.width > original.width + offset.left) {
				x = original.width - (seeker.width * 2) - 2;
			// Free move
			} else {
				x = event.pageX - offset.left - seeker.width;
			}

			// Top side of seeker LESS THAN top side of image
			if (event.pageY - seeker.height < offset.top) {
				y = 0;
			// Bottom side of seeker GREATER THAN bottom side of image
			} else if (event.pageY + seeker.height > original.height + offset.top) {
				y = original.height - (seeker.height * 2) - 2;
			// Free move
			} else {
				y = event.pageY - offset.top - seeker.height;
			}

			// Move seeker
			seeker.$shape.css({"left": x, "top": y});

			// Move zoomed image
			zoomed.$image.css({"left": (-ratio.width * x), "top": (-ratio.height * y)});

		};

/**
*	Protected Members
*/

	/**
	* Inner show method. Attach the component's layout to the DOM tree and load defined content.
	* @protected
	* @name ch.Zoom#innerShow
	* @function
	* @returns itself
	*/
	that.innerShow = function () {

		// If the component isn't loaded, show loading transition
		if (!zoomed.ready) {
			$loading.removeClass("ch-hide");
			return that;
		}

		// Update position of anchor here because Zoom can be inside a Carousel and its position updates
		offset = that.$element.offset();

		// Bind move calculations
		that.$element.bind("mousemove", function (event) { move(event); });

		// Show seeker
		seeker.$shape.removeClass("ch-hide");

		// Show float
		that.parent.innerShow();

		return that;

	};

	/**
	* Inner hide method. Hides the component's layout and detach it from DOM tree.
	* @protected
	* @name ch.Zoom#innerHide
	* @function
	* @returns itself
	*/
	that.innerHide = function () {

		// If the component isn't loaded, hide loading transition
		if (!zoomed.ready) {
			$loading.addClass("ch-hide");
			return that;
		}

		// Unbind move calculations
		that.$element.unbind("mousemove");

		// Hide seeker
		seeker.$shape.addClass("ch-hide");

		// Hide float
		that.parent.innerHide();

		return that;

	};

	/**
	* Getter and setter for size attributes of float that contains the zoomed image.
	* @protected
	* @function
	* @name ch.Zoom#size
	* @param {string} prop Property that will be setted or getted, like "width" or "height".
	* @param {string} [data] Only for setter. It's the new value of defined property.
	* @returns itself
	*/
	that.size = function (prop, data) {

		// Seeker: Updates styles and size value
		if (data) {
			// Seeker: Size relative to zoomed image respect zoomed area
			var size = ~~(data / ratio[prop]);

			// Seeker: Save half width and half height
			seeker[prop] = size / 2;

			// Seeker: Set size
			seeker.$shape.css(prop, size);
		}

		// Change float size
		return that.parent.size(prop, data);
	};

/**
*	Public Members
*/

	/**
	* The 'uid' is the Chico's unique instance identifier. Every instance has a different 'uid' property. You can see its value by reading the 'uid' property on any public instance.
	* @public
	* @name ch.Zoom#uid
	* @type number
	*/

	/**
	* Reference to a DOM Element. This binding between the component and the HTMLElement, defines context where the component will be executed. Also is usual that this element triggers the component default behavior.
	* @public
	* @name ch.Zoom#element
	* @type HTMLElement
	*/

	/**
	* This public property defines the component type. All instances are saved into a 'map', grouped by its type. You can reach for any or all of the components from a specific type with 'ch.instances'.
	* @public
	* @name ch.Zoom#type
	* @type string
	*/

	/**
	* Gets the Float component content.
	* @public
	* @name ch.Zoom#content
	* @function
	* @returns {HTMLIMGElement}
	* @example
	* // Get the defined content
	* me.content();
	* @see ch.Object#content
	*/

	that["public"].content = function () {
		// Only on Zoom it's limmited to be a getter
		return that.content();
	};

	/**
	* Returns a Boolean if the component's core behavior is active. That means it will return 'true' if the component is on and it will return false otherwise.
	* @public
	* @function 
	* @name ch.Zoom#isActive
	* @returns boolean
	*/

	/**
	* Triggers the innerShow method and returns the public scope to keep method chaining.
	* @public
	* @function
	* @name ch.Zoom#show
	* @returns itself
	* @see ch.Floats#show
	* @example
	* // Following the first example, using 'me' as modal's instance controller:
	* me.show();
	*/

	/**
	* Triggers the innerHide method and returns the public scope to keep method chaining.
	* @public
	* @function
	* @name ch.Zoom#hide
	* @returns itself
	* @see ch.Floats#hide
	* @example
	* // Following the first example, using 'me' as modal's instance controller:
	* me.hide();
	*/
	
	/**
	* Sets or gets the width property of the component's layout. Use it without arguments to get the value. To set a new value pass an argument, could be a Number or CSS value like '300' or '300px'.
	* @public
	* @function
	* @name ch.Zoom#width
	* @returns itself
	* @see ch.Floats#size
	* @example
	* // Gets width of Zoom float element.
	* foo.width();
	* @example
	* // Sets width of Zoom float element and updates the seeker size to keep these relation.
	* foo.width(500);
	*/

	/**
	* Sets or gets the height property of the component's layout. Use it without arguments to get the value. To set a new value pass an argument, could be a Number or CSS value like '100' or '100px'.
	* @public
	* @function
	* @name ch.Zoom#height
	* @returns itself
	* @see ch.Floats#size
	* @example
	* // Gets height of Zoom float element.
	* foo.height();
	* @example
	* // Sets height of Zoom float element and update the seeker size to keep these relation.
	* foo.height(500);
	*/

	/**
	* Sets or gets positioning configuration. Use it without arguments to get actual configuration. Pass an argument to define a new positioning configuration.
	* @public
	* @function
	* @name ch.Zoom#position
	* @example
	* // Change default position.
	* $("a").zoom().position({
	*	offset: "0 10",
	*	points: "lt lb"
	* });
	* @example
	* // Refresh position.
	* $("a").zoom().position("refresh");
	* @example
	* // Get current position.
	* $("a").zoom().position();
	* @see ch.Object#position
	*/


/**
*	Default event delegation
*/

	// Anchor
	that.$element
		.addClass("ch-zoom-trigger")

		// Prevent click
		.bind("click", function (event) { that.prevent(event); })

		// Show component or loading transition
		.bind("mouseenter", that.innerShow)

		// Hide component or loading transition
		.bind("mouseleave", that.innerHide);	

	/**
	* Triggers when component is visible.
	* @name ch.Zoom#show
	* @event
	* @public
	* @example
	* me.on("show",function () {
	*	this.content("Some new content");
	* });
	* @see ch.Floats#event:show
	*/

	/**
	* Triggers when component is not longer visible.
	* @name ch.Zoom#hide
	* @event
	* @public
	* @example
	* me.on("hide",function () {
	*	otherComponent.show();
	* });
	* @see ch.Floats#event:hide
	*/

	/**
	* Triggers when the component is ready to use (Since 0.8.0).
	* @name ch.Zoom#ready
	* @event
	* @public
	* @since 0.8.0
	* @example
	* // Following the first example, using 'me' as zoom's instance controller:
	* me.on("ready",function () {
	*	this.show();
	* });
	*/
	setTimeout(function () { that.trigger("ready"); }, 50);

	return that;
};

ch.factory("zoom");