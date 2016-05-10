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

Application.run = function()
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
	
	// Fire up the core shell proxy
	this.shell = new Shell();
	this.shell.onReady = function()
	{
		Application.enableCLI();
		Application.addNL( true );
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
	var n = document.createElement( 'div' );
	n.innerHTML = '<div class="Output">' + str + '</div>';
	this.terminal.appendChild( n );
	this.terminal.scrollTop = 99999999;
}

// Remove old editing possibility
Application.disableCLI = function()
{
	this.input = false;
	if( this.currentCLI ) 
	{
		this.currentCLI.contentEditable = false;
	}
}

// Remove old editing possibility
Application.enableCLI = function()
{
	this.input = true;
	if( this.currentCLI ) 
		this.currentCLI.contentEditable = true;
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
	
			// Enter pressed
			if( k == 13 )
			{
				if( t.currentCLI.innerHTML == '' )
					t.evaluateInput( [ "\n" ], 0, k );
				else t.evaluateInput( [ t.currentCLI.innerHTML ], 0, k );
				return cancelBubble( e );
			}
			// Tab completion
			else if( k == 9 )
			{
				// Try to autocomplete
				if( !Application.complete )
				{
					Application.complete = 1;
					
					var d = new Door( Application.currentPath );
					d.path = Application.currentPath;
					d.getIcons( function( data )
					{
						var cmds = Application.currentCLI.innerText;
						cmds = cmds.split( ' ' );
						var lcmd = cmds[cmds.length-1];
						
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
				// Aha, check autocomplete alternatives
				else
				{
					var cl = t.currentCLI.innerText;
					var d = new Door( Application.currentPath );
					d.path = Application.currentPath;
					d.getIcons( function( data )
					{
						t.addOutput( Application.generateOutputFromObjects( data ) );
						t.addNL();
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
	// End of the line on arrays
	if( index >= input.length )
	{
		// Go ahead with the next
		if( this.temporaryList )
		{
			var nextList = this.temporaryList.list;
			var nextIndex = this.temporaryList.index;
			this.temporaryList = null;
			return this.evaluateInput( nextList, nextIndex );
		}
		return;
	}
	if( !index ) index = 0;
	
	
	var t = this;
	var cmd, rawLine;
	
	// elements
	if( input[index] )
	{
		rawLine = input[index];
		cmd = rawLine.split( /\<[^>]*?\>/i ).join( '' );
	}
	else
	{
		rawLine = ''; cmd = '';
	}
	
	// Ignore identation
	cmd = Trim( cmd );
	
	// Ignore comments
	if( cmd.substr( 0, 2 ) == '//' ) return Application.evaluateInput( input, index + 1 );
	
	// Multiline fork
	if( cmd.indexOf( ';' ) > 0 )
	{
		cmd = cmd.split( ';' );
		var ar = [];
		var a = 0;
		for( ; a < cmd.length; a++ )
		{
			ar[a] = Trim( cmd[a] );
		}
		if( input.length && index + 1 < input.length )
		{
			var b = index + 1;
			for( ; b < input.length; b++ )
			{
				ar[a++] = input[b];
			}
		}
		return Application.evaluateInput( ar );
	}
	
	// Add last command to log
	if( this.input && rawLine.substr( 0, 6 ) != 'input ' )
	{
		this.cmdLog.push( cmd );
		this.logKey = this.cmdLog.length - 1;
	}
	
	cmd = cmd.split( '\\ ' ).join( '<!--space--!>' );
	cmd = this.parseVariables( cmd );
	cmd = cmd.split( ' ' );
	cmd[0] = cmd[0].toLowerCase();

	// Safety, correct currentpath
	if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != ':' )
	{
		if ( this.currentPath.substr( this.currentPath.length-1, 1 ) != '/' )
			this.currentPath += '/';
	}
	
	if( cmd[0] == "\n" )
	{
		if( key == 13 )
			this.addNL();
		return this.evaluateInput( input, index + 1 );
	}
	if( cmd[0] == 'if' )
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
					for( var c = a + 1; c < cmd.length; c++ )
					{
						if( c > a + 1 ) preroll += ' ';
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
						arguments[a].vars[c] = Application.parseVariables( arguments[a].vars[c] );
				
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
			if( input.length <= index && !preroll.length )
			{
				t.addOutput( result );
				return t.addNL() 
			}
			// ok, just use what is after colon
			else if( preroll.length )
			{
				if( result )
				{
					this.temporaryList = { list: input, index: index + 1 };
					return Application.evaluateInput( preroll, 0 );
				}
			}
			// Ok we have what we need, now find out if we have a long list!
			else
			{
				// Find the terminator
				var terminator = false;
				var depth = 0;
				for( var ba = index + 1; ba < input.length; ba++ )
				{
					var lineH = Trim( input[ba] );
					
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
						if( depth == 0 )
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
						return Application.evaluateInput( input, index + 1 );
					}
					else
					{
						return Application.evaluateInput( input, terminator + 1 );
					}
				}
				// No terminator
				else
				{
					if( result )
					{
						return Application.evaluateInput( input, index + 1 );
					}
					else
					{
						return Application.evaluateInput( input, index + 2 );
					}
				}
			}
		}
		return Application.evaluateInput( input, index+1 );
	}
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
					var preroll = '';
					var variable = '';
					if( colonFound == false )
					{
						for( var c = 0; c < cmd.length; c++ )
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
						for( var c = colonFound+1; c < cmd.length; c++ )
						{
							if( c > colonFound+1 )
								preroll += ' ';
							preroll += cmd[c];
						}
					}
					
					// Hmm. No more commands?
					if( input.length <= index && !preroll.length )
					{
						return t.addNL() 
					}
					// Ok we have what we need, now find out if we have a long list!
					// NOTICE: In a repeat loop, the optional variable for the loop is pre parsed
					else
					{
						// Find the terminator
						var terminator = false;
						var depth = 0;
						for( var ba = index + 1; ba < input.length; ba++ )
						{
							var lineH = Trim( input[ba] );
					
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
								if( depth == 0 )
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
							var newList = [];
							
							for( var ni = 0; ni < num; ni++ )
							{
								Application.variables[variable] = ni;
								
								for( var n = index + 1; n <= terminator; n++ )
								{	
									if( preroll )
									{
										var pr = Trim( preroll );
										
										// Skip the stop
										if( pr == 'stop' ) continue;
										if( pr == '' ) continue;
										
										pr = Application.parseVariables( pr );
										newList.push( Trim( pr ) );
									}
									
									// Skip a stop
									var pr = Trim( input[n] );
									if( pr == 'stop' ) continue;
									if( pr == '' ) continue;
									
									var pr = Application.parseVariables( pr );
									newList.push( pr );
								}
							}
							
							//var list = newStack( input, newList, terminator + 1 ); // skip past terminator
							
							// Go ahead with the list first
							Application.temporaryList = { list: input, index: terminator + 2 };
							return Application.evaluateInput( newList, 0 );
						}
						// No terminator
						else
						{
							// New list
							var newList = [];
							for( var n = 0; n < num; n++ )
							{
								var pr = preroll;
								Application.variables[variable] = n;
								pr = Application.parseVariables( pr );
								newList.push( pr );
							}
							//var list = newStack( input, newList, index + 1 );
							Application.temporaryList = { list: input, index: index + 1 };
							return Application.evaluateInput( newList, 0 );
						}
					}
				}
			}
		}
		Application.addError( 'Syntax error.' );
		Application.addNL();
		Application.evaluateInput( input, index + 1 );
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
					if( colonFound == false )
					{
						for( var c = 0; c < cmd.length; c++ )
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
						for( var c = colonFound+1; c < cmd.length; c++ )
						{
							if( c > colonFound+1 )
								preroll += ' ';
							preroll += cmd[c];
						}
					}
					
					// Hmm. No more commands?
					if( input.length <= index && !preroll.length )
					{
						return t.addNL() 
					}
					// Ok we have what we need, now find out if we have a long list!
					// NOTICE: In a repeat loop, the optional variable for the loop is pre parsed
					else
					{
						// Find the terminator
						var terminator = false;
						var depth = 0;
						for( var ba = index + 1; ba < input.length; ba++ )
						{
							var lineH = Trim( input[ba] );
					
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
								if( depth == 0 )
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
									var pr = Trim( preroll );
									
									// Skip the stop
									if( pr == 'stop' ) continue;
									if( pr == '' ) continue;
									
									pr = Application.parseVariables( pr );
									newList.push( Trim( pr ) );
								}
								
								// Skip a stop
								var pr = Trim( input[n] );
								if( pr == 'stop' ) continue;
								if( pr == '' ) continue;
								
								var pr = Application.parseVariables( pr );
								newList.push( pr );
							}
							
							// Add script that will run on event
							if( app && trigger )
								addOnEventTrigger( app, trigger, variable, newList );
							t.addNL();
							// Go ahead with the list after terminator
							return Application.evaluateInput( input, terminator + 2 );
						}
						// No terminator
						else
						{
							// New list
							var newList = [];
							var pr = preroll;
							pr = Application.parseVariables( pr );
							newList.push( pr );
							
							// Add script that will run on event
							if( app && trigger )
								addOnEventTrigger( app, trigger, variable, newList );
							
							// Go ahead with the list after terminator
							t.addNL() 
							return Application.evaluateInput( input, index + 1 );
						}
					}
				}
			}
		}
		t.addNL() 
		return Application.evaluateInput( input, index + 1 );
	}
	// Handle scripts!
	else if( cmd[0] == 'version' )
	{
		t.addOutput( 'Dingo version 0.9' );
		t.addNL();
		return Application.evaluateInput( input, index + 1 );
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
			var f = new File( fname );
			f.onLoad = function( data )
			{
				parseShellScript( data );
			}
			f.load();
			return;
		}
		t.addError( 'Could not execute script ' + cmd[1] );
		t.addNL();
	}
	// Handle gotos!
	else if( cmd[0] == 'goto' )
	{
		var where = cmd[1];
		if( !isNaN( parseInt( where ) ) )
		{
			return Application.evaluateInput( input, parseInt( where ) );
		}
		for( var a = 0; a < input.length; a++ )
		{
			var str = Trim( input[a] );
			if( str.substr( str.length - 1, 1 ) == ':' && str.substr( 0, str.length - 1 ) == where )
			{
				return Application.evaluateInput( input, a );
			}
		}
		return false;
	}
	else
	{
		var ignoreOutput = false;
		// Handle input requests (will also be trapped by global shell)
		if( cmd.length == 2 && cmd[0] == 'input' )
		{
			if( cmd[1] == 'off' )
			{
				Application.disableCLI();
			}
			else if( cmd[1] == 'on' )
			{
				Application.enableCLI();
			}
		}
		else if( cmd.length == 1 && cmd[0] == 'clear' )
		{
			this.terminal.innerHTML = '';
			this.addNL();
			ignoreOutput = true;
		}
		
		// Send it to our man!
		this.shell.execute( cmd.join( ' ' ), function( packet )
		{
			if( ignoreOutput )
			{
				if( index + 1 < input.length )
					return Application.evaluateInput( input, index + 1 );
				return;
			}
			if( packet.data )
			{
				// Update variables
				if( packet.returnMessage && packet.returnMessage.variable )
				{
					Application.variables[packet.returnMessage.variable] = packet.returnMessage.variableValue;
				}
				// Parse the returnMessage on directory change
				if( cmd[0] == 'cd' || cmd[0] == 'enter' || cmd[0] == 'leave' )
				{
					if( packet.returnMessage && packet.returnMessage.path )
					{
						Application.currentPath = packet.returnMessage.path;
					}
				}
				
				if( typeof( packet.data ) == 'object' )
				{
					var out = Application.generateOutputFromObjects( packet.data );
					Application.addOutput( out );
					Application.addNL();
				}
				else
				{
					if( packet.data != true && packet.data != false && ( packet.data + "" ).split( /[\s]+/ ).join ( '' ).length > 0 )
						Application.addOutput( packet.data );
					Application.addNL();
				}
			}
			else
			{
				if( packet.returnMessage && packet.returnMessage.response )
				{
					Application.addError( packet.returnMessage.response );
				}
				Application.addNL();
			}
			// Next in line
			if( index + 1 < input.length )
				Application.evaluateInput( input, index + 1 );
		} );
	}
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
	if( !object.command ) return false;
	switch( object.command )
	{
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
			console.log( 'We got a message: ' );
			console.log( object );
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
		case 'applicationlist':
			for( var a = 0; a < object.data.length; a++ )
			{
				this.addOutput( object.data[a].applicationNumber + '. ' + object.data[a].name );
			}
			this.addNL();
			break;
		default:
			console.log( 'Received an uncaught packet' );
			console.log( object );
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

// TODO: Get around ok<!--separate-->{ "ErrorMessage": "Device not mounted" } error
function cmdCat( what, callback )
{
	var l = new Library( 'system.library' );
	l.onExecuted = function( e, d )
	{
		console.log( 'My response is: ' + e );
		console.log( d );
		console.log( '..' );
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

// Parses a shell script!
function parseShellScript( data )
{
	if( data.substr( 0, 1 ) == '<' )
	{
		Application.input = true;
		Application.addError( 'Error in script on line 1.' );
		Application.addNL();
		return false;
	}
	data = data.split( "\n" );
	for( var a in data )
	{
		var line = data[a];
		data[a] = Application.parseVariables( line );
	}
	Application.evaluateInput( data, 0 );
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
		parseShellScript( script );
	}
	
	var cid = addPermanentCallback( callback );
	
	DormantMaster.addEvent( {
		eventName: trigger,
		applicationName: app,
		callbackId: cid
	} );
}


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
