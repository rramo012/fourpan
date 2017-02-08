(function( $ ) {
	'use strict';

	/**
	 *
	 * Basic Usage
	 *
	 * Inititalize fourpan $init = $().fourpan();
	 *
	 * Highlight a selector $init.highlight('.selection-1');
	 *
	 */

	if ( $.fourpan ) {
		return;
	}

	$.fourpan = function( el, options ) {
		var self = this;

		if ( $.fourpan.initiated ) {
			return;
		}

		// Find the html element used to place objects
		var $html;
		if ( el ) {
			$html = $( el ).find( 'html' );
			if ( ! $html.length ) {
				$html = $( el ).closest( 'html' );
			}
		} else {
			$html = $( 'html' );
		}

		var default_class = 'fourpan-overlays';
		var overlays_active = false;
		var panels = {};
		var settings = $.extend( {}, $.fourpan.defaultOptions, options );
		var overlay_class_strings = default_class + ' ' + settings.overlay_classes;

		var $close_button = $( '<div class="forpan-close-button">Close</div>' );
		$close_button.css({
			'position': 'absolute',
			'z-index': '10000',
			'font-size': '16px',
			'background': 'rgb(213, 78, 33)',
			'border-radius': '25px',
			'padding': '8px 15px',
			'color': 'white',
			'display': 'none'
		} ).on( 'mouseenter', function() {
			  $( this ).css( {
				  'background-color': '#f95b26',
				  'cursor': 'pointer'
			  } );
		} ).on( 'mouseleave', function() {
			  $( this ).css( {
				  'background-color': 'rgb(213, 78, 33)',
				  'cursor': 'default'
			  } );
		} );
		$html.append( $close_button );

		/**
		 * Init Process
		 */
		var init = function() {
			// Create four panels object
			panels[settings.id_prefix + '-top'] = {};
			panels[settings.id_prefix + '-right'] = {};
			panels[settings.id_prefix + '-bottom'] = {};
			panels[settings.id_prefix + '-left'] = {};

			// Set initiated flag
			$.fourpan.initiated = true;

			// Create panels
			create_panels();

			// Bind dismissal action
			bind_overlay_dismiss();
		};

		/**
		 * Find and Create Overlays
		 */
		var create_panels = function() {
			$.each( panels, function( panel_id ) {
				var $panel = $html.find( '#' + panel_id );
				if ( $panel.length ) {
					// Assign existing panels
					panels[panel_id] = $panel;
				} else {
					// If overlays don't exists create them
					$panel = create_panel( panel_id );
					panels[panel_id] = $panel;
				}
			});
		};

		/**
		 * Creates a single panel
		 *
		 * @return $panel
		 */
		var create_panel = function( panel_id ) {
			var $panel = $( '<div id="' + panel_id + '" class="' + overlay_class_strings + '"></div>' );
			$html.append( $panel );
			return $panel;
		};

		/**
		 * On click over the overlay, dismiss it
		 */
		var bind_overlay_dismiss = function() {
			$html.find( '.' + default_class ).add( $close_button ).on( 'click', dismiss );
			//Remove overlay on escape
			$html.keyup(function( e ) {
			     if ( e.keyCode === 27 ) {
			    	 dismiss();
			    }
			});
		};

		var dismiss = function() {
			$html.find( '.' + default_class  ).add( $close_button ).fadeOut();
			overlays_active = false;
			settings.deactivate();
			unbind_subtree_listener();
		};

		/**
		 * Set the intial css for the panels
		 */
		var reset_panels = function() {
			var $overlays = $html.find( '.' + default_class );
			$overlays.css({
				'position': 'absolute',
				'top': '0',
				'right': '0',
				'bottom': '0',
				'left': '0',
				'z-index': '9999',
				'background-color': settings.color
			});

			// Reset Positions
			overlays_active = true;
		};

		$.fourpan.dismiss = function() {
			dismiss();
		};

		var bind_subtree_mod = function() {
			$html.find( 'body' )
				.on( 'DOMSubtreeModified.fourpan', function( event ) {

					self.time = event.timeStamp;
					setTimeout( function() {
						var now = new Date().getTime();
						//Console.log(now, self.last_event < (now - 250))
						if ( ! self.last_event || self.last_event < ( now - 250 ) ) {
							self.last_event = now;

							$.fourpan.refresh();
						}
				}, 250 );
			} );
		};

		var unbind_subtree_listener = function() {
			$html.find( 'body' ).off( '.fourpan' );
		};

		var transition_highlight = function( $this, speed, padding, show_button ) {
			if ( speed > 0 ) {
				$close_button.hide();
			}

			var bounding_rect = $this[0].getBoundingClientRect();
			panels[settings.id_prefix + '-top'].stop().animate({
				'height':Math.max( bounding_rect.top - padding, 0 )
			}, speed );

			panels[settings.id_prefix + '-right'].stop().animate({
				'top':Math.max( bounding_rect.top - padding, 0 ),
				'left': bounding_rect.left + $this.outerWidth() + padding
			},  speed );

			panels[settings.id_prefix + '-bottom'].stop().animate({
				'top': bounding_rect.top + $this.outerHeight() + padding,
				'width': bounding_rect.left + $this.outerWidth() + padding
			}, speed );

			var padding_diff = Math.max( bounding_rect.top - padding, 0 ) - ( bounding_rect.top - padding );
			panels[settings.id_prefix + '-left'].stop().animate({
				'width':Math.max( bounding_rect.left - padding, 0 ),
				'top':Math.max( bounding_rect.top - padding, 0 ),
				'height': $this.outerHeight() + ( padding * 2 ) - padding_diff
			}, {
				duration: speed,
				complete: function() {
					if ( show_button ) {
						$close_button.css({
							'left': ( bounding_rect.left + ( ( $this.outerWidth() + padding ) / 2 ) ) - 35,
							'top': ( bounding_rect.top + $this.outerHeight() + padding ) + 20
						}).fadeIn();
					}
					$html.find( '.' + default_class  ).fadeIn();
				}
			});

		};

		/**
		 * Highlight an element
		 */
		$.fourpan.highlight = function( selection_string ) {
			var $this;

			if ( selection_string instanceof jQuery ) {
				if ( selection_string.length > 1 || ! selection_string.length ) {
					return false;
				}

				$this = selection_string;
			} else {
				$this = $( selection_string );
			}
			// If the user tried to highlight more than 1 object, return false
			if ( $this.length !== 1 || ! $this.is( ':visible' ) ) {
				dismiss();
				return false;
			}
			$.fourpan.$recent_highlight = $this;

			if ( ! overlays_active ) {
				reset_panels();
				settings.activate( );
				bind_subtree_mod();
			//	Transition_highlight( $this, 0, 150, false );
				$html.find( '.' + default_class  ).hide();
			}

			transition_highlight( $this, settings.transition_speed, settings.element_padding, true );

			return true;
		};

		/**
		 * Refresh the highlighted element
		 */
		$.fourpan.refresh = function() {
			if ( overlays_active ) {
				if ( $html.find( $.fourpan.$recent_highlight ).length ) {
					transition_highlight( $.fourpan.$recent_highlight, 0, settings.element_padding, true );
					self.last_event = new Date().getTime();
				} else {
					dismiss();
				}
			}
		};

		init();

		return $html;
	};

	$.fourpan.defaultOptions = {
			// Default Options
			id_prefix: 'fourpan-overlay',
			overlay_classes: '',
			color: 'rgba(0,0,0,.7)',
			transition_speed: 1000,
			element_padding: 20,
			activate: function() {},
			deactivate: function() {}
	  };

	$.fn.fourpan = function( options ) {
		return this.each(function() {
			( new $.fourpan( this, options ) );
		});
	};

})( jQuery );
