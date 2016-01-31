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

document.title = 'Services main';

// Launch application here -----------------------------------------------------
Application.run = function( msg )
{
	var w = new View( {
		title:  'Services',
		width:  500,
		height: 400,
		id:     'mainWindow'
	} );
	
	this.mainView = w;
	
	w.onClose = function() { Application.quit(); }
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			// load entries
			var l = new Library( 'system.library' );
			l.onExecuted = function( data )
			{
				w.sendMessage( {
					command: 'setserviceslist',
					data: data
				} );
			}
			l.execute( 'services', 'list' );
		} );
	}
	f.load();
}


// Receive messages from Doors -------------------------------------------------
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'start':
			console.log( 'start service: ' + msg.id );
			// Opening a call to Friend Core
			var jax = new cAjax ();
			jax.open( 'post', 'system.library/services/start', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.addVar( 'status', 'start' );
			jax.send ();
			break;
		
		case 'stop':
			console.log( 'stop service: ' + msg.id );
			// Opening a call to Friend Core
			var jax = new cAjax ();
			jax.open ( 'post', 'system.library/services/stop', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.addVar( 'status', 'stop' );
			jax.send ();
			break;
		
		case 'executeCommand':
			// get service custom GUI
			var jax = new cAjax ();
			jax.open ( 'post', 'system.library/services/runcommand', true, true );
			jax.addVar( 'serviceName', msg.id );
			jax.onload = function( lmdata )
			{
				console.log('Run command: ' + lmdata );
			} ;
			jax.send ();
			break;

		case 'test':
			this.mainView.setContentById( 'Testing', '<button type="button" onclick="doIt(); Application.sendMessage( { command: \'remove\' } )">Hello</button>' );
			console.log( 'Testing, eh?' );
			break;
		case 'remove':
			this.mainView.setContentById( 'Testing', '' );
			break;
	}
}

