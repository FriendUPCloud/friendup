/*©agpl*************************************************************************
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
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* The FriendUP simple shell client                                             *
* --------------------------------                                             *
*                                                                              *
* version: 1.0                                                                 *
*                                                                              *
* Terminal component.                                                          *
*                                                                              *
*******************************************************************************/

document.title = 'Terminal Component';

Application.run = function(msg)
{
	if( this.initialized )
		return;

	this.cmdLog = [];
	this.logKey = 0;
	this.input = true;
		
	this.initialized = true;
	this.fileName = 'terminal.js';
	
	// Setup the terminal template
	this.cliTemplate = '\
		<div class="Path"></div><div class="Cli"></div>\
		<div style="height: 5px; clear: both"></div>\
	';
	this.variables = [];
	this.terminal = ge('.Terminal')[0];
	this.instanceId = 1;
	this.currentPath = 'System:';
	this.previousPath = false;
	this.friendNetwork = 'disabled';
	this.disableCLI();
	
	// Script list for parsing
	this.scriptListArray = [];
	this.scriptListPosition = 0;
	
	// Fire up the core shell proxy
	this.shell = new Shell();
	this.shell.onReady = function()
	{
		Application.enableCLI();
		Application.addNL( true );
	}
	
	// Pipeing back to this object from outside
	this.shell.onPipe = function( msg )
	{
		Application.handlePipe( msg );
	}
	
	// Enable cli on click
	AddEvent( 'onmousedown', function()
	{
		if( !Application.input )
		{
			Application.enableCLI();
			Application.addNL();
		}
	} );
}

// Handle pipe data
Application.handlePipe = function( packet )
{
	// Flush memory
	if( packet.returnMessage && packet.returnMessage.flush )
	{
		Application.variables = [];
	}
	
	// Update variables
	if( packet.returnMessage && packet.returnMessage.variable )
	{
		//console.log( 'We got the variable back: ' + packet.returnMessage.variable + '=' + packet.returnMessage.variableValue );
		// console.log( 'Variable: ' + packet.returnMessage.variable + ' = ' + packet.returnMessage.variableValue );
		Application.variables[packet.returnMessage.variable] = packet.returnMessage.variableValue;
		//console.log( 'So it is set:' + Application.variables[packet.returnMessage.variable] );
	}
	// Another response
	else if( packet.returnMessage || ( !packet.returnMessage && packet.data ) )
	{
		var sw = packet.returnMessage || packet.data;
		switch( sw )
		{
			case 'quit':
				Application.quit();
				return;
			case 'syntax':
				Application.addError( 'Syntax error.' );
				Application.addNL();
				return;
			case 'disableCLI':
				Application.disableCLI();
				return false;
			case 'enableCLI':
				Application.enableCLI();
				return false;
			case 'clear':
				Application.terminal.innerHTML = '';
				Application.addNL();
				ignoreOutput = true;
				return false;
			case 'friendnetworklist':
				var msg = {
					applicationName: 'FriendShell',
					applicationId: Application.applicationId
				}
				FriendNetwork.list( msg );
				break;
			case 'friendnetworkenable':
				var msg = {
					applicationName: 'FriendShell',
					applicationId: Application.applicationId
				}
				DormantMaster.connectToFriendNetwork( msg );
				Application.friendNetwork = 'enabled';
				break;
			case 'friendnetworkdisable':
				var msg = {
					applicationName: 'FriendShell',
					applicationId: Application.applicationId
				}
				DormantMaster.disconnectFromFriendNetwork( msg );
				Application.friendNetwork = 'disabled';
				break;
			default:
				if (typeof packet.returnMessage == 'object')
				{
					if( packet.returnMessage.path )
					{
						Application.currentPath = packet.returnMessage.path;
					}
					else if ( packet.returnMessage.command )
					{
						switch ( packet.returnMessage.command )
						{
							case 'friendnetworkhost':
								FriendNetwork.host( packet.returnMessage.name );
								break;
							case 'friendnetworkconnect':
								FriendNetwork.connect( packet.returnMessage.name );
								break;
							case 'friendnetworkdispose':
								FriendNetwork.dispose( packet.returnMessage.name );
								break;
						}
					}
				}
				break;
		}
	}
	
	// Input control
	if( packet.returnMessage && packet.returnMessage.input )
	{
		if( packet.returnMessage.input == 'off' )
			Application.disableCLI();
		else Application.enableCLI();
	}

	if( packet.data )
	{
		// Check if we have anything in the data
		var members = 0;
		var fmem = false;
		
		// Only count this if its an objects
		if( typeof( packet.data ) == 'object' )
		{
			for( var a in packet.data )
			{
				members++;
				fmem = a;
			}
		}
		
		// We have no data members, or, we have data members with a newline
		if( members <= 0 || ( members == 1 && packet.data[fmem] == "\n" ) )
		{
			// we have a returnmessage, and we have fmem 0 and not a newline
			// TODO: This looks like bull shit! :) Fix it
			if( packet.returnMessage && packet.returnMessage.response && ( !fmem || packet.data[fmem] != "\n" ) )
			{
				Application.addOutput( packet.returnMessage.response );
			}
		}
		else if( typeof( packet.data ) == 'object' )
		{
			if( packet.data.path )
			{
				this.currentPath = packet.data.path;
				return false;
			}
			var out = Application.generateOutputFromObjects( packet.data );
			Application.addOutput( out );
		}
		else
		{
			if( packet.data != true && packet.data != false && ( packet.data + "" ).split( /[\s]+/ ).join ( '' ).length > 0 )
				Application.addOutput( packet.data );
		}
	}
	else
	{
		if( packet.returnMessage && packet.returnMessage.response )
		{
			Application.addError( packet.returnMessage.response );
		}
	}
	
	// Are we done? Ready to add newline?
	if( packet.returnMessage && packet.returnMessage.done )
	{
		console.log( 'We are done!' );
		Application.enableCLI();
		Application.addNL();
	}
	
}

// Add error line
Application.addError = function( str )
{
	var n = document.createElement( 'div' );
	n.innerHTML = '<div class="Error">' + str + '</div>';
	this.terminal.appendChild( n );
	this.terminal.scrollTop = 99999999;
}

// Add error line
Application.addOutput = function( str )
{
	console.log( 'Adding output (input: ' + ( this.input ? 'on' : 'off' ) + ' ): ' + str );
	var n = document.createElement( 'div' );
	n.innerHTML = '<div class="Output SelectableText">' + str + '</div>';
	this.terminal.appendChild( n );
	this.terminal.scrollTop = 99999999;
}

// Remove old editing possibility
Application.disableCLI = function( loadinganim )
{
	this.input = false;
	this.loadingNr = 0;
	if( this.currentCLI )
	{
		var pn = this.currentCLI.parentNode.parentNode;
		if( pn && pn.classList )
		{
			pn.classList.add( 'Loading' );
			pn.classList.add( 'Loading1' );
			if( this.loadingAnim ) clearInterval( this.loadingAnim );
			this.loadingAnim = setInterval( function()
			{
				Application.loadingNr++;
				pn.classList.remove( 'Loading1' );
				pn.classList.remove( 'Loading2' );
				pn.classList.remove( 'Loading3' );
				pn.classList.remove( 'Loading4' );
				pn.classList.add( 'Loading' + ( Application.loadingNr % 4 + 1 ) );
			}, 100 );
		}
		
		this.currentCLI.contentEditable = false;
	}
}

// Remove old editing possibility
Application.enableCLI = function()
{
	if( this.loadingAnim )
	{
		clearInterval( this.loadingAnim );
		this.loadingAnim = false;
	}
	if( this.currentCLI )
	{
		var pn = this.currentCLI.parentNode.parentNode;
		if( pn && pn.classList )
		{
			pn.classList.remove( 'Loading1' );
			pn.classList.remove( 'Loading2' );
			pn.classList.remove( 'Loading3' );
			pn.classList.remove( 'Loading4' );
			pn.classList.remove( 'Loading' );
		}
		this.currentCLI.contentEditable = true;
	}
	this.input = true;
}

// Add new line
Application.addNL = function( focus )
{
	if( this.currentCLI && this.currentCLI.contentEditable == false ) return false;
	
	if( !this.input )
	{
		this.terminal.scrollTop = 99999999;
		return false;
	}
	
	this.disableCLI();
	
	var t = this.cliTemplate;
	var n = document.createElement( 'div' );
	n.innerHTML = t;
	this.terminal.appendChild( n );
	
	var cli = GeByClass( 'Cli', n );
	cli.contentEditable = true;
	cli.spellcheck = false;
	
	// Hack, please check if window is active..
	if( focus || document.body.className.indexOf( 'activated' ) > 0 )
	{
		setTimeout( function(){ Application.focusCLI(); }, 150 );
	}
	
	var path = GeByClass( 'Path', n );
	path.innerHTML = this.shell.number + '. ' + this.currentPath + '>';
	path.onfocus = function() { Application.focusCLI(); }
	path.onclick = function() { Application.focusCLI(); }

	// Also focus on the cli when clicking window
	document.body.onclick = function() 
	{ 
		Application.focusCLI();
	};
	
	this.currentCLI = cli;
	
	this.setupTerminalKeys();
	
	this.terminal.scrollTop = 99999999;
	
	this.enableCLI();
}

// Put focus on cli
Application.focusCLI = function()
{
	if( !this.input ) return;
	this.sendMessage( { command: 'activate' } );
	if( !this.currentCLI ) return;
	this.currentCLI.focus();
}

// Handle keypresses
Application.handleKeys = function( k )
{
	// Arrow up, show log
	if( k == 38 )
	{	
		if( this.logKey >= 0 && this.cmdLog.length )
		{
			var t = this.terminal;
			if( t )
			{
				var cli = GeByClass( 'Cli', t );
				cli = cli[cli.length-1];
				cli.innerHTML = this.cmdLog[this.logKey];
				SetCursorPosition( cli, 'end' );
				this.logKey--;
				if( this.logKey < 0 ) this.logKey = 0;
			}
		}
	}
	else if ( k == 40 )
	{
		this.logKey++;
		if( this.logKey >= this.cmdLog.length )
			this.logKey = this.cmdLog.length - 1;
		
		if( this.logKey >= 0 && this.cmdLog.length )
		{
			var t = this.terminal;
			if( t )
			{
				var cli = GeByClass( 'Cli', t );
				cli = cli[cli.length-1];
				cli.innerHTML = this.cmdLog[this.logKey];
				SetCursorPosition( cli, 'end' );
			}
		}
	}
}

// Setup keyboard shortcuts
Application.setupTerminalKeys = function()
{
	var t = this;
	var f = this.terminal.getElementsByTagName( 'div' );
	var o = false;
	for ( var a = f.length - 1; a > 0; a-- )
	{
		if ( f[a].className == 'Cli' )
		{
			o = f[a];
			break;
		}
	}
	if ( o )
	{
		o.onkeydown = function( e )
		{
			var k = e.which ? e.which : e.keyCode;
			var ctrl = e.ctrlKey;
			
			// Enter pressed
			if( k == 13 )
			{
				if( t.currentCLI.innerHTML == '' )
					t.evaluateInput( [ "\n" ], 0, k );
				else
				{
					// Add last command to log
					t.cmdLog.push( t.currentCLI.innerHTML );
					t.logKey = t.cmdLog.length - 1;
					t.evaluateInput( [ t.currentCLI.innerHTML ], 0, k );
				}
				return cancelBubble( e );
			}
			else if ( ctrl && k == 67 )
			{
				t.evaluateInput( ['abort'], 0, k);
			}
			// Tab completion
			else if( k == 9 )
			{
				// Try to autocomplete
				if( !Application.complete )
				{
					Application.complete = 1;
					
					var cmds = Application.currentCLI.innerText;
					cmds = cmds.split( ' ' );
					var lcmd = cmds[cmds.length-1];
					
					var m = new Library( 'system.library' );
					m.onExecuted = function( rc, rd )
					{
						
						
						try
						{
							rd = JSON.parse( rd );
						}
						catch( e )
						{
							rd = false;
						}
						
						if( rd )
						{
							// Add system completion
							rd.push( {
								Name: 'System'
							} );
							for( var a = 0; a < rd.length; a++ )
							{
								if( rd[a].Name.substr( 0, lcmd.length ).toLowerCase() == lcmd.toLowerCase() )
								{
									cmds[cmds.length-1] = rd[a].Name + ':';
									Application.currentCLI.innerHTML = cmds.join( ' ' );
									cursorToEndOn( Application.currentCLI );
									return;
								}
							}
						}
						
						var d = new Door( Application.currentPath );
						d.path = Application.currentPath;
						d.getIcons( function( data )
						{
							if( lcmd && lcmd.toLowerCase && lcmd.length )
							{
								for( var a = 0; a < data.length; a++ )
								{
									var fn = data[a].Filename ? data[a].Filename : data[a].Title;
									if( !fn ) continue;
									if( fn.toLowerCase().substr( 0, lcmd.length ) == lcmd.toLowerCase() )
									{
										cmds[cmds.length-1] = fn.split( ' ' ).join( '\\ ' );
										Application.currentCLI.innerHTML = cmds.join( ' ' );
										if( data[a].Type == 'Directory' )
											Application.currentCLI.innerHTML += '/';
										cursorToEndOn( Application.currentCLI );
										return;
									}
								}
							}
						} );
					}
					m.execute( 'device/list' );
				}
				// Aha, check autocomplete alternatives
				else
				{
					var cl = t.currentCLI.innerText;
					var d = new Door( Application.currentPath );
					d.path = Application.currentPath;
					d.getIcons( function( data )
					{
						t.addOutput( Application.generateOutputFromObjects( data ) );
						t.currentCLI.innerHTML = cl;
						cursorToEndOn( t.currentCLI );
						clearTimeout( t.completeTimeout );
						t.complete = null;
					} )
				}
				if( Application.completeTimeout )
				{
					clearTimeout( Application.completeTimeout );
				}
				Application.completeTimeout = setTimeout( function()
				{
					Application.complete = null;
					Application.completeTimeout = null;
				}, 250 );
				return cancelBubble( e );
			}
		}
	}
}

// Checks a path with friend master
Application.checkPath = function( path )
{
	return true;
}

// Evaluate input
Application.evaluateInput = function( input, index, key )
{
	// Send it to our man!
	Application.disableCLI( 'loading' );
	this.shell.evaluate( input );
}

// Just give "command not found" error
Application.sayCommandNotFound = function( c )
{
	// All else fails
	var trans_cmd_not_found = i18n( 'i18n_command_not_found' );
	this.addError( trans_cmd_not_found + '.' );
	this.addNL();
}

Application.generateOutputFromObjects = function( objects )
{
	var acount = objects.length;
	// Fix objects to array
	if( isNaN( acount ) )
	{
		var o = [];
		for( var a in objects ) o.push( objects[a] );
		objects = o;
		acount = o.length;
	}
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
		var isElement = dirType != 'File' && !isDir;
		var itm = '';
		if ( isDir ) 
		{
			itm = ( row.Title ? row.Title : row.Filename ) + ( isDir ? '/' : '' ) + '<br>';
			itm = '<div class="Container">' + itm + '</div>';
		}
		else if( isElement && !row.Filesize )
		{
			itm = '<div class="File">';
			var f = false;
			for( var b in row )
			{
				if( b == 'ID' )
				{
					itm += row[b];
					f++
					break;
				}
				else if( b == 'Title' )
				{
					itm += row[b];
					f++;
					break;
				}
			}
			if( !f ) itm += 'Unknown element ' + a;
			
			itm += '</div>';
		}
		else 
		{
			itm = ( row.Title ? row.Title : row.Filename ) + ( isDir ? '/' : '' ) + '<br>';
			itm = '<div class="File">' + itm + '</div>';
		}
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

// Receive messages
Application.receiveMessage = function( object )
{
	var command = object.command;
	if( !command )
	{
		if ( object.data && object.data.command )
			command = object.data.command;
		else
			return false;
	}
	switch( command )
	{
		case 'quit_shell':
			this.shell.execute( 'exit' );
			// Just send back, it knows what to do
			object = {
				type: 'callback',
				callback: object.callbackId
			};
			this.sendMessage( object );
			break;
		// We're receiving data!
		// TODO: Set who are allowed to pipe in!
		case 'pipe':
			if( this.pipeTimeout )
			{
				clearTimeout( this.pipeTimeout );
				this.pipeTimeout = false;
			}
			this.disableCLI();
			if( msg.output )
			{
				this.addOutput( msg.output );
			}
			// After 10 seconds, we're aborting the pipe..
			this.pipeTimeout = setTimeout( function()
			{
				Application.pipeTimeout = false;
				Application.enableCLI();
			}, 10000 );
			break;
		// Ok, we're out of data..
		case 'pipestop':
			this.enableCLI();
			if( this.pipeTimeout )
			{
				clearTimeout( this.pipeTimeout );
				this.pipeTimeout = false;
			}
			break;
		case 'init':
			console.log( 'We were asked to initialize.' );
			this.init();
			break;
		case 'message':
			//console.log( 'We got a message: ' );
			//console.log( object );
			break;
		case 'applicationnotexecuted':
			this.sayCommandNotFound();
			break;
		case 'applicationexecuted':
			this.addOutput( i18n('command_executed') );
			this.addNL();
			if( object.callback )
			{
				var f = extractCallback( object.callback );
				if( f ) f();
			}
			break;
		case 'friendnetwork':
			var message = object.data.data;
			if ( message.response.substr(0, 2) != 'ok' )
			{
				this.addError( 'Friend network error.' );
				this.addNL;
			}
			else
			{
				switch ( message.command )
				{
					case 'connect':
						this.addOutput( 'The Friend network has been enabled.' );
						this.addNL();
						break;
					case 'disconnect':
						this.addOutput( 'The Friend network has been disabled.');
						this.addNL();
						break;
					case 'listhosts':
						this.addOutput( 'These servers are available:' );
						for (var a = 0; a < message.hosts.length; a++ )
						{
							this.addOutput( a + 1 + '. "' + message.hosts[a] + '"' );
						}
						this.addNL();
						break;
					case 'starthosting':
						this.addOutput( 'You are hosting "' + message.name +'"' );
						this.addNL();
						break;
					case 'disposehosting':
						this.addOutput( '"' + message.name + '" has been disposed.' );
						this.addNL();
						break;
					case 'connecttohost':
						this.addOutput( 'You are now connected to "' + message.name + '"' );
						this.addNL();
						break;
					case 'sendtohost':
						break;
				}
			}
			break;
		case 'applicationlist':
			for( var a = 0; a < object.data.length; a++ )
			{
				this.addOutput( object.data[a].applicationNumber + '. ' + object.data[a].name );
			}
			this.addNL();
			break;
		case 'execute':
			this.evaluateInput( [ object.args ], 0 );
			break;
		default:
			//console.log( 'Received an uncaught packet' );
			//console.log( object );
			break;
	}
}

Application.parseVariables = function( pr )
{
	for( var a in this.variables )
	{
		if( !a.length ) continue;
		pr = pr.split( "$" + a ).join( this.variables[a] );
	}
	return pr;
}

// CLI commands! ---------------------------------------------------------------

// TODO: Get around ok<!--separate-->{ "response": "Device not mounted" } error
function cmdCat( what, callback )
{
	var l = new Library( 'system.library' );
	l.onExecuted = function( e, d )
	{
		if( callback )
		{
			callback( 'All went well!' );
		}
	}
	l.execute( 'file/read', {
		mode: 'r',
		bytes: 32,
		offset: 0,
		path: what
	} );
}

// makes a new execution list with a new indexing (set it to zero now!)
function newStack( arr, newArr, index )
{
	var finalArr = [];
	var mode = 0; // Are we inserting?
	var i = 0;    // Index in newArr
	var ai = 0;   // Index in arr
	var whole = arr.length + newArr.length;
	for( var a = 0; a < whole; a++ )
	{
		// Insert the first part up to index
		if( a <= index )
		{
			finalArr.push( arr[ai++] );
		}
		// Insert the new array
		else if( mode == 0 && i < newArr.length )
		{
			finalArr.push( newArr[i++] );
			if( i == newArr.length ) 
				mode++;
		}
		else if( mode == 1 )
		{
			finalArr.push( arr[ai++] );
		}
	}
	return [];
	return finalArr;
}

// Adds a dormant event trigger
function addOnEventTrigger( app, trigger, variable, newList )
{
	function callback( data )
	{
		var script = "input off\n";
		for( var a in newList ) script += newList[a] + "\n";
		Application.variables[ variable ] = data;
		Application.evaluateInput( [ script ], 0 );
	}
	
	var cid = addPermanentCallback( callback );
	
	DormantMaster.addEvent( {
		eventName: trigger,
		applicationName: app,
		callbackId: cid
	} );
}

// Just move cursor to the end of interactive element (like contentEditable)
function cursorToEndOn( element )
{
    var range,selection;
    if( document.createRange )
    {
        range = document.createRange();
        range.selectNodeContents( element );
        range.collapse( false );
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange( range );
    }
    else if( document.selection )
    { 
        range = document.body.createTextRange();
        range.moveToElementText( element );
        range.collapse( false );
        range.select();
    }
}

