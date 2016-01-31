/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/* Shell class for handling a DOS session */

Shell = function( appObject )
{	
	this.cmdLog = [ '' ];
	this.logPosition = 0;
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
		for( var a = 0; a < tsk.childNodes.length; a++ )
		{
			var ttt = tsk.childNodes[a];
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
		for( var a = 0; a < 4; a++ )
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
			var doors = DormantMaster.getDoors();
			if( doors )
			{
				for ( var a in doors )
				{
					if( doors[a].Title.toLowerCase() == p.toLowerCase() )
					{
						doors[a].Dormant.getDirectory( path, function( dirs )
						{
							if( callback ) callback( dirs );
						} );
						if( callback ) return callback( false );
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
	}
	
	// Gets a directory based on path and returns directory items and info
	this.getDirectory = function( path, callback )
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
						}
					}
					if( callback ) callback( info, data );
				} );
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
		} );
	}
	
	
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
	}
	
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
	}
	
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
	}
	// Parse a whole script
	this.parseScript = function( script, callback )
	{
	}
	// Preparse script to support voice commands!
	this.context = false;
	this.exeIcon = false;
	this.voiceParse = function( string, callback )
	{
		// Make sure we pop out the interface each time
		if( !( 'webkitSpeechRecognition' in window ) )
		{
			if( Doors.handsFree )
            {
                var inp = ge( 'Handsfree' ).getElementsByTagName( 'input' )[0];
                inp.blur();
                document.body.removeChild( ge( 'Handsfree' ) );
                Doors.handsFree = false;
                // TODO: Don't set the color - it's up to the theme.
                //       This is a workaround for Samsung Internet for Gear VR
                ge( 'Tray' ).getElementsByTagName( 'div' )[0].style.color = 'white';
            }
		}
		
		// Sanitize
		string = Trim( string.toLowerCase() );
		var args = string.split( ' ' );
		var arguments = '';
		for( var a = 1; a < args.length; a++ )
		{
			if( a != 1 )
				arguments += ' ';
			arguments += args[a];
		}
		
		// Check context!
		if( this.context == 'executable' )
		{
			if( !this.exeIcon || ( this.exeIcon && !this.exeIcon.domNode ) )
			{
				Say( 'I lost the executable. Reverting to standard mode.' );
				this.context = false;
				this.exeIcon = false;
				return false;
			}
			if( args[0] == 'run' )
			{
				Say( 'Running executable.' );
				this.exeIcon.domNode.ondblclick();
				return true;
			}
			else if( args[0] == 'help' )
			{
				Say( 'Can not find help information regarding this executable. Reverting to standard mode.' );
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
					Say( 'Reverting to standard mode.' );
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
				Say( 'Executed. Say stop for standard mode.' );
				return true;
			}
			this.context = false;
			this.exeIcon = false;
			Say( 'Could not understand what you wanted to do with the executable. Reverting to standard mode.' );
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
					Say( 'Your number is not recognized. Sorry, try another.' );
					return false;
			}
			args[1] = type;
		}
		
		arguments = Trim( arguments );
		switch( Trim( args[0] ) )
		{
			case 'open':
				// Try filesystems
				if( args[1] == 'volume' && typeof( args[2] != 'undefined' ) )
				{
					// Same sorting as doors desktop
					var index = parseInt( args[2] ) - 1;
				   var icons = sortArray( Doors.icons, [ 'Title', 'Filename' ] );
				   if( parseInt( args[2] ) > 0 )
				   {
					   if( parseInt( args[2] ) > icons.length )
					   {
						   Say( 'Excuse me. Can you repeat that?' );
						   return;
					   }
					   Say( 'You opened volume ' + icons[index].Volume.split(':')[0] );
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
					   for( var a = 0; a < icons.length; a++ )
					   {
						   if( icons[a].Volume.toLowerCase().split( ':' )[0] == tries[b] )
						   {
							   Say( 'You opened volume ' + icons[a].Volume.split( ':' )[0] );
							   return OpenWindowByFileinfo( icons[a] );
						   }
					   }
				   }
				   Say( 'Excuse me. Can you repeat that?' );
				   return;
				}
				else if( args[1] == 'directory' )
				{
					if( this.directoryOpen( window.currentMovable, args[2] ) )
					{
						return true;
					}
					Say( 'I can not find the directory you are looking for. Are you sure ' + args[2] + ' is found in the active view?' );
					return;
				}
				else if( args[1] == 'file' )
				{
					if( this.fileOpen( window.currentMovable, args[2] ) )
					{
						return true;
					}
					Say( 'I can not find the file you are looking for. Are you sure ' + args[2] + ' is found in the active view?' );
					return;
				}
			case 'run':
				if( arguments == 'programming application' )
				{
					ExecuteApplication( 'Artisan' );
					Say( 'You opened the programming application, Artisan.' );
					return;
				}
				else if( arguments == 'chat application' )
				{
					ExecuteApplication( 'Hello' );
					Say( 'You open the chat application, Hello.' );
					return;
				}
				else if( arguments == 'terminal application' )
				{
					ExecuteApplication( 'Shell' );
					Say( 'You open the terminal, application.' );
					return;
				}
				else if( arguments == 'document application' )
				{
					ExecuteApplication( 'Author' );
					Say( 'You opened the document application, Author.' );
					return;
				}
				break;
			case 'screen':
				// TODO: Don't accept more arguments
				if( args[1] == 'close' )
				{
					window.currentScreen.screen.close();
					Say( 'Screen closed.' );
					return true;
				}
				else if( args[1] == 'cycle' || args[1] == 'swap' )
				{
					window.currentScreen.screen.screenCycle();
					Say( 'Screens swapped.' );
					return true;
				}
				break;
			case 'switch':
				if( args.length <= 1 )
				{
					Say( 'I do not understand what you want to switch.' );
					return false;
				}
				if( args[1] == 'windows' || args[1] == 'window' )
				{
					return this.voiceParse( 'window cycle', callback );
				}
				break;
			case 'move':
				if( !window.currentMovable )
				{
					Say( 'I have no window or desklet to move.' );
					return false;
				}
				if( args[1] == 'left' )
				{
					var nl = window.currentMovable.offsetLeft - 100;
					ConstrainWindow( window.currentMovable, nl );
					Say( 'Window moved left.' );
					return false;
				}
				else if( args[1] == 'right' )
				{
					var nl = window.currentMovable.offsetLeft + 100;
					ConstrainWindow( window.currentMovable, nl );
					Say( 'Window moved right.' );
					return false;
				}
				else if( args[1] == 'up' )
				{
					var nl = window.currentMovable.offsetTop - 100;
					ConstrainWindow( window.currentMovable, false, nl );
					Say( 'Window moved up.' );
					return false;
				}
				else if( args[1] == 'down' )
				{
					var nl = window.currentMovable.offsetTop + 100;
					ConstrainWindow( window.currentMovable, false, nl );
					Say( 'Window moved down.' );
					return false;
				}
				Say( 'How do I move?' );
				return false;
				break;
			case 'scroll':
				if( !window.currentMovable && !window.currentMovable.content )
				{
					Say( 'I have no window to scroll.' );
					return false;
				}
				else if( args[1] == 'up' )
				{
					window.currentMovable.content.firstChild.scrollTop -= 100;
					Say( 'Window scrolled up.' );
					return false;
				}
				else if( args[1] == 'down' )
				{
					window.currentMovable.content.firstChild.scrollTop += 100;
					Say( 'Window scrolled down.' );
					return false;
				}
				Say( 'How do I scroll?' );
				return false;
				break;
			case 'window':
				// TODO: Don't accept more arguments
				if( args[1] == 'close' )
				{
					CloseWindow( window.currentMovable );
					Say( 'Window closed.' );
					return true;
				}
				else if( args[1] == 'cycle' || args[1] == 'swap' )
				{
					var ind = [];
					for( var a in movableWindows )
					{
						ind.push( movableWindows[a] );
					}
					for( var a = 0; a < ind.length; a++ )
					{
						if( ind[a] == window.currentMovable || !window.currentMovable )
						{
							var b = ( a - 1 ); if( b < 0 ) b = ind.length - 1;
							_WindowToFront( ind[b] );
							_ActivateWindow( ind[b] );
							Say( 'Windows swapped.' );
							return true;
						}
					}
					Say( 'Could not find any windows.' );
					return false;
				}
				break;
			case 'quit':
			case 'close':
				 if( arguments == 'programming application' )
				{
					KillApplication( 'Artisan' );
					Say( 'You quit the programming application, Artisan.' );
					return;
				}
				else if( arguments == 'chat application' )
				{
					KillApplication( 'Hello' );
					Say( 'You quit the chat application, Hello.' );
					return;
				}
				else if( arguments == 'terminal application' )
				{
					KillApplication( 'Shell' );
					Say( 'You quit the termina application.' );
					return;
				}
				else if( arguments == 'document application' )
				{
					KillApplication( 'Author' );
					Say( 'You quit the document application, Author.' );
					return;
				}
				else if( arguments == 'windows' )
				{
					CloseAllWindows();
					Say( 'All the windows have been closed.' );
					return;
				}
				// Only said close..
				else if( ( args.length == 1 || args.length == 2 && args[1] == 'window' ) && window.currentMovable )
				{
					Say( 'Closed window, ' + window.currentMovable.titleString );
					CloseWindow( window.currentMovable );
					return;
				}
				break;
		}
		Say( 'Excuse me. Can you repeat that?' );
	}
	
	this.parseVariables = function( pr )
	{
		for( var a in this.variables )
		{
			if( !a.length ) continue;
			pr = pr.split( "$" + a ).join( this.variables[a] );
		}
		return pr;
	}
	
	// Parse a command
	this.execute = function( cmd, ecallback )
	{
		var t = this;
		cmd = Trim( cmd );
		var rawLine = cmd + '';
		
		var dcallback;
		if( !ecallback ) dcallback = function( d ){};
		else
		{
			dcallback = function( dat, r )
			{
				// Log these..
				var d = document.createElement( 'span' );
				d.innerHTML = typeof( dat ) == 'object' ? t.generateOutputFromObjects( dat ) : dat;
				
				if( !this.sessionId && ge( 'ShellOutput' ) )
				{
					ge( 'ShellOutput' ).appendChild( d );
					ge( 'ShellOutput' ).appendChild( document.createElement( 'br' ) );
					ge( 'ShellOutput' ).scrollTop = 999999999;
				}
				else
				{
					// what to do? nothing?
				}
				
				ecallback( dat, r );
			}
		}
		
		// Get quoted strings
		if( cmd.indexOf( '"' ) > 0 )
		{
			var m;
			while( ( m = cmd.match( /\"([^"]*?)\"/i ) ) )
			{
				var r = m[1].split( '"' ).join ( '' ).split( ' ' ).join ( '<!--space--!>' );
				cmd = cmd.split( m[0] ).join( r );
			}
		}
		
		// Escaped spaces
		cmd = cmd.split( '\\ ' ).join( '<!--space--!>' );
		
		// Split commands into args
		cmd = cmd.split( ' ' );
	
		// Ignore comments
		if( rawLine.substr( 0, 2 ) == '//' ) return dcallback( false );
		
		// Multiline fork
		if( rawLine.indexOf( ';' ) > 0 )
		{
			cmd = rawLine.split( ';' ).join( "\n" );
			return this.parseScript( cmd, dcallback );
		}
	
		// Add last command to log
		if( rawLine.substr( 0, 6 ) != 'input ' )
		{
			if( !this.input || this.input != 'off' )
			{
				this.cmdLog.push( cmd );
				this.logKey = this.cmdLog.length-1;
			}
		}
		
		// Let's do lowercase
		cmd[0] = cmd[0].toLowerCase();

		// Safety, correct currentpath
		if ( this.currentPath && this.currentPath.substr( this.currentPath.length-1, 1 ) != ':' )
		{
			if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != '/' )
				this.currentPath += '/';
		}

		if( cmd[0] == "\n" )
		{
			return dcallback( "\n" );
		}
		else if( cmd[0] == 'say' )
		{
			var args = [];
			for( var a = 1; a < cmd.length; a++ )
				args.push( cmd[a].split( '<!--space--!>' ).join( ' ' ) );
			var str = args.join( ' ' );
			Say( this.parseVariables( str ) );
			return dcallback( "\n" );
		}
		else if( cmd[0] == 'cd' || cmd[0] == 'enter' )
		{
			if( cmd.length <= 1 || ( cmd.length > 1 && !cmd[1].length ) )
			{
				return dcallback( true );
			}
		
			// Get path string (and fix spaces)
			var str = cmd[1];
			if( cmd.length > 2 )
			{
				var args = [];
				for( var a = 1; a < cmd.length; a++ )
					args.push( cmd[a].split( '<!--space--!>' ).join( ' ' ) );
				str = args.join( ' ' );
			}
		
			var fullPath = Trim( str.split( '<!--space--!>' ).join( ' ' ) );
		
			
			
			// Go to root
			if( fullPath == ':' )
			{
				fullPath = this.currentPath.split( ':' )[0] + ':';
			}
			
			// Go to parent
			if( fullPath.substr( 0, 1 ) == '/' && this.currentPath )
			{
				var tmp = this.currentPath;
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
					else break;
				}
				fullPath = tmp;
			}
		
			// Fix path
			if( fullPath.indexOf( ':' ) < 0 )
			{
				fullPath = this.currentPath;
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
			if( cmd[0] == 'enter' )
			{
				if( cmd.length != 2 )
				{
					return dcallback( "\n" );
				}
				else if( cmd[1].indexOf( ':' ) > 0 || cmd[1].indexOf( '/' ) > 0 )
				{
					return dcallback( "\n" );
				}
				fullPath = cmd[1] + ':Functions/';
				if( this.currentPath )
				{
					this.previousPath = this.currentPath;
				}
			}
		
			// First check dormant
			// TODO: Implement "evaluate path"
			this.checkDormantDoors( fullPath, function( dirs )
			{
				// Use standard doors
				if( !dirs || ( !dirs && !dirs.length ) )
				{
					var door = ( new Door() ).get( fullPath );
					door.getIcons( false, function( data, path )
					{	
						if( typeof( data ) == 'object' && path )
						{
							t.currentPath = path;
						}
						// Error never should be here.
						else
						{
							return dcallback( false, { response: 'Could not change directory.' } );
						}
						dcallback( "\n", { path: path } );
					} );
				}
				else
				{
					// TODO: Fix that these are arrays!
					var count = 0;
					for( var a in dirs ) count++;
					if( dirs || count > 0 )
					{
						t.currentPath = fullPath;
					}
					else 
					{
						return dcallback( false, { response: 'Could not change directory.' } );
					}
					dcallback( "\n", { path: fullPath } );
				}
			} );
		}
		else if( cmd[0] == 'leave' )
		{
			if( this.previousPath )
			{
				// TODO: Perhaps have a history here!
				var tp = this.currentPath;
				this.currentPath = this.previousPath;
				this.previousPath = tp;
				return dcallback( "\n", { path: this.currentPath } );
			}
			return dcallback( "\n" );
		}
		// Launch an application without knowing where it is at
		else if( cmd[0] == 'launch' )
		{
			if( cmd.length == 2 )
			{
				function cbn( msg )
				{
					dcallback( msg.data, msg.error );
				}
				var args = '';
				for( var z = 2; z < cmd.length; z++ )
					args += ( z > 2 ? ' ' : '' ) + cmd[z];
					
				return ExecuteApplication( cmd[1], args, cbn );
			}
			return dcallback( "\n" );
		}
		// Copy some files
		else if( cmd[0] == 'copy' )
		{
			if( cmd.length >= 3 )
			{
				var src = cmd[1];
				
				if( src.indexOf( ':' ) < 0 ) src = this.currentPath + src;
				
				var dst = cmd[2].toLowerCase() == 'to' ? cmd[3] : cmd[2];
				
				if( dst.indexOf( ':' ) < 0 ) dst = this.currentPath + dst;
				
				var recursive = cmd[cmd.length-1].toLowerCase() == 'all' ? true : false;
				FriendDOS.copyFiles( src, dst, { recursive: recursive, move: false }, function( result )
				{
					dcallback( "\n" );
				} );
			}
		}
		else if( cmd[0] == 'move' )
		{
			if( cmd.length >= 3 )
			{
				var src = cmd[1];
				
				if( src.indexOf( ':' ) < 0 ) src = this.currentPath + src;
				
				var dst = cmd[2].toLowerCase() == 'to' ? cmd[3] : cmd[2];
				
				if( dst.indexOf( ':' ) < 0 ) dst = this.currentPath + dst;
				
				var recursive = cmd[cmd.length-1].toLowerCase() == 'all' ? true : false;
				FriendDOS.copyFiles( src, dst, { recursive: recursive, move: true }, function( result )
				{
					dcallback( "\n" );
				} );
			}
		}
		else if( cmd[0] == 'delete' )
		{
		}
		else if( cmd[0] == 'stop' )
		{
			return dcallback( "\n" );
		}
		else if( cmd[0] == 'clear' )
		{
			ge( 'ShellOutput' ).innerHTML = '';
			ge( 'ShellOutput' ).scrollTop = 0;
			return dcallback( 'clear' );
		}
		else if( cmd[0] == 'ls' || cmd[0] == 'dir' )
		{
			var dirs = false;
			var door = false;
		
			var path = ( typeof(cmd[1]) != 'undefined' && cmd[1].length ) ? cmd[1] : this.currentPath;
		
			this.getDirectory( path, function( doorItem, data )
			{
				if( data && data.length )
				{
					return dcallback( data, { path: path } );
				}
				// We have empty list
				else if( data )
				{
					return dcallback( false, 'Empty directory.' );
				}
				// Error never should be here.
				else
				{
					return dcallback( false, 'Invalid path.' );
				}
				return dcallback( "\n", { path: path } );
			} );
		}
		else if( cmd[0] == 'endcli' || cmd[0] == 'exit' )
		{
			return dcallback( FriendDOS.removeSession( this.uniqueId ) );
		}
		else if( cmd[0] == 'cli' || cmd[0] == 'newcli' )
		{
			apiWrapper( { data: JSON.stringify( {
				applicationName: this.app.applicationName,
				applicationId: this.app.applicationId,
				type: 'system',
				command: 'executeapplication',
				executable: 'Shell',
				arguments: ''
			} ) } );
			return dcallback( "\n", { response: 'New shell launched.' } );
		}
		else if( cmd[0] == 'status' )
		{
			apiWrapper( { data: JSON.stringify( {
				applicationName: this.app.applicationName,
				applicationId: this.app.applicationId,
				type: 'system', command: 'listapplications', callbackId: addWrapperCallback( dcallback ) 
			} ) } );
		}
		else if( cmd[0] == 'kill' )
		{
			apiWrapper( { data: JSON.strintify( {
				applicationName: this.app.applicationName,
				applicationId: this.app.applicationId, 
				type: 'system', command: 'kill', appName: cmd[1], callbackId: addWrapperCallback( dcallback ) 
			} ) } );
		}
		else if( cmd[0] == 'install' )
		{
			if( cmd.length <= 1 )
			{
				return dcallback( false, 'Please tell me which application you wish to install.' );
			}
			else
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						return dcallback( true, 'Installed or upgraded in the future.' );
					}
					else
					{
						return dcallback( false, 'Failed to install ' + cmd[1] + '.' );
					}
				}
				m.execute( 'install', { application: cmd[1] } );
			}
		}
		else if( cmd[0] == 'break' )
		{
			apiWrapper( { data: JSON.stringify( {
				applicationName: this.app.applicationName,
				applicationId: this.app.applicationId,
				type: 'system', command: 'break', appNum: cmd[1], callbackId: addWrapperCallback( dcallback ) 
			} ) } );
			// TODO: Find out why callback by callbackId doesn't work on 'break'
			dcallback( "\n" );
		}
		// Jump
		else if( cmd[0] == 'goto' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			var gotoPoint = cmd[1];
		
			// Ok, it could be a prerolled goto
			if( typeof( input[index+1] ) == 'undefined' )
			{
				if( this.temporaryList )
				{
					input = this.temporaryList.list;
					index = this.temporaryList.index;
					this.temporaryList = null;
				}
			}
		
			// This is a line number
			if( !isNaN( parseInt( gotoPoint ) ) )
			{
				return dcallback( parseInt( gotoPoint ) );
			}
			// Text length, it's a label
			else
			{
				return dcallback( gotoPoint );
			}
			return dcallback( false );
		}
		// Set a var
		else if( cmd[0] == 'set' )
		{
			// TODO: Support strings
			if( cmd.length < 2 )
			{
				return dcallback( "\n" );
			}
			this.variables[cmd[1]] = isNaN( parseFloat( cmd[2] ) ) ? cmd[2].split( '<!--space--!>' ).join( ' ' ) : parseFloat( cmd[2] );
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'increase' )
		{
			// TODO: Support strings
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]]++;
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'decrease' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]]--;
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'add' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]] += isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'subtract' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]] -= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'multiply' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]] *= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		else if( cmd[0] == 'divide' )
		{
			if( cmd.length < 2 )
			{
				return dcallback( false );
			}
			this.variables[cmd[1]] /= isNaN( parseFloat( cmd[2] ) ) ? ( parseInt( cmd[2] ) ? parseInt( cmd[2] ) : 0 ) : parseFloat( cmd[2] );
			return dcallback( true, { variable: cmd[1], variableValue: this.variables[cmd[1]] } );
		}
		// Condition
		else if( cmd[0] == 'if' )
		{
			// catch condition
			if( cmd.length > 1 )
			{
				// TODO: implement AND, OR etc
				// Find what we compare, and what we compare to
				var preroll = '';
				var operators = [ 'equals', 'differs', 'lesser', 'greater' ];
				var arguments = [];
				var compi = 0;
				var argument = {
					operator: '',
					vars: []
				};
			
				// Case
				var out = [];
				for( var a = 0; a < cmd.length; a++ )
				{
					if( cmd[a].substr( cmd[a].length - 1, 1 ) == ':' )
					{
						out.push( cmd[a].substr( 0, cmd[a].length - 1 ) );
						out.push( ':' );
						for( var c = a+1; c < cmd.length; c++ )
						{
							if( c > a+1 ) preroll += ' ';
							preroll += cmd[c];
						}
					}
					else out.push( cmd[a] );
				}
				cmd = out;
			
				for( var b = 1; b < cmd.length; b++ )
				{
					// End of the line
					if( cmd[b] == ':' )
					{
						if( argument.operator ) arguments.push( argument );
						break;
					}
				
					if( cmd[b] == 'and' || cmd[b] == 'or' )
					{
						if( argument.operator ) arguments.push( argument );
						arguments.push( { operator: cmd[b] } );
						argument = { operator: '', vars: [] };
						continue;
					}
				
					// find operators
					var operatorFound = false;
					for( var c = 0; c < operators.length; c++ )
					{
						if( cmd[b] == operators[c] )
						{
							argument.operator = cmd[b];
							operatorFound = true;
							break;
						}
					}
					if( operatorFound ) continue;
				
					// We only allow to compare two arguments
					if( argument.vars.length < 2 )
						argument.vars.push( cmd[b] );
					else
					{
						arguments.push( argument );
						argument = { operator: '', vars: [] };
					}
				}
			
				// Unadded - now added
				if( argument.operator )
					arguments.push( argument );
			
				// Check if this fans out!
				for( var a = 0; a < arguments.length; a++ )
				{
					// Parse variables
					for( var c = 0; c < arguments[a].vars.length; c++ )
						if( arguments[a].vars[c].substr( 0, 1 ) == '$' )
							arguments[a].vars[c] = this.parseVariables( arguments[a].vars[c] );
				
					switch( arguments[a].operator )
					{
						case 'equals':
							if( arguments[a].vars.length == 2 )
								arguments[a].result = arguments[a].vars[0] == arguments[a].vars[1];
							break;
						case 'differs':
							if( arguments[a].vars.length == 2 )
								arguments[a].result = arguments[a].vars[0] != arguments[a].vars[1];
							break;
						case 'lesser':
							if( arguments[a].vars.length == 2 )
								arguments[a].result = parseFloat( arguments[a].vars[0] ) < parseFloat( arguments[a].vars[1] );
							break;
						case 'greater':
							if( arguments[a].vars.length == 2 )
							{
								arguments[a].result = parseFloat( arguments[a].vars[0] ) > parseFloat( arguments[a].vars[1] );
							}
							break;
					}
				}
			
				// Evaluate all arguments
				var result  = true;
				var orFlag  = false;
				var oneTrue = false;
				for( var a = 0; a < arguments.length; a++ )
				{
					if( arguments[a].operator == 'or' )
					{
						orFlag = true;
					}
					if( arguments[a].result == false )
						result = false;
					else oneTrue = true;
				}
			
				// Sum it up!
				result = oneTrue && orFlag ? true : result;
			
				// Hmm. No more commands?
				if( !preroll.length )
				{
					return dcallback( result );
				}
				// ok, just use what is after colon
				else if( preroll.length )
				{
					if( result )
					{
						return this.execute( preroll, dcallback );
					}
				}
				
			}
			return dcallback( false );
		}
		else if( cmd[0] == 'execute' )
		{
			if( cmd.length > 1 && cmd[1].substr( cmd[1].length - 4, 4 ).toLowerCase() == '.run' )
			{
				var fname = cmd[1];
				if( fname.indexOf( ':' ) < 0 )
				{
					fname = t.currentPath + fname;
				}
				var tt = this;
				var f = new File( fname );
				f.onLoad = function( data )
				{
					tt.parseShellScript( data, dcallback );
				}
				f.load();
				return dcallback( false );
			}
			return dcallback( false, 'Could not execute script ' + cmd[1] );
		}
		else if( cmd[0] == 'echo' && cmd.length > 1 )
		{
			// TODO: Support pipes
			return dcallback( this.parseVariables( cmd[1] ).split( '<!--space--!>' ).join( ' ' ) );
		}
		else if( cmd[0] == 'input' )
		{
			if( cmd[1] == 'on' )
			{
				this.input = null;
				return dcallback( "\n", { response: 'input set to "on"' } );
			}
			else if( cmd[1] == 'off' )
			{
				this.input = 'off';
				return dcallback( "\n", { response: 'input set to "off"' } );
			}
			return dcallback( false );
		}
		else if( cmd[0] == 'wait' )
		{
			time = 0;
			if( parseInt( cmd[1] ) > 0 )
				time = parseInt( cmd[1] );
			setTimeout( function()
			{
				dcallback( true );
			}, time );
		}
		else if( cmd[0] == 'output' )
		{
			// TODO: Show file content
			cmdCat( cmd[1], function( result ){ 
				if( result != 'ok' )
				{
					return dcallback( false, 'Failed. (' + result + ')' );
				}
				return dcallback( result );
			} );
			return;
		}
		// A simple loop!
		// Skipped, shell only understands commands
		else if( cmd[0] == 'repeat' )
		{
			return dcallback( true );
		}
		// Assign a path to virtual device
		else if( cmd[0] == 'assign' )
		{
			var mode = 'new';
		
			if( cmd.length >= 2 )
			{
				var rd = cmd[1];
				var vd = cmd[2];
		
				for( var a = 2; a < cmd.length; a++ )
				{
					var cm = cmd[a].toLowerCase();
					if( cm == 'add' ) mode = 'add';
					if( cm == 'to' ) continue;
					vd = cmd[a];
				}
		
				// Keep the whole path!
				if( rd.indexOf( ':' ) < 0 )
					rd = t.currentPath + rd;
		
				// Let us validate
				if( rd.indexOf( ':' ) > 0 && vd.indexOf( ':' ) > 0 && vd.split( ':' )[1].length <= 0 )
				{
					// Let's check the path! (must be a directory or volume)
					var lch = rd.substr( rd.length - 1, 1 );
					if( lch != '/' && lch != ':' ) rd += '/';
					t.getDirectory( rd, function( directory, children )
					{
						if( directory.Type && ( directory.Type == 'Directory' || directory.Type == 'Volume' ) )
						{
							var m = new Module( 'system' );
							m.onExecuted = function( e, d )
							{
								if( e == 'ok' )
								{
									return dcallback( true, { response: 'Path ' + rd + ' assigned to ' + vd + '.' } );
								}
								else
								{
									return dcallback( false, { response: 'Assigning ' + rd + ' to ' + vd + ' failed.' } );
								}
							}
							m.execute( 'assign', {
								path: rd,
								assign: vd,
								mode: mode
							} );
						}
						else
						{
							return dcallback( false, 'The path is erroneous (' + rd + ')..' );
						}
					} );
					return;
				}
			}
			return dcallback( false, 'Failed to execute command "assign".' );
		}
		else if( cmd[0] == '' )
		{
			return dcallback( "\n" );
		}
		// Skip labels
		else if( cmd[0].substr( cmd[0].length - 1, 1 ) == ':' )
		{
			return dcallback( "\n" );
		}
		// Catch all
		else
		{
			// If all else fails
			var lastCallback = function()
			{
				/*// Signal to parent that we want to execute an application
				var args = [];
				for( var a = 1; a < cmd.length; a++ )
					args.push( cmd[a] );
				args = args.join ( ' ' );
				var command = cmd[0];
				var cid = addCallback( function( msg )
				{
					console.log( 'Response from parent to terminal' );
					console.log( msg );
				} );
				this.app.sendMessage( {
					type: 'system',
					command: 'executeapplication',
					executable: command,
					arguments: args
				} );*/
				return dcallback( false, 'Command not found.' );
			}
		
			// Try to see if there is an executable in the current directory
			var dirs = false;
			var door = false;
			var tt = this;
			
			var path = ( cmd[0] == 'cd' && typeof(cmd[1]) != 'undefined' && cmd[1].length ) ? cmd[1] : this.currentPath;	
			
			// Check dormant first!
			// TODO: Make uniform!
			this.checkDormantDoors( path, function( dirs )
			{
				// If we end up here, we're not using dormant - which is OK! :)
				if( !dirs || ( !dirs && !dirs.length ) )
				{
					// Use standard doors
					var door = ( new Door() ).get( path );
					door.getIcons( false, function( data )
					{
						if( data.length )
						{
							for( var a in data )
							{
								var f = data[a].Filename ? data[a].Filename : data[a].Title;
								if( !f ) continue;
								if( f.toLowerCase() == cmd[0] )
								{
									var args = [];
									for( var aa = 1; aa < cmd.length; aa++ )
										args.push( cmd[aa].split( '<!--space--!>' ).join( ' ' ) );
								
									var command = cmd[0];
								
									// TODO: Make safe! Could have jsx in the middle of the file name!
									if( command.indexOf( '.jsx' ) > 0 )
									{
										command = path + command;
									}
								
									var cid = addWrapperCallback( function( msg )
									{
										var resp = msg ? ( msg.response ? msg.response : msg ) : false;
										dcallback( resp ? resp : "\n", { path: path } );
									} );
									
									var msgHere = {
										applicationName: tt.app.applicationName,
										applicationId: tt.app.applicationId,
										type: 'system',
										command: 'executeapplication',
										executable: command,
										arguments: args,
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
					for( var a in dirs )
					{
						if( dirs[a].Title.toLowerCase() == cmd[0] )
						{
							var args = [];
							for( var aa = 1; aa < cmd.length; aa++ )
								args.push( cmd[aa].split( '<!--space--!>' ).join( ' ' ) );
						
							var cid = addWrapperCallback( function( msg )
							{
								var resp = msg ? msg.response : false;
								dcallback( resp ? resp : "\n", { path: path } );
							} );
							
							var msgHere = {
								applicationName: tt.app.applicationName,
								applicationId: tt.app.applicationId,
								type: 'dormantmaster',
								method: 'execute',
								executable: dirs[a].Path + cmd[0],
								doorId: dirs[a].Dormant.doorId,
								dormantCommand: cmd[0],
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
	}
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
		for( var a = 0; a < acount; a++ )
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
		for( var a = 0; a < output.length; a++ )
		{
			var c = output[a];
			icons += '<td style="vertical-align: top; padding-right: 20px">' + c + '</td>';
		}
		icons += '</tr></table><br>';
		icons += acount + ' ' + i18n( 'i18n_items_total' ) + '.<br><br>';
		return icons;
	}
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
					Say( 'The file, ' + t + ', is an executable. What are your arguments?' );
					return true;
				}
				
				i.domNode.ondblclick();
				Say( 'File ' + t + ' opened.' );
				return true;
			}
		}
		return false;
	}
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
				Say( 'Directory ' + t + ' opened.' );
				return true;
			}
		}
		return false;
	}
}

/* Global dos object that manages all dos sessions */

FriendDOS =
{
	sessions: [],
	count: 0,
	// Copy files with option flags
	copyFiles: function( src, dest, flags, callback )
	{
		// Do we want to move the files?
		var move = flags && flags.move ? true : false;
		
		// Get door objects
		var doorSrc = ( new Door() ).get( src );
		var doorDst = ( new Door() ).get( src );
		
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
		
		console.log( 'Testing path before copy: ' + pthTest );
		
		doorSrc.path = pthTest;
		doorSrc.getIcons( false, function( data )
		{
			console.log( 'This was the result..' );
			console.log( data  );
		} );
		
		/*// Create a filecopy object
		var fileCopyObject = {
			files: [],
			processing: 0,
			fileInfoCheck: function( ele )
			{
				if( !ele.fileInfo ) 
				{
					ele.fileInfo = {
						Type: ele.Type,
						Path: ele.Path,
						Filesize: ele.Filesize,
						Filename: ele.Filename
					};
				}
			},
			// Find files in folders
			findSubFiles: function( folder )
			{
				// Counting!
				this.processing++;
				var d = Doors.getDoorByPath( folder.ele.fileInfo.Path );
				if( !d )
				{
					this.processing--;
					return;
				}
				
				var o = this;
				
				// Get icons on path
				d.getIcons( folder.ele.fileInfo, function( result )
				{
					for( var z = 0; z < result.length; z++ )
					{
						// We need to have fileInfo
						o.fileInfoCheck( result[z] );
						if( result[z].Type.toLowerCase() == 'directory' )
						{
							var d = Doors.getDoorByPath( result[z].Path );
							o.files.push( result[z] );
							o.findSubFiles( { door: d, ele: result[z] } );
						}
						else if( result[z].Type.toLowerCase() == 'file' )
						{
							o.files.push( result[z] );
						}
					}
					// Done counting!
					o.processing--;
					o.checkFinished();
				} );
			},
			// Check all files (type etc)
			checkFiles: function( eles )
			{
				// Counting!
				this.processing++;
				
				// Collect all files!
				for( var a = 0; a < eles.length; a++ )
				{
					var d = Doors.getDoorByPath( eles[a].fileInfo.Path );
					var fin = eles[a].fileInfo;
					if( d )
					{
						// Make sure we have file info
						this.fileInfoCheck( fin );
						
						// Check type, and if folder collect files
						if( fin.Type.toLowerCase() == 'directory' )
						{
							// Add folder and make sub paths
							this.files.push( eles[a] );
							this.findSubFiles( { door: d, ele: eles[a] } );
						}
						else if( fin.Type.toLowerCase() == 'file' )
						{
							this.files.push( eles[a] );
						}
					}
				}
				
				// Not counting anymore
				this.processing--;
				
				// No more processing loops, it means we're finished!
				this.checkFinished();
			},
			// Copy files that have been added
			copyFiles: function()
			{
				// TODO: Performance test / question:
				//       Do we queue these, or just loop through, 
				//       relying on server timeout
				if( !this.files || !this.files.length )
				{
					// No files, abort
					// Close window
					w.close();
					
					// Refresh source and target
					Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
					return false;
				}
				
				var fob = this;
				var d = Doors.getDoorByPath( this.files[0].fileInfo.Path );
				
				// Make sure our path is right
				var cfoF = cfo.Path.substr( 0, cfo.Path.length - 1 );
				var p = '';
				if( cfoF != '/' && cfoF != ':' )
					p = '/';
				

				var fl = this.files[0];
				
				var toPath = cfo.Path + p + fl.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
				
				// Sanitation
				while( toPath.indexOf( ':/' ) >= 0 ) toPath = toPath.split( ':/' ).join ( ':' );
				while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );
				
				// Start with a whosh
				if( a == 0 )
				{
					bar.style.width = Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%';
					bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
						Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%</div>';
				}
				
				// Do the copy
				d.dosAction( 'copy', { from: fl.fileInfo.Path, to: toPath }, function( result )
				{
					if( fileCopyObject.files.length > 1 )
					{
						var f = fileCopyObject.files;
						var nf = [];
						for( var b = 1; b < f.length; b++ )
							nf.push( f[b] );
						fileCopyObject.files = nf;
						fileCopyObject.copyFiles();									
					}
					
					// Initial refresh
					eles[0].window.refresh();
					bar.items--;
					bar.style.width = Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%';
					bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
						Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%</div>';
					if( bar.items == 0 )
					{	
						// No control key in? Delete files after copying - essentially moving the files
						if( !ctrl )
						{
							// Now delete files
							//first make the list complete again
							fob.files = fob.originalfilelist;
							
							w.deletable = fob.files.length;
							bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">Cleaning up...</div>';
							
							
							// Delete in reverse
							for( var b = fob.files.length - 1; b >= 0; b-- )
							{
								console.log( 'Deleting file: ' + fob.files[b].fileInfo.Path );
								d.dosAction( 'delete', { path: fob.files[b].fileInfo.Path }, function( result )
								{
									w.deletable--;
									if( w.deletable == 0 )
									{
										// Close window
										w.close();
									
										// Refresh source and target
										Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
									}
								} );
							}
						}
						// Just copy! No delete! :)
						else
						{
							// Close window
							w.close();
						
							// Refresh source and target
							Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
						}
					
					}
				} );
				
			},
			// Do this when the processing loops are all done!
			checkFinished: function()
			{
				if( this.processing == 0 )
				{
					bar.total = this.files.length;
					bar.items = this.files.length;
					
					//keep a copy as we will call copyFiles once after popping from our filellist
					//needs to be done to make sure directories are in place before files are copied
					//we might improve this and allow parallel processing once we have seperated files from directories and can be sure directories are processed first
					this.originalfilelist = this.files;
					this.copyFiles();						
				}
			}
		};
		fileCopyObject.checkFiles( eles );*/
			
	},
	
	// Add a new session and return the Shell session id
	addSession: function( appObject, callback )
	{
		var a = new Shell( appObject );
		this.sessions[a.uniqueId] = a;
		this.sessions[a.uniqueId].number = this.count++;
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
	}
}


