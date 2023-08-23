/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/view/observer/observer
 */

import DomEmitterMixin from '@ckeditor/ckeditor5-utils/src/dom/emittermixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/**
 * Abstract base observer class. Observers are classes which listen to DOM events, do the preliminary
 * processing and fire events on the {@link module:engine/view/document~Document} objects.
 * Observers can also add features to the view, for instance by updating its status or marking elements
 * which need refresh on DOM events.
 *
 * @abstract
 */
export default class Observer {
	/**
	 * Creates an instance of the observer.
	 *
	 * @param {module:engine/view/view~View} view
	 */
	constructor( view ) {
		/**
		 * Instance of the view controller.
		 *
		 * @readonly
		 * @member {module:engine/view/view~View}
		 */
		this.view = view;

		/**
		 * Reference to the {@link module:engine/view/document~Document} object.
		 *
		 * @readonly
		 * @member {module:engine/view/document~Document}
		 */
		this.document = view.document;

		/**
		 * State of the observer. If it is disabled events will not be fired.
		 *
		 * @readonly
		 * @member {Boolean}
		 */
		this.isEnabled = false;
	}

	/**
	 * Enables the observer. This method is called when the observer is registered to the
	 * {@link module:engine/view/view~View} and after {@link module:engine/view/view~View#render rendering}
	 * (all observers are {@link #disable disabled} before rendering).
	 *
	 * A typical use case for disabling observers is that mutation observers need to be disabled for the rendering.
	 * However, a child class may not need to be disabled, so it can implement an empty method.
	 *
	 * @see module:engine/view/observer/observer~Observer#disable
	 */
	enable() {
		this.isEnabled = true;
	}

	/**
	 * Disables the observer. This method is called before
	 * {@link module:engine/view/view~View#render rendering} to prevent firing events during rendering.
	 *
	 * @see module:engine/view/observer/observer~Observer#enable
	 */
	disable() {
		this.isEnabled = false;
	}

	/**
	 * Disables and destroys the observer, among others removes event listeners created by the observer.
	 */
	destroy() {
		this.disable();
		this.stopListening();
	}

	/**
	 * Starts observing the given root element.
	 *
	 * @method #observe
	 * @param {HTMLElement} domElement
	 * @param {String} name The name of the root element.
	 */
}

mix( Observer, DomEmitterMixin );
