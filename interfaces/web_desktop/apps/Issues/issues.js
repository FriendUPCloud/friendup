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

document.title = 'All issues';

Application.run = function( msg )
{
	var w = new View( {
		title: 'Issues',
		width: 480,
		height: 500,
		id: 'Issues'
	} );
	this.mainView = w;
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	w.setMenuItems( [
		{
			name: 'File',
			items: [
				{
					name: 'Refresh issues',
					command: 'refreshIssues'
				},
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		},
		/* Uncommented until we can determina user privileges */
		/*this.userInfo.Level == 'Admin' ? 
		{
			name: 'Categories',
			items: [
				{
					name: 'Edit categories',
					command: 'showcatview'
				}
			]
		} : false,*/
		{
			name: 'Help',
			items: [
				{
					name: 'Index',
					command: 'helpindex'
				}
			]
		}
	] );
	
	Application.userInfo = false;
	var set = new Module( 'system' );
	set.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		var us = JSON.parse( d );
		Application.userInfo = us;
		var f = new File( 'Progdir:Templates/main.html' );
		f.onLoad = function( data )
		{
			w.setContent( data, function()
			{
				Application.refreshIssues();
				w.sendMessage( { command: 'userinfo', userinfo: Application.userInfo } );
			} );
		}
		f.load();
	}
	set.execute( 'userinfoget', { id: this.userId } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'refreshIssues':
			this.refreshIssues( 
				msg.filter ? msg.filter : false, 
				msg.search ? msg.search : false 
			);
			break;
		case 'closeView':
			this.mainView.sendMessage( msg );
			break;
		case 'closeIssue':
			this.mainView.sendMessage( msg );
			this.refreshIssues();
			break;
		case 'getcomments':
			this.receiveMessage( { command: 'refreshIssues' } );
			this.mainView.sendMessage( msg );
			break;
		case 'refreshcategories':
			if( this.catview )
				this.catview.sendMessage( msg );
			break;
		case 'showcatview':
			if( this.catview ) return;
			this.catview = new View( {
				title: 'Issue categories',
				width: 500,
				height: 600
			} );
			this.catview.onClose = function()
			{
				Application.catview = false;
			}
			var f = new File( 'Progdir:Templates/categories.html' );
			f.onLoad = function( data )
			{
				Application.catview.setContent( data );
			}
			f.load();
			break;
		case 'helpindex':
			if( this.hwi )
			{
				return;
			}
			this.hwi = new View( {
				title: 'Issues - Help',
				width: 600,
				height: 500
			} );
			var f = new File( 'Progdir:Documentation/index.html' );
			f.onLoad = function( data )
			{
				Application.hwi.setContent( data );
			}
			f.load();
			this.hwi.onClose = function()
			{
				Application.hwi = false;
			}
			break;
	}
}

Application.refreshIssues = function( filter, search )
{
	var m = new Module( 'issues' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return Application.mainView.sendMessage( { command: 'updateissues', issues: '' } );;
		Application.mainView.sendMessage( { command: 'updateissues', issues: d } );
	}
	m.execute( 'getissues', { filter: filter?filter:'', search: search?search:'' } );
}



