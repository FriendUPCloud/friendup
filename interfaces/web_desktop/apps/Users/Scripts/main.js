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

var state = { mode: null, user: null };

Application.run = function( msg, iface )
{
	this.views = [];
	this.listUsers();
	RefreshSetup();
	RefreshWorkgroups();
	RefreshSessions();
	this.guiHTML = '\
	<div class="Padding"><h1>' + i18n( 'i18n_idle_title' ) + '</h1><p>' + i18n( 'i18n_idle_desc' ) + '</p></div>';
	ge( 'UserGui' ).innerHTML = this.guiHTML;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'renewedsession':
			if( msg.sessionid )
			{
				if( this.renewSessionGui )
					this.renewSessionGui.close();
				this.renewSessionGui = false;
			}
			RefreshSessions();
			break;
		case 'refreshworkgroups':
			RefreshWorkgroups();
			//console.log( 'Fodah' );
			break;
		case 'refreshsessions':
			RefreshSessions();
			break;
		case 'addmembers':
			if( msg.members )
			{
				var exist = ge( 'pMembers' ).value.split( ',' );
				var newst = msg.members.split( ',' );
				for( var a = 0; a < newst.length; a++ )
				{
					// Do we already have them?
					var found = false;
					for( var b = 0; b < exist.length; b++ )
					{
						if( exist[b] == newst[a] )
						{
							found = true;
							break;
						}
					}
					if( !found ) exist.push( newst[a] );
				}
				ge( 'pMembers' ).value = exist.join( ',' );
			}
			saveWorkgroup( refreshMembers );
			break;
		case 'savestartup':
			if( msg.value )
			{
				SaveStartup( msg.value, msg.itemId );
			}
			break;
		case 'savesoftware':
			if( msg.apps )
			{
				SaveSoftware( msg.apps );
			}
			break;
	}
}

Application.listUsers = function( current, mode )
{
	// Open system module
	// TODO: Use user.library
	var m = new Module( 'system' );
	
	// What happens when we've executed?
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var users;
			try
			{
				users = JSON.parse( d );
			}
			catch(e)
			{
				ge( 'UserList' ).innerHTML = '<h4 style="#F00">ERROR!</h4><p>Could not parse user list!</p><p>' + e + ' :: ' + d + '</p>';
				return;
			}
			var ml = '';
			var i = 0;
			var sw = 1;
			for( var a in users )
			{
				var icon = users[a].Level == 'Admin' ? '-secret' : '-md';
				ml += '<div userId="' + users[a].ID + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="EditUser(' + users[a].ID + ')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-user' + icon + ' FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft"><span name="' + (users[a].Name ? users[a].Name : 'n/a' ) + '" email="' + ( users[a].Email ? users[a].Email : '' ) + '">' + ( users[a].FullName ? users[a].FullName : 'n/a' ) + '</span></div></div>';
				sw = sw == 1 ? 2 : 1;
				i++;
			}
			
			if( i <= 10 && ge( 'UserFilter' ) && ge( 'UserFilter' ).style.display != 'none' )
			{
				// TODO : Activate this after testing mode is done
				//ge( 'UserFilter' ).style.display = 'none';
			}
			
			ge( 'UserList' ).innerHTML = ml;
			
			if( current )
			{
				EditUser( current, mode );
			}
		}
	}
	
	// Execute the "get user list"
	m.execute( 'listusers' );
}

function FilterUsers()
{
	var i;
	
	var u = ge( 'UserList' );
	var v = ge( 'UserFilterInput' ).value;
	
	if( v )
	{
		i = v.toLowerCase()
	}
	
	if( u )
	{
		var e = u.getElementsByTagName( 'div' );
		
		if( e.length > 0 )
		{
			for( var a = 0; a < e.length; a++ )
			{
				var span = e[a].getElementsByTagName( 'span' )[0];
				if( span )
				{
					// TODO: Decide if you want to search by all Fullname, Name, Email or just Fullname
					// TODO: Support searching in the whole list if there is limitations set for max
					
					if( span.innerHTML.length )
					{
						if( !v || v == '' 
						|| span.innerHTML.toLowerCase().split( i ).join( '' ).length < span.innerHTML.length
						|| span.getAttribute( 'name' ).toLowerCase().split( i ).join( '' ).length < span.getAttribute( 'name' ).length
						|| span.getAttribute( 'email' ).toLowerCase().split( i ).join( '' ).length < span.getAttribute( 'email' ).length 
						)
						{
							e[a].style.display = '';
						}
						else
						{
							e[a].style.display = 'none';
						}
					}
				}
			}
		}
	}
}

function SwitchRow( ele, type )
{
	
}

function EditUser( id, mode )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			state = { mode: mode ? mode : 'edit', user: d };
			
			var str = '';
			
			
			var dat;
			try
			{
				dat = JSON.parse( d );
			} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load user data!'}); return; }
			
			if( dat.Setup && dat.Setup.length > 0 )
			{
				str += '<option value="0">none</option>';
				
				var set = false;
				
				for( k in dat.Setup )
				{
					if( !set && dat.Setup[k].UserID > 0 )
					{
						set = dat.Setup[k].ID;
					}
				}
				
				if( !set )
				{
					for( k in dat.Setup )
					{
						if( !set && dat.Setup[k].SetupGroup > 0 )
						{
							set = dat.Setup[k].ID;
						}
					}
				}
				
				for( k in dat.Setup )
				{
					var s = ( set && dat.Setup[k].ID == set ? ' selected="selected"' : '' );
					
					str += '<option value="' + dat.Setup[k].ID + '"' + s + '>' + dat.Setup[k].Name + '</option>';
				}
			}
			
			var f = new File( 'Progdir:Templates/user.html' );
			f.replacements = {
				'id'        : dat.ID,
				'username'  : dat.Name,
				'password'  : '********',
				'fullname'  : (dat.FullName ? dat.FullName : ''),
				'email'     : (dat.Email ? dat.Email : ''),
				'level'     : dat.Level,
				'setup' 	: str,
				'workgroup' : ( dat.Workgroup ? dat.Workgroup : '' ) 
			};
			f.i18n();
			f.onLoad = function( data )
			{
				ge( 'UserGui' ).innerHTML = data;
				
				if( ge( 'SetupContainer' ) && !ge( 'Setup' ).value )
				{
					ge( 'SetupContainer' ).style.display = 'none';
				}
				
				if( ge( 'WorkgroupContainer' ) && !ge( 'Workgroup' ).value )
				{
					ge( 'WorkgroupContainer' ).style.display = 'none';
				}
				
				var f = ge( 'UserGui' ).getElementsByTagName( 'option' );
				for( var a = 0; a < f.length; a++ )
				{
					if( f[a].value == dat.Level ) f[a].selected = 'selected';
				}
				
				var us = ge( 'UserList' ).getElementsByTagName( 'div' );
				for( var a = 0; a < us.length; a++ )
				{
					if( !us[a].getAttribute( 'userId' ) ) continue;
					if( us[a].getAttribute( 'userId' ) == id )
					{
						us[a].className = us[a].className.split( /sw[1|2]{0,1}\ / ).join ( '' );
						us[a].className = us[a].className.split( ' BackgroundNegative Negative' ).join( '' ) + ' BackgroundNegative Negative';
					}
					else
					{
						us[a].className = us[a].className.split( ' BackgroundNegative Negative' ).join( '' );
					}
				}
				
			}
			f.load();
		}
	}
	m.execute( 'userinfoget', { id: id } );
}

function SaveUser( id )
{
	// Setup input values
	var args = {};
	var inps = [ 'Username', 'Email', 'Password', 'FullName', 'Level', 'Setup' ];
	var t = '';
	for( var a = 0; a < inps.length; a++ )
	{
		if( inps[a] == 'Password' && ge(inps[a]).value ==  '********' )
		{
			continue;
		}
		else if ( inps[a] == 'Username' || inps[a] == 'FullName' )
		{
			args[ inps[a].toLowerCase() ] = htmlentities( Trim( ge(inps[a]).value ) );
		}
		else if ( inps[a] == 'Password' )
		{
			args[ inps[a].toLowerCase() ] = '{S6}' + Sha256.hash ( 'HASHED' + Sha256.hash(ge(inps[a]).value) );
		}
		else
		{
			args[ inps[a].toLowerCase() ] = ge(inps[a]).value;	
		}
		
	}
	args.id = id;

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if( state.mode == 'add' )
			{
				Notify({'title':i18n( 'i18n_users' ),'text':i18n( 'i18n_user_created' )});
			}
			else
			{
				Notify({'title':i18n( 'i18n_users' ),'text':i18n( 'i18n_user_updated' )});
			}
			
			EditUser( id );
			Application.listUsers();
		}
		else
		{
			console.log('Error during user update',e,d);
		}
		RefreshSessions()	
	}
	
	args.command ='update';
	f.execute( 'user', args );
}

function DeleteUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			CancelEditing();
			Application.listUsers();
		}
		RefreshSessions();
	}
	m.execute( 'userdelete', { id: id } );
}

function UnblockUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			CancelEditing();
			Application.listUsers();
			Notify({'title':'Users administration','text':'User unblocked'});
		}
		else
		{
			Notify({'title':'Users administration','text':'Could not unblock user ' + e + ':' + d });
		}
		RefreshSessions();
	}
	m.execute( 'userunblock', { id: id } );
}

function CancelEditing()
{
	if( ge( 'UserGui' ).default )
		ge( 'UserGui' ).innerHTML = ge( 'UserGui' ).default;
	else ge( 'UserGui' ).innerHTML = Application.guiHTML;
	state = { mode: null, user: null };
}

function AddUser()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			state = { guiMode: 'add', user: d };
			Application.listUsers( d, 'add' );
		}
	}
	m.execute( 'useradd' );
}

/* Setup -------------------------------------------------------------------- */

var FirstSetupCheck = false;

function AddSetup( first )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			RefreshSetup();
		}
	}
	m.execute( 'usersetupadd', { Name: ( first ? 'Default' : '' ) } );
}

function RefreshSetup()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			if( !FirstSetupCheck )
			{
				FirstSetupCheck = true;
				AddSetup(1);
			}
			ge( 'SetupList' ).innerHTML = '';
			return;
		}
		var rows;
		try
		{
			rows = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load setups!'}); return; }
		
		var ml = '';
		var sw = 1;
		for( var a in rows )
		{
			ml += '<div setupId="' + rows[a].ID + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="EditSetup(' + rows[a].ID + ')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-group FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft">' + rows[a].Name + '</div></div>';
			sw = sw == 1 ? 2 : 1;
		}
		ge( 'SetupList' ).innerHTML = ml;
	}
	m.execute( 'usersetup' );
}

function EditSetup( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var data = {};
		
		var ele;
		try
		{
			ele = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load setup data!'}); return; }
		
		if( ele.Data )
		{
			try
			{
				data = JSON.parse( ele.Data );
			} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not parse user details!'}); }
		}
		
		var f = new File( 'Progdir:Templates/setup.html' );
		f.replacements = {
			'id': ele.ID,
			'name': ele.Name,
			'applications': '',
			'disks': '',
			'startups': '',
			'languages': '',
			'themes': ''
		};
		f.i18n();
		f.onLoad = function( html )
		{
			ge( 'SetupGui' ).innerHTML = html;
			
			if( ge( 'pSetupPreinstall' ) )
			{
				ge( 'pSetupPreinstall' ).checked = ( data.preinstall ? true : false );
			}
			
			RefreshSoftware( data.software );
			RefreshDisks( data.disks );
			RefreshStartup( data.startups );
			RefreshLanguages( data.language );
			RefreshThemes( data.theme );
		}
		f.load();
	}
	m.execute( 'usersetupget', { id: id } );
}

function RefreshSoftware( apps )
{
	if ( ge( 'pSetupApplications' ) )
	{
		if ( !ge( 'pSetupApplications' ).innerHTML )
		{
			ge( 'pSetupApplications' ).innerHTML = i18n( 'i18n_loading' );
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var software;
			try
			{
				software = JSON.parse( d );
			} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load software!'}); return; }
			
			//console.log( software );
			
			var str = '';
			
			if ( software && apps )
			{
				sfw = {};
				
				for( key in software )
				{
					sfw[software[key].Name] = software[key];
				}
				
				for( k in apps )
				{
					if ( sfw[apps[k][0]] )
					{
						str += '<div value="' + sfw[apps[k][0]].Name + '" class="HBox GuiContainer MarginBottom Padding">' +
						'<h2>' + sfw[apps[k][0]].Name + '<span onclick="RemoveSoftware(this)" class="MousePointer IconSmall fa-remove"></span></h2>' + 
						'<p class="Layout"><strong>' + sfw[apps[k][0]].Category + '</strong></p>' +
						'<p class="Layout">No description available for this title.</p>' +
						'<div class="TheButton BackgroundNegative Padding">' +
						'<span>include in dock&nbsp;</span><input type="checkbox"' + ( apps[k][1] ? ' checked="checked"' : '' ) + '/>' + 
						'</div>' +
						'</div>';
					}
				}
			}
			
			ge( 'pSetupApplications' ).innerHTML = str;
			
			ge( 'pSetupApplications' ).obj = ( apps ? apps : false );
		}
		m.execute( 'software' );
	}
}

function AddSoftware()
{
	var v = new View( {
		title: i18n( 'i18n_add_apps' ),
		width: 300,
		height: 400
	} );
	
	var f = new File( 'Progdir:Templates/apps.html' );
	f.replacements = {
		parentViewId: ge( 'viewId' ).value 
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			var o = { command: 'apps', viewid: ge( 'viewId' ).value, guiview: v.getViewId() };
			
			v.sendMessage( o );
		} );
	}
	f.load();
}

function SaveSoftware( arr )
{
	if ( arr && ge( 'pSetupApplications' ) )
	{
		var apps = ( ge( 'pSetupApplications' ).obj ? ge( 'pSetupApplications' ).obj : [] );
		
		arr = arr.split( ',' );
		
		if ( apps )
		{
			var curr = {};
			
			for( key in apps )
			{
				if( apps[key][0] )
				{
					curr[apps[key][0]] = apps[key];
				}
			}
			
			for( key in arr )
			{
				if( !curr[arr[key]] )
				{
					apps.push( [ arr[key] ] );
				}
			}
			
			RefreshSoftware( apps );
		}
	}
}

function RemoveSoftware( ele )
{
	if ( ele.parentNode.parentNode && ge( 'pSetupApplications' ) && ge( 'pSetupApplications' ).obj )
	{
		var app = ele.parentNode.parentNode;
		
		apps = new Array();
		
		var obj = ge( 'pSetupApplications' ).obj;
		
		if ( obj )
		{
			for( key in obj )
			{
				if( obj[key][0] != app.getAttribute( 'value' ) )
				{
					apps.push( obj[key] );
				}
			}
			
			RefreshSoftware( apps );
		}
	}
}

function RefreshDisks( disks )
{
	if ( ge( 'pSetupDisks' ) )
	{
		if ( !ge( 'pSetupDisks' ).innerHTML )
		{
			ge( 'pSetupDisks' ).innerHTML = i18n( 'i18n_loading' );
		}
		
		ge( 'pSetupDisks' ).innerHTML = '<table><tr><th>{i18n_name}</th><th>{i18n_type}</th></tr><tr><td>Home:</td><td>Sqldrive</td></tr></table>';
	}
}

function RefreshStartup( starts )
{
	if ( ge( 'pSetupStartup' ) )
	{
		if (!ge( 'pSetupStartup' ).innerHTML )
		{
			ge( 'pSetupStartup' ).innerHTML = i18n( 'i18n_loading' );
		}
		
		var str = '';
		
		if ( starts )
		{
			var sw = 1;
			
			str += '<table class="List"><tbody>';
			
			for( key in starts )
			{
				str += '<tr itemid="' + ( 1 + key ) + '" value="' + starts[key] + '" class="sw' + ( sw = ( sw == 1 ? 2 : 1 ) ) + '">' +
					   '<td class="MousePointer IconSmall fa-edit" onclick="EditStartup(this)">&nbsp;' + starts[key] + '</td>' +
					   '<td width="24px" onclick="RemoveStartup(this)" class="MousePointer IconSmall fa-remove">&nbsp;&nbsp;&nbsp;</td>' +
					   '</tr>';
			}
			
			str += '</tbody></table>';
		}
		
		ge( 'pSetupStartup' ).innerHTML = str;
		
		ge( 'pSetupStartup' ).obj = ( starts ? starts : false );
	}
}

function AddStartup()
{
	var v = new View( {
		title: i18n( 'i18n_add_startup' ),
		width: 400,
		height: 100
	} );
	
	var f = new File( 'Progdir:Templates/startup.html' );
	f.replacements = {
		command: ''
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			var o = { command: 'item', viewid: ge( 'viewId' ).value, guiview: v.getViewId() };
			
			v.sendMessage( o );
		} );
	}
	f.load();
}

function EditStartup( ele )
{
	if( ele.parentNode && ele.parentNode.getAttribute( 'value' ) )
	{
		var value = ele.parentNode.getAttribute( 'value' );
		var itemid = ele.parentNode.getAttribute( 'itemid' );
		
		var v = new View( {
			title: i18n( 'i18n_edit_startup' ),
			width: 400,
			height: 100
		} );
		
		var f = new File( 'Progdir:Templates/startup.html' );
		f.replacements = {
			command: value
		};
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data, function()
			{
				var o = { command: 'item', itemId: itemid, viewid: ge( 'viewId' ).value, guiview: v.getViewId() };
				
				v.sendMessage( o );
			} );
		}
		f.load();
	}
}

function SaveStartup( value, edit )
{
	if ( ge( 'pSetupStartup' ) )
	{
		var starts = ( ge( 'pSetupStartup' ).obj ? ge( 'pSetupStartup' ).obj : [] );
		
		if ( starts )
		{
			if ( edit )
			{
				for( key in starts )
				{
					if( ( 1 + key ) == edit )
					{
						starts[key] = value;
					}
				}
			}
			else if ( value )
			{
				starts.push( value );
			}
			
			RefreshStartup( starts );
		}
	}
}

function RemoveStartup( ele )
{
	if ( ele.parentNode && ge( 'pSetupStartup' ) && ge( 'pSetupStartup' ).obj )
	{
		var sts = ele.parentNode;
		
		starts = new Array();
		
		var obj = ge( 'pSetupStartup' ).obj;
		
		if ( obj )
		{
			for( key in obj )
			{
				if( ( 1 + key ) != sts.getAttribute( 'itemid' ) )
				{
					starts.push( obj[key] );
				}
			}
			
			RefreshStartup( starts );
		}
	}
}

function RefreshLanguages( lang )
{
	if ( ge( 'pSetupLanguages' ) )
	{
		if ( !ge( 'pSetupLanguages' ).innerHTML )
		{
			ge( 'pSetupLanguages' ).innerHTML = i18n( 'i18n_loading' );
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var languages;
			try
			{
				languages = JSON.parse( d );
			} catch(e){ Notify({'title':'ERROR in Users app','text':'Could not load languages!'}); return; }
			
			//console.log( languages );
			
			var str = '';
			
			if ( languages && languages.shortNames )
			{
				for( var key in languages.shortNames )
				{
					var s = ( lang && lang == languages.shortNames[key] ? ' selected="selected"' : '' );
					str += '<option value="' + languages.shortNames[key] + '"' + s + '>' + i18n( 'i18n_locale_' + languages.shortNames[key] ) + '</option>';
				}
				
				ge( 'pSetupLanguages' ).innerHTML = str;
			}
		}
		m.execute( 'languages' );
	}
}

function RefreshThemes( theme )
{
	if ( ge( 'pSetupThemes' ) )
	{
		if ( !ge( 'pSetupThemes' ).innerHTML )
		{
			ge( 'pSetupThemes' ).innerHTML = i18n( 'i18n_loading' );
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			
			var themes = JSON.parse( d );
			var str = '';
			if ( themes )
			{
				for( var key in themes )
				{
					var s = ( theme && theme == themes[key].Name ? ' selected="selected"' : '' );
					str += '<option value="' + themes[key].Name + '"' + s + '>' + themes[key].Name + '</option>';
				}
				
				ge( 'pSetupThemes' ).innerHTML = str;
			}
			
		}
		m.execute( 'listthemes' );
	}
}

function saveSetup()
{
	var id = ge( 'pSetupID' );
	
	if ( id && id.value > 0 )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				EditSetup( id.value );
				RefreshSetup();
			}
			else alert( e );
		}
		
		// Setup input values
		var args = {};
		
		var vals = [ 'Name', 'Preinstall', 'Applications', 'Disks', 'Startup', 'Languages', 'Themes' ];
		
		for( var a = 0; a < vals.length; a++ )
		{
			if( ge( 'pSetup' + vals[a] ) )
			{
				if( ge( 'pSetup' + vals[a] ).tagName == 'INPUT' )
				{
					args[vals[a]] = ( ge( 'pSetup' + vals[a] ).type == 'checkbox' ? ( ge( 'pSetup' + vals[a] ).checked ? '1' : '0' ) : ge( 'pSetup' + vals[a] ).value );
				}
				else if( ge( 'pSetup' + vals[a] ).tagName == 'SELECT' )
				{
					args[vals[a]] = ge( 'pSetup' + vals[a] ).value;
				}
				else if( ge( 'pSetup' + vals[a] ).tagName == 'DIV' )
				{
					var ele = ge( 'pSetup' + vals[a] ).getElementsByTagName( '*' );
					
					if( ele.length > 0 )
					{
						var value = false;
						
						for( var v = 0; v < ele.length; v++ )
						{
							if( ele[v].getAttribute( 'value' ) && ele[v].getAttribute( 'value' ) != '' )
							{
								var inp = ele[v].getElementsByTagName( 'input' );
								
								value = ( value ? ( value + ', ' + ele[v].getAttribute( 'value' ) + ( inp[0] && inp[0].type == 'checkbox' ? ( inp[0].checked ? '_1' : '_0' ) : '' ) ) : ( ele[v].getAttribute( 'value' ) + ( inp[0] && inp[0].type == 'checkbox' ? ( inp[0].checked ? '_1' : '_0' ) : '' ) ) );
							}
						}
						
						if( value )
						{
							args[vals[a]] = value;
						}
					}
				}
				else
				{
					//args[vals[a]] = ge( 'pSetup' + vals[a] ).value;
				}
			}
			
		}
		
		args.id = id.value;
		
		m.execute( 'usersetupsave', args );
	}
}

function ApplySetup( id )
{
	if ( id && ge( 'Setup' ) && ge( 'Setup' ).value )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			EditUser( id );
		}
		m.execute( 'usersetupapply', { id: ge( 'Setup' ).value, userid: id } );
	}
}

function deleteSetup()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		RefreshSetup();
	}
	m.execute( 'usersetupdelete', { id: ge( 'pSetupID' ).value } );
}

function cancelSetup()
{
	ge( 'SetupGui' ).innerHTML = '';
}

/* Workgroups --------------------------------------------------------------- */

function AddWorkgroup()
{
	var v = new View( {
		title: i18n( 'i18n_add_workgroup' ),
		width: 320,
		height: 300
	} );
	
	var f = new File( 'Progdir:Templates/workgroup.html' );
	f.replacements = {
		'id': '',
		'name': '',
		'viewId': v.getViewId(),
		'parentViewId': ge( 'viewId' ).value,
		'delCss': '#deleteButton{ display: none; }'
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();	
}

function EditWorkgroup( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var ele;
		try{
			ele = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load workgroup data!'}); return; }
		
		var str = '';
		
		if( ele.Setup && ele.Setup.length > 0 )
		{
			str += '<option value="0">none</option>';
			
			for( k in ele.Setup )
			{
				var s = ( ele.Setup[k].UserID > 0 ? ' selected="selected"' : '' );
				
				str += '<option value="' + ele.Setup[k].ID + '"' + s + '>' + ele.Setup[k].Name + '</option>';
			}
		}
		
		var f = new File( 'Progdir:Templates/workgroup.html' );
		f.replacements = {
			'id': ele.ID,
			'name': ele.Name,
			'members': ele.Members,
			'setup': str,
			'viewId': ge( 'viewId' ).value,
			'parentViewId': ge( 'viewId' ).value,
			'delCss': ''
		};
		f.i18n();
		f.onLoad = function( data )
		{
			ge( 'WorkgroupGui' ).innerHTML = data;
			
			if( ge( 'SetupContainer' ) && ge( 'pWorkgroupSetup' ) && !ge( 'pWorkgroupSetup' ).value )
			{
				ge( 'SetupContainer' ).style.display = 'none';
			}
			
			refreshMembers( ele.ID );
		}
		f.load();
	}	
	m.execute( 'workgroupget', { id: id } );
}

// Save a workgroup
function saveWorkgroup( callback )
{
	var o = {
		ID: ge( 'pWorkgroupID' ).value > 0 ? ge( 'pWorkgroupID' ).value : '0',
		Name: ge( 'pWorkgroupName' ).value,
		Setup: ( ge( 'pWorkgroupSetup' ) ? ge( 'pWorkgroupSetup' ).value : '' ),
		Members: ge( 'pMembers' ).value
	};

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			ge( 'pWorkgroupID' ).value = d;
		}
		//update all members mount points...
		var members = ge( 'pMembers' ).value.split(',');
		var calls = [];
		if( members.length > 0 )
		{
			for(var i = 0; i < members.length; i++)
			{
				calls[i] = new Library('system.library');
				calls[i].onExecuted = function( e,d ) {  };
				
				calls[i].uindex = i;
				calls[i].execute('user/update?id=' + members[i]);
			}
		}
		
		
		if( callback ) callback();
		RefreshWorkgroups();
	}
	
	if( o.ID > 0 )
	{
		m.execute( 'workgroupupdate', o );
	}
	else
	{
		m.execute( 'workgroupadd', o );
	}
}

function RefreshWorkgroups()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'WorkgroupList' ).innerHTML = '';
			return;
		}
		var rows;
		try{
			rows = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load workgroups!'}); return; }
		var ml = '';
		var sw = 1;
		for( var a in rows )
		{
			ml += '<div workgroupId="' + rows[a].ID + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="EditWorkgroup(' + rows[a].ID + ')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-group FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft">' + rows[a].Name + '</div></div>';
			sw = sw == 1 ? 2 : 1;
		}
		ge( 'WorkgroupList' ).innerHTML = ml;
	}
	m.execute( 'workgroups' );
}

// Add members to workgroup
function addMembers()
{
	var v = new View( {
		title: i18n( 'i18n_add_workgroup_members' ),
		width: 300,
		height: 400
	} );
	
	// Load the members template and popuplate it
	var f = new File( 'Progdir:Templates/workgroup_members.html' );
	f.replacements = {
		parentViewId: ge( 'viewId' ).value,
		members: ''
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function cancelWorkgroup()
{
	ge( 'WorkgroupGui' ).innerHTML = '';
}

function refreshMembers( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var re;
			try
			{
				re = JSON.parse( d );
			} catch( e ) { Notify({'title':'ERROR in Users app','text':'Could not load workgroup data!'}); return; }
			
			var exist = re.Members;
			ge( 'pMembersListed' ).innerHTML = '';
			var out  = [];
			for( var a = 0; a < exist.length; a++ )
			{
				var o = document.createElement( 'option' );
				o.value = exist[a].ID;
				o.innerHTML = exist[a].FullName;
				ge( 'pMembersListed' ).appendChild( o );
				out.push( exist[a].ID );
			}
			ge( 'pMembers' ).value = out.join( ',' );
		}
	}
	m.execute( 'workgroupget', { id: ge( 'pWorkgroupID' ).value } );
}

// Remove users from workgroup
function removeFromGroup()
{
	var opts = ge( 'pMembersListed' ).getElementsByTagName( 'option' );
	var ids = [];
	var idstr = [];
	for( var a = 0; a < opts.length; a++ )
	{
		if( opts[a].selected )
		{
			ids.push( opts[a] );
		}
		else idstr.push( opts[a].value );
	}
	ge( 'pMembers' ).value = idstr.join( ',' );
	for( var a = 0; a < ids.length; a++ )
		ids[a].parentNode.removeChild( ids[a] );
	saveWorkgroup();
}

// Remove a workgroup outright
function deleteWorkgroup()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		RefreshWorkgroups();
	}
	m.execute( 'workgroupdelete', { id: ge( 'pWorkgroupID' ).value } );
}

/* Sessions --------------------------------------------------------------- */

function RefreshSessions()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		var list;
		try
		{
			list = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load usersessions!'}); return; }
		var str = '';
		var sw = 2;
		for( var a = 0; a < list.length; a++ )
		{
			var us = list[a];
			sw = sw == 1 ? 2 : 1;
			str += '<div class="UserSession HRow sw' + sw + ' Padding">';
			str += '<div class="HContent35 FloatLeft Ellipsis Padding">' + us.FullName + '</div>';
			str += '<div class="HContent45 FloatLeft Ellipsis Padding"><input type="text" class="FullWidth" value="' + us.SessionID + '"/></div>';
			str += '<div class="HContent20 FloatLeft Ellipsis"><div class="HContent5 FloatLeft">&nbsp;</div><div class="HContent95 FloatLeft"><button type="button" class="Button IconSmall fa-refresh" onclick="RenewSession(' + us.ID + ')">' + i18n( 'i18n_regenerate' ) + '</button></div></div>';
			str += '</div>';
		}
		ge( 'Sessions' ).innerHTML = str;
	}
	m.execute( 'usersessions' );
}

function RenewSession( id )
{
	if( Application.renewSessionGui ) return;
	var v = new View( {
		title: i18n( 'i18n_renew_session' ),
		width: 300,
		height: 150
	} );
	Application.renewSessionGui = v;
	var f = new File( 'Progdir:Templates/user_login.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'userid', userid: id } );
		} );
	}
	f.load();
	v.onClose = function()
	{ 
		Application.renewSessionGui = false; 
	}
}

