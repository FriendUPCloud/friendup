/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module font/fontfamily/fontfamilyui
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';

import { createDropdown, addListToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import { normalizeOptions } from './utils';
import fontFamilyIcon from '../../theme/icons/font-family.svg';

/**
 * The font family UI plugin. It introduces the `'fontFamily'` dropdown.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FontFamilyUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;

		const options = this._getLocalizedOptions();

		const command = editor.commands.get( 'fontFamily' );

		// Register UI component.
		editor.ui.componentFactory.add( 'fontFamily', locale => {
			const dropdownView = createDropdown( locale );
			addListToDropdown( dropdownView, _prepareListOptions( options, command ) );

			dropdownView.buttonView.set( {
				label: t( 'Font Family' ),
				icon: fontFamilyIcon,
				tooltip: true
			} );

			dropdownView.extendTemplate( {
				attributes: {
					class: 'ck-font-family-dropdown'
				}
			} );

			dropdownView.bind( 'isEnabled' ).to( command );

			// Execute command when an item from the dropdown is selected.
			this.listenTo( dropdownView, 'execute', evt => {
				editor.execute( evt.source.commandName, { value: evt.source.commandParam } );
				editor.editing.view.focus();
			} );

			return dropdownView;
		} );
	}

	/**
	 * Returns options as defined in `config.fontFamily.options` but processed to account for
	 * editor localization, i.e. to display {@link module:font/fontfamily~FontFamilyOption}
	 * in the correct language.
	 *
	 * Note: The reason behind this method is that there is no way to use {@link module:utils/locale~Locale#t}
	 * when the user configuration is defined because the editor does not exist yet.
	 *
	 * @private
	 * @returns {Array.<module:font/fontfamily~FontFamilyOption>}.
	 */
	_getLocalizedOptions() {
		const editor = this.editor;
		const t = editor.t;

		const options = normalizeOptions( editor.config.get( 'fontFamily.options' ) );

		return options.map( option => {
			// The only title to localize is "Default" others are font names.
			if ( option.title === 'Default' ) {
				option.title = t( 'Default' );
			}

			return option;
		} );
	}
}

// Prepares FontFamily dropdown items.
// @private
// @param {Array.<module:font/fontsize~FontSizeOption>} options
// @param {module:font/fontsize/fontsizecommand~FontSizeCommand} command
function _prepareListOptions( options, command ) {
	const itemDefinitions = new Collection();

	// Create dropdown items.
	for ( const option of options ) {
		const def = {
			type: 'button',
			model: new Model( {
				commandName: 'fontFamily',
				commandParam: option.model,
				label: option.title,
				withText: true
			} )
		};

		def.model.bind( 'isOn' ).to( command, 'value', value => value === option.model );

		// Try to set a dropdown list item style.
		if ( option.view && option.view.styles ) {
			def.model.set( 'labelStyle', `font-family: ${ option.view.styles[ 'font-family' ] }` );
		}

		itemDefinitions.add( def );
	}
	return itemDefinitions;
}
