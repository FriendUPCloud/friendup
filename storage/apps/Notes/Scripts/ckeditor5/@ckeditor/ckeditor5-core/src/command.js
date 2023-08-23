/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module core/command
 */

import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

/**
 * The base class for CKEditor commands.
 *
 * Commands are the main way to manipulate editor contents and state. They are mostly used by UI elements (or by other
 * commands) to make changes in the model. Commands are available in every part of code that has access to
 * the {@link module:core/editor/editor~Editor editor} instance.
 *
 * Instances of registered commands can be retrieved from {@link module:core/editor/editor~Editor#commands `editor.commands`}.
 * The easiest way to execute a command is through {@link module:core/editor/editor~Editor#execute `editor.execute()`}.
 *
 * By default commands are disabled when the editor is in {@link module:core/editor/editor~Editor#isReadOnly read-only} mode.
 *
 * @mixes module:utils/observablemixin~ObservableMixin
 */
export default class Command {
	/**
	 * Creates a new `Command` instance.
	 *
	 * @param {module:core/editor/editor~Editor} editor Editor on which this command will be used.
	 */
	constructor( editor ) {
		/**
		 * The editor on which this command will be used.
		 *
		 * @readonly
		 * @member {module:core/editor/editor~Editor}
		 */
		this.editor = editor;

		/**
		 * The value of the command. A concrete command class should define what it represents for it.
		 *
		 * For example, the `'bold'` command's value indicates whether the selection starts in a bolded text.
		 * And the value of the `'link'` command may be an object with links details.
		 *
		 * It is possible for a command to have no value (e.g. for stateless actions such as `'imageUpload'`).
		 *
		 * A concrete command class should control this value by overriding the {@link #refresh `refresh()`} method.
		 *
		 * @observable
		 * @readonly
		 * @member #value
		 */
		this.set( 'value', undefined );

		/**
		 * Flag indicating whether a command is enabled or disabled.
		 * A disabled command will do nothing when executed.
		 *
		 * A concrete command class should control this value by overriding the {@link #refresh `refresh()`} method.
		 *
		 * It is possible to disable a command from "outside". For instance, in your integration you may want to disable
		 * a certain set of commands for the time being. To do that, you can use the fact that `isEnabled` is observable
		 * and it fires the `set:isEnabled` event every time anyone tries to modify its value:
		 *
		 *		function disableCommand( cmd ) {
		 *			cmd.on( 'set:isEnabled', forceDisable, { priority: 'highest' } );
		 *
		 *			cmd.isEnabled = false;
		 *
		 *			// Make it possible to enable the command again.
		 *			return () => {
		 *				cmd.off( 'set:isEnabled', forceDisable );
		 *				cmd.refresh();
		 *			};
		 *
		 *			function forceDisable( evt ) {
		 *				evt.return = false;
		 *				evt.stop();
		 *			}
		 *		}
		 *
		 *		// Usage:
		 *
		 *		// Disabling the command.
		 *		const enableBold = disableCommand( editor.commands.get( 'bold' ) );
		 *
		 *		// Enabling the command again.
		 *		enableBold();
		 *
		 * @observable
		 * @readonly
		 * @member {Boolean} #isEnabled
		 */
		this.set( 'isEnabled', false );

		this.decorate( 'execute' );

		// By default every command is refreshed when changes are applied to the model.
		this.listenTo( this.editor.model.document, 'change', () => {
			this.refresh();
		} );

		this.on( 'execute', evt => {
			if ( !this.isEnabled ) {
				evt.stop();
			}
		}, { priority: 'high' } );

		// By default commands are disabled when the editor is in read-only mode.
		this.listenTo( editor, 'change:isReadOnly', ( evt, name, value ) => {
			if ( value ) {
				this.on( 'set:isEnabled', forceDisable, { priority: 'highest' } );
				this.isEnabled = false;
			} else {
				this.off( 'set:isEnabled', forceDisable );
				this.refresh();
			}
		} );
	}

	/**
	 * Refreshes the command. The command should update its {@link #isEnabled} and {@link #value} properties
	 * in this method.
	 *
	 * This method is automatically called when
	 * {@link module:engine/model/document~Document#event:change any changes are applied to the document}.
	 */
	refresh() {
		this.isEnabled = true;
	}

	/**
	 * Executes the command.
	 *
	 * A command may accept parameters. They will be passed from {@link module:core/editor/editor~Editor#execute `editor.execute()`}
	 * to the command.
	 *
	 * The `execute()` method will automatically abort when the command is disabled ({@link #isEnabled} is `false`).
	 * This behavior is implemented by a high priority listener to the {@link #event:execute} event.
	 *
	 * In order to see how to disable a command from "outside" see the {@link #isEnabled} documentation.
	 *
	 * @fires execute
	 */
	execute() {}

	/**
	 * Destroys the command.
	 */
	destroy() {
		this.stopListening();
	}

	/**
	 * Event fired by the {@link #execute} method. The command action is a listener to this event so it's
	 * possible to change/cancel the behavior of the command by listening to this event.
	 *
	 * See {@link module:utils/observablemixin~ObservableMixin.decorate} for more information and samples.
	 *
	 * **Note:** This event is fired even if command is disabled. However, it is automatically blocked
	 * by a high priority listener in order to prevent command execution.
	 *
	 * @event execute
	 */
}

mix( Command, ObservableMixin );

// Helper function that forces command to be disabled.
function forceDisable( evt ) {
	evt.return = false;
	evt.stop();
}
