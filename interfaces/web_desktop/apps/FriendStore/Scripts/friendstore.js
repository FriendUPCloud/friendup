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

// Run application when every subsystem is initialized
Application.run = function( )
{
	// Create a new View (a Window in the DE)
	var v = new View( {
		title:  i18n('i18n_apptitle'),
		width:   960,
		height:  630,
		id:     'friendstore'
	} );
	this.mainView = v;
	
	// Create a new File (to load the template)
	var f = new File( 'Progdir:Templates/friendstore.html' );
	
		f.replacements = {
			'menu_applications' : i18n('i18n_menu_applications'),
			'menu_myapps' : i18n('i18n_menu_myapps'),
			'menu_store' : i18n('i18n_menu_store'),
			'menu_games' : i18n('i18n_menu_games'),
			'menu_themes' : i18n('i18n_menu_themes'),
			'menu_updates' : i18n('i18n_menu_updates'),
			'menu_storesettings' : i18n('i18n_menu_store_settings')
		};	

	var jaxmenu = new cAjax ();
		jaxmenu.open ( 'post', 'Json/menu.json', true, true );
		jaxmenu.addVar( 'name', 'Group' );
		jaxmenu.addVar( 'authId', '1' );
		jaxmenu.onload = function( menu )
		{
			//console.log(menu);
			var amenu = JSON.parse( menu );

			for (var key in amenu) {
				console.log(amenu[key].name);
				v.setContentById("Menu",amenu[key].name);
			}
		};
		jaxmenu.send ();
	
	f.onLoad = function( data )
	{
		// Set content on window
		v.setContent( data );
		//console.log(data);
	}
	f.load();
    // Make sure that when the view window is closed - quit app
    v.onClose = function()
    {
        Application.quit();
	}
}

// Receive messages from Doors -------------------------------------------------
Application.receiveMessage = function( msg )
{		
	//console.log(msg.command);
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'test1':
			this.mainView.setContentById( 'Testing', 'aaa' );			
		break;
			
		case 'test2':
			this.mainView.setContentById( 'Testing', '<button type="button" onclick="doIt(); Application.sendMessage( { command: \'remove\' } )">Hello2</button>' );
			console.log( 'Testing, 2' );
		break;
	/*		
//			var jax = new cAjax ();
//                        jax.open ( 'post', 'system.library/nom/gcreate', true, true );
//                        jax.addVar( 'name', 'Group' );
//						jax.addVar( 'authId', '1' );
//                        jax.onload = function( lmdata )
//                        {
//                                console.log('Run command: ' + lmdata );
//                        } ;
//                        jax.send ();
//*/
//			console.log( 'Testing, eh?' );
//			var gid = 0;
//			var eid = 0;
//			
//			// create group
//			var t = new Library( 'system.library' );
//			t.onExecuted = function( e, d )
//			{
//                console.log( 'Create group ' + e );
//				var obj = JSON.parse( e );
//				gid = obj.response.Pointer;
//				
//				// create entry
//				var l = new Library( 'system.library' );
//				l.onExecuted = function( e, d )
//				{
//					var obj = JSON.parse( e );
//					eid = obj.response.Pointer;
//			        console.log( 'Create entry ' + e + ' obj ' + obj );
//					
//					// get entry
//					var l = new Library( 'system.library' );
//					l.onExecuted = function( e, d )
//					{
//						var obj = JSON.parse( e );
//				        console.log( 'Get entry ' + e + ' obj ' + obj );
//					
//						// update entry	
//						var l = new Library( 'system.library' );
//						l.onExecuted = function( e, d )
//						{
//							var obj = JSON.parse( e );
//						    console.log( 'Update entry ' + e + ' obj ' + obj );
//							
//							// get entry	
//							var l = new Library( 'system.library' );
//							l.onExecuted = function( e, d )
//							{
//								var obj = JSON.parse( e );
//							    console.log( 'Get entry ' + e + ' obj ' + obj );
//							}
//							l.execute( 'invar/gentry', {
//								eid: eid,
//							} );
//						}
//						l.execute( 'invar/uentry', {
//							eid: eid,
//							data: 'hellohello'
//						} );
//					}
//					l.execute( 'invar/gentry', {
//						eid: eid
//					} );
//				}
//				l.execute( 'invar/centry', {
//				    name: 'Entry',
//					data: 'blablablablalba',
//					gid: gid
//				} );
//			}
//			t.execute( 'invar/cgroup', {
//                name: 'Group',
//				authid: '1'
//			} );
//			
//			
//
//			
//			break;
		case 'test3':
			console.log("test3");
			
			var m = new Module('system');
			m.onExecuted = function (e, d) {
				if (e == 'ok') {
					var ele = JSON.parse(d);
					console.log(ele);
					var f = new File('Progdir:Templates/friendstoregui.html');
					f.replacements = {
						'id': ele.ID,
						'name': ele.Name,
						'members': ele.Members,
						'viewId': ge('viewId').value,
						'parentViewId': ge('viewId').value
					};
					f.i18n();
					f.onLoad = function (data) {
						ge('SetupGui').innerHTML = data;
					}
					f.load();
				}
			}
			
			m.execute('setup');		
			
			break;
			
		case 'remove':
			this.mainView.setContentById( 'Testing', '' );
			break;
	}
}
