/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module ui/list/listitemview
 */

import View from '../view';

/**
 * The list item view class.
 *
 * @extends module:ui/view~View
 */
export default class ListItemView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		/**
		 * Collection of the child views inside of the list item {@link #element}.
		 *
		 * @readonly
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this.children = this.createCollection();

		this.setTemplate( {
			tag: 'li',

			attributes: {
				class: [
					'ck',
					'ck-list__item'
				]
			},

			children: this.children
		} );
	}

	/**
	 * Focuses the list item.
	 */
	focus() {
		this.children.first.focus();
	}
}
