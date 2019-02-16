/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function()
{
	// Just add start task to pipeline
	Pipeline.currentTasks.push( {
		type: 'start'
	} );
	checkState();
}

function checkState()
{
	if( !Pipeline.currentTasks.length )
		return;
		
	var task = Pipeline.currentTasks[ 0 ];
	
	if( Application[ 'task_' + task.type ] )
	{
		Application[ 'task_' + task.type ]();
	}
	
}

// Engine ----------------------------------------------------------------------

Application.task_start = function()
{
	ShowHeading( 'What is your name?', 5000, function()
	{
		ShowInput( 'Your name...', function( name )
		{
			var p = new Player( name );
			Brain.addPlayer( p );
			Brain.refreshStatus();
		}  ); 
	} );
}

Application.task_menu = function()
{
}

// Structure -------------------------------------------------------------------

var Brain = {
	screen: 'status',
	addPlayer: function( player )
	{
		this.memory.players.push( player );
		Gui.ShowBubbleNotification( player.name + ' entered game.' );
	},
	memory: {
		players: [
		],
		bank: {
			balance: 10000.0
		}
	},
	refreshStatus()
	{
		Application.sendMessage( {
			command: 'setScreenTitle',
			data: 'SpaceAge - Balance: ' + Brain.memory.bank.balance
		} );
	}
};

var Pipeline = {
	currentTasks: [],
	locations: [],
	menus: {
		mainMenu: {
			'projects': 'Projects',
			'research': 'Research',
			'taxes'   : 'Taxes'
		}
	}
};


// Graphics operations ---------------------------------------------------------

ShowHeading = function( heading, timeout, callback )
{
	var v = document.createElement( 'h1' );
	v.className = 'Heading Opening';
	v.innerHTML = heading;
	document.body.appendChild( v );
	if( timeout )
	{
		setTimeout( function()
		{
			setTimeout( function()
			{
				v.classList.remove( 'Opening' );
				v.classList.add( 'Closing' );
				setTimeout( function()
				{
					document.body.removeChild( v );
					if( callback )
					{
						callback();
					}
				}, 500 );
			}, timeout );
		}, 500 );
	}
}

ShowInput = function( question, callback )
{
	console.log( 'Ok, input: ', question );
	var v = document.createElement( 'input' );
	v.type = 'text';
	v.className = 'Question';
	v.placeholder = question;
	document.body.appendChild( v );
	
	setTimeout( function()
	{
		v.classList.add( 'Showing' );
		v.onkeydown = function( e )
		{
			var k = e.charCode ? e.charCode : e.which;
			if( k == 13 )
			{
				if( callback )
				{
					callback( this.value );
				}
				v.classList.remove( 'Showing' );
				setTimeout( function()
				{
					v.parentNode.removeChild( v );
				}, 500 );
			}
		}
	}, 500 );
}

