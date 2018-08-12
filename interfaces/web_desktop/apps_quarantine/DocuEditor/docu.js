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

document.title = 'All Documentation Editor';

Application.run = function( msg )
{
	this.parentId = '0';

	Application.setApplicationName( 'Documentation Central' );

	var set = new Module( 'system' );
	set.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		
		var us = JSON.parse( d );
		Application.userInfo = us;
		
		if( Application.userInfo.Level == 'Admin' )
		{
			Application.initWritemode();
		}
		else
		{
			Application.initReadmode();
		}
	}
	set.execute( 'userinfoget', { id: this.userId } );
}

Application.refreshMenus = function()
{
	var menuItems = [];
	
	menuItems.push(
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_refresh_topics' ),
					command: 'refreshTopics'
				},
				{
					name: i18n( 'i18n_add_topic' ),
					command: 'addTopic'
				},
                {
                    name: i18n( 'i18n_import' ),
                    command: 'import'
                },
				{
					name: i18n( 'i18n_parent_level' ),
					command: 'parentLevel',
					disabled: this.parentId != '0' ? false : true
				},
				{
					name: i18n( 'i18n_read_mode' ),
					command: 'readmode'
				},
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		}
	);
	
	if( Application.userInfo.Level == 'Admin' )
	{
		menuItems.push(
			{
				name: i18n( 'i18n_preferences' ),
				items: [
					{
						name: i18n( 'i18n_edit_preferences' ),
						command: 'editPreferences'
					}
				]
			}
		);
	}
	menuItems.push( 
		{
			name: i18n( 'i18n_help' ),
			items: [
				{
					name: i18n( 'i18n_help_index' ),
					command: 'helpindex'
				}
			]
		}
	);

	this.mainView.setMenuItems( menuItems );
}

Application.initWritemode = function()
{
	if( this.mainView ) this.mainView.close();
	
	var w = new View( {
		title: i18n( 'i18n_documentation_editor' ),
		width: 880,
		height: 600,
		id: 'documentationeditor'
	} );
	this.mainView = w;
	
	w.onClose = function()
	{
		if( !Application.modeChange )
		{
			Application.quit();
		}
	}
	
	Application.refreshMenus();
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			Application.refreshTopics();
			w.sendMessage( { command: 'userinfo', userinfo: Application.userInfo } );
		} );
	}
	f.load();
}

Application.initReadmode = function()
{
	if( this.readView ) this.readView.close();
	
	var w = new View( {
		title: i18n( 'i18n_documentation_reader' ),
		width: 880,
		height: 600,
		id: 'documentationreader'
	} );
	this.readView = w;
	
	w.onClose = function()
	{
		// Only admin enters write mode
		if( Application.userInfo.Level != 'Admin' )
		{
			Application.quit();
		}
		else
		{
			Application.readView = false;
		}
	}
		
	var f = new File( 'Progdir:Templates/main_read.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			w.sendMessage( { command: 'userinfo', userinfo: Application.userInfo } );
		} );
	}
	f.load();
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'readmode':
			Application.initReadmode();
			break;
		case 'refreshTopics':
		
			// Reparent
			if( msg.parentId ) Application.parentId = msg.parentId;
			
			this.refreshTopics( 
				msg.filter ? msg.filter : false, 
				msg.search ? msg.search : false
			);
			
			// Refresh the menus..
			Application.refreshMenus();
			break;
		case 'editPreferences':
			if( this.prefView ) return;
			this.prefView = new View( {
				title: i18n( 'i18n_preferences' ),
				width: 400,
				height: 250
			} );
			var pf = this.prefView;
			var f = new File( 'Progdir:Templates/preferences.html' );
			f.i18n();
			f.onLoad = function( data )
			{
				pf.setContent( data );
			}
			f.load();
			pf.onClose = function()
			{
				Application.prefView = false;
			}
			break;
		case 'closeprefs':
			if( this.prefView )
				this.prefView.close();
			this.prefView = false;
			break;
		case 'closeView':
			this.mainView.sendMessage( msg );
			break;
		case 'closeTopic':
			this.mainView.sendMessage( msg );
			this.refreshTopics();
			break;
		case 'parentLevel':
			var m = new Module( 'friendreference' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					var o = JSON.parse( d );
					Application.parentId = o.TopicID;
					Application.receiveMessage( { command: 'refreshTopics' } );
				}
			}
			m.execute( 'loadtopic', { topicid: Application.parentId } );
			break;
		case 'getcomments':
			this.receiveMessage( { command: 'refreshTopics' } );
			this.mainView.sendMessage( msg );
			break;
		case 'refreshcategories':
			if( this.catview )
				this.catview.sendMessage( msg );
			break;
		case 'showcatview':
			if( this.catview ) return;
			this.catview = new View( {
				title: i18n( 'i18n_topic_categories' ),
				width: 500,
				height: 600
			} );
			this.catview.onClose = function()
			{
				Application.catview = false;
			}
			var f = new File( 'Progdir:Templates/categories.html' );
			f.i18n();
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
				title: 'Documentation Editor - Help',
				width: 600,
				height: 500
			} );
			var f = new File( 'Progdir:Documentation/index.html' );
			f.i18n();
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

Application.refreshTopics = function( filter, search )
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return Application.mainView.sendMessage( { command: 'updatetopics', topics: '', parentId: Application.parentId } );
		Application.mainView.sendMessage( { command: 'updatetopics', topics: d, parentId: Application.parentId } );
	}
	m.execute( 'gettopics', { 
		filter: filter?filter:'', 
		search: search?search:'', 
		parentId: this.parentId 
	} );
}



