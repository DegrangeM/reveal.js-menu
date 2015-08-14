/*
 * Reveal.js menu plugin
 * MIT licensed
 * (c) Greg Denehy 2015
 */

var RevealMenu = window.RevealMenu || (function(){
	var config = Reveal.getConfig();
	var options = config.menu || {};
	options.path = options.path || scriptPath() || 'plugin/menu';

	var module = {};

	loadResource(options.path + '/lib/jeesh.min.js', 'script', function() {
	loadResource(options.path + '/lib/bowser.min.js', 'script', function() {
	loadResource(options.path + '/menu.css', 'stylesheet', function() {
	loadResource(options.path + '/font-awesome-4.3.0/css/font-awesome.min.css', 'stylesheet', function() {
		// does not support IE8 or below
		if (!bowser.msie || bowser.version >= 9) {
			//
			// Set option defaults
			//
			var side = options.side || 'left';	// 'left' or 'right'
			var numbers = options.numbers || false;
			var markers = options.markers || false;
			var themes = options.themes;
			if (typeof themes === "undefined") {
				themes = [
					{ name: 'Black', theme: 'css/theme/black.css' },
					{ name: 'White', theme: 'css/theme/white.css' },
					{ name: 'League', theme: 'css/theme/league.css' },
					{ name: 'Sky', theme: 'css/theme/sky.css' },
					{ name: 'Beige', theme: 'css/theme/beige.css' },
					{ name: 'Simple', theme: 'css/theme/simple.css' },
					{ name: 'Serif', theme: 'css/theme/serif.css' },
					{ name: 'Blood', theme: 'css/theme/blood.css' },
					{ name: 'Night', theme: 'css/theme/night.css' },
					{ name: 'Moon', theme: 'css/theme/moon.css' },
					{ name: 'Solarized', theme: 'css/theme/solarized.css' }
				];
			}
			var transitions = options.transitions;
			if (typeof transitions === "undefined") transitions = true;
			if (bowser.msie && bowser.version <= 9) {
				// transitions aren't support in IE9 anyway, so no point in showing them
				transitions = false;
			}
			var openButton = options.openButton;
			if (typeof openButton === "undefined") openButton = true;
			var openSlideNumber = options.openSlideNumber;
			if (typeof openSlideNumber === "undefined") openSlideNumber = false;

			//XXX add options for keyboard, ie disable, custom key codes, etc.

			function disableMouseSelection() {
				mouseSelectionEnabled = false;
			}

			function reenableMouseSelection() {
				// wait until the mouse has moved before re-enabling mouse selection
				// to avoid selections on scroll
				$('nav.slide-menu').one('mousemove', function(event) {
					//XXX this should select the item under the mouse
					mouseSelectionEnabled = true;
				});
			}

			//
			// Keyboard handling
			//
			function getOffset(el) {
				var _x = 0;
				var _y = 0;
				while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
					_x += el.offsetLeft - el.scrollLeft;
					_y += el.offsetTop - el.scrollTop;
					el = el.offsetParent;
				}
				return { top: _y, left: _x };
			}

			function keepVisible(el) {
				var offsetFromTop = getOffset(el).top - el.offsetParent.offsetTop;
				if (offsetFromTop < 0) {
					disableMouseSelection();
					el.scrollIntoView(true);
					reenableMouseSelection();
				}
				else {
					var offsetFromBottom = el.offsetParent.offsetHeight - (el.offsetTop - el.offsetParent.scrollTop + el.offsetHeight);
					if (offsetFromBottom < 0) {
						disableMouseSelection();
						el.scrollIntoView(false);
						reenableMouseSelection();	
					}
				}
			}

			function selectItem(el) {
				$(el).addClass('selected');
				keepVisible(el);
			}

			function onDocumentKeyDown(event) {
				if (event.keyCode === 77) {
					toggleMenu();
				} else if (isOpen()) {
					event.stopImmediatePropagation();
					switch( event.keyCode ) {
						// h, left - change panel
						case 72: case 37:
							prevPanel();
							break;
						// l, right - change panel
						case 76: case 39:
							nextPanel();
							break;
						// k, up
						case 75: case 38:
							var currItem = $('.active-menu-panel li.selected').get(0) || $('.active-menu-panel li.active').get(0);
							if (currItem) {
								$('.active-menu-panel li').removeClass('selected');
								var nextItem = $('.active-menu-panel li[data-item="' + ($(currItem).data('item') - 1) + '"]').get(0) || currItem;
								selectItem(nextItem);
							} else {
								selectItem($('.active-menu-panel li:first-of-type').addClass('selected').get(0));
							}
							break;
						// j, down
						case 74: case 40:
							var currItem = $('.active-menu-panel li.selected').get(0) || $('.active-menu-panel li.active').get(0);
							if (currItem) {
								$('.active-menu-panel li').removeClass('selected');
								var nextItem = $('.active-menu-panel li[data-item="' + ($(currItem).data('item') + 1) + '"]').get(0) || currItem;
								selectItem(nextItem);
							} else {
								selectItem($('.active-menu-panel li:first-of-type').addClass('selected').get(0));
							}
							break;
						// home
						case 36:
							$('.active-menu-panel li').removeClass('selected');
							var sel = $('.active-menu-panel li:first-of-type').addClass('selected').get(0);
							keepVisible(sel);
							break;
						// end
						case 35:
							$('.active-menu-panel li').removeClass('selected');
							var sel = $('.active-menu-panel li:last-of-type').addClass('selected').get(0);
							keepVisible(sel);
							break;
						// space, return
						case 32: case 13:
						var currItem = $('.active-menu-panel li.selected').get(0);
							if (currItem) {
								openItem(currItem);
							}
							break;
						// esc
						case 27: closeMenu(); break;
					}
				}
			}
			document.addEventListener('keydown', onDocumentKeyDown, false);

			// Prevent reveal from processing keyboard events when the menu is open
			if (config.keyboardCondition && typeof config.keyboardCondition === 'function') {
				// combine user defined keyboard condition with the menu's own condition
				var userCondition = config.keyboardCondition;
				config.keyboardCondition = function() {
					return userCondition() && !isOpen();
				};
			} else {
				config.keyboardCondition = function() { return !isOpen(); }
			}


			//
			// Utilty functions
			//

			function openMenu(event) {
				if (event) event.preventDefault();
				if (!isOpen()) {
				    $('body').addClass('slide-menu-active');
				    $('.reveal').addClass('has-' + options.effect + '-' + side);
				    $('.slide-menu').addClass('active');
				    $('.slide-menu-overlay').addClass('active');

				    // identify active theme
				    $('div[data-panel="Themes"] li').removeClass('active');
				    $('li[data-theme="' + $('#theme').attr('href') + '"]').addClass('active');

				    // identify active transition
				    $('div[data-panel="Transitions"] li').removeClass('active');
				    $('li[data-transition="' + Reveal.getConfig().transition + '"]').addClass('active');

				    // set item selections to match active items
				    $('.slide-menu-panel li.active')
				    	.addClass('selected')
				    	.each(function(item) { keepVisible(item) });
				}
			}

			function closeMenu(event) {
				if (event) event.preventDefault();
			    $('body').removeClass('slide-menu-active');
			    $('.reveal').removeClass('has-' + options.effect + '-' + side);
			    $('.slide-menu').removeClass('active');
			    $('.slide-menu-overlay').removeClass('active');
			    $('.slide-menu-panel li.selected').removeClass('selected');
			}

			function toggleMenu(event) {
				if (isOpen()) {
					closeMenu(event);
				} else {
					openMenu(event);
				}
			}

			function isOpen() {
				return $('body').hasClass('slide-menu-active');
			}

			function openPanel(e) {
				openMenu();
				var panel = e;
				if (typeof e !== "string") {
					panel = $(e.currentTarget).data('panel');
				}
				$('.slide-menu-toolbar > li').removeClass('active-toolbar-button');
				$('li[data-panel="' + panel + '"]').addClass('active-toolbar-button');
				$('.slide-menu-panel').removeClass('active-menu-panel');
				$('div[data-panel="' + panel + '"]').addClass('active-menu-panel');
			}

			function nextPanel() {
				var next = ($('.active-toolbar-button').data('button') + 1) % buttons;
				openPanel($('.toolbar-panel-button[data-button="' + next + '"]').data('panel'));
			}

			function prevPanel() {
				var next = $('.active-toolbar-button').data('button') - 1;
				if (next < 0) {
					next = buttons - 1;
				}
				openPanel($('.toolbar-panel-button[data-button="' + next + '"]').data('panel'));
			}

			$('<nav class="slide-menu slide-menu--' + side + '"></nav>')
				.appendTo($('.reveal'));
			$('<div class="slide-menu-overlay"></div>')
				.appendTo($('.reveal'))
				.click(closeMenu);

			var toolbar = $('<ol class="slide-menu-toolbar"></ol>').prependTo($('.slide-menu'));
			var buttons = 0;
			$('<li data-panel="Slides" data-button="' + (buttons++) + '" class="toolbar-panel-button"><span class="slide-menu-toolbar-label">Slides</span><br/><i class="fa fa-list"></i></li>')
				.appendTo(toolbar)
				.addClass('active-toolbar-button')
				.click(openPanel);
			if (themes) {
				$('<li data-panel="Themes" data-button="' + (buttons++) + '" class="toolbar-panel-button"><span class="slide-menu-toolbar-label">Themes</span><br/><i class="fa fa-desktop"></i></li>')
					.appendTo(toolbar)
					.click(openPanel);
			}
			if (transitions) {
				$('<li data-panel="Transitions" data-button="' + (buttons++) + '" class="toolbar-panel-button"><span class="slide-menu-toolbar-label">Transitions</span><br/><i class="fa fa-arrows-h"></i></li>')
					.appendTo(toolbar)
					.click(openPanel);
			}
			$('<li id="close"><span class="slide-menu-toolbar-label">Close</span><br/><i class="fa fa-times"></i></li>')
				.appendTo(toolbar)
				.click(closeMenu);

			var panels = $('.slide-menu');

			//
			// Slide links
			//
			function item(type, section, i, h, v) {
				var link = '/#/' + h;
				if (v) link += '/' + v;
				else v = 0;

				var title = $(section).data('menu-title') ||
					$('.menu-title', section).text() ||
					$('h1, h2, h3, h4, h5, h6', section).text();
				if (!title) {
					title = "Slide " + i;
					type += ' no-title';
				}

				title = '<span class="slide-menu-item-title">' + title + '</span>';
				if (numbers) {
					// Number formatting taken from reveal.js

					// Default to only showing the current slide number
					var format = 'c';

					// Check if a custom slide number format is available
					if( typeof numbers === 'string' ) {
						format = numbers;
					}

					var n = format.replace( /h/g, h )
									.replace( /v/g, v )
									.replace( /c/g, i )
									.replace( /t/g, Reveal.getTotalSlides() );

					title = '<span class="slide-menu-item-number">' + n + '. </span>' + title;
				}

				var m = '';
				if (markers) {
					m = '<i class="fa fa-check-circle past"></i>' +
								'<i class="fa fa-dot-circle-o active"></i>' + 
								'<i class="fa fa-circle-thin future"></i>';
				}

				return '<li class="' + type + '" data-item="' + i + '" data-slide-h="' + h + '" data-slide-v="' + v + '">' + m + title + '</li>';
			}

			function openItem(item) {
				var h = $(item).data('slide-h');
				var v = $(item).data('slide-v');
				var theme = $(item).data('theme');
				var transition = $(item).data('transition');
				if (typeof h !== "undefined" && typeof v !== "undefined") {
					Reveal.slide(h, v);
					closeMenu();
				} else if (theme) {
					$('#theme').attr('href', theme);
					closeMenu();
				} else if (transition) {
					Reveal.configure({ transition: transition });
					closeMenu();
				}
			}

			function clicked(event) {
				event.preventDefault();
				openItem(event.currentTarget);
			}

			function highlightCurrentSlide() {
				var state = Reveal.getState();
				$('li.slide-menu-item, li.slide-menu-item-vertical')
					.removeClass('past')
					.removeClass('active')
					.removeClass('future');

				$('li.slide-menu-item, li.slide-menu-item-vertical').each(function(e) {
					var h = $(e).data('slide-h');
					var v = $(e).data('slide-v');
					if (h < state.indexh || (h === state.indexh && v < state.indexv)) {
						$(e).addClass('past');
					}
					else if (h === state.indexh && v === state.indexv) {
						$(e).addClass('active');
					}
					else {
						$(e).addClass('future');
					}
				});
			}

			$('<div data-panel="Slides" class="slide-menu-panel"><ul class="slide-menu-items"></ul></div>')
				.appendTo(panels)
				.addClass('active-menu-panel');
			var items = $('.slide-menu-items');
			var slideCount = 0;
			$('.slides > section').each(function(section, h) {
				var subsections = $('section', section);
				if (subsections.length > 0) {
					subsections.each(function(subsection, v) {
						slideCount++;
						var type = (v === 0 ? 'slide-menu-item' : 'slide-menu-item-vertical');
						items.append(item(type, subsection, slideCount, h, v));
					});
				} else {
					slideCount++;
					var type = 'slide-menu-item';
					items.append(item(type, section, slideCount, h));
				}
			});
			$('.slide-menu-item, .slide-menu-item-vertical').click(clicked);

			Reveal.addEventListener('slidechanged', highlightCurrentSlide);
			highlightCurrentSlide();

			//
			// Themes
			//
			if (themes) {
				var panel = $('<div data-panel="Themes" class="slide-menu-panel"></div>').appendTo(panels);
				themes.forEach(function(t, i) {
					$('<li data-theme="' + t.theme + '" data-item="' + (i+1) + '">' + t.name + '</li>').appendTo(panel).click(clicked);
				})
			}

			//
			// Transitions
			//
			if (transitions) {
				var panel = $('<div data-panel="Transitions" class="slide-menu-panel"></div>')
					.appendTo(panels);
				['None', 'Fade', 'Slide', 'Convex', 'Concave', 'Zoom'].forEach(function(name, i) {
					$('<li data-transition="' + name.toLowerCase() + '" data-item="' + (i+1) + '">' + name + '</li>').appendTo(panel).click(clicked);
				})
			}

			//
			// Open menu options
			//
			if (openButton) {
				// add menu button
				$('<div class="slide-menu-button"><a href="#"><i class="fa fa-bars"></i></a></div>')
					.appendTo($('.reveal'))
					.click(openMenu);
			}

			if (openSlideNumber) {
				// wrap slide number in link
				$('<div class="slide-number-wrapper"><a href="#"></a></div>').insertAfter($('div.slide-number'));
				$('.slide-number').appendTo($('.slide-number-wrapper a'));
				$('.slide-number-wrapper a').click(openMenu);
			}

			//
			// Handle mouse overs
			//
			var mouseSelectionEnabled = true;
			$('.slide-menu-panel li').mouseenter(function(event) {
				if (mouseSelectionEnabled) {
					$('.active-menu-panel li').removeClass('selected');
					$(event.currentTarget).addClass('selected');
				}
			});

			module.toggle = toggleMenu;
			module.isOpen = isOpen;
		}
	})
	})
	})
	});

	// modified from math plugin
	function loadResource( url, type, callback ) {
		var head = document.querySelector( 'head' );
		var resource;

		if ( type === 'script' ) {
			resource = document.createElement( 'script' );
			resource.type = 'text/javascript';
			resource.src = url;
		}
		else if ( type === 'stylesheet' ) {
			resource = document.createElement( 'link' );
			resource.rel = 'stylesheet';
			resource.href = url;
		}

		// Wrapper for callback to make sure it only fires once
		var finish = function() {
			if( typeof callback === 'function' ) {
				callback.call();
				callback = null;
			}
		}

		resource.onload = finish;

		// IE
		resource.onreadystatechange = function() {
			if ( this.readyState === 'loaded' ) {
				finish();
			}
		}

		// Normal browsers
		head.appendChild( resource );
	}

	function scriptPath() {
		// obtain plugin path from the script element
		var path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -7);
		} else {
			var sel = document.querySelector('script[src$="/menu.js"]')
			if (sel) {
				path = sel.src.slice(0, -7);
			}
		}
		return path;
	}

	return module;
})();
