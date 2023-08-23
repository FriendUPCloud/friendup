/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module ui/list/listseparatorview
 */

import View from '../view';

/**
 * The list separator view class.
 *
 * @extends module:ui/view~View
 */
export default class ListSeparatorView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		this.setTemplate( {
			tag: 'li',
			attributes: {
				class: [
					'ck',
					'ck-list__separator'
				]
			}
		} );
	}
}
