/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module core/editor/editor
 */

import Config from '@ckeditor/ckeditor5-utils/src/config';
import EditingController from '@ckeditor/ckeditor5-engine/src/controller/editingcontroller';
import PluginCollection from '../plugincollection';
import CommandCollection from '../commandcollection';
import Locale from '@ckeditor/ckeditor5-utils/src/locale';
import DataController from '@ckeditor/ckeditor5-engine/src/controller/datacontroller';
import Conversion from '@ckeditor/ckeditor5-engine/src/conversion/conversion';
import Model from '@ckeditor/ckeditor5-engine/src/model/model';
import EditingKeystrokeHandler from '../editingkeystrokehandler';

import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

import '@ckeditor/ckeditor5-utils/src/version';

/**
 * Class representing a basic, generic editor.
 *
 * Check out the list of its subclasses to learn about specific editor implementations.
 *
 * All editor implementations (like {@link module:editor-classic/classiceditor~ClassicEditor} or
 * {@link module:editor-inline/inlineeditor~InlineEditor}) should extend this class. They can add their
 * own methods and properties.
 *
 * When you are implementing a plugin, then this editor represents the API
 * which your plugin can expect to get when using its {@link module:core/plugin~Plugin#editor} property.
 *
 * This API should be sufficient in order to implement the "editing" part of your feature
 * (schema definition, conversion, commands, keystrokes, etc.).
 * It does not define the editor UI, which is available only if the
 * the specific editor implements also the {@link module:core/editor/editorwithui~EditorWithUI} interface
 * (as most editor implementations do).
 *
 * @mixes module:utils/observablemixin~ObservableMixin
 */
export default class Editor {
	/**
	 * Creates a new instance of the Editor class.
	 *
	 * Usually, not to be used directly. See the static {@link module:core/editor/editor~Editor.create `create()`} method.
	 *
	 * @param {Object} [config] The editor config.
	 */
	constructor( config ) {
		const availablePlugins = this.constructor.builtinPlugins;

		/**
		 * Holds all configurations specific to this editor instance.
		 *
		 *		editor.config.get( 'image.toolbar' );
		 *		// -> [ 'imageStyle:full', 'imageStyle:side', '|', 'imageTextAlternative' ]
		 *
		 * @readonly
		 * @member {module:utils/config~Config}
		 */
		this.config = new Config( config, this.constructor.defaultConfig );

		this.config.define( 'plugins', availablePlugins );

		/**
		 * The plugins loaded and in use by this editor instance.
		 *
		 *		editor.plugins.get( 'Clipboard' ); // -> instance of the Clipboard plugin.
		 *
		 * @readonly
		 * @member {module:core/plugincollection~PluginCollection}
		 */
		this.plugins = new PluginCollection( this, availablePlugins );

		/**
		 * Commands registered to the editor.
		 *
		 * Use the shorthand {@link #execute `editor.execute()`} method to execute commands:
		 *
		 *		// Execute the bold command:
		 *		editor.execute( 'bold' );
		 *
		 *		// Check the state of the bold command:
		 *		editor.commands.get( 'bold' ).value;
		 *
		 * @readonly
		 * @member {module:core/commandcollection~CommandCollection}
		 */
		this.commands = new CommandCollection();

		/**
		 * @readonly
		 * @member {module:utils/locale~Locale}
		 */
		this.locale = new Locale( this.config.get( 'language' ) );

		/**
		 * Shorthand for {@link module:utils/locale~Locale#t}.
		 *
		 * @see module:utils/locale~Locale#t
		 * @method #t
		 */
		this.t = this.locale.t;

		/**
		 * Indicates the editor life-cycle state.
		 *
		 * The editor is in one of the following states:
		 *
		 * * `initializing` - during the editor initialization (before {@link module:core/editor/editor~Editor.create `Editor.create()`})
		 * finished its job,
		 * * `ready` - after the promise returned by the {@link module:core/editor/editor~Editor.create `Editor.create()`}
		 * method is resolved,
		 * * `destroyed` - once the {@link #destroy `editor.destroy()`} method was called.
		 *
		 * @observable
		 * @member {'initializing'|'ready'|'destroyed'} #state
		 */
		this.set( 'state', 'initializing' );
		this.once( 'ready', () => ( this.state = 'ready' ), { priority: 'high' } );
		this.once( 'destroy', () => ( this.state = 'destroyed' ), { priority: 'high' } );

		/**
		 * Defines whether this editor is in read-only mode.
		 *
		 * In read-only mode the editor {@link #commands commands} are disabled so it is not possible
		 * to modify the document by using them. Also, the editable element(s) become non-editable.
		 *
		 * In order to make the editor read-only, you can set this value directly:
		 *
		 *		editor.isReadOnly = true;
		 *
		 * @observable
		 * @member {Boolean} #isReadOnly
		 */
		this.set( 'isReadOnly', false );

		/**
		 * The editor's model.
		 *
		 * The central point of the editor's abstract data model.
		 *
		 * @readonly
		 * @member {module:engine/model/model~Model}
		 */
		this.model = new Model();

		/**
		 * The {@link module:engine/controller/datacontroller~DataController data controller}.
		 * Used e.g. for setting and retrieving editor data.
		 *
		 * @readonly
		 * @member {module:engine/controller/datacontroller~DataController}
		 */
		this.data = new DataController( this.model );

		/**
		 * The {@link module:engine/controller/editingcontroller~EditingController editing controller}.
		 * Controls user input and rendering the content for editing.
		 *
		 * @readonly
		 * @member {module:engine/controller/editingcontroller~EditingController}
		 */
		this.editing = new EditingController( this.model );
		this.editing.view.document.bind( 'isReadOnly' ).to( this );

		/**
		 * Conversion manager through which you can register model to view and view to model converters.
		 *
		 * See {@link module:engine/conversion/conversion~Conversion}'s documentation to learn how to add converters.
		 *
		 * @readonly
		 * @member {module:engine/conversion/conversion~Conversion}
		 */
		this.conversion = new Conversion();

		this.conversion.register( 'downcast', [ this.editing.downcastDispatcher, this.data.downcastDispatcher ] );
		this.conversion.register( 'editingDowncast', [ this.editing.downcastDispatcher ] );
		this.conversion.register( 'dataDowncast', [ this.data.downcastDispatcher ] );

		this.conversion.register( 'upcast', [ this.data.upcastDispatcher ] );

		/**
		 * Instance of the {@link module:core/editingkeystrokehandler~EditingKeystrokeHandler}.
		 *
		 * It allows setting simple keystrokes:
		 *
		 *		// Execute the bold command on Ctrl+E:
		 *		editor.keystrokes.set( 'Ctrl+E', 'bold' );
		 *
		 *		// Execute your own callback:
		 *		editor.keystrokes.set( 'Ctrl+E', ( data, cancel ) => {
		 *			console.log( data.keyCode );
		 *
		 *			// Prevent default (native) action and stop the underlying keydown event
		 *			// so no other editor feature will interfere.
		 *			cancel();
		 *		} );
		 *
		 * Note: Certain, typing oriented keystrokes (like <kbd>Backspace</kbd> or <kbd>Enter</kbd>) are handled
		 * by low level mechanism and trying to listen to them via the keystroke handler will not work reliably.
		 * To handle those specific keystrokes see the events fired by the
		 * {@link module:engine/view/document~Document editing view document} (`editor.editing.view.document`).
		 *
		 * @readonly
		 * @member {module:core/editingkeystrokehandler~EditingKeystrokeHandler}
		 */
		this.keystrokes = new EditingKeystrokeHandler( this );
		this.keystrokes.listenTo( this.editing.view.document );
	}

	/**
	 * Loads and initializes plugins specified in the config.
	 *
	 * @returns {Promise} A promise which resolves once the initialization is completed.
	 */
	initPlugins() {
		const that = this;
		const config = this.config;

		return loadPlugins()
			.then( loadedPlugins => {
				return initPlugins( loadedPlugins, 'init' )
					.then( () => initPlugins( loadedPlugins, 'afterInit' ) );
			} )
			.then( () => this.fire( 'pluginsReady' ) );

		function loadPlugins() {
			const plugins = config.get( 'plugins' ) || [];
			const removePlugins = config.get( 'removePlugins' ) || [];
			const extraPlugins = config.get( 'extraPlugins' ) || [];

			return that.plugins.load( plugins.concat( extraPlugins ), removePlugins );
		}

		function initPlugins( loadedPlugins, method ) {
			return loadedPlugins.reduce( ( promise, plugin ) => {
				if ( !plugin[ method ] ) {
					return promise;
				}

				return promise.then( plugin[ method ].bind( plugin ) );
			}, Promise.resolve() );
		}
	}

	/**
	 * Destroys the editor instance, releasing all resources used by it.
	 *
	 * **Note** The editor cannot be destroyed during the initialization phase so if it is called
	 * while the editor {@link #state is being initialized}, it will wait for the editor initialization before destroying it.
	 *
	 * @fires destroy
	 * @returns {Promise} A promise that resolves once the editor instance is fully destroyed.
	 */
	destroy() {
		let readyPromise = Promise.resolve();

		if ( this.state == 'initializing' ) {
			readyPromise = new Promise( resolve => this.once( 'ready', resolve ) );
		}

		return readyPromise
			.then( () => {
				this.fire( 'destroy' );
				this.stopListening();
				this.commands.destroy();
			} )
			.then( () => this.plugins.destroy() )
			.then( () => {
				this.model.destroy();
				this.data.destroy();
				this.editing.destroy();
				this.keystrokes.destroy();
			} );
	}

	/**
	 * Executes specified command with given parameters.
	 *
	 * Shorthand for:
	 *
	 *		editor.commands.get( commandName ).execute( ... );
	 *
	 * @param {String} commandName Name of command to execute.
	 * @param {*} [...commandParams] Command parameters.
	 */
	execute( ...args ) {
		this.commands.execute( ...args );
	}

	/**
	 * Creates and initializes a new editor instance.
	 *
	 * @param {Object} config The editor config. You can find the list of config options in
	 * {@link module:core/editor/editorconfig~EditorConfig}.
	 * @returns {Promise} Promise resolved once editor is ready.
	 * @returns {module:core/editor/editor~Editor} return.editor The editor instance.
	 */
	static create( config ) {
		return new Promise( resolve => {
			const editor = new this( config );

			resolve(
				editor.initPlugins()
					.then( () => {
						editor.fire( 'dataReady' );
						editor.fire( 'ready' );
					} )
					.then( () => editor )
			);
		} );
	}
}

mix( Editor, ObservableMixin );

/**
 * Fired after {@link #initPlugins plugins are initialized}.
 *
 * @event pluginsReady
 */

/**
 * Fired when the data loaded to the editor is ready. If a specific editor doesn't load
 * any data initially, this event will be fired right before {@link #event:ready}.
 *
 * @event dataReady
 */

/**
 * Fired when {@link #event:pluginsReady plugins}, and {@link #event:dataReady data} and all additional
 * editor components are ready.
 *
 * Note: This event is most useful for plugin developers. When integrating the editor with your website or
 * application you do not have to listen to `editor#ready` because when the promise returned by the static
 * {@link module:core/editor/editor~Editor.create `Editor.create()`} event is resolved, the editor is already ready.
 * In fact, since the first moment when the editor instance is available to you is inside `then()`'s callback,
 * you cannot even add a listener to the `editor#ready` event.
 *
 * See also the {@link #state `editor.state`} property.
 *
 * @event ready
 */

/**
 * Fired when this editor instance is destroyed. The editor at this point is not usable and this event should be used to
 * perform the clean-up in any plugin.
 *
 *
 * See also the {@link #state `editor.state`} property.
 *
 * @event destroy
 */

/**
 * An array of plugins built into this editor class.
 * It is used in CKEditor 5 builds to provide a list of plugins which are later automatically initialized
 * during the editor initialization.
 *
 * They will be automatically initialized by the editor, unless listed in `config.removePlugins` and
 * unless `config.plugins` is passed.
 *
 *		// Build some plugins into the editor class first.
 *		ClassicEditor.builtinPlugins = [ FooPlugin, BarPlugin ];
 *
 *		// Normally, you need to define config.plugins, but since ClassicEditor.builtinPlugins was
 *		// defined, now you can call create() without any configuration.
 *		ClassicEditor
 *			.create( sourceElement )
 *			.then( editor => {
 *				editor.plugins.get( FooPlugin ); // -> instance of the Foo plugin
 *				editor.plugins.get( BarPlugin ); // -> instance of the Bar plugin
 *			} );
 *
 *		ClassicEditor
 *			.create( sourceElement, {
 *				// Don't initialize this plugins (note: it's defined by a string):
 *				removePlugins: [ 'Foo' ]
 *			} )
 *			.then( editor => {
 *				editor.plugins.get( FooPlugin ); // -> undefined
 *				editor.config.get( BarPlugin ); // -> instance of the Bar plugin
 *			} );
 *
 *		ClassicEditor
 *			.create( sourceElement, {
 *				// Load only this plugin. Can also be define by a string if
 *				// this plugin was built into the editor class.
 *				plugins: [ FooPlugin ]
 *			} )
 *			.then( editor => {
 *				editor.plugins.get( FooPlugin ); // -> instance of the Foo plugin
 *				editor.config.get( BarPlugin ); // -> undefined
 *			} );
 *
 * See also {@link module:core/editor/editor~Editor.defaultConfig}.
 *
 * @static
 * @member {Array.<Function>} module:core/editor/editor~Editor.builtinPlugins
 */

/**
 * The default config which is built into the editor class.
 * It is used in CKEditor 5 builds to provide the default config options which are later used during editor initialization.
 *
 *		ClassicEditor.defaultConfig = {
 *			foo: 1,
 *			bar: 2
 *		};
 *
 *		ClassicEditor
 *			.create( sourceElement )
 *			.then( editor => {
 *				editor.config.get( 'foo' ); // -> 1
 *				editor.config.get( 'bar' ); // -> 2
 *			} );
 *
 *		// The default options can be overridden by the config passed to create().
 *		ClassicEditor
 *			.create( sourceElement, { bar: 3 } )
 *			.then( editor => {
 *				editor.config.get( 'foo' ); // -> 1
 *				editor.config.get( 'bar' ); // -> 3
 *			} );
 *
 * See also {@link module:core/editor/editor~Editor.builtinPlugins}.
 *
 * @static
 * @member {Object} module:core/editor/editor~Editor.defaultConfig
 */
