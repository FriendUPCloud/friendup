/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Shell class for handling a DOS session */

function SayWithText( text )
{
	Say( text, false, 'both' );
}

// Generating string
function PadList( str, len, dir, chr, ellipsis )
{
	if( !str ){ str = ''; }
	if( !dir ){ dir = 'left'; }
	if( !chr ){ chr = '&nbsp;'; }
	if( typeof( ellipsis ) == 'undefined' ){ ellipsis = true; }
	var slen = str.length;

	// If we're using ellipsis
	if( ellipsis )
	{
		if( slen > len - 3 )
		{
			slen = len;
			str = str.substr( 0, len - 3 ) + '...';
		}
	}

	var stro = str;
	var a;
	
	// Left padded
	if( dir == 'left' )
	{
		for( a = slen; a < len; a++ )
		{
			stro += chr;
		}
	}
	// Right padded
	else if( dir == 'right' )
	{
		for( a = slen; a < len; a++ )
		{
			stro = chr + stro;
		}
	}
	return stro;
}

/*******************************************************************************
* Shell object - this is the Friend DOS layer in Workspace!                    *
*                                                                              *
* Callback function argument format:                                           *
* returncode (true or false),                                                  *
* {                                                                            *
*    response: "This is to be shown in the terminal.",                         *
*    path: "Home:NewPath/",  <- update client prompt                           *
*    input: 'off' or 'on',   <- turn on or off user input                      *
*    done: true or false     <- to tell the client that we're done processing  *
* }                                                                            *
*                                                                              *
*******************************************************************************/

window.Shell = function( appObject )
{
	var shell = this;
	
	this.applicationId = false;
	this.authId = false;
	this.sessionId = false;
	this.input = true;
	this.events = [];
	this.currentPath = 'System:';
	this.previousPath = 'System:';
	this.pathLog = [ 'System:' ];
	this.pathLogPosition = 0;
	this.variables = [];
	this.state = { entry: -1 }; // Engine state
	this.mindMode = false; // Use A.I.
	this.pipe = false; // Target pipe!

	this.mind = FriendMind.makeSession( appObject );

	var aa = 0;

	// This is used by object that are living in the Workspace domain
	if( appObject.sessionId )
	{
		this.sessionId = appObject.sessionId;
	}
	// Application domain
	else
	{
		this.applicationId = appObject.applicationId;
		this.authId = appObject.authId;
		// Find app object
		var tsk = ge( 'Tasks' );
		for( aa = 0; aa < tsk.childNodes.length; aa++ )
		{
			var ttt = tsk.childNodes[aa];
			if( ttt.ifr && ttt.ifr.applicationId == this.applicationId )
			{
				this.app = ttt.ifr;
				break;
			}
		}
	}
	
	this.uniqueId = false;
	while( !this.uniqueId || typeof( FriendDOS.sessions[this.uniqueId] ) != 'undefined' )
	{
		this.uniqueId = '';
		for( aa = 0; aa < 4; aa++ )
			this.uniqueId += Math.random() * 9999;
	}

	// Check if we're trying to access a dormant drive
	this.checkDormantDoors = function( path, callback )
	{
		if( !path ) path = this.currentPath;
		if( !path )
		{
			return callback( false );
		}
		if( path.indexOf( ':' ) <= 0 )
		{
			var l = this.currentPath.substr( this.currentPath.length - 1 );
			if( l == ':' )
				path = this.currentPath + path;
			else if( l != '/' )
				path = this.currentPath + '/' + path;
		}
		if( path.indexOf( ':' ) <= 0 ) path = this.currentPath;

		var p = path.split( ':' )[0] + ':';
		if( typeof( DormantMaster ) != 'undefined' )
		{
			function handleDirs( dirs )
			{
				if( callback ) callback( dirs );
			}
		
			var doors = DormantMaster.getDoors();
			
			if( doors )
			{
				for( var a in doors )
				{
					if( doors[a].Title.toLowerCase() == p.toLowerCase() )
					{
						doors[a].Dormant.getDirectory( path, handleDirs );
						return;
					}
				}
			}
			if( callback )
			{
				return callback( false );
			}
		}
		if( callback )
		{
			return callback( false );
		}
		return;
	};

	// Check if a file exists
	this.fileExists = function( fileWithPath, callback )
	{
		var path = '';
		var dirmode = false;

		// Aha a directory!
		if( fileWithPath.substr( fileWithPath.length - 1, 1 ) == '/' )
		{
			fileWithPath = fileWithPath.substr( 0, fileWithPath.length - 1 );
			dirmode = true;
		}

		if( fileWithPath.indexOf( '/' ) > 0 )
		{
			path = fileWithPath.split( '/' );
			path.pop();
			path = path.join( '/' ) + '/';
		}
		else path = fileWithPath.split( ':' )[0] + ':';

		this.getDirectory( path, function( info, data )
		{
			if( dirmode ) fileWithPath += '/';
			if( info && data.length )
			{
				for( var a = 0; a < data.length; a++ )
				{
					// File exists!
					if( data[a].Path == fileWithPath )
					{
						return callback( true, data[a] );
					}
				}
			}
			callback( false, false );
		} );
	};

	// Gets a directory based on path and returns directory items and info
	this.getDirectory = function( path, callback, flags )
	{
		// Check dormant first!
		this.checkDormantDoors( path, function( dirs )
		{
			var fname = path.split( ':' )[1];
			if( fname && fname.indexOf( '/' ) > 0 ){ fname = fname.split( '/' ); fname = fname[fname.length-1]; }

			// If we end up here, we're not using dormant - which is OK! :)
			if( !dirs || ( !dirs && !dirs.length ) )
			{
				// Use standard doors
				var door = ( new Door() ).get( path );
				door.getIcons( false, function( data )
				{
					var info = false;
					if( data.length )
					{
						info = {
							Type: path.substr( path.length - 1, 1 ) == ':' ? 'Volume' : 'Directory',
							Filename: fname && fname.length ? fname : path,
							Path: path
						};
					}
					if( callback ) callback( info, data );
				}, flags );
			}
			else if( callback )
			{
				// We need this as an array!
				if( dirs && typeof( dirs ) == 'object' )
				{
					var o = [];
					for( var a in dirs ) o.push( dirs[a] );
					dirs = o;
				}

				callback( {
					Type: path.substr( path.length - 1, 1 ) == ':' ? 'Volume' : 'Directory',
					Filename: fname && fname.length ? fname : path,
					Path: path
				}, dirs );
			}
		}, flags );
	};

	this.mountDevice = function( devname )
	{
		var l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
			}
		};
		l.execute( 'device/mount', { devname: devname, sessionid: Workspace.sessionid } );
	};

	this.unmountDevice = function( dev )
	{
		var l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
			}
		};
		l.execute( 'device/unmount', { devname: devname, sessionid: Workspace.sessionid } );
	};

	// Adds an event
	this.addEvent = function( eventName, persistent, callback )
	{
		var allowedEvents = [
			'mount', 'unmount', 'openscreen', 'closescreen',
			'openview', 'closeview' /* More to come... */
		];
		for( var a = 0; a < allowedEvents; a++ )
		{
			if( eventName == allowedEvents[a] )
			{
				this.events.push( [ eventName, persistent, callback ] );
				return true;
			}
		}
		return false;
	};

	// This one is triggered on system events
	this.runEvents = function( eventName )
	{
		// Queue while running other events
		if( this.eventsRunning )
		{
			var t = this;
			return setTimeout( function(){ t.runEvents( eventName ); }, 50 );
		}
		// Run event queue and clear the event out
		this.eventsRunning = true;
		var nlist = [];
		for( var a = 0; a < this.events.length; a++ )
		{
			if( this.events[a][0] == eventName )
			{
				this.events[a][2]();
				// Persistent events stay..
				if( this.events[a][1] )
					nlist.push( this.events[a] );
			}
			else nlist.push( this.events[a] );
		}
		this.events = nlist;
		this.eventsRunning = false;
	};

	// Clear events (by name optionally)
	this.clearEvents = function( eventName )
	{
		if( !eventName ) this.events = [];
		else
		{
			var nlist = [];
			for( var a = 0; a < this.events.length; a++ )
			{
				if( this.events[a][0] != eventName )
					nlist.push( this.events[a] );
			}
			this.events = nlist;
		}
	};

	// Parse a whole script
	this.parseScript = function( script, callback )
	{
		script = script.split( "\n" );
		this.queueCommand( script, 0, [], callback );
	};

	// queue and culminate output!
	this.queueCommand = function( array, index, buffer, callback )
	{
		var t = this;
		this.execute( array[index++], function( result, data )
		{
			if( result )
			{
				buffer += typeof( result ) == 'object' ? result.response : result;
			}
			if( index > array.length )
			{
				callback( true, buffer );
			}
			else
			{
				t.queueCommand( array, index, buffer, callback );
			}
		} );
	};

	// Preparse script to support voice commands!
	this.context = false;
	this.exeIcon = false;
	this.voiceParse = function( string, callback )
	{
		// Make sure we pop out the interface each time
		if( !( 'webkitSpeechRecognition' in window ) )
		{
			if( Workspace.handsFree )
            {
                var inp = ge( 'Handsfree' ).getElementsByTagName( 'input' )[0];
                inp.blur();
                document.body.removeChild( ge( 'Handsfree' ) );
                Workspace.handsFree = false;
                // TODO: Don't set the color - it's up to the theme.
                //       This is a workaround for Samsung Internet for Gear VR
                ge( 'Tray' ).getElementsByTagName( 'div' )[0].style.color = 'white';
            }
		}

		// Sanitize
		string = Trim( string.toLowerCase() );
		var args = string.split( ' ' );
		var fin_args = '';
		var a = 0;
		for( a = 1; a < args.length; a++ )
		{
			if( a != 1 )
				fin_args += ' ';
			fin_args += args[a];
		}

		// Check context!
		if( this.context == 'executable' )
		{
			if( !this.exeIcon || ( this.exeIcon && !this.exeIcon.domNode ) )
			{
				SayWithText( 'I lost the executable. Reverting to standard mode.' );
				this.context = false;
				this.exeIcon = false;
				return false;
			}
			if( args[0] == 'run' )
			{
				SayWithText( 'Running executable.' );
				this.exeIcon.domNode.ondblclick();
				return true;
			}
			else if( args[0] == 'help' )
			{
				SayWithText( 'Can not find help information regarding this executable. Reverting to standard mode.' );
				this.context = false;
				this.exeIcon = false;
				return false;
			}
			else if( args.length )
			{
				if( args[0] == 'stop' )
				{
					this.context = false;
					this.exeIcon = false;
					SayWithText( 'Reverting to standard mode.' );
					return false;
				}
				var t = this.exeIcon.Title ? this.exeIcon.Title : this.exeIcon.Filename;
				if( this.exeIcon.Type.toLowerCase() == 'dormantfunction' )
				{
					apiWrapper( { data: JSON.stringify( {
						type: 'dormantmaster',
						method: 'execute',
						executable: this.exeIcon.Path + t,
						dormantCommand: this.exeIcon.Path + t,
						dormantArgs: args
					} ) }, 'force' );
				}
				else
				{
					ExecuteApplication( this.exeIcon.Path + t, args );
				}
				SayWithText( 'Executed. Say stop for standard mode.' );
				return true;
			}
			this.context = false;
			this.exeIcon = false;
			SayWithText( 'Could not understand what you wanted to do with the executable. Reverting to standard mode.' );
			return false;
		}

		// Some number magick!
		if( args.length >= 3 && ( args[2] == 'file' || args[2] == 'directory' || args[2] == 'volume' ) )
		{
			var type = args[2];
			switch( args[1] )
			{
				case 'first': args[2] = '1'; break;
				case 'second': args[2] = '2'; break;
				case 'third': args[2] = '3'; break;
				case 'fourth': args[2] = '4'; break;
				case 'fifth': args[2] = '5'; break;
				case 'sixth': args[2] = '6'; break;
				case 'seventh': args[2] = '7'; break;
				case 'eighth': args[2] = '8'; break;
				case 'ninth': args[2] = '9'; break;
				case 'tenth': args[2] = '10'; break;
				default:
					SayWithText( 'Your number is not recognized. Sorry, try another.' );
					return false;
			}
			args[1] = type;
		}

		fin_args = Trim( fin_args );
		switch( Trim( args[0] ) )
		{
			case 'open':
				// Try filesystems
				if( args[1] == 'volume' && typeof( args[2] != 'undefined' ) )
				{
					// Same sorting as doors desktop
					var index = parseInt( args[2] ) - 1;
				   var icons = sortArray( Workspace.icons, [ 'Title', 'Filename' ] );
				   if( parseInt( args[2] ) > 0 )
				   {
					   if( parseInt( args[2] ) > icons.length )
					   {
						   SayWithText( 'Excuse me. Can you repeat that?' );
						   return;
					   }
					   SayWithText( 'You opened volume ' + icons[index].Volume.split(':')[0] );
					   return OpenWindowByFileinfo( icons[index] );
				   }
				   var tries = [ args[2].toLowerCase() ];
				   if( typeof( args[3] ) != 'undefined' )
				   {
					   tries.push(
						   args[2].toLowerCase() + args[3].toLowerCase()
					   );
				   }
				   for( var b = 0; b < tries.length; b++ )
				   {
					   // Two tries
					   for( a = 0; a < icons.length; a++ )
					   {
						   if( icons[a].Volume.toLowerCase().split( ':' )[0] == tries[b] )
						   {
							   SayWithText( 'You opened volume ' + icons[a].Volume.split( ':' )[0] );
							   return OpenWindowByFileinfo( icons[a] );
						   }
					   }
				   }
				   SayWithText( 'Excuse me. Can you repeat that?' );
				   return;
				}
				else if( args[1] == 'directory' )
				{
					if( this.directoryOpen( window.currentMovable, args[2] ) )
					{
						return true;
					}
					SayWithText( 'I can not find the directory you are looking for. Are you sure ' + args[2] + ' is found in the active view?' );
					return;
				}
				else if( args[1] == 'file' )
				{
					if( this.fileOpen( window.currentMovable, args[2] ) )
					{
						return true;
					}
					SayWithText( 'I can not find the file you are looking for. Are you sure ' + args[2] + ' is found in the active view?' );
					return;
				}
				break;
			case 'run':
				if( fin_args == 'programming application' )
				{
					ExecuteApplication( 'Artisan' );
					SayWithText( 'You opened the programming application, Artisan.' );
					return;
				}
				else if( fin_args == 'chat application' )
				{
					ExecuteApplication( 'Hello' );
					SayWithText( 'You open the chat application, Hello.' );
					return;
				}
				else if( fin_args == 'terminal application' )
				{
					ExecuteApplication( 'Shell' );
					SayWithText( 'You open the terminal, application.' );
					return;
				}
				else if( fin_args == 'document application' )
				{
					ExecuteApplication( 'Author' );
					SayWithText( 'You opened the document application, Author.' );
					return;
				}
				break;
			case 'screen':
				// TODO: Don't accept more fin_args
				if( args[1] == 'close' )
				{
					window.currentScreen.screen.close();
					SayWithText( 'Screen closed.' );
					return true;
				}
				else if( args[1] == 'cycle' || args[1] == 'swap' )
				{
					window.currentScreen.screen.screenCycle();
					SayWithText( 'Screens swapped.' );
					return true;
				}
				break;
			case 'switch':
				if( args.length <= 1 )
				{
					SayWithText( 'I do not understand what you want to switch.' );
					return false;
				}
				if( args[1] == 'windows' || args[1] == 'window' )
				{
					return this.voiceParse( 'window cycle', callback );
				}
				break;
			case 'move':
				var nl;
				if( !window.currentMovable )
				{
					SayWithText( 'I have no window or desklet to move.' );
					return false;
				}
				if( args[1] == 'left' )
				{
					nl = window.currentMovable.offsetLeft - 100;
					ConstrainWindow( window.currentMovable, nl );
					SayWithText( 'Window moved left.' );
					return false;
				}
				else if( args[1] == 'right' )
				{
					nl = window.currentMovable.offsetLeft + 100;
					ConstrainWindow( window.currentMovable, nl );
					SayWithText( 'Window moved right.' );
					return false;
				}
				else if( args[1] == 'up' )
				{
					nl = window.currentMovable.offsetTop - 100;
					ConstrainWindow( window.currentMovable, false, nl );
					SayWithText( 'Window moved up.' );
					return false;
				}
				else if( args[1] == 'down' )
				{
					nl = window.currentMovable.offsetTop + 100;
					ConstrainWindow( window.currentMovable, false, nl );
					SayWithText( 'Window moved down.' );
					return false;
				}
				SayWithText( 'How do I move?' );
				return false;
			case 'scroll':
				if( !window.currentMovable && !window.currentMovable.content )
				{
					SayWithText( 'I have no window to scroll.' );
					return false;
				}
				else if( args[1] == 'up' )
				{
					window.currentMovable.content.firstChild.scrollTop -= 100;
					SayWithText( 'Window scrolled up.' );
					return false;
				}
				else if( args[1] == 'down' )
				{
					window.currentMovable.content.firstChild.scrollTop += 100;
					SayWithText( 'Window scrolled down.' );
					return false;
				}
				SayWithText( 'How do I scroll?' );
				return false;
			case 'window':
				// TODO: Don't accept more fin_args
				if( args[1] == 'close' )
				{
					CloseWindow( window.currentMovable );
					SayWithText( 'Window closed.' );
					return true;
				}
				else if( args[1] == 'cycle' || args[1] == 'swap' )
				{
					var ind = [];
					for( a in movableWindows )
					{
						ind.push( movableWindows[a] );
					}
					for( a = 0; a < ind.length; a++ )
					{
						if( ind[a] == window.currentMovable || !window.currentMovable )
						{
							var b = ( a - 1 ); if( b < 0 ) b = ind.length - 1;
							_WindowToFront( ind[b] );
							_ActivateWindow( ind[b] );
							SayWithText( 'Windows swapped.' );
							return true;
						}
					}
					SayWithText( 'Could not find any windows.' );
					return false;
				}
				break;
			case 'quit':
			case 'close':
				 if( fin_args == 'programming application' )
				{
					KillApplication( 'Artisan' );
					SayWithText( 'You quit the programming application, Artisan.' );
					return;
				}
				else if( fin_args == 'chat application' )
				{
					KillApplication( 'Hello' );
					SayWithText( 'You quit the chat application, Hello.' );
					return;
				}
				else if( fin_args == 'terminal application' )
				{
					KillApplication( 'Shell' );
					SayWithText( 'You quit the termina application.' );
					return;
				}
				else if( fin_args == 'document application' )
				{
					KillApplication( 'Author' );
					SayWithText( 'You quit the document application, Author.' );
					return;
				}
				else if( fin_args == 'windows' )
				{
					CloseAllWindows();
					SayWithText( 'All the windows have been closed.' );
					return;
				}
				// Only said close..
				else if( ( args.length == 1 || args.length == 2 && args[1] == 'window' ) && window.currentMovable )
				{
					SayWithText( 'Closed window, ' + window.currentMovable.titleString );
					CloseWindow( window.currentMovable );
					return;
				}
				break;
		}
		SayWithText( 'Excuse me. Can you repeat that?' );
	};

	this.parseVariables = function( pr )
	{
		for( var a in this.variables )
		{
			if( !a.length ) continue;
			pr = pr.split( "$" + a ).join( this.variables[a] );
		}
		return pr;
	};

	// Evaluate until done! (for scripts etc)
	this.evaluate = function( input, callback, clientKey, restrictedPath )
	{
		if ( clientKey == 'Workspace' )
			this.workspace = true;
		else
			this.clientKey = clientKey;
		this.restrictedPath = restrictedPath;
		this.evaluateInput( input, 0, callback );
	};

	// Evaluate an input command array
	this.evaluateInput = function( input, index, callback, mode )
	{
		var t = this;
		return setTimeout( function()
		{
			t.executeEvaluateInput( input, index, callback, mode );
		}, 0 );
	};
	
	this.executeEvaluateInput = function( input, index, callback, mode )
	{
		// What to do with the ouput?
		var t = this;
		var previousCallback = callback;
		callback = function( data, returnMessage )
		{
			if ( t.workspace )
			{
				//t.skipClient = false;
				previousCallback( data, returnMessage );
			}
			else
			{
				// If the current shell is a host of FriendNetwork client, send the response to him
				if ( t.clientKey && !t.skipClient )
				{
					FriendNetwork.send(
					{
						key: t.clientKey,
						data:{
							returnMessage: returnMessage,
							data:          data
						}
					}, function( msg )
					{
					});
				}
				else
				{
					// If not, just output to the current output stream
					t.skipClient = false;
					previousCallback( data, returnMessage );
				}
			}
		};
		
		if( this.executing )
		{
			if( this.break )
			{
				this.executing = false;
				this.break = false;
				callback( false, { done: true } );
				return false;
			}
		}

		// End of the line on arrays
		if( !input || index >= input.length )
		{
			// Handle repeat
			if( this.state.mode == 'repeat' )
			{
				// Check if we're on our way
				if( this.variables[this.state.variable] < this.state.times )
				{
					this.variables[this.state.variable]++;

					// Just repeat over and over..
					return this.evaluateInput( this.state.preroll, 0, callback, 'inside' );
				}
				// Ok, we hit our target! Delete state and continue past exit
				else
				{
					var state = this.state;
					this.state = this.state.prevState;
					return this.evaluateInput( state.prevInput, state.terminator + 1, callback, state.prevMode );
				}
			}
			// Go ahead with the next
			if( this.temporaryList )
			{
				var nextList = this.temporaryList.list;
				var nextIndex = this.temporaryList.index;
				this.temporaryList = null;
				return this.evaluateInput( nextList, nextIndex, callback, mode );
			}
			// Terminate with a newline (done=true) when we're outside the recursion
			// except if we've terminated this process with this.terminate
			if( !this.terminate && mode != 'inside' )
			{
				//console.log( 'We are not inside.' );
				callback( true, { done: true } );
			}
			this.terminate = false;
			this.executing = false;
			return;
		}
		if( !index ) index = 0;

		var cmd, rawLine;

		// elements
		if( input[index] )
		{
			rawLine = input[index];
			cmd = rawLine.split( /<[^>]*?>/i ).join( '' );
		}
		else
		{
			rawLine = ''; cmd = '';
		}

		// Shortcut to cd
		if( !mode && rawLine.indexOf( ' ' ) < 0 )
		{
			if( rawLine == '/' )
			{
				input[ index ] = 'cd ' + rawLine;
				return this.evaluateInput( input, index, callback, mode );
			}
			else if( rawLine == ':' )
			{
				input[ index ] = 'cd ' + rawLine;
				return this.evaluateInput( input, index, callback, mode );
			}
			else if( rawLine.substr( rawLine.length - 1, 1 ) == ':' )
			{
				input[ index ] = 'cd ' + rawLine;
				return this.evaluateInput( input, index, callback, mode );
			}
			else if( rawLine.substr( rawLine.length - 1, 1 ) == '/' )
			{
				var d = '';
				if( rawLine.indexOf( ':' ) < 0 )
					d = this.currentPath;
				input[ index ] = 'cd ' + d + rawLine;
				return this.evaluateInput( input, index, callback, mode );
			}
		}

		// Ignore identation
		cmd = Trim( cmd, 'left' );
		//console.log( " > CMD:" + cmd );

		// Ignore comments
		if( cmd.substr( 0, 2 ) == '//' ) return this.evaluateInput( input, index + 1, callback, mode );

		// Fix spaces
		cmd = cmd.split( '\\ ' ).join( '<!--space--!>' );
		cmd = this.parseVariables( cmd );
		cmd = cmd.split( ' ' );
		cmd[0] = cmd[0].toLowerCase();
		// Counters
		var a = 0, b = 0, c = 0, ba = 0;
		
		for( ; a < cmd.length; a++ )
		{
			// Fix these, because we use it for something else
			do
			{
				var c = cmd[a];
				var i = c.indexOf( ';' );
				if( i >= 0 && i < cmd[a].length )
				{
					cmd[a] = c.substr( 0, i ) + '<!--semicolon-->' + c.substr( i + 1, c.length - i );
				}
				else break;
			}
			while( 1 );
		}

		// Multiline fork
		if( cmd.indexOf( ';' ) > 0 )
		{
			cmd = cmd.split( ';' );
			var ar = [];
			var a = 0;
			for( ; a < cmd.length; a++ )
			{
				ar[a] = Trim( cmd[a], 'left' );
			}
			if( input.length && index + 1 < input.length )
			{
				var b = index + 1;
				for( ; b < input.length; b++ )
				{
					ar[a++] = input[b];
				}
			}
			return this.evaluateInput( ar, 0, callback, mode );
		}

		// Safety, correct currentpath
		if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != ':' )
		{
			if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != '/' )
				this.currentPath += '/';
		}

		// Test for some erroneous input
		if( cmd[0] == "\n" )
		{
			//			if( key == 13 )
			//				this.addNL();
			return this.evaluateInput( input, index + 1, callback, mode );
		}

		// Go do the real stuff ------------------------------------------------
		// This is where we handle Friend DOS scripting ------------------------
		
		// Condition block
		if( cmd[0] == 'if' )
		{
			// catch condition
			if( cmd.length > 1 )
			{
				// TODO: implement AND, OR etc
				// Find what we compare, and what we compare to
				var preroll = '';
				var operators = [ '=', '!=', '<', '>' ];
				var fin_args = [];
				var compi = 0;
				var argument = {
					operator: '',
					vars: []
				};

				// Case
				var out = [];
				var c = 0;
				for( a = 0; a < cmd.length; a++ )
				{
					if( cmd[a].substr( cmd[a].length - 1, 1 ) == ':' )
					{
						out.push( cmd[a].substr( 0, cmd[a].length - 1 ) );
						out.push( ':' );
						for( c = a + 1; c < cmd.length; c++ )
						{
							if( c > a + 1 ) preroll += ' ';
							preroll += cmd[c];
						}
					}
					else out.push( cmd[a] );
				}
				cmd = out;

				for( b = 1; b < cmd.length; b++ )
				{
					// End of the line
					if( cmd[b] == ':' )
					{
						if( argument.operator ) fin_args.push( argument );
						break;
					}

					if( cmd[b] == 'and' || cmd[b] == 'or' )
					{
						if( argument.operator ) fin_args.push( argument );
						fin_args.push( { operator: cmd[b] } );
						argument = { operator: '', vars: [] };
						continue;
					}

					// find operators
					var operatorFound = false;
					for( c = 0; c < operators.length; c++ )
					{
						if( cmd[b] == operators[c] )
						{
							argument.operator = cmd[b];
							operatorFound = true;
							break;
						}
					}
					if( operatorFound ) continue;

					// We only allow to compare two fin_args
					if( argument.vars.length < 2 )
						argument.vars.push( cmd[b] );
					else
					{
						fin_args.push( argument );
						argument = { operator: '', vars: [] };
					}
				}

				// Unadded - now added
				if( argument.operator )
					fin_args.push( argument );

				// Check if this fans out!
				for( a = 0; a < fin_args.length; a++ )
				{
					// Parse variables
					for( c = 0; c < fin_args[a].vars.length; c++ )
						if( fin_args[a].vars[c].substr( 0, 1 ) == '$' )
							fin_args[a].vars[c] = this.parseVariables( fin_args[a].vars[c] );

					switch( fin_args[a].operator )
					{
						case '=':
							if( fin_args[a].vars.length == 2 )
							{
								fin_args[a].result = fin_args[a].vars[0] == fin_args[a].vars[1];
							}
							break;
						case '!=':
							if( fin_args[a].vars.length == 2 )
								fin_args[a].result = fin_args[a].vars[0] != fin_args[a].vars[1];
							break;
						case '<':
							if( fin_args[a].vars.length == 2 )
								fin_args[a].result = parseFloat( fin_args[a].vars[0] ) < parseFloat( fin_args[a].vars[1] );
							break;
						case '>':
							if( fin_args[a].vars.length == 2 )
							{
								fin_args[a].result = parseFloat( fin_args[a].vars[0] ) > parseFloat( fin_args[a].vars[1] );
							}
							break;
					}
				}

				// Evaluate all fin_args
				var result  = true;
				var orFlag  = false;
				var oneTrue = false;
				for( a = 0; a < fin_args.length; a++ )
				{
					if( fin_args[a].operator == 'or' )
					{
						orFlag = true;
					}
					if( fin_args[a].result === false )
						result = false;
					else oneTrue = true;
				}

				// Sum it up!
				result = oneTrue && orFlag ? true : result;

				//console.log( 'Result from cmd: ' + cmd.join( ' ' ) + ' is ' + ( result ? 'true' : 'false' ) );

				if( preroll.length )
				{
					if( result )
					{
						this.temporaryList = { list: input, index: index + 1 };
						return this.evaluateInput( preroll, 0, callback, mode );
					}
				}
				// Ok we have what we need, now find out if we have a long list!
				else
				{
					// Find the terminator
					var terminator = false;
					var depth = 0;
					for( ba = index + 1; ba < input.length; ba++ )
					{
						var lineH = Trim( input[ba], 'left' );

						// TODO: Add all other loops that use stop!
						if(
							lineH.substr( 0, 6 ) == 'repeat' ||
							lineH.substr( 0, 2 ) == 'if' ||
							lineH.substr( 0, 2 ) == 'on'
						)
						{
							depth++;
						}
						if( lineH.substr( 0, 4 ) == 'stop' )
						{
							if( depth === 0 )
							{
								terminator = ba;
								break;
							}
							else depth--;
						}
					}
					if( !terminator && input.length - 1 > index + 1 )
					{
						terminator = index + 1;
					}

					// Ok, we have a terminator, rearrange with these items
					if( terminator )
					{
						if( result )
						{
							return this.evaluateInput( input, index + 1, callback, mode );
						}
						else
						{
							return this.evaluateInput( input, terminator + 1, callback, mode );
						}
					}
					// No terminator
					else
					{
						if( result )
						{
							return this.evaluateInput( input, index + 1, callback, mode );
						}
						else
						{
							return this.evaluateInput( input, index + 2, callback, mode );
						}
					}
				}
			}
			else
			{
				callback( false, {response: 'Syntax error.', done: true} );
				return false;
			}
			return this.evaluateInput( input, index + 1, callback, mode );
		}
		// Break
		else if( cmd[0] == 'abort' )
		{
			if (this.executing)
			{
				this.break = true;
				callback(false, { response: 'Break.'} );
				return false;
			}
			else
			{
				callback( true, { done: true } );
				return false;
			}
		}
		// Set a var
		else if( cmd[0] == 'set' )
		{
			// TODO: Support strings
			if( cmd.length < 2 || typeof( cmd[2] ) == 'undefined' )
			{
				t.lastErrorMessage = 'The set command needs both a variable name and a value.';
				return callback( false, { response: "Not enough fin_args.", done: true } );
			}

			var va = cmd[2];
			if( va.indexOf && va.indexOf( '<!--space--!>' ) )
				va = va.split( '<!--space--!>' ).join( ' ' );

			this.variables[cmd[1]] = isNaN( parseFloat( va ) ) ? va : parseFloat( va );
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'increase' )
		{
			// TODO: Support strings
			if( cmd.length < 2 )
			{
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]]++;
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'decrease' )
		{
			if( cmd.length < 2 )
			{
				callback( false );
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]]--;
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'add' )
		{
			if( cmd.length < 2 )
			{
				callback( false );
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]] += isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'subtract' )
		{
			if( cmd.length < 2 )
			{
				callback( false );
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]] -= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'multiply' )
		{
			if( cmd.length < 2 )
			{
				callback( false );
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]] *= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		else if( cmd[0] == 'divide' )
		{
			if( cmd.length < 2 )
			{
				callback( false );
				return this.evaluateInput( input, index+1, callback, mode );
			}
			this.variables[cmd[1]] /= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			callback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
			return this.evaluateInput( input, index+1, callback, mode );
		}
		// Repeat until
		else if( cmd[0] == 'repeat' )
		{
			var num = 0;
			if( cmd.length > 1 )
			{
				num = parseInt( cmd[1] );
				if( num > 0 )
				{
					// TODO: Catch variable!
					if( cmd.length > 2 && ( cmd[2] == 'times:' || cmd[2] == 'times' ) )
					{
						// If we have a colon here, the next part is a new command
						var colonFound = false;
						if( cmd[2] == 'times:' ) colonFound = 2;

						// Add preroll
						var preroll = [];

						var variable = '';
						if( colonFound === false )
						{
							for( c = 0; c < cmd.length; c++ )
							{
								// Variable next to colon
								if( cmd[c].indexOf( ':' ) > 0 && !colonFound )
								{
									variable = cmd[c].substr( 0, cmd[c].length - 1 );
									colonFound = c;
								}
								// Just variable
								if( !colonFound && c > 1 && !variable )
									variable = cmd[c];
								// Just colon
								if( cmd[c] == ':' && !colonFound )
									colonFound = c;
							}
						}

						var command = '';
						if( colonFound > 0 && cmd.length > colonFound )
						{
							for( c = colonFound + 1; c < cmd.length; c++ )
							{
								if( c > colonFound + 1 )
									command += ' ';
								command += cmd[c];
								if (cmd[c].length > 16 && cmd[c].substr(cmd[c].length - 16, 16) == '<!--semicolon-->')
								{
									preroll.push(command.substring(0, command.length - 16));
									command = '';
								}
							}
							if (command.length)
								preroll.push(command);
						}

						// Find the terminator 'stop'
						var terminator = index;
						var depth = 0;
						for( ba = index + 1; ba < input.length; ba++ )
						{
							var lineH = Trim( input[ba], 'left' );

							// TODO: Add all other loops that use stop!
							if(
								lineH.substr( 0, 6 ) == 'repeat' ||
								lineH.substr( 0, 2 ) == 'if' ||
								lineH.substr( 0, 2 ) == 'on'
							)
							{
								depth++;
							}
							if( lineH.substr( 0, 4 ) == 'stop' )
							{
								if( depth === 0 )
								{
									terminator = ba;
									break;
								}
								else depth--;
							}
						}

						if (terminator > index)
						{
							for (var a = index + 1; a < terminator; a++)
								preroll.push(input[a]);
						}

						// Reset variable!
						this.variables[ variable ] = 0;

						// Set the state of the engine
						this.state = {
							mode: 'repeat',
							terminator: terminator,
							times: num - 1,
							variable: variable,
							preroll: preroll,
							prevState: this.state, // Reparent!
							prevInput: input,
							prevMode: mode
						};

						// Reevaluate!
						return this.evaluateInput( preroll, 0, callback, 'inside' );
					}
				}
			}
		}
		else if( cmd[0] == 'stop' )
		{
			// Just continue
			return this.evaluateInput( input, index + 1, callback, mode );
		}
		// An event trigger (on Artisan KeyDown x: echo "$x was the key"; done)
		else if( cmd[0] == 'on' )
		{
			var app = '';
			var trigger = '';
			if( cmd.length > 1 )
			{
				app = cmd[1];
				if( app )
				{
					// TODO: Catch variable!
					if( cmd.length > 2 )
					{
						// If we have a colon here, the next part is a new command
						var colonFound = false;
						if( cmd[2].substr( cmd[2].length-1, 1 ) == ':' ) colonFound = 2;
						if( colonFound == 2 )
							trigger = cmd[2].substr( 0, cmd[2].length - 1 );
						else trigger = cmd[2];

						// Add preroll
						var preroll = '';
						var variable = '';
						if( colonFound === false )
						{
							for( c = 0; c < cmd.length; c++ )
							{
								// Variable next to colon
								if( cmd[c].indexOf( ':' ) > 0 && !colonFound )
								{
									variable = cmd[c].substr( 0, cmd[c].length - 1 );
									colonFound = c;
								}
								// Just variable
								if( !colonFound && c > 1 && !variable )
									variable = cmd[c];
								// Just colon
								if( cmd[c] == ':' && !colonFound )
									colonFound = c;
							}
						}

						if( colonFound > 0 && cmd.length > colonFound )
						{
							for( c = colonFound+1; c < cmd.length; c++ )
							{
								if( c > colonFound+1 )
									preroll += ' ';
								preroll += cmd[c];
							}
						}

						// Hmm. No more commands?
						if( input.length <= index && !preroll.length )
						{
							callback(true, { response: "newline", done: true } );
							return false;
						}
						// Ok we have what we need, now find out if we have a long list!
						// NOTICE: In a repeat loop, the optional variable for the loop is pre parsed
						else
						{
							// Find the terminator
							var terminator = false;
							var depth = 0;
							for( ba = index + 1; ba < input.length; ba++ )
							{
								var lineH = Trim( input[ba], 'left' );

								// TODO: Add all other loops that use stop!
								if(
									lineH.substr( 0, 6 ) == 'repeat' ||
									lineH.substr( 0, 2 ) == 'if' ||
									lineH.substr( 0, 2 ) == 'on'
								)
								{
									depth++;
								}
								if( lineH.substr( 0, 4 ) == 'stop' )
								{
									if( depth === 0 )
									{
										terminator = ba;
										break;
									}
									else depth--;
								}
							}
							if( !terminator && input.length - 1 > index + 1 )
							{
								terminator = index + 1;
							}

							// Ok, we have a terminator, add list to callbacks
							if( terminator )
							{
								var newList = [];

								for( var n = index + 1; n <= terminator; n++ )
								{
									if( preroll )
									{
										var pr = Trim( preroll, 'left' );

										// Skip the stop
										if( pr == 'stop' ) continue;
										if( pr == '' ) continue;

										pr = this.parseVariables( pr );
										newList.push( Trim( pr, 'left' ) );
									}

									// Skip a stop
									var pr = Trim( input[n], 'left' );
									if( pr == 'stop' ) continue;
									if( pr == '' ) continue;

									var pr = this.parseVariables( pr );
									newList.push( pr );
								}

								// Add script that will run on event
								if( app && trigger )
									addOnEventTrigger( app, trigger, variable, newList );
								// t.addNL();
								// Go ahead with the list after terminator
								return this.evaluateInput( input, terminator + 2 , callback, mode );
							}
							// No terminator
							else
							{
								// New list
								var newList = [];
								var pr = preroll;
								pr = this.parseVariables( pr );
								newList.push( pr );

								// Add script that will run on event
								if( app && trigger )
									addOnEventTrigger( app, trigger, variable, newList );

								// Go ahead with the list after terminator
								// t.addNL()
								return this.evaluateInput( input, index + 1, callback, mode );
							}
						}
					}
				}
				// t.addNL()
				return this.evaluateInput( input, index + 1, callback, mode );
			}
			else
			{
				callback( false, { response: 'Syntax error.', done: true} );
				return false;
			}
		}
		// Handle scripts!
		else if( cmd[0] == 'version' )
		{
			callback( true, { response: 'Friend Shell version 1.2rc1' } );
			return this.evaluateInput( input, index + 1, callback, mode );
		}
		// Handle gotos!
		else if( cmd[0] == 'goto' )
		{
			var where = cmd[1];
			if( !isNaN( parseInt( where ) ) )
			{
				return this.evaluateInput( input, parseInt( where ), callback, mode );
			}
			for( a = 0; a < input.length; a++ )
			{
				var str = Trim( input[a], 'left' );
				if( str.substr( str.length - 1, 1 ) == ':' && str.substr( 0, str.length - 1 ) == where )
				{
					return this.evaluateInput( input, a, callback, mode );
				}
			}
			callback( false, { response: 'Could not find label "' + where + '".', done: true } );
			return false;
		}
		// This is handled by the Workspace shell object: --------------------------
		else
		{
			// Go parse the single command
			var time = 1; // <- make sure we only evaluate one time, and not for ever
			this.execute( cmd.join( ' ' ), function( e, d )
			{
				if( callback ) callback( e, d );
				if( time-- == 1 )
					t.evaluateInput( input, index + 1, callback, mode );
			} );
		}
	};

	// Parses a shell script!
	this.parseShellScript = function( data, callback )
	{
		if( data.substr( 0, 1 ) == '<' )
		{
			this.input = true;
			if( callback )
				callback( false, { response: 'Error in script on line 1.', input: 'on' } );
			return false;
		}

		// Start executing script
		data = data.split( "\n" );
		this.executing = true;
		this.evaluateInput( data, 0, callback, 'script' );
	};

	// Parse a command
	this.execute = function( cmd, ecallback )
	{
		// References
		// TODO: Remove dosobj and replace with t
		var dosobj = t = this;

		// Pipe to another place (reroute)
		if( this.pipe )
		{
			// The pipe is an application object
			if( this.pipe.applicationName )
			{
				var cid = addWrapperCallback( function( response )
				{
					if( !response )
						return ecallback( false, 'Unknown response..' );
					ecallback( true, { response: response } );
				} );
				this.pipe.contentWindow.postMessage( JSON.stringify( { command: 'clifin_args', shellId: this.uniqueId, args: cmd, callbackId: cid } ), '*' );
				return;
			}
			// Pipe is a function. It needs to take commands and callback!
			else if( typeof( this.pipe ) == 'function' )
			{
				this.pipe( cmd, ecallback );
				return;
			}
			else
			{
				ecallback( false, { response: 'Broken pipe.' } );
				this.pipe = false;
				return;
			}
		}

		// For applications to jack in..
		if( cmd == 'mind on' )
		{
			this.mindMode = true;
			return ecallback( true, { response: 'Mind on.' } );
		}
		else if( cmd == 'mind off' )
		{
			this.mindMode = false;
			return ecallback( false, { response: 'Mind off.' } );
		}

		if( this.mindMode )
		{
			return this.mind.parse( cmd, ecallback );
		}

		var rawLine = cmd + '';

		// Setup proxy caller we can add some things to
		var dcallback;
		if( !ecallback )
		{
			dcallback = function( d )
			{
				// Do nothing..
			}
		}
		else
		{
			dcallback = function( dat, r )
			{
				// TODO: Some other place to do this?
				if( !this.sessionId && ge( 'ShellOutput' ) )
				{
					//
				}
				else
				{
					// what to do? nothing?
				}
				ecallback( dat, r );
			}
		}

		// Ignore comments
		if( rawLine.substr( 0, 2 ) == '//' ) return dcallback( false );

		var a = 0, b = 0;

		// Multiline fork
		if( rawLine.indexOf( ';' ) > 0 )
		{
			cmd = rawLine.split( ';' ).join( "\n" );
			cmd = cmd.split( "\n" );
			for( a = 0; a < cmd.length; a++ )
			{
				cmd[a] = Trim( cmd[a] );
			}
			cmd = cmd.join( "\n" );
			return this.parseScript( cmd, dcallback );
		}

		// Get an intelligent parsed object for variables and fin_args
		cmd = Trim( EntityDecode( cmd.split( '<!--semicolon-->' ).join( ';' ) ) );

		// Common ones
		switch( cmd.toLowerCase() )
		{
			case 'shell':
			case 'newshell':
			case 'new shell':
			case 'cli':
				cmd = 'launch FriendShell';
				break;
		}

		var parsedObject = this.parseInput( cmd );
		cmd = parsedObject.args; // Just the fin_args
		this.parsedObj = parsedObject;

		// Let's do lowercase
		cmd[0] = cmd[0].toLowerCase();

		// Safety, correct currentpath
		if ( this.currentPath && this.currentPath.substr( this.currentPath.length-1, 1 ) != ':' )
		{
			if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != '/' )
				this.currentPath += '/';
		}
		
		// Start parsing commands
		if( this.FriendDOSCommands[ cmd[ 0 ] ] )
		{
			return this.FriendDOSCommands[ cmd[ 0 ] ]( cmd, dcallback );
		}
		else if( cmd[0] == "\n" )
		{
			return dcallback( true );
		}
		else if( cmd[0] == '' )
		{
			return dcallback( true );
		}
		// Skip labels
		else if( cmd[0].substr( cmd[0].length - 1, 1 ) == ':' )
		{
			return dcallback( true );
		}
		// Catch all
		else
		{
			//console.log( 'This one didn\'t compute!', cmd );

			// If all else fails
			function lastCallback()
			{
				//// Signal to parent that we want to execute an application
				//var args = [];
				//for( var a = 1; a < cmd.length; a++ )
				//	args.push( cmd[a] );
				//args = args.join ( ' ' );
				//var command = cmd[0];
				//var cid = addCallback( function( msg )
				//{
				//	console.log( 'Response from parent to terminal' );
				//	console.log( msg );
				//} );
				//this.app.sendMessage( {
				//	type: 'system',
				//	command: 'executeapplication',
				//	executable: command,
				//	fin_args: args
				//} );
				return dcallback( false, { response: 'Command not found.' } );
			}

			// Construct path var
			var path = ( cmd[0] == 'cd' && typeof(cmd[1]) != 'undefined' && cmd[1].length ) ? cmd[1] : this.currentPath;

			// We're just entering a path
			if( cmd.length == 1 && cmd[0].indexOf( ':' ) >= 0 )
			{
				path = cmd[0];
				if( path.charAt( path.length - 1 ) != ':' && path.charAt( path.length - 1 ) != '/' )
				{
					// Subdir or...
					var s = path.indexOf( '/' );
					if( s > 0 )
					{
						path = path.split( '/' );
						path.pop();
						path = path.join( '/' );
					}
					// ...root
					else
					{
						path = path.split( ':' )[0] + ':';
					}
				}
			}
			
			// Try to see if there is an executable in the current directory
			var dirs = false;
			var door = false;
			var tt = this;

			// Check dormant first!
			// TODO: Make uniform!
			this.checkDormantDoors( path, function( dirs )
			{
				// If we end up here, we're not using dormant - which is OK! :)
				if( !dirs || ( !dirs && !dirs.length ) )
				{
					// Use standard doors
					var door = ( new Door() ).get( path );
					
					var filename = cmd[0];
					if( filename.indexOf( '/' ) > 0 || filename.indexOf( ':' ) > 0 )
					{
						filename = cmd[0].indexOf( '/' ) > 0 ? cmd[0].split( '/' ).pop() : cmd[0].split( ':' ).pop();
					}
					
					door.getIcons( false, function( data )
					{
						if( data.length )
						{
							for( var a in data )
							{
								var f = data[a].Filename ? data[a].Filename : data[a].Title;
								if( !f ) continue;
								
								// Match it!
								if( data[a].Type == 'Directory' && filename == f.toLowerCase() )
								{
									return dosobj.execute( 'cd ' + cmd[0], ecallback );
								}
								else if( f.toLowerCase() == cmd[0] )
								{
									if( data[a].Type == 'Directory' )
									{
										return dosobj.execute( 'cd ' + f, ecallback );
									}
									
									var args = [];
									for( var aa = 1; aa < cmd.length; aa++ )
										args.push( cmd[aa].split( '<!--space--!>' ).join( ' ' ) );

									var command = cmd[0];

									// TODO: Make safe! Could have jsx in the middle of the file name!
									if( command.indexOf( '.jsx' ) > 0 )
									{
										command = path + command;
									}

									var s = command.split( '.' );
									if( s[ s.length - 1 ].toLowerCase() == 'module' )
									{
										var call = cmd.length > 1 ? cmd[1] : 'help';
										var m = new Module( s[ s.length - 2 ] );
										m.onExecuted = function( e, d )
										{
											var o = false;
											try
											{
												o = JSON.parse( d );
											}
											catch( e )
											{
												o = false;
											}
											if( e == 'ok' )
											{
												
												if( call == 'help' )
												{
													var str = '<strong>Commands:</strong><br><br>';
													str += o.Commands.join( ', ' ) + '.';
													dcallback( false, { response: str } );
												}
												else if( o.message )
												{
													dcallback( true, { response: o.message } );
												}
												else
												{
													// Simple format
													function outd( p, dd )
													{
														if( !dd ) dd = '';
														var str = '';
														for( var f in p )
														{
															if( !p[f] ) continue;
															if( p[f].indexOf && p[f].indexOf( '{' ) >= 0 )
																p[f] = JSON.parse( p[f] );
															if( typeof( p[f] ) == 'object' )
															{
																str += dd + f + ':\n';
																str += outd( p[f], dd + '\t' );
															}
															else str += dd + f + ': ' + p[f] + '\n';
														}
														return str;
													}
													dcallback( true, { response: outd( o ).split( "\n" ).join( "<br>" ).split( "\t" ).join( "&nbsp;&nbsp;&nbsp;&nbsp;")  } );
												}
											}
											else if( e == 'fail' && o.message )
											{
												dcallback( false, { response: o.message } );
											}
											else
											{
												dcallback( false, { response: 'No output from this module.' } );
											}
										}
										var args = {};
										for( var f = 1; f < cmd.length; f++ )
										{
											// Named variable
											if( cmd[f].indexOf( '=' ) > 0 )
											{
												var d = cmd[f].split( '=' );
												args[d[0]] = d[1];
											}
											// Just use the variable as a bool
											else
											{
												args[cmd[f]] = 1;
											}
										}

										m.execute( call, args );
										return;
									}
									
									var cid = addWrapperCallback( function( msg )
									{
										var resp = msg ? ( msg.response ? msg.response : msg ) : false;
										dcallback( resp ? resp : false, { path: path } );
									} );

									var msgHere = {
										applicationName: tt.app.applicationName,
										applicationId: tt.app.applicationId,
										type: 'system',
										command: 'executeapplication',
										executable: command,
										fin_args: args,
										path: path,
										callback: cid
									};
									apiWrapper( { data: JSON.stringify( msgHere ) } );
									return;
								}
							}
							return dcallback( false, { response: 'Command not found.' } );
						}
						else
						{
							lastCallback();
						}
					} );
				}
				else
				{
					// Check command
					var command = cmd[0];
					if( command.indexOf( '/' ) )
					{
						command = command.split( '/' ).pop();
					}
					else if( command.indexOf( ':' ) )
					{
						command = command.split( ':' ).pop();
					}
				
					for( var a in dirs )
					{
						if( dirs[a].Title.toLowerCase() == command )
						{
							var args = [];
							for( var aa = 1; aa < cmd.length; aa++ )
								args.push( cmd[aa].split( '<!--space--!>' ).join( ' ' ) );

							var cid = addWrapperCallback( function( msg )
							{
								var resp = msg ? msg.response : false;
								dcallback( resp ? true : false, resp ? { response: resp, path: path } : { response: 'Command completed.' } );
							} );
							
							var msgHere = {
								applicationName: tt.app.applicationName,
								applicationId: tt.app.applicationId,
								type: 'dormantmaster',
								method: 'execute',
								executable: dirs[a].Path + command,
								doorId: dirs[a].Dormant.doorId,
								dormantCommand: command,
								dormantArgs: args,
								callback: cid
							};
							apiWrapper( { data: JSON.stringify( msgHere ) } );
							return;
						}
					}
					return dcallback( false, { response: 'Command not found.' } );
				}
			} );
		}
	};

	/**
	 * @brief Converts a string into an object with a list of fin_args and vars
	 *
	 * @string a string value
	 * @return an object with the members args (array) and vars (key/values)
	 */
	this.parseInput = function( string )
	{
		// Clean up escaped characters and double quoted
		var qmode = 0;
		var out = '';
		var a = 0;
		for( ; a < string.length; a++ )
		{
			if( qmode === 0 && string[a] == '"' )
			{
				qmode = 1;
				continue;
			}
			else if( qmode == 1 && string[a] == '"' )
			{
				qmode = 0;
				continue;
			}
			else if( qmode == 1 && string[a] == ' ' )
			{
				out += '<!--space--!>';
				continue;
			}
			else if( string[a] == '\\' && string[a+1] == ' ' )
			{
				out += '<!--space--!>';
				a += 1;
				continue;
			}
			else if( string[a] == '\\' && string[a+1] == '"' )
			{
				out += '\\"';
				a += 1;
				continue;
			}
			out += string[a];
		}
		// Get an array. Return an object with vars and args
		out = out.split( ' ' );
		var object = { args: [], vars: [] };
		for( a = 0; a < out.length; a++ )
		{
			if( out[a].indexOf( '<!--space--!>' ) >= 0 )
				out[a] = out[a].split( '<!--space--!>' ).join( ' ' );
			object.args.push( out[a] );
			if( out[a].indexOf( '=' ) > 0 )
			{
				var sp = out[a].split( '=' );
				if( sp.length == 2 )
				{
					object.vars[sp[0]] = sp[1];
				}
			}
		}
		return object;
	};
	
	// Create formatted output from objects
	this.generateOutputFromObjects = function( objects, type )
	{
		if( !type ) type = 'html';

		var acount = objects.length;
		var third  = Math.floor( acount / 3 );
		var output = [];
		var count  = 0;
		var column = 0;
		// Go through the icons
		var icons = '';
		var trash = 0; // how many bad icons were found
		var a = 0;
		
		for( ; a < acount; a++ )
		{
			var row = objects[a];
			if( !output[column] ) output[column] = '';
			if( !row.Type ){ trash++; continue; }
			var dirType = row.Type ? row.Type.toLowerCase() : 'File';
			var isDir = ( dirType == 'directory' || row.MetaType == 'Folder' || dirType == 'dormant' );
			var itm = ( row.Title ? row.Title : row.Filename ) + ( isDir ? '/' : '' ) + '<br>';
			if ( isDir ) itm = '<div class="Container">' + itm + '</div>';
			else itm = '<div class="File">' + itm + '</div>';
			output[column] += itm;
			if( ++count > third ) { column++; count = 0; }
		}

		acount -= trash;

		icons += '<table style="border-collapse: collapse; border-spacing: 0"><tr>';
		for( a = 0; a < output.length; a++ )
		{
			var c = output[a];
			icons += '<td style="vertical-align: top; padding-right: 20px">' + c + '</td>';
		}
		icons += '</tr></table><br>';
		icons += acount + ' ' + i18n( 'i18n_items_total' ) + '.<br><br>';
		return icons;
	};
	
	this.fileOpen = function( win, arg )
	{
		if( !win.content || !win.content.icons ) return false;
		var argn = parseInt( arg ); if( isNaN( argn ) ) argn = 0;
		arg = arg.toLowerCase();
		for( var a = 0, b = 0; a < win.content.icons.length; a++ )
		{
			var i = win.content.icons[a];
			if( i.Type.toLowerCase() != 'file' && i.Type.toLowerCase() != 'dormantfunction' ) continue;
			b++;
			var t = i.Title ? i.Title : i.Filename;
			if( ( argn > 0 && b == argn ) || ( argn <= 0 && t.toLowerCase() == arg ) )
			{
				if( i.Type.toLowerCase() == 'dormantfunction' )
				{
					this.context = 'executable';
					this.exeIcon = i;
					SayWithText( 'The file, ' + t + ', is an executable. What are your fin_args?' );
					return true;
				}

				i.domNode.ondblclick();
				SayWithText( 'File ' + t + ' opened.' );
				return true;
			}
		}
		return false;
	};
	
	this.directoryOpen = function( win, arg )
	{
		if( !win.content || !win.content.icons ) return false;
		var argn = parseInt( arg ); if( isNaN( argn ) ) argn = 0;
		arg = arg.toLowerCase();
		for( var a = 0, b = 0; a < win.content.icons.length; a++ )
		{
			var i = win.content.icons[a];
			if( i.Type.toLowerCase() != 'directory' && i.Type.toLowerCase() != 'dormant' ) continue;
			b++;
			var t = i.Title ? i.Title : i.Filename;
			if( ( argn > 0 && b == argn ) || ( argn <= 0 && t.toLowerCase() == arg ) )
			{
				i.domNode.ondblclick();
				SayWithText( 'Directory ' + t + ' opened.' );
				return true;
			}
		}
		return false;
	};
	
	// All Friend DOS commands hashmap
	this.FriendDOSCommands = {
		/*
		'add': function(){},
		'goto': function(){},
		'increase': function(){},
		'decrease': function(
			
		){},
		'divide': function(){},
		'multiply': function(){},
		'subtract': function(){},
		'stop': function(){},
		'version': function(){},
		'repeat': function(){},
		'set': function(){},
		*/

		'access': function( args, callback )
		{
			if( args.length < 2 )
			{
				shell.lastErrorMessage = 'The access command needs a filename to get the access privileges from.';
				return callback( false, { response: "Not enough fin_args." } );
			}
			if( args[ 1 ].indexOf( ':' ) < 0 ) 
				args[ 1 ] = shell.currentPath + args[ 1 ];
			shell.fileExists( args[ 1 ], function( result, data )
			{
				if( result )
				{
					var nl = new Library( 'system.library' );
					nl.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							shell.lastErrorMessage = 'Your last call succeeded.';

							d = JSON.parse( d );

							var str2ar = function( str ){ var o = []; for( var a = 0; a < str.length; a++ ) o.push( str[a] ); return o };
							var res = { user: '', group: '', others: '' };
							var combined = [ '-', '-', '-', '-', '-' ];
							var a = 0;
							for( ; a < d.length; a++ )
							{
								if( !d[ a ].access ) continue;
								d[ a ].access = str2ar( d[ a ].access ); // To string!
								if( !res[ d[ a ].type ] )
								{
									// Copy
									res[ d[ a ].type ] = str2ar( d[ a ].access.join( '' ).toLowerCase() );
								}
								else
								{
									// Merge
									for( var c = 0; c < res[ d[ a ].type ].length; c++ )
									{
										if( d[ a ].access[ c ] != '-' && res[ d[ a ].type ][ c ] == '-' )
											res[ d[ a ].type ][ c ] = d[ a ].access[ c ].toLowerCase();
									}
								}
								// Merge with combined
								for( var b = 0; b < d[ a ].access.length; b++ )
								{
									if( d[ a ].access[ b ] != '-' && combined[ b ] == '-' )
										combined[ b ] = d[ a ].access[ b ];
								}
							}
							var out = '';
							for( a in res )
								out += a + ': ' + ( typeof( res[ a ] ) == 'object' ? res[a].join( '' ) : '-----' ) + "&nbsp;&nbsp;&nbsp;&nbsp;";
							out += '<br>combined: ' + combined.join( '' ).toLowerCase();

							return callback( true, { response: "Access privileges found:<br>" + out } );
						}
						shell.lastErrorMessage = 'Could not get a list of access privileges from this file.';
						return callback( false, { response: "This file is unprotected." } );
					}
					nl.execute( 'file/access', { path: args[ 1 ] } );
					return;
				}
				shell.lastErrorMessage = 'The file you entered does not exist on disk.';
				return callback( false, { response: "The file does not exist." } );
			} );
		},
		
		// Alias a command with another command
		'alias': function( args, callback )
		{
			if( args.length == 3 )
			{
				// Already exists
				if( this[ args[1] ] )
					return callback( false, { response: 'You can not overwrite ' + args[1] + ' with ' + args[2] + '.' } );
				if( !this[ args[2] ] )
					return callback( false, { response: 'Command ' + args[2] + ' does not exist.' } );
				this[ args[1] ] = this[ args[2] ];
				return callback( true, { response: 'Command ' + args[1] + ' now points to ' + args[2] + '.' } );
			}
			return callback( false, { response: 'Usage: alias {alias} {command}' } );
		}, 
		'assign': function( args, callback )
		{
			var mode = 'new';

			if( args.length >= 2 )
			{
				var path = args[1];
				var assign = args[2];

				for( a = 2; a < args.length; a++ )
				{
					var cm = args[a].toLowerCase();
					if( cm == 'add' ) mode = 'add';
					if( ( cm == 'to' || cm == 'from' ) && a+1 < args.length )
					{
						assign = args[ a+1 ];
						a++;
						continue;
					}
					if( cm == 'remove' ) mode = 'remove';
					if( args[a].indexOf( ':' ) > 0 )
						assign = args[a];
				}

				// Keep the whole path!
				if( path.indexOf( ':' ) < 0 )
					path = shell.currentPath + path;

				if( path.indexOf( ':' ) <= 0 || assign.indexOf( ':' ) <= 0 )
				{
					shell.lastErrorMessage = 'Could not understand your assign syntax as there was no valid path and assign drive.';
					return callback( false, { response: 'Unknown assign syntax.' } );
				}

				// Let us validate
				if( path.indexOf( ':' ) > 0 && assign.indexOf( ':' ) > 0 && assign.split( ':' )[1].length <= 0 && mode != 'remove' )
				{
					// Let's check the path! (must be a directory or volume)
					var lch = path.substr( path.length - 1, 1 );
					if( lch != '/' && lch != ':' ) path += '/';
					shell.getDirectory( path, function( directory, children )
					{
						if( directory && directory.Type && ( directory.Type == 'Directory' || directory.Type == 'Volume' ) )
						{
							var m = new Module( 'system' );
							m.onExecuted = function( e, d )
							{
								if( e == 'ok' )
								{
									mstr = mode == 'add' ? 'added' : 'assigned';
									shell.execute( 'mount ' + assign, function()
									{
										callback( true, { response: 'Path ' + path + ' ' + mstr + ' to ' + assign + '.' } );
									} );
								}
								else
								{
									return callback( false, { response: 'Assigning ' + path + ' to ' + assign + ' failed.' } );
								}
							}
							m.execute( 'assign', {
								path: path,
								assign: assign,
								mode: mode
							} );
						}
						else
						{
							return callback( false, { response: 'Failed to find assign ' + path + '...' } );
						}
					} );
				}
				else if( mode == 'remove' )
				{
					var assignPath = path;
					if( assign.indexOf( ':' ) > 0 )
						assignPath = assign;

					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							shell.execute( 'unmount ' + assignPath, function()
							{
								return callback( true, { response: 'Assign ' + assignPath + ' removed.' } );
							} );
							return;
						}
						else
						{
							return callback( false, { response: 'Failed to remove assign ' + assignPath + '..' } );
						}
					}
					m.execute( 'assign', {
						assign: assignPath,
						mode: mode
					} );
				}
				else
				{
					callback( true, { response: 'Assign syntax error.' } );
				}
			}
			// Just give a list
			else
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e == 'fail' )
					{
						return callback( true, { response: 'No available assign devices.' } );
					}
					var list = JSON.parse( d );
					var out = '';
					for( var y = 0; y < list.length; y++ )
					{
						out += "&nbsp;&nbsp;" + list[y].Name + ":" + ( list[y].Mounted == 1 ? " mounted..." : "<br>" );
					}

					return callback( true, { response: 'List of assigned devices:' + "<br><br>" + out } );
				}
				m.execute( 'assign' );
			}
		},
		'break': function( args, callback )
		{
			apiWrapper( { data: JSON.stringify( {
				applicationName: shell.app.applicationName,
				applicationId: shell.app.applicationId,
				type: 'system', command: 'break', appNum: parseInt( args[1] ), callbackId: addWrapperCallback( callback )
			} ) } );
			callback( true, { response: 'Broke process ' + args[1] + '.' } );
		},
		'cat': function( args, callback )
		{
			if( args.length == 2 )
			{
				var p = args[ 1 ];
				if( p.indexOf( ':' ) <= 0 )
					p = shell.currentPath + p;

				// Get a door object and get file information about image
				var pp = p.indexOf( ':' );
				pp = p.substr(0, pp + 1);
				var d = new Door( pp );
				d.dosAction( 
					'file/info', 
					{ path: p },
					function( data )
					{
						var res = data.split( "<!--separate-->" );
						if( res[0] != "ok" )
						{
							callback( false, { response: 'File not found.' } )
							return false;
						}
						var d = JSON.parse( res[1] );
						if ( d.Filesize > 1024 * 100 )
						{
							callback( false, { response: 'File too large: ' + d.Filesize / 1024 +' kb.' } );
							return false;
						}
						var f = new File( p );
						f.onLoad = function( data )
						{
							callback( false, { response: data.split( "\n" ).join( "<br>" ) } );
						}
						f.load();
					}
				);
			}
			else
			{
				callback( false, { response: 'Usage: cat filename' } );
			}
		},
		'output': function( args, callback )
		{
			this[ 'cat' ]( args, callback );
		},
		'cd': function( args, callback )
		{
			if( args.length <= 1 || ( args.length > 1 && !args[1].length ) )
			{
				return callback( true );
			}

			// Get path string (and fix spaces)
			var str = args[1];
			if( args.length > 2 )
			{
				var args2 = [];
				for( a = 1; a < args.length; a++ )
					args2.push( args[a].split( '<!--space--!>' ).join( ' ' ) );
				str = args2.join( ' ' );
			}

			var fullPath = Trim( str.split( '<!--space--!>' ).join( ' ' ), 'left' );

			// Go to root
			if( fullPath == ':' )
			{
				fullPath = shell.currentPath.split( ':' )[0] + ':';
			}

			// Go to parent
			if( fullPath.substr( 0, 1 ) == '/' && shell.currentPath )
			{
				var tmp = shell.currentPath;
				
				// Remove trailing forward slash
				if( tmp.substr( tmp.length - 1, 1 ) == '/' )
					tmp = tmp.substr( 0, tmp.length - 1 );
				while( fullPath.substr( 0, 1 ) == '/' )
				{
					// Split up a folder
					if( tmp.indexOf( '/' ) > 0 )
					{
						tmp = tmp.split( '/' );
						tmp.pop();
						tmp = tmp.join( '/' );
					}
					// Toplevel
					else if( tmp.indexOf( ':' ) > 0 )
					{
						tmp = tmp.split( ':' )[0] + ':';
					}
					if( fullPath.length > 1 )
					{
						fullPath = fullPath.substr( 1, fullPath.length - 1 );
					}
					else
					{ 
						break;
					}
				}
				fullPath = tmp;
			}

			// Fix path
			if( fullPath.indexOf( ':' ) < 0 )
			{
				fullPath = shell.currentPath;
				var ll = fullPath.substr( fullPath.length - 1, 1 );
				if( ll != ':' && ll != '/' )
					fullPath += '/';
				fullPath = fullPath + str.split( '<!--space--!>' ).join( ' ' );
				ll = fullPath.substr( fullPath.length - 1, 1 );
				if( ll != '/' )
					fullPath += '/';
			}
			// Not a door volume name
			else if ( fullPath.substr( fullPath.length - 1, 1 ) != ':' )
			{
				var ll = fullPath.substr( fullPath.length - 1, 1 );
				if( ll != '/' )
					fullPath += '/';
			}


			// No volume written by name!
			// TODO: enter must imply mount or running a dormant app with a callback??
			if( args[0] == 'enter' )
			{
				if( args.length != 2 )
				{
					return callback( true );
				}
				else if( args[1].indexOf( ':' ) > 0 || args[1].indexOf( '/' ) > 0 )
				{
					return callback( true );
				}
				fullPath = args[1] + ':' + i18n('i18n_directory_Functions') + '/';
				if( shell.currentPath )
				{
					shell.previousPath = shell.currentPath;
				}
			}

			// First check dormant
			// TODO: Implement "evaluate path"
			shell.checkDormantDoors( fullPath, function( dirs )
			{
				// Use standard doors
				if( !dirs || ( !dirs && !dirs.length ) )
				{
					var door = ( new Door() ).get( fullPath );
					door.getIcons( false, function( data, path )
					{
						if( typeof( data ) == 'object' && path )
						{
							// Restricted path (for use with FriendNetwork)
							if ( shell.restrictedPath )
								if ( fullPath.indexOf( shell.restrictedPath ) < 0 )
									return callback( false, { response: 'Path is restricted by host to ' + shell.restrictedPath } );

							shell.currentPath = path;
						}
						// Error never should be here.
						else
						{
							return callback( false, { response: 'Could not change directory.' } );
						}
						callback( false, { path: path } );
					} );
				}
				else
				{
					// Restricted path (for use with FriendNetwork)
					if ( shell.restrictedPath )
						if ( fullPath.indexOf( shell.restrictedPath ) < 0 )
							return callback( false, { response: 'Path is restricted by host to ' + shell.restrictedPath } );

					// TODO: Fix that these are arrays!
					var count = 0;
					for( a in dirs ) count++;
					if( dirs || count > 0 )
					{
						shell.currentPath = fullPath;
					}
					else
					{
						return callback( false, { response: 'Could not change directory.' } );
					}
					callback( false, { path: fullPath } );
				}
			} );
		},
		'enter': function( args, callback )
		{
			this[ 'cd' ]( args, callback );
		},		
		'clear': function( args, callback )
		{
			// TODO: Do we have an internal buffer to clear?
			return callback( 'clear' );			
		},		
		'copy': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Copy is not authorised by host.' } );

			if( args.length >= 3 )
			{
				shell.terminate = true;

				var start = 1;
				var recursive = false;

				// check recursive
				if( ( args[ 0 ] + ' ' + args[ 1 ] ).toLowerCase() == 'copy all' )
				{
					start++;
					recursive = true;
				}

				var src = args[ start ];

				if( src.indexOf( ':' ) < 0 ) src = shell.currentPath + src;

				var dst = args[ start + 1 ].toLowerCase() == 'to' ? args[ start + 2 ] : args[ start + 1 ];

				if( dst.indexOf( ':' ) < 0 ) dst = shell.currentPath + dst;

				// 'all' on the end
				if( !recursive ) recursive = args[ args.length - 1 ].toLowerCase() == 'all' ? true : false;

				FriendDOS.copyFiles( src, dst, { recursive: recursive, move: false }, function( result, done )
				{
					if( !done ) done = false;
					callback( false, { response: result, done: done } );
				} );
			}
			else
			{
				callback( false, { response: 'Usage: copy (all) source:path/or/file (to) destination:path/' } );
			}
		},		
		'date': function( args, callback )
		{
			var td = new Date();
			callback( true, {
				response: td.getFullYear() + '-' +
				StrPad( ( td.getMonth() + 1 ), 2, '0' ) + '-' +
				StrPad( td.getDate(), 2, '0' ) + ' ' +
				StrPad( td.getHours(), 2, '0' ) + ':' +
				StrPad( td.getMinutes(), 2, '0' ) + ':' +
				StrPad( td.getSeconds(), 2, '0' )
			} );
		},
		'delete': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Delete is not authorised by host.' } );

			shell.terminate = true;

			if( args.length >= 2 )
			{
				var start = 1;
				var recursive = false;
				var notrash = false;

				// check recursive (if we have at least three fin_args)
				if( ( args[ 0 ] + ' ' + args[ 1 ] ).toLowerCase() == 'delete all' && typeof( args[ 2 ] ) != 'undefined' )
				{
					start++;
					recursive = true;
				}

				// Find source path
				var src = args[ start++ ];
				src = src.split( '&nbsp;' ).join( ' ' ).split( '<!--space--!>' ).join( ' ' );
				if( src.indexOf( ':' ) < 0 ) src = shell.currentPath + src;

				// Find other keywords after filename
				for( ; start < args.length; start++ )
				{
					if( args[ start ] == 'all' )
						recursive = true;
					if( args[ start ] == 'notrash' )
						notrash = true;
				}

				// Finally delete
				FriendDOS.deleteFiles( src, { recursive: recursive, notrash: notrash }, function( result )
				{
					callback( false, { response: result, done: true } );
				} );
			}
		},
		'dir': function( args, callback )
		{
			var path = ( typeof( args[ 1 ] ) != 'undefined' && args[ 1 ].length ) ? args[ 1 ] : shell.currentPath;
 
			if( path.indexOf( ':' ) < 0 )
			{
				var cp = shell.currentPath;
				var ssign = cp.substr( cp.length - 1 );
				path = shell.currentPath + ( ( ssign != ':' && ssign != '/' ) ? '/' : '' ) + path;
			}
			if( path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
				path += '/';

			path = path.split( '<!--space--!>' ).join( ' ' );

			shell.getDirectory( path, function( doorItem, data )
			{
				if( data && data.length )
				{
					return callback( data );
				}
				// We have empty list
				else if( data )
				{
					return callback( false, { response: 'Empty directory.' } );
				}
				// Error never should be here.
				else
				{
					return callback( false, { response: 'Invalid path.' } );
				}
				return callback( false );
			} );
		},	
		'echo': function( args, callback )
		{
			// TODO: Support pipes to other destinations
			return callback( true, { response: shell.parseVariables( args[ 1 ] ).split( '<!--space--!>' ).join( ' ' ) } );
		},
		// TODO: test in real!
		'engage': function( args, callback )
		{
			var preposition = 'with';
			var subject = false;
			var number = -1;
			for( b = 1; b < args.length; b++ )
			{
				if( args[ b ] == 'with' )
					preposition = args[ b ];
				else if( !isNaN( args[ b ] ) )
					number = parseInt( args[ b ] );
				else subject = args[ b ];
			}

			// Add number specification
			if( subject && number > 0 ) subject = subject + ' ' + number;

			if( subject && preposition )
			{
				// Check if subject exists!
				var candidates = [];
				var appObjects = [];
				var i = 0;
				for( a in Workspace.applications )
				{
					i++;
					var appNr = Workspace.applications[a].applicationName + ' ' + i;
					if( Workspace.applications[a].applicationName == subject || subject == appNr )
					{
						candidates.push( Workspace.applications[a].applicationName );
						appObjects.push( Workspace.applications[a] );
					}
				}
				if( candidates.length > 1 )
				{
					for( a = 0; a < candidates.length; a++ )
					{
						candidates[a] += ' ' + ( 1 + a );
					}
					return callback( false, { response: 'Please specify which target: "' + candidates.join( '", "' ) + '".' } );
				}
				// Found the target
				else if( candidates.length == 1 )
				{
					nsp = '';
					if( number > 0 ) nsp = ' (' + number + ').';
					shell.pipe = appObjects[0];

					// Tell it we're engaging!
					return shell.execute( 'engage', callback );
				}
			}
			return callback( false, { response: 'Could not engage with ' + ( subject ? subject : 'unknown target.' ) } );
		},
		'execute': function( args, callback )
		{
			if( args.length > 1 && args[ 1 ].substr( args[ 1 ].length - 4, 4 ).toLowerCase() == '.run' )
			{
				var fname = args[ 1 ];
				if( fname.indexOf( ':' ) < 0 )
				{
					fname = shell.currentPath + fname;
				}
				var f = new File( fname );
				f.onLoad = function( data )
				{
					shell.parseShellScript( data, callback );
				}
				f.load();
			}
			return callback( false, 'Could not execute script ' + args[ 1 ] );
		},		
		'flush': function( args, callback )
		{
			shell.variables = [];
			callback( true, { flush: true } );
		},
		'help': function( args, callback )
		{
			var commands = [
				'ls', 'info', 'list', 'dir', 'cat', 'type', 'why', 'copy', 'delete', 'makedir', 'tinyurl',
				'protect', 'access', 'execute', 'launch', 'output', 'infoget', 'infoset', 'wait',
				'rename', /*'mind',*/ 'enter', 'engage', 'date', 'clear', 'flush', 'cd', 'set', 'echo',
				'say', 'leave', 'status', 'break', 'kill', 'assign', 'mount', 'unmount', 'deletemount', 'mountlist',
				'repeat', /*'on',*/ 'increase', 'decrease', 'multiply', 'divide', 'add', 'subtract',
				'stop', 'version', 'goto', 'help'
			].sort();
			if ( args.length == 1 )
			{
				callback( false, { command: 'help', text: commands.join( ', ' ) } );
			}
			else if ( args.length == 2 )
			{
				for ( var a = 0; a < commands.length; a++ )
				{
					if ( commands[ a ] == args[ 1 ] )
					{
						return callback( false, { command: 'help', name: args[ 1 ] } );
					}
				}
			}
			else
			{
				callback( false, { response: 'Syntax error.' } );
			}
			switch( args[ 1 ] )
			{
				default:
					callback( true, { response: 'Friend DOS has the following commands available:<br><br>' + commands.join( ', ' ) + '<br><br>Please try "help {commandname}".' } );
					break;
			}
		},		
		// TODO: infoget cannot find information about StdAfx.h
		'infoget': function( args, callback )
		{
			if( args.length < 2 )
			{
				return callback( false, { response: "Could not get info. Please specify file." } );
			}
			var o = new Object();

			var path = args[ 1 ];
			if( path.indexOf( ':' ) < 0 )
			{
				var cp = shell.currentPath;
				var ssign = cp.substr( cp.length - 1 );
				path = shell.currentPath + ( ( ssign != ':' && ssign != '/' ) ? '/' : '' ) + path;
			}

			var m = new Library( 'system.library' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) 
				{
					callback( false, { response: 'Infoget failed to get a workable result.' } );
					return;
				}

				d = JSON.parse( d );

				var fn = path.split( path.indexOf( '/' ) > 0 ? '/' : ':' ).pop();
				var info = false;

				for( var a = 0; a < d.length; a++ )
				{
					if( d[a].Filename == fn )
					{
						info = d[a];
						break;
					}
				}

				if( !info )
				{
					return callback( false, { response: "File " + o.path + " does not exist.." } );
				}

				if( info && info.Type == 'Directory' && path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
					path += '/';

				o.path = path.split( '<!--space--!>' ).join( ' ' );

				if( typeof( args[ 2 ] ) != 'undefined' )
					o.key = args[ 2 ];

				var l = new Library( 'system.library' );
				l.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						return callback( true, { response: shell.generateOutputFromObjects( JSON.parse( d ) ) } );
					}
					return callback( false, { response: "Could not get info about " + o.path } );
				}
				l.execute( 'file/infoget', o );
			}
			m.execute( 'file/dir', { path: shell.currentPath } );
		},		
		// TODO: see with Hogne if this instruction is to be kept
		'infoset': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Infoset is not authorised by host.' } );

			if( args.length < 2 )
			{
				return callback( false, { response: "Could not get info. Please specify file." } );
			}
			var o = new Object();

			var path = args[ 1 ];
			if( path.indexOf( ':' ) < 0 )
			{
				var cp = shell.currentPath;
				var ssign = cp.substr( cp.length - 1 );
				path = shell.currentPath + ( ( ssign != ':' && ssign != '/' ) ? '/' : '' ) + path;
			}

			var m = new Library( 'system.library' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) return;

				d = JSON.parse( d );

				var np = path;
				if( np.substr( np.length - 1, 1 ) == '/' )
					np = np.substr( 0, np.length - 1 );
				var fn = np.split( np.indexOf( '/' ) > 0 ? '/' : ':' ).pop();
				var info = false;

				for( var a = 0; a < d.length; a++ )
				{
					if( d[a].Filename == fn )
					{
						info = d[a];
						break;
					}
				}

				if( !info )
				{
					return callback( false, { response: "File " + o.path + " does not exist.." } );
				}

				if( info && info.Type == 'Directory' && path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
					path += '/';

				o.path = path.split( '<!--space--!>' ).join( ' ' );

				// Get args
				var ind = args[ 2 ].indexOf( '=' );
				if( ind < 0 )
					return callback( false, { response: "Could not set info. Please specify file, key and value." } );
				o.key = args[ 2 ].substr( 0, ind );
				o.value = args[ 2 ].substr( ind + 1, args[ 2 ].length - ind );

				// Execute!
				var l = new Library( 'system.library' );
				l.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						return callback( true, { response: "Info was set." } );
					}
					return callback( false, { response: "Could not set info on " + o.path } );
				}
				l.execute( 'file/infoset', o );
			}
			m.execute( 'file/dir', { path: shell.currentPath } );
		},
		'info': function( args, callback )
		{
			var path = args[ 1 ];
			
			if( !path || path.indexOf( ':' ) <= 0 )
			{
				var l = shell.currentPath.substr( shell.currentPath.length - 1 );
				if( l == ':' )
					path = shell.currentPath + path;
				else if( l != '/' )
					path = shell.currentPath + '/' + path;
			}
			if( path.indexOf( ':' ) <= 0 ) path = shell.currentPath;

			FriendDOS.getFileInfo( path, function( e, d )
			{
				if( !e )
				{
					return callback( false, { response: 'Could not get file information.' } );
				}
				else
				{
					try
					{
						d = JSON.parse( d );
						var output = '';
						for( var z in d )
						{
							output += '<div class="Container">' + z + ': ';
							switch( z )
							{
								default:
									output += d[z];
									break;
							}
							output += '</div>';
						}
						return callback( true, { response: output } );
					}
					catch( e )
					{
						return callback( false, { response: 'Could not parse file information.' } );
					}
				}
			} );
		},		
		'kill': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Kill is not authorised by host.' } );

			apiWrapper( { data: JSON.stringify( {
				applicationName: shell.app.applicationName,
				applicationId: shell.app.applicationId,
				type: 'system', command: 'kill', appName: args[ 1 ], callbackId: addWrapperCallback( callback )
			} ) } );
			return callback( false, { response: 'Killed ' + args[ 1 ] + '.' } );
		},		
		'launch': function( args, callback )
		{
			if( args.length >= 2 )
			{
				function cbn( msg )
				{
					callback( msg.data, msg.error );
				}
				var args2 = '';
				for( var z = 2; z < args.length; z++ )
					args2 += ( z > 2 ? ' ' : '' ) + args[ z ];

				return ExecuteApplication( args[ 1 ], args2, cbn );
			}
			return callback( true );
		},
		'leave': function( args, callback )
		{
			if( shell.previousPath )
			{
				// Restricted path (for use with FriendNetwork)
				if ( shell.restrictedPath )
					if ( shell.previousPath.indexOf( shell.restrictedPath ) < 0 )
						return callback( false, { response: 'Host forbids to leave ' + shell.currentPath } );

				// TODO: Perhaps have a history here!
				var tp = shell.currentPath;
				shell.currentPath = shell.previousPath;
				shell.previousPath = tp;
				return callback( false, { path: shell.currentPath } );
			}
			return callback( true );
		},
		'list': function( args, callback )
		{
			var path = ( typeof( args[ 1 ]) != 'undefined' && args[ 1 ].length ) ? args[ 1 ] : shell.currentPath;
 
			if( path.indexOf( ':' ) < 0 )
			{
				var cp = shell.currentPath;
				var ssign = cp.substr( cp.length - 1 );
				path = shell.currentPath + ( ( ssign != ':' && ssign != '/' ) ? '/' : '' ) + path;
			}
			if( path.substr( path.length - 1, 1 ) != ':' && path.substr( path.length - 1, 1 ) != '/' )
				path += '/';


			path = path.split( '<!--space--!>' ).join( ' ' );

			shell.getDirectory( path, function( doorItem, data )
			{
				// We got data
				if( data && data.length )
				{
					var str = '';
					var now = new Date();
					now = now.getFullYear() + '-' + PadList( now.getMonth() + 1, 2, 'right', '0' )  + '-' + PadList( now.getDay(), 2, 'right', '0' ) + ' 00:00:00';
					for( var c = 0; c <= 1; c++ )
					{
						for( var a = 0; a < data.length; a++ )
						{
							if( !data[a].DateCreated )
								if( data[a].DateModified )
									data[a].DateCreated = data[a].DateModified;
							else
								data[a].DateCreated = now;

							var fnam = '';
							if( data[a].Type != 'Directory' )
							{
								fnam = data[a].Filename ? data[a].Filename : data[a].Title;
							}
							else
							{
								fnam = data[a].Title ? data[a].Title : data[a].Filename;
							}
							var date = data[a].DateCreated.split( ' ' );
							var today = ( new Date() ); today = today.getFullYear() + '-' + ( PadList( today.getMonth() + 1 + '', 2, 'right', '0', false ) ) + '-' + PadList( today.getDate() + '', 2, 'right', '0', false );
							if( today == date[0] )
								date[0] = i18n( 'i18n_today' );
							date = PadList( date[0], 10, 'right', '&nbsp;', false ) + ' &nbsp;' + date[1];

							var permz = '-----';
							if( data[a].Permissions )
							{
								if( typeof( data[a].Permissions ) == 'string' )
								{
									permz = data[a].Permissions.toLowerCase();
								}
								else
								{
									permz = '*****'; // Not supported yet..
								}

								// Flatten permissions (user,group,others -> combined)
								permz = permz.split( ',' );
								var out = '-----';
								for( var i = 0; i < permz.length; i++ )
								{
									var tmp = '';
									for( var f = 0; f < permz[i].length; f++ )
									{
										if( out.substr( f, 1 ) == '-' && permz[i].substr( f, 1 ) != '-' )
										{
											tmp += permz[i].substr( f, 1 );
										}
										else
										{
											tmp += out.substr( f, 1 );
										}
									}
									out = tmp;
								}
								permz = out;
							}

							if( c === 0 && data[a].Type == 'Directory' )
							{
								str += '<div class="Container">' + PadList( fnam + '/', 30 ) + ' ' + PadList( 'Dir', 13, 'right' ) + '&nbsp; ' + permz + ' &nbsp;' + date + "</div>";
							}
							else if ( c == 1 && data[a].Type != 'Directory' )
							{
								str += '<div class="File">' + PadList( fnam, 30 ) + ' ' + PadList( humanFilesize( data[a].Filesize ), 13, 'right' ) + '&nbsp; ' + permz + ' &nbsp;' + date + "</div>";
							}
						}
					}
					return callback( true, { response: str } );
				}
				// We have empty list
				else if( data )
				{
					return callback( false, { response: 'Empty directory.' } );
				}
				// Error never should be here.
				else
				{
					return callback( false, { response: 'Invalid path.' } );
				}
				return callback( false, { response: 'Invalid path.' } );
			}, { details: true } );
		},
		'ls': function( args, callback )
		{
			this[ 'list' ]( args, callback );
		},
		// Create a new directory!
		'makedir': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Makedir is not authorised by host.' } );

			var cdr = shell.currentPath;
			var chk = cdr.substr( cdr.length - 1, 1 );
			if( chk != ':' && chk != '/' ) cdr += '/';
			var npath = cdr;
			var dir = args[1].split( '<!--space--!>' ).join( ' ' );
			if( dir.indexOf( ':' ) > 0 )
			{
				npath = dir;
				var chark = dir.substr( dir.length - 1, 1 );
				if( chark != ':' && chark != '/' ) dir += '/';
				cdr = dir;
			}
			else cdr += dir;
			var d = ( new Door() ).get( npath );

			d.dosAction( 'makedir', { path: cdr }, function()
			{
				// TODO: Do some error handling
				callback( true );
			} );
		},
		'mount': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Mount is not authorised by host.' } );

			if( args.length < 2 || ( args.length == 2 && args[ 1 ].indexOf( ':' ) < 0 ) )
			{
				return callback( false, { response: 'Syntax error. Usage:<br>mount [disk:]<br>' } );
			}
			var l = new Library( 'system.library' );
			l.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					return callback( false, { response: 'Could not mount disk ' + args[ 1 ] + '<br>' } );
				}
				Workspace.getMountlist();
				return callback( true, { response: 'Disk ' + args[ 1 ] + ' mounted.<br>' } );
			}
			l.execute( 'device/mount', { devname: args[ 1 ], sessionid: Workspace.sessionid } );
		},
		'mountlist': function( args, callback )
		{
			if( args.length > 2 || ( args.length == 2 && args[ 1 ] != 'unmounted' ) )
				return callback( false, { response: 'Syntax error. Usage:<br>mountlist [unmounted]<br>' } );

			if( args.length == 2 && args[ 1 ] == 'unmounted' )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e != 'ok' )
					{
						return callback( false, { response: 'No unmounted disks available.' } );
					}
					var rows = JSON.parse( d );
					var disks = PadList( 'Volumes:', 25, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
						        PadList( 'Type:', 20, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
						        PadList( 'Visible:', 11, 'left', '&nbsp;' ) + '<br>';
					disks +=   '<br>';
					var diskcount = 0;
					for( a = 0; a < rows.length; a++ )
					{
						var cfg = false;
						if( rows[a].Config && rows[a].Config.indexOf( '{' ) >= 0 )
							cfg = JSON.parse( rows[a].Config );
						if( rows[a].Mounted == '1' ) continue;
						disks += '<div class="Container">' +
						    PadList( rows[a].Name + ':', 25, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
							PadList( rows[a].Type, 20, 'left', '&nbsp;' ) + '&nbsp;&nbsp' +
							PadList( cfg && cfg.Invisible == 'Yes' ? 'hidden' : 'yes', 10, 'right', '&nbsp;' ) + '</div>';
						diskcount++;
					}
					callback( true, { response: disks + '<br>' + 'Found ' + diskcount + ' unmounted disk(s) in mountlist.' } );
				}
				m.execute( 'mountlist', {} );
			}
			else
			{
				Workspace.getMountlist( function( rows )
				{
					if ( !shell.workspace )
					{
						var disks = PadList( 'Volumes:', 25, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
							        PadList( 'Handler:', 20, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
							        PadList( 'Visible:', 11, 'left', '&nbsp;' ) + '<br>';
						disks +=   '<br>';
						var diskcount = 0;
						for( var a = 0; a < rows.length; a++ )
						{
							if( rows[a].Mounted != '1' ) continue;
							if( !rows[a].Volume ) continue;
							disks += '<div class="Container">' +
							    PadList( rows[a].Volume, 25, 'left', '&nbsp;' ) + '&nbsp;&nbsp;' +
								PadList( rows[a].Handler, 20, 'left', '&nbsp;' ) + '&nbsp;&nbsp' +
								PadList( rows[a].Visible ? 'yes' : 'hidden', 10, 'right', '&nbsp;' ) + '</div>';
							diskcount++;
						}
						callback( true, { response: disks + '<br>' + 'Found ' + diskcount + ' disk(s) in mountlist.' } );
					}
					else
					{
						callback( true, rows );
					}
				} );
			}
		},
		'protect': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Protect is not authorised by host.' } );

			// Find filename, then flags
			// Usage: protect myfile rwd
			var fn = '';
			var flags = '';
			for( a = 1; a < args.length; a++ )
			{
				if( !fn && args[ a ].indexOf( '=' ) < 0 )
				{
					fn = args[ a ];
				}
				// current user flags straight forward
				else if( !flags && args[ a ].indexOf( '=' ) < 0 )
				{
					flags = args[ a ];
					break;
				}
			}

			if( fn.indexOf( ':' ) < 0 )
			{
				fn = shell.currentPath + fn;
			}

			var uf = false, gf = false, of = false;

			if( shell.parsedObj.vars.user )
				uf = shell.parsedObj.vars.user;
			if( shell.parsedObj.vars.group )
				gf = shell.parsedObj.vars.group;
			if( shell.parsedObj.vars.others )
				of = shell.parsedObj.vars.others;

			if( fn && ( flags || uf || gf || of ) )
			{
				// Put the flags in the right format
				var finalFlags = '';

				var data = {
					user: ( flags ? flags : ( uf ? uf : '' ) ).toLowerCase(),
					group: ( gf ? gf : '' ).toLowerCase(),
					others: ( of ? of : '' ).toLowerCase()
				};

				var all = {};

				// Go through users-others
				for( var g in data )
				{
					if( !data[ g ].length ) continue;
					all[ g ] = '';
					var perms = { a: '-', r: '-', w: '-', e: '-', d: '-' };
					for( a = 0; a < data[ g ].length; a++ )
					{
						perms[ data[ g ][ a ] ] = data[ g ][ a ] ? data[ g ][ a ] : '-';
					}
					for( a in perms )
					{
						all[ g ] += perms[ a ];
					}
					all[ g ] = Trim( all[ g ] ); // Remove whitespace
				}

				all.path = fn;

				// Execute!
				var l = new Library( 'system.library' );
				l.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						shell.lastErrorMessage = 'Your last call succeeded.';
						return callback( true, { response: "Permissions were set." } );
					}
					shell.lastErrorMessage = 'Your attempt to change the permissions on the file failed because of an access restriction.';
					return callback( false, { response: "Could not set permissions on file." } );
				}
				l.execute( 'file/protect', all );
				return;
			}
			shell.lastErrorMessage = 'Your protect call had a syntax error.';
			return callback( false, { response: "Error in protect query." } );
		},
		'rename': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Rename is not authorised by host.' } );

			if( args.length == 3 || ( args.length == 4 && args[ 2 ] == 'to' ) )
			{
				var src = args[ 1 ];
				var dst = args[ 2 ];
				if( args.length == 4 && args[ 2 ] == 'to' )
					dst = args[ 3 ];

				var dstVolume = '';
				var srcVolume = '';

				if( dst.indexOf( ':' ) > 0 )
					dstVolume = dst.split( ':' )[0] + ':';
				else dst = shell.currentPath + dst;
				if( src.indexOf( ':' ) > 0 )
					srcVolume = src.split( ':' )[0] + ':';
				else src = shell.currentPath + src;

				// Make sure we convert space placeholder
				src = src.split( '<!--space--!>' ).join( ' ' );
				dst = dst.split( '<!--space--!>' ).join( ' ' );

				if( dstVolume == srcVolume || !dstVolume )
				{
					var newname = dst.split( ':' )[ 1 ];
					newname = newname.split( '/' );
					newname = newname[ newname.length - 1 ];

					var doorSrc = ( new Door() ).get( src );

					doorSrc.dosAction( 'rename', { path: src, newname: newname }, function()
					{
						callback( false, { response: 'Renamed file to ' + dst + '..' } );
					} );
				}
				else
				{
					callback( false, { response: 'Could not understand source and/or destination filename.' } );
				}
			}
			else
			{
				callback( false, { response: 'Usage: rename source:path/file (to) destination:path/' } );
			}
		},
		'say': function( args, callback )
		{
			var args2 = [];
			for( a = 1; a < args.length; a++ )
				args2.push( args[ a ].split( '<!--space--!>' ).join( ' ' ) );
			var str = args2.join( ' ' );
			SayWithText( shell.parseVariables( str ) );
			return callback( true );
		},
		'status': function( args, callback )
		{
			apiWrapper( { data: JSON.stringify( {
				applicationName: shell.app.applicationName,
				applicationId: shell.app.applicationId,
				type: 'system', command: 'listapplications', callbackId: addWrapperCallback( callback )
			} ) } );
		},
		'tinyurl': function( args, callback )
		{
			if( args.length >= 2 )
			{
				var post = { source: args[ 1 ] };
				if( args.length > 2 )
					post.expire = args[ 2 ];

				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					var r = false;
					try
					{
						r = JSON.parse( d );
					}
					catch( e ){};

					if( e != 'ok' )
					{
						callback( false, { response: 'Failed to set tinyurl: ' + ( r ? r.response : 'unknown error' ) } );
					}
					else
					{
						callback( false, { response: 'Generated unique hash for url: ' + ( r ? r.hash : 'unknown error' ) } );
					}
				}
				m.execute( 'tinyurl', post );
			}
			else
			{
				dcallback( false, { response: "Syntax: tinyurl url boolean_expire" } );
			}
		},
		'type': function( args, callback )
		{
			if( args.length == 2 )
			{
				var p = args[ 1 ];
				if( p.indexOf( ':' ) <= 0 )
					p = shell.currentPath + p;

				var f = new File( p );
				f.onLoad = function( data )
				{
					callback( false, { response: data.split( "\n" ).join( "<br>" ) } );
				}
				f.load();
			}
			else
			{
				
				callback( false, { response: 'Usage: cat filename' } );
			}
		},
		'unmount': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Unmount is not authorised by host.' } );

			if( args.length < 2 || ( args.length == 2 && args[ 1 ].indexOf( ':' ) < 0 ) )
			{
				return callback( false, { response: 'Syntax error. Usage:<br>unmount [disk:]<br>' } );
			}
			var l = new Library( 'system.library' );
			l.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					return callback( false, { response: 'Could not unmount disk ' + args[ 1 ] + '<br>' } );
				}
				Workspace.refreshDesktop( false, true ); // Badabish
				return callback( true, { response: 'Disk ' + args[ 1 ] + ' unmounted.<br>' } );
			}
			l.execute( 'device/unmount', { devname: args[ 1 ], sessionid: Workspace.sessionid } );
		},
		'wait': function( args, callback )
		{
			time = 0;
			if( parseInt( args[ 1 ] ) > 0 )
				time = parseInt( args[ 1 ] );
			return setTimeout( function()
			{
				callback();
			}, time );
		},
		'why':function( args, callback )
		{
			if( shell.lastErrorMessage )
			{
				callback( false, { response: shell.lastErrorMessage } );
				shell.lastErrorMessage = '';
				return;
			}
			return callback( false, { response: 'No explanation available.' } );
		},
		'input': function( args, callback )
		{
			if( args[ 1 ] == 'on' )
			{
				shell.input = null;
				return callback( false, { input: 'on' } );
			}
			else if( args[ 1 ] == 'off' )
			{
				shell.input = 'off';
				return callback( false, { input: 'off' } );
			}
			return callback( false );
		},
		'install': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Install is not authorised by host.' } );

			if( args.length <= 1 )
			{
				return callback( false, 'Please tell me which application you wish to install.' );
			}
			else
			{
				// We are installing a friend package
				if( args[ 1 ] == 'package' && args.length == 3 )
				{
					var p = args[ 2 ];
					if( p.indexOf( ':' ) <= 0 )
						p = shell.currentPath + p;
					
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e != 'ok' )
						{
							callback( false, { response: 'Failed to install package ' + args[ 2 ] } );
						}
						else
						{
							callback( true, { response: 'The package, ' + args[ 2 ] + ', was successfully installed.' } );
						}
					}
					m.execute( 'installpackage', { path: p } );
				}
				else
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							return callback( true, 'Installed or upgraded in the future.' );
						}
						else
						{
							return callback( false, 'Failed to install ' + args[ 1 ] + '.' );
						}
					}
					m.execute( 'install', { application: args[ 1 ] } );
				}
			}
		},		
		'endcli': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Endcli/Exit is not authorised by host.' } );

			FriendDOS.delSession( shell.uniqueId );
			return callback( true, 'quit' );
		},
		'exit': function( args, callback )
		{
			this[ 'endcli' ]( args, callback );
		},
		'cli': function( args, callback ) 
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Cli/Newcli is not authorised by host.' } );

			apiWrapper( { data: JSON.stringify( {
				applicationName: shell.app.applicationName,
				applicationId: shell.app.applicationId,
				type: 'system',
				command: 'executeapplication',
				executable: 'Shell',
				fin_args: ''
			} ) } );
			return callback( true, { response: 'New shell launched.' } );
		},
		'newcli': function( args, callback )
		{
			this[ 'cli' ]( args, callback );
		},
		'deletemount': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'deletemount is not authorised by host.' } );
			
			if( args.length != 2 )
			{
				return callback( false, { response: 'Syntax error. Usage:<br>deletemount [disk:]<br>' } );
			}
			else
			{
				var l = new Library( 'system.library' );
				l.onExecuted = function( e, d )
				{	
					Workspace.refreshDesktop( false, true ); // Badabish
					
					var m = new Module( 'system' );
					m.onExecuted = function( e, dat )
					{
						var ll = new Library( 'system.library' );
						ll.execute( 'device/refreshlist', { sessionid: Workspace.sessionid } );
						setTimeout( function()
						{
							return callback( true, { response: 'Disk mount ' + args[ 1 ] + ' deleted.<br>' } );
						}, 250 );
					}
					m.execute( 'deletedoor', { devname: args[ 1 ].split( ':' )[ 0 ], sessionid: Workspace.sessionid } );
				}
				l.execute( 'device/unmount', { devname: args[ 1 ].split( ':' )[ 0 ], sessionid: Workspace.sessionid } );
			}
		},
		'metainfo': function( args, callback )
		{
			// Get command
			var command = false;
			var options = [ 'get', 'set', 'list' ];
			for( a = 0; a < options.length; a++ )
			{
				if( args[ 1 ] == options[ a ] )
				{
					command = options[ a ];
					break;
				}
			}
			if( !command )
				return callback( false, { response: 'Command not recognized. Usage: metainfo get|set|list filename (key=value)' } );

			var filename = false;
			var variable = false;
			var data = false;

			// Get the rest
			for( a = 2; a < args.length; a++ )
			{
				if( args[ a ].indexOf( '=' ) > 0 )
				{
					var pair = args[ a ].split( '=' );
					variable = pair[ 0 ];
					pair[ 0 ] = '';
					pair = pair.join( '=' );
					pair = pair.substr( 1, pair.length - 1 );
					data = pair.split( '<!--space--!>' ).join( ' ' );
				}
				else filename = args[ a ];
			}

			if( filename && filename.indexOf( ':' ) < 0 )
			{
				filename = shell.currentPath + filename;
			}

			if( filename )
			{
				var d = ( new Door() ).get( filename );
				if( d )
				{
					return d.dosAction( 'metainfo', { path: filename, command: command, variable: variable, data: data }, function( e )
					{
						if( e )
						{
							return callback( true, false );
						}
						return callback( false, { response: 'Failed to execute.' } );
					} );
				}
			}
			return callback( false, { response: 'Command not recognized. Usage: metainfo get|set|list filename (key=value)' } );
		},
		'move': function( args, callback )
		{
			if ( shell.restrictedPath )
				return callback( false, { response: 'Move is not authorised by host.' } );

			if( args.length >= 3 )
			{
				shell.terminate = true;

				var start = 1;
				var recursive = false;

				// check recursive
				if( ( args[ 0 ] + ' ' + args[ 1 ] ).toLowerCase() == 'move all' )
				{
					start++;
					recursive = true;
				}

				var src = args[ start ];

				if( src.indexOf( ':' ) < 0 ) 
					src = shell.currentPath + src;

				var dst = args[ start + 1 ].toLowerCase() == 'to' ? args[ start + 2 ] : args[ start + 1 ];

				if( dst.indexOf( ':' ) < 0 ) 
					dst = shell.currentPath + dst;

				// 'all' on the end
				if( !recursive ) 
					recursive = args[ args.length - 1 ].toLowerCase() == 'all' ? true : false;

				FriendDOS.copyFiles( src, dst, { recursive: recursive, move: true }, function( result, done )
				{
					if( !done ) 
						done = false;
					callback( false, { response: result, done: done } );
				} );
			}
			else
			{
				callback( false, { response: 'Usage: move (all) source:path/or/file (to) destination:path/' } );
			}
		},
		'ln': function( args, callback )
		{
			if( args.length >= 3 )
			{
				var start = 1;

				var src = args[ start ];

				if( src.indexOf( ':' ) < 0 ) 
					src = shell.currentPath + src;

				var dst = args[ start + 1 ].toLowerCase() == 'to' ? args[ start + 2 ] : args[ start + 1 ];

				if( dst.indexOf( ':' ) < 0 ) 
					dst = shell.currentPath + dst;

				if( dst )
				{
					var d = ( new Door() ).get( dst );
					if( d )
					{
						return d.dosAction( 'link', { from: src, to: dst }, function( e )
						{
							if( e )
							{
								return callback( true, false );
							}
							return callback( false, { response: 'Failed to execute.' } );
						} );
					}
				}
			}
			return callback( false, { response: 'Command not recognized.' } );
		},
		'link': function( args, callback )
		{
			this[ 'ln' ]( args, callback );
		},
		'symlink': function( args, callback )
		{
			this[ 'ln' ]( args, callback );
		},
		'fnet': function( args, callback )
		{
			switch ( args[ 1 ] )
			{
				case 'list':
					return callback('friendnetworklist');
				case 'host':
					if ( args.length < 3 )
						return callback( false, { response: 'Syntax: friendnetwork host "hostname".' } );
					return callback( false, 
					{
						command: 'friendnetworkhost',
						name:    args[ 2 ],
						password: args[ 3 ]
					});
				case 'dispose':
					if ( args.length < 3 )
						return callback( false, { response: 'Syntax: friendnetwork dispose "hostname".' } );
					return ( false, 
					{
						command: 'friendnetworkdispose',
						name:    args[ 2 ]
					});
				case 'connect':
					if ( args.length < 3 )
						return callback( false, { response: 'Syntax: friendnetwork connect "hostname".' } );
					var p2p = false;
					if ( args.length == 4 && args[ 3 ] == 'p2p' )
						p2p = true;
					return callback(false, 
					{
						command: 'friendnetworkconnect',
						name:    args[ 2 ],
						p2p:	 p2p
					});
				case 'password':
					if ( args.length < 4 )
						return callback(false, { response: 'Syntax: friendnetwork dispose "hostname".' } );
					return callback( false, 
					{
						command: 'friendnetworksetpassword',
						name:    args[ 2 ],
						password: args[ 3 ]
					});
					break;
				case 'disconnect':
					shell.skipClient = true;
					return callback(false, { command: 'friendnetworkdisconnect' });
				case 'status':
					return callback(false, { command: 'friendnetworkstatus' });
				default:
					return callback(false, { response: 'Syntax error.' } );
			}
		},
		'friendnetwork': function( args, callback )
		{
			this[ 'fnet' ]( args, callback );
		},
		'unify': function( args, callback )
		{
			callback( false, { response: 'Please wait for this feature!' } );
		}
	};
};

/* Global dos object that manages all dos sessions */

window.FriendDOS =
{
	sessions: [],
	// Copy files with option flags
	copyFiles: function( src, dest, flags, callback, depth, copyObject )
	{
		// Do we want to move the files?
		var move = flags && flags.move ? true : false;

		// Setup copyobject!
		if( !copyObject ) 
		{
			copyObject = {
				copyCounter: 0, // Done copying files
				copyTotal: 0,   // Files copying in progress
				copyDepth: 0,    // Swipe depth
				callback: callback,
				test: function()
				{
					if( this.copyCounter == this.copyTotal && this.copyDepth === 0 )
					{
						if ( move )
							this.callback( 'Done moving ' + this.copyTotal + ' files.', true );
						else
							this.callback( 'Done copying ' + this.copyTotal + ' files.', true );
					}
					//console.log( 'Copying files: ' + this.copyCounter + ' / ' + this.copyTotal + ' at depth ' + this.copyDepth );
				}
			};
		}

		// Verified destinations are passing
		if( flags.verifiedDestination )
		{
			cfcbk( src, dest, flags, callback, depth );
		}
		// Unverified are verified first
		else
		{
			if( dest.substr( dest.length - 1, 1 ) == ':' )
			{
				if( flags ) flags.verifiedDestination = true;
				else flags = { verifiedDestination: true };
				cfcbk( src, dest, flags, callback, depth );
			}
			else
			{
				FriendDOS.getFileInfo( dest, function( e, d )
				{
					if( e )
					{
						var f = false;
						try
						{
							 f = JSON.parse( d );
						}
						catch( e )
						{
							return callback( 'Failed to get file info on ' + dest, { done: true } );
						}
						if( f && f.Type == 'Directory' && dest.substr( dest.length - 1, 1 ) != '/' )
							dest += '/';
						if( flags ) flags.verifiedDestination = true;
						else flags = { verifiedDestination: true };
					}
					cfcbk( src, dest, flags, callback, depth );
					/*
					if( !e ) return callback( 'Failed to copy files.', { done: true } );
					var f = false;
					try
					{
						 f = JSON.parse( d );
					}
					catch( e )
					{
						return callback( 'Failed to get file info on ' + dest, { done: true } );
					}
					if( f && f.Type == 'Directory' && dest.substr( dest.length - 1, 1 ) != '/' )
						dest += '/';
					if( flags ) flags.verifiedDestination = true;
					else flags = { verifiedDestination: true };
					cfcbk( src, dest, flags, callback, depth );
					*/
				} );
			}
		}

		// Actual working code
		function cfcbk( src, dest, flags, cb, depth )
		{
			var self = this;

			if (!depth)
   			{
    			depth = 0;
    			if( move )
				{
					window.moveFiles = { fileArray: [], dirArray: [], counter: 0 };
				}
   			}

			// Get door objects
			var doorSrc = ( new Door() ).get( src );
			var doorDst = ( new Door() ).get( src );
			if( move ) window.moveFiles.doorSrc = doorSrc;

			// Don't copy to self
			if ( src == dest )
				return false;

			// Check what type source and destination is
			var pthTest = src;

			// Get without trailing forward slash so we get the parent folder
			if( src.substr( src.length - 1, 1 ) == '/' )
			{
				pthTest = src.substr( 0, src.length - 1 );
			}

			// Get parent
			if( pthTest.indexOf( '/' ) > 0 )
			{
				pthTest = pthTest.split( '/' );
				pthTest.pop();
				pthTest = pthTest.join( '/' );
			}
			else
			{
				pthTest = pthTest.split( ':' )[0] + ':';
			}

			// Correct path
			var ptsg = pthTest.substr( pthTest.length - 1, 1 );
			if( ptsg != ':' && ptsg != '/' ) pthTest += '/';

			doorSrc.path = pthTest;

			//console.log( 'So, getting icons on: ' + pthTest );
			if( move ) window.moveFiles.counter++;
			doorSrc.getIcons( false, function( data )
			{
				var abort = false;

				// TODO: Support #? and * wildcards
				for( var a = 0; a < data.length && !abort; a++ )
				{
					//console.log( '>>> Examining: ' + data[a].Path );
					// Make a trim
					var compare = data[a].Path;
					if(
						data[a].Path.substr( data[a].Path.length - 1, 1 ) == '/' &&
						src.substr( src.length - 1, 1 ) != '/'
					)
					{
						compare = compare.substr( 0, compare.length - 1 );
					}

					// We have a match with the path we want to copy!
					if( compare == src )
					{
						// Recurse into directories (copy a directory)
						if( data[a].Type == 'Directory' || data[a].Type == 'Door' )
						{
							var dsign = dest.substr( dest.length - 1, 1 );
							if( dsign != ':' && dsign != '/' ) dsign = '/'; else dsign = '';

							var destination = dest + dsign + data[a].Filename + '/';
							var p = data[a].Path;

							if( move )
			    			{
				    			window.moveFiles.dirArray.push(p);
				    			window.moveFiles.counter++;
			    			}

			    			// Assume the destination directory does not exist
							doorSrc.dosAction( 'makedir', { path: destination }, function()
							{
								if( move ) window.moveFiles.counter--;
								var d = ( new Door() ).get( p );
								if( move ) window.moveFiles.counter++;
								// Get source directory
								d.getIcons( p, function( subs )
								{
									function CopyAndCallback( dcp, dfn, move )
									{
										if( move )
										{
											window.moveFiles.fileArray.push({ source: dcp, destination: destination + dfn });
											window.moveFiles.counter++;
										}
										doorSrc.dosAction( 'copy', { from: dcp, to: destination + dfn }, function( result )
										{
											if( move )
											{
												window.moveFiles.counter--;
												callback( 'Moved ' + dcp + ' to ' + destination + dfn );
											}
											else
											{
												callback( 'Copied ' + dcp + ' to ' + destination + dfn );
											}
											copyObject.copyCounter++;
											copyObject.test();
										} );
									}

									for( var c = 0; c < subs.length; c++ )
									{
										if( subs[c].Type == 'File' )
										{
											copyObject.copyTotal++;
											CopyAndCallback( subs[c].Path, subs[c].Filename, move );
										}
										else
										{
											if( flags && flags.recursive == true )
											{
												var p = subs[c].Path;
												var psign = p.substr( p.length - 1, 1 );
												if( psign != ':' && psign != '/' ) p += '/';

												//console.log( 'Foodah! Recursing on ' + p + "! Because of recursion: " + flags.recursive + "\n" );
												FriendDOS.copyFiles( p, destination, flags, callback, depth + 1, copyObject );
											}
											else
							    			{
								    			if( move ) window.moveFiles.noDeleteRoot = true;
							    			}
										}
									}
									if( move ) window.moveFiles.counter--;
								} );
							} );
						}
						// Copy single file
						else
						{
							copyObject.copyTotal++;
							var destination = dest + data[a].Filename;
							if( move )
							{
								window.moveFiles.fileArray.push( { source: src, destination: destination } );
								window.moveFiles.counter++;
							}
							doorSrc.dosAction( 'copy', { from: src, to: destination }, function( result )
							{
								if( move )
								{
									callback( 'Moved ' + src + ' to ' + destination + '..' );
								}
								else
								{
									callback( 'Copied ' + src + ' to ' + destination + '..' );
								}
								// Upon fail! Just piss.
								if( 1 == 2 ) abort = true;

								copyObject.copyCounter++; copyObject.test();
							} );
						}
					}
				}
				if( move ) window.moveFiles.counter--;
			} );
			if( move && depth === 0 )
   			{
	   			setTimeout( FriendDOS.checkMove, 100 );
   			}
		}
	},
	checkMove: function()
	{
		if (window.moveFiles.counter > 0)
		{
			setTimeout(FriendDOS.checkMove, 100);
			return;
		}

		var move = window.moveFiles;
		if (!move.currentSrceSize)
		{
			move.fileCount = move.fileArray.length;
			move.currentSrceSize = [];
			move.currentDestSize = [];
			for (var count = 0; count < move.fileArray.length; count++)
			{
				move.currentSrceSize[count] = -1;
				move.currentDestSize[count] = -1;
				move.doorSrc.dosAction( 'info', {path: move.fileArray[count].source}, function (data)
				{
					if( data.substr( 0, 2 ) == 'ok' )
					{
						var move = window.moveFiles;
						if (move)
						{
							var info = data.split( '<!--separate-->' )[ 1 ];
							info = JSON.parse( info );
							for (var a = 0; a < move.fileArray.length; a++)
							{
								if (info.Path == move.fileArray[a].source)
									break;
							}
							move.currentSrceSize[a] = info.Filesize;
						}
					}
				});
			}
		}
		for( count = 0; count < move.fileArray.length; count++ )
		{
			if( move.currentDestSize[ count ] == -1)
			{
				// Directories
				move.doorSrc.dosAction( 'info', { path: move.fileArray[ count ].destination }, function( data )
				{
					if( data.substr(0, 2) == 'ok' )
					{
						var move = window.moveFiles;
						if (move)
						{
							var info = data.split('<!--separate-->')[1];
							info = JSON.parse( info );
							for (var a = 0; a < move.fileArray.length; a++)
							{
								if (info.Path == move.fileArray[a].destination)
									break;
							}
							move.currentDestSize[a] = info.Filesize;
						}
					}
				} );
			}

			if (move.currentSrceSize[count] >= 0 && move.currentDestSize[count] >= 0 && move.currentSrceSize[count] == move.currentDestSize[count] )
			{
				// Delete source file
				move.doorSrc.dosAction( 'delete', { path: move.fileArray[count].source, notrash: true }, function( result )
				{
				} );
				move.currentSrceSize[count] = move.currentDestSize[count] = -2;
				move.fileArray[count].source = '';
				move.fileArray[count].destination = '';
				move.fileCount--;
			}
		}
		if (move.fileCount > 0)
			setTimeout(FriendDOS.checkMove, 100);
		else
		{
			// Delete directories
			if ( !move.noDeleteRoot )
			{
				for (var count = move.dirArray.length - 1; count >= 0; count--)
				{
					move.doorSrc.dosAction('delete', {path: move.dirArray[count], notrash: true}, function (result)
					{
					});
				}
			}
			window.moveFiles = false;
		}
	},
	// Delete files with option flags
	// src is what to delete (path)
	// flags, how to delete, and some extra temp info
	// callback, what to do after delete
	// depth, how deep we've recursed into directories
	deleteFiles: function( src, flags, callback, depth )
	{
		var self = this;
		if( !depth ) depth = 0;
		if( !flags ) flags = {};

		// Remove temporary spaces
		src = src.split( '<!--space--!>' ).join( ' ' );

		// Keep track of stuff!
		if( depth === 0 )
		{
			flags._startedCleanup = false;
			flags._dirsToDelete = [];
			flags._activeProcesses = 0;
			flags._originalCallback = callback;
			flags._cleanup = function()
			{
				if( this._activeProcesses != 0 )
				{
					//console.log( 'Not ready to clean up. Still ' + this._activeProcesses + ' left.' );
					return;
				}
				//console.log( 'Starting on _cleanup process.' );

				if( !this._startedCleanup )
				{
					this._folderCount = this._dirsToDelete.length;
					this._startedCleanup = true;
				}

				// Delete five directories at a time
				var ceiling = 5;
				var out = [];
				if( this._dirsToDelete && this._dirsToDelete.length )
				{
					for( var a = this._dirsToDelete.length - 1; a >= 0; a-- )
					{
						if( ceiling-- > 0 )
						{
							//console.log( 'Executing delete on ' + this._dirsToDelete[a] );
							doorSrc.dosAction( 'delete', { path: this._dirsToDelete[a], notrash: flags.notrash }, function( result )
							{
								if( flags._dirsToDelete.length > 0 )
								{
									// Next!
									console.log( 'Respawning cleanup!' );
									flags._cleanup();
								}
								else
								{
									console.log( 'ALL DONE WITH DELETE!' );
									flags._originalCallback( 'Delete completed.' );
								}
							} );
						}
						else
						{
							out.push( this._dirsToDelete[a] );
						}
					}
					this._dirsToDelete = out;
				}
				else
				{
					flags._originalCallback( 'Delete completed.' );
				}
			}
		}

		// Get door objects
		var doorSrc = ( new Door() ).get( src );

		// Check what type source
		var pthTest = src;

		// Get without trailing forward slash so we get the parent folder
		if( src.substr( src.length - 1, 1 ) == '/' )
			pthTest = src.substr( 0, src.length - 1 );

		// Get parent
		if( pthTest.indexOf( '/' ) > 0 )
		{
			pthTest = pthTest.split( '/' );
			pthTest.pop();
			pthTest = pthTest.join( '/' );
		}
		else
		{
			pthTest = pthTest.split( ':' )[0] + ':';
		}

		// Correct path
		var ptsg = pthTest.substr( pthTest.length - 1, 1 );
		if( ptsg != ':' && ptsg != '/' ) pthTest += '/';

		doorSrc.path = pthTest;

		// Get directory listing
		doorSrc.getIcons( false, function( data )
		{
			var abort = false; // in the future, we can abort the process

			var dirCount = 0;

			// TODO: Support #? and * wildcards
			for( var a = 0; a < data.length && !abort; a++ )
			{
				// Make a trim
				var compare = data[a].Path;
				if( data[a].Path.substr( data[a].Path.length - 1, 1 ) == '/' &&
					src.substr( src.length - 1, 1 ) != '/' )
				{
					compare = compare.substr( 0, compare.length - 1 );
				}

				// We have a match!
				if( compare == src )
				{
					// Recurse into directories
					if( data[a].Type == 'Directory' || data[a].Type == 'Door' )
					{
						dirCount++;
						var p = data[a].Path;

						var d = ( new Door() ).get( p );

						// Start process getting sub folder
						flags._activeProcesses++;

						var foo = p;
						d.getIcons( p, function( subs )
						{
							flags._dirsToDelete.push( foo );
							//console.log( 'Added ' + foo + ' to dirsToDelete array...' );

							for( var c = 0; c < subs.length; c++ )
							{
								// If we have a directory/file ID, then use that instead of a whole path
								if( subs[c].Type == 'File' )
								{
									var dcp = subs[c].Path;
									var dfn = subs[c].Filename;
									// Start delete
									flags._activeProcesses++;
									doorSrc.dosAction( 'delete', { path: dcp, notrash: flags.notrash }, function( result )
									{
										flags._activeProcesses--; // Done!
										flags._cleanup();
										// Clean up when we're out of files!
									} );
								}
								else
								{
									dirCount++;
									if( flags && flags.recursive == true )
									{
										var p = subs[c].Path;
										var psign = p.substr( p.length - 1, 1 );
										if( psign != ':' && psign != '/' ) p += '/';

										// Start deleting of sub directory
										flags._activeProcesses++;
										//console.log( 'Adding another process: ' + flags._activeProcesses );
										self.deleteFiles( p, flags, function( d )
										{
											flags._activeProcesses--; // Done
											flags._cleanup();
										}, depth + 1 );
									}
								}
							}

							// We're done
							flags._activeProcesses--;
							flags._cleanup();
						} );
					}
					// Delete single file
					else
					{
						var dPath = src;

						// Start delete process
						flags._activeProcesses++;
						doorSrc.dosAction( 'delete', { path: dPath, notrash: flags.notrash }, function( result )
						{
							// Upon fail!
							if( 1 == 2 )
							{
								abort = true;
							}
							// Done
							flags._activeProcesses--;
							flags._cleanup();
						} );
					}
				}
			}
			console.log( 'Looking: do we have callback? ' + callback ? 'yes' : 'no' );
			if( callback && callback != flags._originalCallback )
			{
				console.log( 'We\'re using a unique callback.' );
				callback();
				flags._cleanup();
			}
			else
			{
				 console.log( 'We had original callback.' );
				 return;
				 //return callback();
			}
		} );
	},

	// Callback format myFunc( bool return value, data )
	getFileInfo: function( path, callback )
	{
		var l = new Library( 'system.library' );
		l.onExecuted = function( e, d )
		{
			if( callback ) callback( e == 'ok' ? true : false, d );
		}
		l.execute( 'file/info', { path: path } );
	},

	// Add a new session and return the Shell session id
	addSession: function( appObject, callback )
	{
		// Find unique shell slot number
		var available = 0, found;
		do
		{
			found = false;
			for( var c in this.sessions )
			{
				if( this.sessions[c].number == available )
				{
					found = true;
					break;
				}
			}
			if( found ) available++;
		}
		while( found );

		var a = new Shell( appObject );
		this.sessions[a.uniqueId] = a;
		this.sessions[a.uniqueId].number = available;
		if( callback ) callback( a.uniqueId );
		return a.uniqueId;
	},

	// Get a shell object
	getSession: function( sessionid )
	{
		if( typeof( this.sessions[sessionid] ) != 'undefined' )
		{
			return this.sessions[sessionid];
		}
		return false;
	},

	// Delete a shell session
	delSession: function( sessionid )
	{
		if( typeof( this.sessions[sessionid] ) != 'undefined' )
		{
			var sessions = [];
			for( var b in this.sessions )
			{
				if( b != sessionid )
				{
					sessions[b] = this.sessions[b];
				}
			}
			this.sessions = sessions;
			return true;
		}
		return false;
	},
	
	// Opens a window based on filepath (used for opening files hosted external)  
	openWindowByFilename: function( fileInfo, ext )
	{
		if( typeof( fileInfo ) === "string" )
		{
			if( !ext )
			{
				ext = fileInfo.split( '.' );
				ext = ext[ext.length-1];
			}
			
			fileInfo = {
				Extension : ext, 
				Path : fileInfo 
			};
		}
		else
		{
			if( !ext )
			{
				ext = fileInfo.Path ? fileInfo.Path.split( '.' ) : ( fileInfo.Filename ? fileInfo.Filename.split( '.' ) : fileInfo.Title.split( '.' ) );
				ext = ext[ext.length-1];
			}
		}
		
		fileInfo = {
			Title        : ( fileInfo.Title        ? fileInfo.Title        : ''     ),
			Filename     : ( fileInfo.Filename     ? fileInfo.Filename     : ''     ),
			DateCreated  : ( fileInfo.DateCreated  ? fileInfo.DateCreated  : 0      ),
			DateModified : ( fileInfo.DateModified ? fileInfo.DateModified : 0      ),
			Extension    : ( fileInfo.Extension    ? fileInfo.Extension    : ext    ),
			Filesize     : ( fileInfo.Filesize     ? fileInfo.Filesize     : 0      ),
			MetaType     : ( fileInfo.MetaType     ? fileInfo.MetaType     : 'File' ),
			Path         : ( fileInfo.Path         ? fileInfo.Path         : ''     ),
			Type         : ( fileInfo.Type         ? fileInfo.Type         : 'File' ),
			downloadhref : ( fileInfo.downloadhref ? fileInfo.downloadhref : ''     )
		};
		
		return OpenWindowByFileinfo( fileInfo );
	}
	
};
