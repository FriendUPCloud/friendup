/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	// Local shell instance
	this.shell = new Shell();
	this.shell.onReady = function( data )
	{
		this.ready = true;
	}
	
	this.icons = [];
	this.propWindows = [];
	this.elements = [];
	this.playTimeout = false;
	this.playlistPosition = 0;
	this.playSpeed = 200;
	this.coordsX = 0;
	this.coordsY = 0;
	this.cmdLog = [];
	this.playing = false;
	this.variables = [];
	this.delay = 250;
	this.currentPath = 'System:';
	
	// Set up buttons
	ge( 'Play' ).onclick = function()
	{
		Application.playing = true;
		Application.runPlaylist();
	}
	
	// Set up buttons
	ge( 'Pause' ).onclick = function()
	{
		Application.playing = false;
	}
	
	// Set up buttons
	ge( 'Stop' ).onclick = function()
	{
		Application.playing = false;
		Application.playlistPosition = 0;
		Application.activatePlaylistItem( 0 );
	}
	
	// Set up buttons
	ge( 'Rewind' ).onclick = function()
	{
		Application.playing = false;
		Application.playlistPosition--;
		if( Application.playlistPosition < 0 )
			Application.playlistPosition = Application.elements.length - 1;
		Application.playPosition();
	}
	
	// Set up buttons
	ge( 'Forward' ).onclick = function()
	{
		Application.playing = false;
		Application.playlistPosition++;
		if( Application.playlistPosition > Application.elements.length - 1 )
			Application.playlistPosition = 0;
		Application.playPosition();
	}
	
	// Open the function palette
	ge( 'Palette' ).onclick = function()
	{
		if( Application.pal )
			return;
		var pw = new View( {
			title: 'Palette',
			width: 320,
			height: 320
		} );
		
		var pl = new File( 'Progdir:Templates/palette.html' );
		pl.onLoad = function( data )
		{
			pw.setContent( data );
		}
		pl.load();
		
		Application.pal = pw;
	}
	
}

Application.playPosition = function()
{
	var a = this.playlistPosition;
	this.activatePlaylistItem( a );
	this.shell.execute( this.icons[a].Filename + ' ' + this.icons[a].Options, function( data, result )
	{
		console.log( data, result );
	} );
}

// Evaluate input
// NB: MAKE SURE this always is equal to the one in Dingo
Application.parseVariables = function( pr )
{
	for( var a in this.variables )
	{
		if( !a.length ) continue;
		pr = pr.split( "$" + a ).join( this.variables[a] );
	}
	return pr;
}
// NB: MAKE SURE this always is equal to the one in Dingo, except for the first line
Application.evaluateInput = function( input, index, key, delay )
{
	if( !delay )
	{
		return setTimeout( function()
		{
			Application.checkPosition( input, index );
			Application.evaluateInput( input, index, key, 1 );
		}, Application.delay );
	}

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
				console.log( 'Lets find terminator..' );
				// Find the terminator
				var terminator = false;
				var depth = 0;
				for( var ba = index + 1; ba < input.length; ba++ )
				{
					console.log( 'Looking for a stop' );
					console.log( input[ba] );
					
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
							console.log( 'Looking for a stop' );
							console.log( input[ba] );
					
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
	// Handle scripts!
	else if( cmd[0] == 'version' )
	{
		t.addOutput( 'DoIt! version 0.9' );
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
				this.input = false;
			else if( cmd[1] == 'on' )
				this.input = true;
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

// These do nothing
Application.addError = function( err )
{
}
Application.generateOutputFromObjects = function( objdata )
{
}
Application.addOutput = function( str )
{
}
Application.addNL = function( str )
{
}
// End of These do nothing

Application.runPlaylist = function()
{
	var a = this.playlistPosition;
	
	var list = [];
	for( var c = 0; c < this.icons.length; c++ )
	{
		list[c] = this.icons[c].Filename + ' ' + this.icons[c].Options;
	}
	
	this.evaluateInput( list, a );
}

Application.checkPosition = function( stack, pos )
{
	console.log( 'Line ' + pos + '. ' + stack[pos] );
	this.activatePlaylistItem( pos );
}

Application.activatePlaylistItem = function( pos )
{
	for( var a = 0; a < this.elements.length; a++ )
	{
		var ele = this.elements[a];
		if( pos == a )
		{
			ele.className = ele.className.split( ' Active' ).join( '' ) + ' Active';
		}
		else
		{
			ele.className = ele.className.split( ' Active' ).join( '' );
		}
	}
}

Application.refreshElements = function()
{
	var e = ge( 'Elements' );
	e.innerHTML = '';
	this.elements = [];
	var margin = 0;
	var marginWidth = 20;
	for( var a = 0; a < this.icons.length; a++ )
	{
		var icon = this.icons[a];
		
		var command = document.createElement( 'div' );
		command.innerHTML = this.icons[a].Filename;
		command.className = 'Command HContent50 FloatLeft';
		
		var option = document.createElement( 'div' );
		option.innerHTML = this.icons[a].Options;
		option.className = 'Options HContent50 FloatLeft';
	
		var d = document.createElement( 'div' );
		d.className = 'Box HRow MarginBottom';
		d.appendChild( command );
		d.appendChild( option );
		
		// Pre context
		if( icon.Filename.substr( icon.Filename.length - 1, 1 ) == ':' )
			d.className += ' Label';
		if( icon.Filename == 'stop' )
		{
			margin -= marginWidth;
			d.className += ' Stop';
		}
		
		d.style.marginLeft = margin.toString() + 'px';
		e.appendChild( d );
		
		d.onclick = function( e )
		{
			return cancelBubble( e );
		}
		
		d.onstartdrag = function( e )
		{
			return cancelBubble( e );
		}
		
		d.onselectstart = function( e )
		{
			return cancelBubble( e );
		}
		
		d.indx = a;
		d.ondblclick = function( e )
		{
			editElement( this.indx );
			return cancelBubble( e );
		}
		
		this.elements.push( d );
		
		// Context and margins
		// A label
		//if( icon.Filename.substr( icon.Filename.length - 1, 1 ) == ':' )
		//	margin += marginWidth;
		// A condition block
		if( icon.Options.substr( icon.Options.length - 1, 1 ) == ':' )
		{
			d.className += ' Condition';
			margin += marginWidth;
		}
	}
	this.activatePlaylistItem( this.playlistPosition );
}

// When receiving icons from Workspace
Application.dropElements = function( icons )
{
	// Check if we dropped on some existing elements
	var eles = ge( 'Elements' ).getElementsByTagName( 'div' );
	for( var a = 0; a < eles.length; a++ )
	{
		var t = eles[a].offsetTop;
		var l = eles[a].offsetLeft;
		var w = eles[a].offsetWidth;
		var h = eles[a].offsetHeight;
		/*if( this.coordsX >= l && this.coordsX < l + w && this.coordsY >= t && this.coordsY < t + h )
		{
			console.log( 'Element div with innerHTML ' + eles[a].innerHTML + ' WAS HIT!' );
		}
		else console.log( 'Element div at ' + l + ', ' + t + 
			' and dims ' + w + 'x' + h );*/
	}
	
	for ( var a = 0; a < icons.length; a++ )
	{
		if( icons[a].Type == 'DormantFunction' || icons[a].Type == 'DormantTrigger' )
		{
			if( !icons[a].Options )
				icons[a].Options = '';
			this.icons.push( icons[a] );
		}
		// A script
		else if( icons[a].Filename.match( /.run/i ) )
		{
			console.log( icons[a] );
			var f = new File( icons[a].Path );
			f.onLoad = function( data )
			{
				Application.initListByData( data.split( "\n" ) );
			}
			f.load();
		}
		else 
		{
			// TODO: Make some alert about not being able to add this type
		}
	}
	this.refreshElements();
}

function editElement( indx )
{
	if( Application.propWindows['edit_doit_' + indx] )
		return;
	
	// Find context
	var context = 'built-in';
	
	var v = new View( {
		title: 'Edit item',
		width: 300, 
		height: 160,
		id: 'edit_doit_' + indx 
	} );
	
	Application.propWindows['edit_doit_' + indx] = v;
	
	// Clean out in list
	v.onClose = function()
	{
		var o = [];
		for( var a in Application.propWindows )
		{
			if( a == 'edit_doit_'+indx )
				continue;
			o[a] = Application.propWindows[a];
		}
		Application.propWindows = o;
	}
	
	var dob = Application.icons[indx];
	
	var f = new File( 'Progdir:Templates/item.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
		
		v.sendMessage( {
			command: 'set',
			data: {
				command: dob.Filename,
				resource: context,
				args: dob.Options,
				pwin: 'edit_doit_' + indx
			}
		} );
	}
	f.load();
}

// Gets which resource by line number
Application.getResourceByContext = function( lineNumber, command )
{
	return false;
}

Application.initListByData = function( data )
{
	this.icons = [];
	
	var context = '';
	
	// Make sure list is ok! (preparse)
	var pp = [];
	for( var a = 0; a < data.length; a++ )
	{
		var line = data[a];
		if( line.indexOf( ':' ) > 0 )
		{
			var pars = line.split( ':' );
			pp.push( pars[0] + ':' );
			if( Trim( pars[1] ) )
			{
				pp.push( pars[1] );
				pp.push( 'stop' );
			}
		}
		else
		{
			pp.push( line );
		}
	}
	
	for( var a = 0; a < pp.length; a++ )
	{
		var line = Trim( pp[a] );
		if( line.indexOf( ';' ) > 0 )
		{
			var l = line.split( ';' );
			for( var b = 0; b < l.length; b++ )
			{
				if( !Trim( l[b] ) ) continue;
				var d = l[b].split( ' ' );
				var cmds = [];
				for( var c = 1; c < d.length; c++ )
					cmds.push( d[c] );
				this.icons.push( {
					Filename: d[0],
					Options: cmds.join( ' ' ),
					Resource: context
				} );
			}
		}
		else
		{
			if( !Trim( line ) ) continue;
			var d = line.split( ' ' );
			var cmds = [];
			for( var c = 1; c < d.length; c++ )
				cmds.push( d[c] );
			this.icons.push( {
				Filename: d[0],
				Options: cmds.join( ' ' ),
				Resource: context
			} );
		}
	}
	
	// Redraw
	this.refreshElements();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'setlist':
			this.initListByData( msg.list );
			break;
		case 'drop':
			this.dropElements( msg.data );
			break;
		case 'close':
			if( this.propWindows[msg.pwin] ) this.propWindows[msg.pwin].close();
			break;
		case 'apply':
			break;
		case 'inputcoordinates':
			this.coordsX = msg.data.x;
			this.coordsY = msg.data.y;
			break;
	}
}

