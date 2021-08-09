/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
	this.disableCLI();
	
	// Script list for parsing
	this.scriptListArray = [];
	this.scriptListPosition = 0;
	
	// FriendNetwork
	this.friendNetwork = 'disabled';
	this.friendNetworkClient = false;
	this.friendNetworkHosts = [];
	
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
		let sw = packet.returnMessage || packet.data;
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
				FriendNetwork.list( function( msg ){} );
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
							case 'help':
								// Help on command
								if( packet.returnMessage.name )
								{
									let help = i18n( 'i18n_' + packet.returnMessage.name );
									Application.addOutput( help );
									Application.addNL();
								}
								break;
							case 'friendnetworkhost':
								FriendNetwork.host
								( 
									packet.returnMessage.name, 
									'system', 
									'FriendShell', 
									'Please connect to my Friend Shell', 
									{ password: packet.returnMessage.password }
								);
								break;
							case 'friendnetworkstatus':
								FriendNetwork.status();
								break;
							case 'friendnetworkconnect':
								this.noNextNL = true;
								if ( !this.friendNetworkClient )
								{
									FriendNetwork.connect( packet.returnMessage.name, 'system', packet.returnMessage.p2p );
								}
								else
								{
									this.addError( 'Cannot connect : you are already a client.' );
									this.addNL();
								}
								break;
							case 'friendnetworksetpassword':
							{
								let ok = false;
								if ( !Application.friendNetworkClient && Application.friendNetworkHosts )
								{
									for( let key in Application.friendNetworkHosts )
									{
										if ( Application.friendNetworkHosts[ key ].name == packet.returnMessage.name )
										{
											ok = true;
											FriendNetwork.setHostPassword( key, packet.returnMessage.password );
											break;
										}
									}
								}
								if ( !ok )
								{
									this.addError( 'Host not found.' );
									this.addNL();
								}
								break;
							}
							case 'friendnetworkdisconnect':
								if ( this.friendNetworkClient )
								{
									FriendNetwork.disconnect( this.friendNetworkClient.key, function( msg ) {
									} );
									Application.fnetDisconnect();
								}
								else
									this.addError( 'You are not connected to anyone.' );
								this.addNL();
								break;
							case 'friendnetworkdispose':
							{
								let found = false;
								if ( !Application.friendNetworkClient && Application.friendNetworkHosts )
								{
									let hostName = packet.returnMessage.name;
									let userName, p;
									if ( (p = hostName.indexOf('@')) >= 0)
									{
										userName = hostName.substring(p + 1);
										hostName = hostName.substring(0, p);
									}
									for( let key in Application.friendNetworkHosts )
									{
										let name = Application.friendNetworkHosts[ key ].name;
										if ( !userName )
										{
											p = name.indexOf('@');
											if ( name.substring(0, p) == hostName )
											{
												found = true;
												break;
											}
										}
										else if ( packet.returnMessage.name == name )
										{
											found = true;
											break;
										}
									}
								}
								if ( found )
								{
									FriendNetwork.dispose( key, function( msg ) {
									});
								}
								else
								{
									this.addError('Host not found.');
									this.addNL();
								}
								break;
							}
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
		let members = 0;
		let fmem = false;
		
		// Only count this if its an objects
		if( typeof( packet.data ) == 'object' )
		{
			for( let a in packet.data )
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
			let out = Application.generateOutputFromObjects( packet.data );
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
		Application.enableCLI();
		if ( !this.noNextNL )
			Application.addNL();
		else
			this.noNextNL = false;
	}
}

// Add error line
Application.addError = function( str )
{
	let n = document.createElement( 'div' );
	n.innerHTML = '<div class="Error">' + str + '</div>';
	this.terminal.appendChild( n );
	this.terminal.scrollTop = 99999999;
}

// Add error line
Application.addOutput = function( str)
{
	let n = document.createElement('div');
	n.innerHTML = '<div class="Output SelectableText">' + str + '</div>';
	this.terminal.appendChild(n);
	this.terminal.scrollTop = 99999999;
}

// Remove old editing possibility
Application.disableCLI = function( loadinganim )
{
	this.input = false;
	this.loadingNr = 0;
	if( this.currentCLI )
	{
		let pn = this.currentCLI.parentNode.parentNode;
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
		let pn = this.currentCLI.parentNode.parentNode;
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
	
	let t = this.cliTemplate;
	let n = document.createElement( 'div' );
	n.innerHTML = t;
	this.terminal.appendChild( n );
	
	let cli = GeByClass( 'Cli', n );
	cli.contentEditable = true;
	cli.spellcheck = false;
	
	// Hack, please check if window is active..
	if( focus || document.body.classList.contains( 'activated' ) )
	{
		setTimeout( function(){ Application.focusCLI(); }, 150 );
	}
	
	let path = GeByClass( 'Path', n );
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
	
	this.focusCLI();
}

// Add new line
Application.addQuestion = function( question, callback )
{
	if( this.currentCLI && this.currentCLI.contentEditable == false ) return false;
	
	if( !this.input )
	{
		this.terminal.scrollTop = 99999999;
		return false;
	}
	
	this.questionCallback = callback;
	this.disableCLI();
	
	let t = this.cliTemplate;
	let n = document.createElement( 'div' );
	n.innerHTML = t;
	this.terminal.appendChild( n );
	
	let cli = GeByClass( 'Cli', n );
	cli.contentEditable = true;
	cli.spellcheck = false;
	
	// Hack, please check if window is active..
	if( focus || document.body.className.indexOf( 'activated' ) > 0 )
	{
		setTimeout( function(){ Application.focusCLI(); }, 150 );
	}
	
	n.className = 'Password';
	
	let path = GeByClass( 'Path', n );
	path.innerHTML = question +': ';
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
			let t = this.terminal;
			if( t )
			{
				let cli = GeByClass( 'Cli', t );
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
			let t = this.terminal;
			if( t )
			{
				let cli = GeByClass( 'Cli', t );
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
	let t = this;
	let f = this.terminal.getElementsByTagName( 'div' );
	let o = false;
	for( let a = f.length - 1; a > 0; a-- )
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
			let k = e.which ? e.which : e.keyCode;
			let ctrl = e.ctrlKey;
			
			// Enter pressed
			if( k == 13 )
			{
				if( t.currentCLI.innerHTML == '' )
					t.evaluateInput( [ "\n" ], 0, k );
				else
				{
					if ( t.questionCallback )
					{
						let callback = t.questionCallback;
						t.questionCallback = false;
						callback( t.currentCLI.innerHTML );
						return cancelBubble( e );
					}
					
					// Add last command to log
					t.cmdLog.push( t.currentCLI.innerHTML );
					t.logKey = t.cmdLog.length - 1;
					
					// Are we client of a FriendNetwork Shell host?
					if ( t.friendNetworkClient )
					{
						// Are we calling fnet disconnect?
						let s = t.currentCLI.innerHTML.toLowerCase();
						let p = s.indexOf( 'fnet', 0 );
						if ( p < 0 ) p = s.indexOf( 'friendnetwork' );
						if ( p >= 0 )
						{
							if ( s.indexOf( 'disconnect', p ) > p )
							{
								t.evaluateInput( [t.currentCLI.innerHTML], 0, k );
							}
							else if ( s.indexOf( 'status', p ) > p )
							{
								t.evaluateInput( [t.currentCLI.innerHTML], 0, k );
							}
						}
						else
						{
							FriendNetwork.send(t.friendNetworkClient.key, [t.currentCLI.innerHTML], function (msg)
							{
								console.log('FriendShell sent: ', t.friendNetworkHostKey, msg);
							});
						}
					}
					else
					{
						t.evaluateInput([t.currentCLI.innerHTML], 0, k);
					}
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
					
					let cmds = Application.currentCLI.innerText;
					cmds = cmds.split( ' ' );
					let lcmd = cmds[cmds.length-1];
					
					let m = new Library( 'system.library' );
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
							for( let a = 0; a < rd.length; a++ )
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
						
						let d = new Door( Application.currentPath );
						d.path = Application.currentPath;
						d.getIcons( function( data )
						{
							if( lcmd && lcmd.toLowerCase && lcmd.length )
							{
								for( let a = 0; a < data.length; a++ )
								{
									let fn = data[a].Filename ? data[a].Filename : data[a].Title;
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
					let cl = t.currentCLI.innerText;
					let d = new Door( Application.currentPath );
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
	let trans_cmd_not_found = i18n( 'i18n_command_not_found' );
	this.addError( trans_cmd_not_found + '.' );
	this.addNL();
}

Application.generateOutputFromObjects = function( objects )
{
	let acount = objects.length;
	// Fix objects to array
	if( isNaN( acount ) )
	{
		let o = [];
		for( let a in objects ) o.push( objects[a] );
		objects = o;
		acount = o.length;
	}
	let third  = Math.floor( acount / 3 );
	let output = [];
	let count  = 0;
	let column = 0;
	
	// Go through the icons
	let icons = '';
	let trash = 0; // how many bad icons were found
	for( let a = 0; a < acount; a++ )
	{
		let row = objects[a];
		if( !output[column] ) output[column] = '';
		if( !row.Type ){ trash++; continue; }
		let dirType = row.Type ? row.Type.toLowerCase() : 'File';
		let isDir = ( dirType == 'directory' || row.MetaType == 'Folder' || dirType == 'dormant' );
		let isElement = dirType != 'File' && !isDir;
		let itm = '';
		if ( isDir ) 
		{
			itm = ( row.Title ? row.Title : row.Filename ) + ( isDir ? '/' : '' ) + '<br>';
			itm = '<div class="Container">' + itm + '</div>';
		}
		else if( isElement && !row.Filesize )
		{
			itm = '<div class="File">';
			let f = false;
			for( let b in row )
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
	for( let a = 0; a < output.length; a++ )
	{
		let c = output[a];
		icons += '<td style="vertical-align: top; padding-right: 20px">' + c + '</td>';
	}
	icons += '</tr></table><br>';
	icons += acount + ' ' + i18n( 'i18n_items_total' ) + '.<br><br>';
	return icons;
}

// Receive messages
Application.receiveMessage = function( object )
{
	let self = this;
	let command = object.command;
/*	if( !command )
	{
		if ( object.data && object.data.command )
			command = object.data.command;
		else
			return false;
	}
*/	switch( command )
	{
		case 'quit_shell':
			FriendNetwork.closeApplication();
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
				let f = extractCallback( object.callback );
				if( f ) f();
			}
			break;
		case 'activate':
			Application.focusCLI();
			break;
		case 'friendnetwork':
			switch (object.subCommand)
			{
				case 'list':
				{
					let output = false;
					let count = 1;
					for( let a = 0; a < object.hosts.length; a++ )
					{
						if ( object.hosts[a].apps )
						{
							let apps = object.hosts[a].apps;
							for( let b = 0; b < apps.length; b++ )
							{
								if ( apps[b].type == 'system' )
								{
									if ( !output )
									{
										this.addOutput('These servers are available:');
										output = true;
									}
									this.addOutput(count + '. "' + apps[b].name + '@' + object.hosts[a].name + '"');
									count++;
								}
							}
						}
					}
					if ( !output )
					{
						this.addOutput( 'No servers available.' );
					}
					this.addNL();
					break;
				}
				case 'host':
					this.addOutput('You are hosting "' + object.name + '"');
					this.friendNetworkHosts[ object.hostKey ] = { name: object.name, key: object.hostKey, clients: [] };
					this.addNL();
					break;
				case 'hostDisconnected':
					if ( this.friendNetworkClient )
					{
						this.friendNetworkClient = false;
						this.sendMessage( { command: 'settitle', text: 'New Shell' } );
						this.addOutput('You have been disconnected from "' + object.name + '"');
						this.addNL();
					}
					break;
				case 'disposed':
					if ( this.friendNetworkHosts[ object.hostKey ])
					{
						this.friendNetworkHosts[object.hostKey] = false;
						let temp = [];
						for( let key in this.friendNetworkHosts )
						{
							if ( this.friendNetworkHosts[ key ])
								temp[ key ] = this.friendNetworkHosts[ key ];
						}
						this.friendNetworkHosts = temp;
						this.addOutput('You are no longer hosting "' + object.name + '"');
						this.addNL();
					}
					break;
				case 'clientConnected':
				{
					let shell = new Shell();
					shell.onReady = function()
					{
						if ( Application.friendNetworkHosts[ object.hostKey ] )
						{
							let restrictedPath = object.sessionPassword ? false : Application.currentPath;
							Application.friendNetworkHosts[ object.hostKey ].clients[ object.key ] = {
								key:   object.key,
								shell: shell,
								restrictedPath: restrictedPath
							};
							shell.evaluate( ['cd ' + Application.currentPath ], function(){}, restrictedPath, object.key );
							let p2p = "";
							if ( object.p2p ) p2p = ' (peer-to-peer)'
							Application.addOutput( object.name + ' just connected to you' + p2p + '...' );
							Application.addNL();
						}
					};
					break;
				}
				case 'p2pClientConnected':
					Application.addOutput( 'Peer-to-peer connection established' );
					Application.addNL();
					break;
				case 'p2pConnected':
					Application.addOutput( 'Peer-to-peer connection established' );
					Application.addNL();
					break;
				case 'clientDisconnected':
					if( this.friendNetworkHosts[ object.hostKey ])
					{
						if ( this.friendNetworkHosts[ object.hostKey ].clients[ object.key ] )
						{
							this.friendNetworkHosts[ object.hostKey ].clients[ object.key ] = false;
							this.addOutput( object.name + ' disconnected from you...' );
							this.addNL();
						}
					}
					break;
				case 'timeout':
					if ( this.friendNetworkHosts[ object.hostKey ] )
					{
						if ( this.friendNetworkHosts[ object.hostKey ].clients[ object.key ])
						{
							this.friendNetworkHosts[ object.hostKey ].clients[ object.key ] = false;
							this.addOutput( object.name + ' timeout.' );
							this.addNL();
						}
					}
					else if ( this.friendNetworkClient && this.friendNetworkClient.key == object.key )
					{
						this.friendNetworkClient = false;
						this.addOutput( object.name + ' timeout.' );
						this.addNL();
					}
					break;
				case 'getCredentials':
					setTimeout( askQuestion, 500 );
					break;
				case 'connected':
					this.friendNetworkPreviousPath = this.currentPath;
					this.friendNetworkClient = { key: object.key, name: object.name, hostName: object.hostName };
					this.sendMessage( { command: 'settitle', text: 'New Shell - ' + object.hostName } );
					this.addOutput( 'You are now connected to "' + object.hostName + '"' );
					this.addNL();
					break;
				case 'disconnected':
					this.currentPath = this.friendNetworkPreviousPath;
					this.friendNetworkClient = false;
					this.sendMessage( { command: 'settitle', text: 'New Shell' } );
					this.addOutput( 'You are now disconnected from ' + object.name );
					this.addNL();
					break;
				case 'messageFromClient':
					if ( this.friendNetworkHosts[ object.hostKey ] )
					{
						if ( this.friendNetworkHosts[ object.hostKey ].clients[ object.key ] )
							this.friendNetworkHosts[ object.hostKey ].clients[ object.key ].shell.evaluate( object.data, false, object.key, this.friendNetworkHosts[ object.hostKey ].clients[ object.key ].restrictedPath );
					}
					break;
				case 'messageFromHost':
					if ( this.friendNetworkClient )
						Application.handlePipe( object.data );
					break;
				case 'status':
				{
					let out = "";
					out += 'FriendNetwork status report<br />';
					out += '---------------------------';
					if ( object.connected )
					{
						out += '<br />Connected';
						for( let a = 0; a < object.hosts.length; a++ )
						{
							out += '<br />Host: ' + object.hosts[ a ].name + '\n';
							for( let b = 0; b < object.hosts[ a ].hosting.length; b++ )
							{
								out += '<br />    Hosting: ' + object.hosts[ a ].hosting[ b ].distantName + '\n';
							}
						}
						for( let a = 0; a < object.clients.length; a++ )
						{
							out += '<br />Client: of ' + object.clients[a].hostName +'\n';
						}
					}
					else
					{
						out = '<br />Disconnected';
					}
					out += '<br />---------------------------';
					this.addOutput( out );
					this.addNL();
					break;
				}
				case 'error':
					this.noNextNL = false;
					switch ( object.error )
					{
						case 'ERR_HOST_ALREADY_EXISTS':
							this.addError('Host already exists.');
							break;
						case 'ERR_HOSTING_FAILED':
							this.addError('Hosting failed');
							break;
						case 'ERR_HOST_NOT_FOUND':
							this.addError('Host not found');
							break;
						case 'ERR_DISPOSING':
							this.addError('Error while disposing host.');
							break;
						case 'ERR_FAILED_CREDENTIALS':
							this.addOutput('Connection cancelled.');
							break;
						case 'ERR_WRONG_CREDENTIALS':
							this.addOutput('Invalid password...');
							setTimeout( askQuestion, 500 );
							break;
						default:
							this.addError('Network error.');
							break;
					}
					this.addNL();
					break;
			}
			break;
		case 'applicationlist':
			for( let a = 0; a < object.data.length; a++ )
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
	function askQuestion()
	{
		self.addQuestion( 'Please enter password ', function( result )
		{
			FriendNetwork.sendCredentials( object.key, result );
		} );
	}
}
Application.parseVariables = function( pr )
{
	for( let a in this.variables )
	{
		if( !a.length ) continue;
		pr = pr.split( "$" + a ).join( this.variables[a] );
	}
	return pr;
}
Application.fnetDisconnect = function()
{
	this.sendMessage( { command: 'settitle', text: 'New Shell' } );
	this.friendNetworkClient = false;
}

// CLI commands! ---------------------------------------------------------------

// TODO: Get around ok<!--separate-->{ "response": "Device not mounted" } error
function cmdCat( what, callback )
{
	let l = new Library( 'system.library' );
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
	let finalArr = [];
	let mode = 0; // Are we inserting?
	let i = 0;    // Index in newArr
	let ai = 0;   // Index in arr
	let whole = arr.length + newArr.length;
	for( let a = 0; a < whole; a++ )
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
		let script = "input off\n";
		for( let a in newList ) script += newList[a] + "\n";
		Application.variables[ variable ] = data;
		Application.evaluateInput( [ script ], 0 );
	}
	
	let cid = addPermanentCallback( callback );
	
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

