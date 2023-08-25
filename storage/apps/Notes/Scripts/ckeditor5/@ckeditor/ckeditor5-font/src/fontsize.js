/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module font/fontsize
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FontSizeEditing from './fontsize/fontsizeediting';
import FontSizeUI from './fontsize/fontsizeui';

/**
 * The font size plugin.
 *
 * For a detailed overview, check the {@glink features/font font feature} documentation
 * and the {@glink api/font package page}.
 *
 * This is a "glue" plugin which loads the {@link module:font/fontsize/fontsizeediting~FontSizeEditing} and
 * {@link module:font/fontsize/fontsizeui~FontSizeUI} features in the editor.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FontSize extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FontSizeEditing, FontSizeUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FontSize';
	}
}

/**
 * The font size option descriptor.
 *
 * @typedef {Object} module:font/fontsize~FontSizeOption
 *
 * @property {String} title The user-readable title of the option.
 * @property {String} model The attribute's unique value in the model.
 * @property {module:engine/view/elementdefinition~ElementDefinition} view View element configuration.
 * @property {Array.<module:engine/view/elementdefinition~ElementDefinition>} [upcastAlso] An array with all matched elements that
 * the view-to-model conversion should also accept.
 */

/**
 * The configuration of the font size feature.
 * It is introduced by the {@link module:font/fontsize/fontsizeediting~FontSizeEditing} feature.
 *
 * Read more in {@link module:font/fontsize~FontSizeConfig}.
 *
 * @member {module:font/fontsize~FontSizeConfig} module:core/editor/editorconfig~EditorConfig#fontSize
 */

/**
 * The configuration of the font size feature.
 * This option is used by the {@link module:font/fontsize/fontsizeediting~FontSizeEditing} feature.
 *
 * 		ClassicEditor
 * 			.create( {
 * 				fontSize: ... // Font size feature configuration.
 *			} )
 * 			.then( ... )
 * 			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface module:font/fontsize~FontSizeConfig
 */

/**
 * Available font size options. Expressed as predefined presets, numerical "pixel" values
 * or the {@link module:font/fontsize~FontSizeOption}.
 *
 * The default value is:
 *
 *		const fontSizeConfig = {
 *			options: [
 *				'tiny',
 * 				'small',
 * 				'default',
 * 				'big',
 * 				'huge'
 *			]
 *		};
 *
 * It defines 4 sizes: **tiny**, **small**, **big**, and **huge**. These values will be rendered as `<span>` elements in the view.
 * The **default** defines a text without the `fontSize` attribute.
 *
 * Each `<span>` has the the `class` attribute set to the corresponding size name. For instance, this is what the **small** size looks
 * like in the view:
 *
 * 		<span class="text-small">...</span>
 *
 * As an alternative, the font size might be defined using numerical values (either as a `Number` or as a `String`):
 *
 * 		const fontSizeConfig = {
 * 			options: [ 9, 10, 11, 12, 13, 14, 15 ]
 * 		};
 *
 * Font size can be applied using the command API. To do that, use the `'fontSize'` command and pass the desired font size as a `value`.
 * For example, the following code will apply the `fontSize` attribute with the **tiny** value to the current selection:
 *
 *		editor.execute( 'fontSize', { value: 'tiny' } );
 *
 * Executing the `fontSize` command without value will remove the `fontSize` attribute from the current selection.
 *
 * @member {Array.<String|Number|module:font/fontsize~FontSizeOption>} module:font/fontsize~FontSizeConfig#options
 */
