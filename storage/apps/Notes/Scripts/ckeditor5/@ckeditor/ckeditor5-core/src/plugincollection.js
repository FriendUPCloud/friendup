/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module core/plugincollection
 */

import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import log from '@ckeditor/ckeditor5-utils/src/log';

/**
 * Manages a list of CKEditor plugins, including loading, resolving dependencies and initialization.
 */
export default class PluginCollection {
	/**
	 * Creates an instance of the PluginCollection class.
	 * Allows loading and initializing plugins and their dependencies.
	 *
	 * @param {module:core/editor/editor~Editor} editor
	 * @param {Array.<Function>} [availablePlugins] Plugins (constructors) which the collection will be able to use
	 * when {@link module:core/plugincollection~PluginCollection#load} is used with plugin names (strings, instead of constructors).
	 * Usually, the editor will pass its built-in plugins to the collection so they can later be
	 * used in `config.plugins` or `config.removePlugins` by names.
	 */
	constructor( editor, availablePlugins = [] ) {
		/**
		 * @protected
		 * @member {module:core/editor/editor~Editor} module:core/plugin~PluginCollection#_editor
		 */
		this._editor = editor;

		/**
		 * Map of plugin constructors which can be retrieved by their names.
		 *
		 * @protected
		 * @member {Map.<String|Function,Function>} module:core/plugin~PluginCollection#_availablePlugins
		 */
		this._availablePlugins = new Map();

		/**
		 * @protected
		 * @member {Map} module:core/plugin~PluginCollection#_plugins
		 */
		this._plugins = new Map();

		for ( const PluginConstructor of availablePlugins ) {
			this._availablePlugins.set( PluginConstructor, PluginConstructor );

			if ( PluginConstructor.pluginName ) {
				this._availablePlugins.set( PluginConstructor.pluginName, PluginConstructor );
			}
		}
	}

	/**
	 * Iterable interface.
	 *
	 * Returns `[ PluginConstructor, pluginInstance ]` pairs.
	 *
	 * @returns {Iterable.<Array>}
	 */
	* [ Symbol.iterator ]() {
		for ( const entry of this._plugins ) {
			if ( typeof entry[ 0 ] == 'function' ) {
				yield entry;
			}
		}
	}

	/**
	 * Gets the plugin instance by its constructor or name.
	 *
	 * @param {Function|String} key The plugin constructor or {@link module:core/plugin~PluginInterface.pluginName name}.
	 * @returns {module:core/plugin~PluginInterface}
	 */
	get( key ) {
		return this._plugins.get( key );
	}

	/**
	 * Loads a set of plugins and adds them to the collection.
	 *
	 * @param {Array.<Function|String>} plugins An array of {@link module:core/plugin~PluginInterface plugin constructors}
	 * or {@link module:core/plugin~PluginInterface.pluginName plugin names}. The second option (names) works only if
	 * `availablePlugins` were passed to the {@link #constructor}.
	 * @param {Array.<String|Function>} [removePlugins] Names of plugins or plugin constructors
	 * that should not be loaded (despite being specified in the `plugins` array).
	 * @returns {Promise} A promise which gets resolved once all plugins are loaded and available in the
	 * collection.
	 * @returns {Promise.<Array.<module:core/plugin~PluginInterface>>} returns.loadedPlugins The array of loaded plugins.
	 */
	load( plugins, removePlugins = [] ) {
		const that = this;
		const editor = this._editor;
		const loading = new Set();
		const loaded = [];

		const pluginConstructors = mapToAvailableConstructors( plugins );
		const removePluginConstructors = mapToAvailableConstructors( removePlugins );
		const missingPlugins = getMissingPluginNames( plugins );

		if ( missingPlugins ) {
			/**
			 * Some plugins are not available and could not be loaded.
			 *
			 * Plugin classes (constructors) need to be provided to the editor before they can be loaded by name.
			 * This is usually done in CKEditor 5 builds by setting the {@link module:core/editor/editor~Editor.builtinPlugins}
			 * property.
			 *
			 * **If you see this warning when using one of the {@glink builds/index CKEditor 5 Builds}**, it means
			 * that you try to enable a plugin which was not included in that build. This may be due to a typo
			 * in the plugin name or simply because that plugin is not a part of this build. In the latter scenario,
			 * read more about {@glink builds/guides/development/custom-builds custom builds}.
			 *
			 * **If you see this warning when using one of the editor creators directly** (not a build), then it means
			 * that you tried loading plugins by name. However, unlike CKEditor 4, CKEditor 5 does not implement a "plugin loader".
			 * This means that CKEditor 5 does not know where to load the plugin modules from. Therefore, you need to
			 * provide each plugin through reference (as a constructor function). Check out the examples in
			 * {@glink builds/guides/integration/advanced-setup#scenario-2-building-from-source "Building from source"}.
			 *
			 * @error plugincollection-plugin-not-found
			 * @param {Array.<String>} plugins The name of the plugins which could not be loaded.
			 */
			const errorMsg = 'plugincollection-plugin-not-found: Some plugins are not available and could not be loaded.';

			// Log the error so it's more visible on the console. Hopefully, for better DX.
			log.error( errorMsg, { plugins: missingPlugins } );

			return Promise.reject( new CKEditorError( errorMsg, { plugins: missingPlugins } ) );
		}

		return Promise.all( pluginConstructors.map( loadPlugin ) )
			.then( () => loaded );

		function loadPlugin( PluginConstructor ) {
			if ( removePluginConstructors.includes( PluginConstructor ) ) {
				return;
			}

			// The plugin is already loaded or being loaded - do nothing.
			if ( that.get( PluginConstructor ) || loading.has( PluginConstructor ) ) {
				return;
			}

			return instantiatePlugin( PluginConstructor )
				.catch( err => {
					/**
					 * It was not possible to load the plugin.
					 *
					 * This is a generic error logged to the console when a JavaSript error is thrown during the initialization
					 * of one of the plugins.
					 *
					 * If you correctly handled the promise returned by the editor's `create()` method (like shown below)
					 * you will find the original error logged to the console, too:
					 *
					 *		ClassicEditor.create( document.getElementById( 'editor' ) )
					 *			.then( editor => {
					 *				// ...
					 * 			} )
					 *			.catch( error => {
					 *				console.error( error );
					 *			} );
					 *
					 * @error plugincollection-load
					 * @param {String} plugin The name of the plugin that could not be loaded.
					 */
					log.error( 'plugincollection-load: It was not possible to load the plugin.', { plugin: PluginConstructor } );

					throw err;
				} );
		}

		function instantiatePlugin( PluginConstructor ) {
			return new Promise( resolve => {
				loading.add( PluginConstructor );

				if ( PluginConstructor.requires ) {
					PluginConstructor.requires.forEach( RequiredPluginConstructorOrName => {
						const RequiredPluginConstructor = getPluginConstructor( RequiredPluginConstructorOrName );

						if ( removePlugins.includes( RequiredPluginConstructor ) ) {
							/**
							 * Cannot load a plugin because one of its dependencies is listed in the `removePlugins` option.
							 *
							 * @error plugincollection-required
							 * @param {Function} plugin The required plugin.
							 * @param {Function} requiredBy The parent plugin.
							 */
							throw new CKEditorError(
								'plugincollection-required: Cannot load a plugin because one of its dependencies is listed in' +
								'the `removePlugins` option.',
								{ plugin: RequiredPluginConstructor, requiredBy: PluginConstructor }
							);
						}

						loadPlugin( RequiredPluginConstructor );
					} );
				}

				const plugin = new PluginConstructor( editor );
				that._add( PluginConstructor, plugin );
				loaded.push( plugin );

				resolve();
			} );
		}

		function getPluginConstructor( PluginConstructorOrName ) {
			if ( typeof PluginConstructorOrName == 'function' ) {
				return PluginConstructorOrName;
			}

			return that._availablePlugins.get( PluginConstructorOrName );
		}

		function getMissingPluginNames( plugins ) {
			const missingPlugins = [];

			for ( const pluginNameOrConstructor of plugins ) {
				if ( !getPluginConstructor( pluginNameOrConstructor ) ) {
					missingPlugins.push( pluginNameOrConstructor );
				}
			}

			return missingPlugins.length ? missingPlugins : null;
		}

		function mapToAvailableConstructors( plugins ) {
			return plugins
				.map( pluginNameOrConstructor => getPluginConstructor( pluginNameOrConstructor ) )
				.filter( PluginConstructor => !!PluginConstructor );
		}
	}

	/**
	 * Destroys all loaded plugins.
	 *
	 * @returns {Promise}
	 */
	destroy() {
		const promises = Array.from( this )
			.map( ( [ , pluginInstance ] ) => pluginInstance )
			.filter( pluginInstance => typeof pluginInstance.destroy == 'function' )
			.map( pluginInstance => pluginInstance.destroy() );

		return Promise.all( promises );
	}

	/**
	 * Adds the plugin to the collection. Exposed mainly for testing purposes.
	 *
	 * @protected
	 * @param {Function} PluginConstructor The plugin constructor.
	 * @param {module:core/plugin~PluginInterface} plugin The instance of the plugin.
	 */
	_add( PluginConstructor, plugin ) {
		this._plugins.set( PluginConstructor, plugin );

		const pluginName = PluginConstructor.pluginName;

		if ( !pluginName ) {
			return;
		}

		if ( this._plugins.has( pluginName ) ) {
			/**
			 * Two plugins with the same {@link module:core/plugin~PluginInterface.pluginName} were loaded.
			 * This will lead to runtime conflicts between these plugins.
			 *
			 * In practice, this warning usually means that new plugins were added to an existing CKEditor 5 build.
			 * Plugins should always be added to a source version of the editor (`@ckeditor/ckeditor5-editor-*`),
			 * not to an editor imported from one of the `@ckeditor/ckeditor5-build-*` packages.
			 *
			 * Check your import paths and the list of plugins passed to
			 * {@link module:core/editor/editor~Editor.create `Editor.create()`}
			 * or specified in {@link module:core/editor/editor~Editor.builtinPlugins `Editor.builtinPlugins`}.
			 *
			 * The second option is that your `node_modules/` directory contains duplicated versions of the same
			 * CKEditor 5 packages. Normally, on clean installations, npm deduplicates packages in `node_modules/`, so
			 * it may be enough to call `rm -rf node_modules && npm i`. However, if you installed conflicting versions
			 * of packages, their dependencies may need to be installed in more than one version which may lead to this
			 * warning.
			 *
			 * Technically speaking, this error occurs because after adding a plugin to an existing editor build
			 * dependencies of this plugin are being duplicated.
			 * They are already built into that editor build and now get added for the second time as dependencies
			 * of the plugin you are installing.
			 *
			 * Read more about {@glink builds/guides/integration/installing-plugins installing plugins}.
			 *
			 * @error plugincollection-plugin-name-conflict
			 * @param {String} pluginName The duplicated plugin name.
			 * @param {Function} plugin1 The first plugin constructor.
			 * @param {Function} plugin2 The second plugin constructor.
			 */
			log.warn(
				'plugincollection-plugin-name-conflict: Two plugins with the same name were loaded.',
				{ pluginName, plugin1: this._plugins.get( pluginName ).constructor, plugin2: PluginConstructor }
			);
		} else {
			this._plugins.set( pluginName, plugin );
		}
	}
}
