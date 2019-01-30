/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var state = { mode: null, user: null };

var startlimit = 0;
var maxlimit = 50;
var nothingnew = false;
var limit = ( maxlimit ? ( startlimit + ', ' + maxlimit ) : '' );
var updateuserlist = true;
var searchQuery = {};

Application.workgroupUserListChanged = false;

Application.run = function( msg, iface )
{
	this.views = [];
	this.listUsers();
	RefreshSetup();
	RefreshWorkgroups();
	//RefreshSessions();
	this.guiHTML = '\
	<div class="Padding"><h1>' + i18n( 'i18n_idle_title' ) + '</h1><p>' + i18n( 'i18n_idle_desc' ) + '</p></div>';
	ge( 'UserGui' ).innerHTML = this.guiHTML;
	
	var tabs = document.getElementsByClassName( 'Tab' );
	this.tabs = {};
	for( var a = 0; a < tabs.length; a++ )
	{
		if( tabs[a].id )
			this.tabs[ tabs[a].id ] = tabs[a];
	}
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'users_add':
			this.tabs[ 'UsersTab' ].click();
			AddUser();
			break;
		case 'templates_add':
			this.tabs[ 'TemplatesTab' ].click();
			AddSetup();
			break;
		case 'workgroups_add':
			this.tabs[ 'WorkgroupsTab' ].click();
			AddWorkgroup();
			break;
		case 'activate_tab':
			if( this.tabs[ msg.tab ] )
				this.tabs[ msg.tab ].click();
			break;
		case 'renewedsession':
			if( msg.sessionid )
			{
				if( this.renewSessionGui )
					this.renewSessionGui.close();
				this.renewSessionGui = false;
			}
			//RefreshSessions( msg.uid );
			break;
		case 'refreshworkgroups':
			RefreshWorkgroups();
			//console.log( 'Fodah' );
			break;
		case 'refreshsessions':
			//RefreshSessions();
			break;
		case 'addmembers':
			if( msg.members )
			{
				var exist = ge( 'pMembers' ).value ? ge( 'pMembers' ).value.split( ',' ) : [];
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
					if( !found )
					{
						Application.workgroupUserListChanged = true;
						exist.push( newst[a] );
					}
				}
				ge( 'pMembers' ).value = exist.join( ',' );
			}
			if( Application.workgroupUserListChanged ) saveWorkgroup( refreshMembers );
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
	
	updateuserlist = false;
	
	var query = ( ge( 'UserFilterInput' ).value ? ge( 'UserFilterInput' ).value : '' );
	
	// What happens when we've executed?
	m.onExecuted = function( e, d )
	{
		var users; var i = 0;
		
		if( e == 'ok' )
		{
			try
			{
				users = JSON.parse( d );
			}
			catch(e)
			{
				console.log( '<h4 style="#F00">ERROR!</h4><p>Could not parse user list!</p><p>' + e + ' :: ' + d + '</p>' );
				Notify({'title':'ERROR in Users app','text':'Could not parse user list!'});
				//ge( 'UserList' ).innerHTML = '<h4 style="#F00">ERROR!</h4><p>Could not parse user list!</p><p>' + e + ' :: ' + d + '</p>';
				return;
			}
			
			var ml = '';
			
			var sw = 1;
		
			console.log('users',users);
			
			if( ge( 'UsersCount' ) && users['Count'] )
			{
				ge( 'UsersCount' ).innerHTML = ' (' + users['Count'] + ')';
			}
			
			for( var a in users )
			{
				if( a == 'Count' ) continue;
				
				var icon = users[a].Level == 'Admin' ? '-secret' : '-md';
				var str = '<div userId="' + users[a].ID + '" onclick="EditUser(' + users[a].ID + ')" class="HRow BorderBottom Padding" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-user' + icon + ' FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft"><span name="' + (users[a].Name ? users[a].Name : 'n/a' ) + '" email="' + ( users[a].Email ? users[a].Email : '' ) + '">' + ( users[a].FullName ? users[a].FullName : 'n/a' ) + '</span></div></div>';
				
				if( !ge( 'UserListID_' + users[a].ID ) )
				{
					ml += '<div id="UserListID_' + users[a].ID + '" class="sw' + sw + '">' + str + '</div>';
				}
				else
				{
					ge( 'UserListID_' + users[a].ID ).innerHTML = str;
				}
				
				sw = sw == 1 ? 2 : 1;
				
				i++;
			}
			
			if( i <= 10 && ge( 'UserFilter' ) && ge( 'UserFilter' ).style.display != 'none' )
			{
				// TODO : Activate this after testing mode is done
				//ge( 'UserFilter' ).style.display = 'none';
			}
			
			ge( 'UserList' ).innerHTML = ( ge( 'UserList' ).innerHTML + ml );
			
			if( current )
			{
				EditUser( current, mode );
			}
			
			nothingnew = false;
		}
		else
		{
			if( !query )
			{
				nothingnew = true;
				
				startlimit = 0;
			}
		}
		
		updateuserlist = true;
		
		console.log( 'listusers result: ', { limit: ( !current ? limit : '' ), userid: current, count: true, query: query, res: e, num: i } );
	}
	// Execute the "get user list"
	m.execute( 'listusers', { limit: ( !current ? limit : '' ), userid: current, count: true, query: query } );
}

var FilterQueue = [];

function FilterUsers()
{
	var i;
	
	var u = ge( 'UserList' );
	var v = ge( 'UserFilterInput' ).value;
	
	if( v )
	{
		i = v.toLowerCase();
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
						//|| span.innerHTML.toLowerCase().split( i ).join( '' ).length < span.innerHTML.length
						//|| span.getAttribute( 'name' ).toLowerCase().split( i ).join( '' ).length < span.getAttribute( 'name' ).length
						//|| span.getAttribute( 'email' ).toLowerCase().split( i ).join( '' ).length < span.getAttribute( 'email' ).length 
						|| span.innerHTML.toLowerCase().substr( 0, i.length ) == i 
						|| span.getAttribute( 'name' ).toLowerCase().substr( 0, i.length ) == i
						|| span.getAttribute( 'email' ).toLowerCase().substr( 0, i.length ) == i
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
		
		if( i && updateuserlist )
		{
			FilterQueue.push( function() 
			{ 
				startlimit = 0;
				
				limit = ( startlimit + ', ' + maxlimit );
				
				Application.listUsers(); 
			} );
			
			FilterInit();
		}
	}
}

var InitFilter = false;

function FilterInit()
{
	var query = ( ge( 'UserFilterInput' ).value ? ge( 'UserFilterInput' ).value : '-' );
	
	if( !searchQuery[query] )
	{
		//console.log( 'running a setTimeout ... ', { query: query } );
		
		setTimeout( function()
		{ 
			
			if( FilterQueue )
			{
				var query = ( ge( 'UserFilterInput' ).value ? ge( 'UserFilterInput' ).value : '-' );
				
				for( var key in FilterQueue )
				{
					if( !searchQuery[query] )
					{
						FilterQueue[key]();
					}
					
					delete FilterQueue[key];
					
					if( !searchQuery[query] )
					{
						FilterInit();
					}
					
					searchQuery[query] = query;
					
					break;
				}
			}
		
		}, 1000 );
	}
}

function CheckScroll( ele )
{
	if( !ele ) return;
	
	if( ( ele.scrollHeight - ele.clientHeight ) > 0 )
	{
		//console.log( ele.scrollTop + ' / ' + ( ele.scrollHeight - ele.clientHeight ) + ' * ' + 100 );
		
		var pos = Math.round( ele.scrollTop / ( ele.scrollHeight - ele.clientHeight ) * 100 );
		
		// Outputs prosentage
		
		return pos;
	}
}

function CheckUserList( ele )
{
	var check = CheckScroll( ele );
	
	var query = ( ge( 'UserFilterInput' ).value ? ge( 'UserFilterInput' ).value : '' );
	
	if( maxlimit > 0 && !query && !nothingnew && updateuserlist && check && check >= 50 )
	{
		// 
		
		startlimit = ( startlimit + maxlimit );
		
		
		
		//console.log( 'limit [' + check + '] ' + limit );
		
		Application.listUsers();
		//RefreshSessions();
		
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
			
			var str = ''; var ugs = '';
			
			
			var dat;
			try
			{
				dat = JSON.parse( d );
			} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load user data!'}); return; }
			
			if( dat.Setup && dat.Setup.length > 0 )
			{
				str += '<option value="0">' + i18n( 'i18n_none' ) + '</option>';
				
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
			
			/*if( dat.Workgroup && dat.Workgroup.length > 0 )
			{
				ugs += '<option value="0">' + i18n( 'i18n_select_workgroups' ) + '</option>';
				
				for( k in dat.Workgroup )
				{
					var s = ( dat.Workgroup[k].UserID > 0 ? ' selected="selected"' : '' );
					
					ugs += '<option value="' + dat.Workgroup[k].ID + '"' + s + '>' + dat.Workgroup[k].Name + '</option>';
				}
			}*/
			
			var f = new File( 'Progdir:Templates/user.html' );
			f.replacements = {
				'id'        : dat.ID,
				'username'  : dat.Name,
				'password'  : '********',
				'fullname'  : (dat.FullName ? dat.FullName : ''),
				'email'     : (dat.Email ? dat.Email : ''),
				'level'     : dat.Level,
				'setup' 	: str,
				'workgroup' : ugs
			};
			f.i18n();
			f.onLoad = function( data )
			{
				ge( 'UserGui' ).innerHTML = data;
				
				if( ge( 'SetupContainer' ) && !ge( 'Setup' ).value )
				{
					ge( 'SetupContainer' ).style.display = 'none';
				}
				
				if( ge( 'WorkgroupContainer' ) && !dat.Workgroup.length )
				{
					ge( 'WorkgroupContainer' ).style.display = 'none';
				}
				
				if( dat.Workgroup )
				{
					RefreshUserGroups( dat.Workgroup );
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
		// Else if user is deleted, remove from list of users if found
		else if( ge( 'UserListID_' + id ) )
		{
			ge( 'UserListID_' + id ).parentNode.removeChild( ge( 'UserListID_' + id ) );
		}
	}
	m.execute( 'userinfoget', { id: id, mode: 'all' } );
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
			args[ inps[a].toLowerCase() ] = Trim( ge(inps[a]).value );
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
			
			if( ge( 'Setup' ) )
			{
				ApplySetup( id );
			}
			else
			{
				EditUser( id );
			}
			
			if( ge( 'pUserWorkgroup' ) )
			{
				ApplyUserGroups( id );
			}
			
			Application.listUsers( id );
		}
		else
		{
			console.log('Error during user update',e,d);
		}
		//RefreshSessions( id )	
	}
	
	args.command ='update';
	f.execute( 'user', args );
}

function DeleteUser( id )
{
	Confirm( i18n( 'i18n_deleting_user' ), i18n( 'i18n_deleting_verify' ), function( result )
	{
		// Confirmed!
		if( result.data == true )
		{
			var f = new Library( 'system.library' );
			var args = {};
			args.command ='delete';
			args.id = id;


			if( ge( 'UserListID_' + id ) ) ge( 'UserListID_' + id ).parentNode.removeChild( ge( 'UserListID_' + id ) );

			f.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
				    CancelEditing();
				    startlimit = 0;
				    limit = ( startlimit + ', ' + maxlimit );
				    
				    ge( 'UserList' ).innerHTML = '';
				    Application.listUsers();
				    console.log('User deleted. List refreshed?');
				}
				else
				{
					console.log('delete user gave unexpected response',e,d);
				}
				//RefreshSessions( id );
			}

			f.execute( 'user', args );
		}
	} );
}

function RefreshUserGroups( groups )
{
	if ( ge( 'pUserWorkgroup' ) )
	{
		if (!ge( 'pUserWorkgroup' ).innerHTML )
		{
			ge( 'pUserWorkgroup' ).innerHTML = i18n( 'i18n_loading' );
		}

		var str = ''; var ugs = '';
		
		if ( groups )
		{
			var sw = 1;
			
			//ugs += '<option value="0">' + i18n( 'i18n_add_workgroup' ) + '</option>';
			
			str += '<table class="List"><tbody>';
			
			for( k in groups )
			{
				if( groups[k].UserID > 0 )
				{
					str += '<tr itemid="' + ( 1 + k ) + '" value="' + groups[k].ID + '" class="sw' + ( sw = ( sw == 1 ? 2 : 1 ) ) + '">' +
						   '<td>&nbsp;' + groups[k].Name + '</td>' +
						   '<td width="24px" onclick="RemoveUserGroups(this)" class="MousePointer IconSmall fa-remove">&nbsp;&nbsp;&nbsp;</td>' +
						   '</tr>';
				}
				else
				{
					ugs += '<option value="' + groups[k].ID + '">' + groups[k].Name + '</option>';
				}
			}
			
			str += '</tbody></table>';
		}
		
		ge( 'pUserWorkgroup' ).innerHTML = str;
		
		ge( 'pUserWorkgroup' ).obj = ( groups ? groups : [] );
		
		if( ge( 'WorkgroupSelect' ) )
		{
			if( !ugs )
			{
				ge( 'WorkgroupSelect' ).style.display = 'none';
			}
			else
			{
				ge( 'WorkgroupSelect' ).style.display = '';
			}
		}
		
		ge( 'Workgroup' ).innerHTML = ugs;
	}
}

function RemoveUserGroups( ele )
{
	if ( ele.parentNode && ge( 'pUserWorkgroup' ) && ge( 'pUserWorkgroup' ).obj )
	{
		var sts = ele.parentNode;
	
		groups = new Array();
		
		var obj = ge( 'pUserWorkgroup' ).obj;
	
		if ( obj )
		{
			for( k in obj )
			{
				if( obj[k].ID == sts.getAttribute( 'value' ) )
				{
					obj[k].UserID = 0;
				}
				
				groups.push( obj[k] );
			}
			
			RefreshUserGroups( groups );
		}
	}
}

function AddUserGroup()
{
	if ( ge( 'Workgroup' ) && ge( 'pUserWorkgroup' ) && ge( 'pUserWorkgroup' ).obj )
	{
		groups = new Array();
		
		var obj = ge( 'pUserWorkgroup' ).obj;
	
		if ( obj && ge( 'Workgroup' ).value )
		{
			for( k in obj )
			{
				if( obj[k].ID == ge( 'Workgroup' ).value )
				{
					obj[k].UserID = 1;
				}
				
				groups.push( obj[k] );
			}
			
			RefreshUserGroups( groups );
		}
	}
}


function UnblockUser( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			CancelEditing();
			Application.listUsers( id );
			Notify({'title':'Users administration','text':'User unblocked'});
		}
		else
		{
			Notify({'title':'Users administration','text':'Could not unblock user ' + e + ':' + d });
		}
		//RefreshSessions( id );
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

function RefreshList()
{
    ge( 'UserList' ).innerHTML = '';
    Application.listUsers();
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
		
		var ele = {};
		try
		{
			ele = JSON.parse( d );
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load setup data!'});/* return;*/ }
		
		if( ele && ele.Data )
		{
			try
			{
				data = JSON.parse( ele.Data );
			} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not parse user details!'}); }
		}
		
		var f = new File( 'Progdir:Templates/setup.html' );
		f.replacements = {
			'id': ( ele.ID ? ele.ID : id ),
			'name': ( ele.Name ? ele.Name : 'Unnamed setup' ),
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
				ge( 'pSetupPreinstall' ).checked = ( data.preinstall != '0' ? true : false );
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
						str += '<div value="' + sfw[apps[k][0]].Name + '" class="HBox Box MarginBottom Padding">' +
						'<h2>' + sfw[apps[k][0]].Name + '<span onclick="RemoveSoftware(this)" class="MousePointer IconSmall fa-remove"></span></h2>' + 
						'<p class="Layout"><strong>' + sfw[apps[k][0]].Category + '</strong></p>' +
						'<p class="Layout">No description available for this title.</p>' +
						'<div class="TheButton BackgroundNegative Padding">' +
						'<span>' + i18n( 'i18n_include_in_dock' ) + '&nbsp;</span><input type="checkbox"' + ( apps[k][1] != '0' ? ' checked="checked"' : '' ) + '/>' + 
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
		
		ge( 'pSetupStartup' ).obj = ( starts ? starts : [] );
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
	if ( id && ge( 'Setup' ) )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			try { d = JSON.parse( d ) } catch( e ) {}
			
			console.log( { e: e, d: d, id: ( ge( 'Setup' ).value ? ge( 'Setup' ).value : '0' ), userid: id } );
			
			EditUser( id );
		}
		m.execute( 'usersetupapply', { id: ( ge( 'Setup' ).value ? ge( 'Setup' ).value : '0' ), userid: id } );
	}
}

function ApplyUserGroups( id )
{
	if( id && ge( 'pUserWorkgroup' ) )
	{
		var opt = [];
		
		var obj = ge( 'pUserWorkgroup' ).obj;
		
		if( obj )
		{
			for( k in obj )
			{
				if( obj[k].ID > 0 && obj[k].UserID > 0 )
				{
					opt.push( obj[k].ID );
				}
			}
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			try { d = JSON.parse( d ) } catch( e ) {}
			
			console.log( { e: e, d: d, workgroups: ( opt ? opt : '0' ), userid: id } );
			
			EditUser( id );
		}
		m.execute( 'workgroupupdate', { workgroups: ( opt ? opt : '0' ), userid: id } );
	}
}

function ApplyGroupSetup( id )
{
	if ( id && ge( 'pWorkgroupSetup' ) )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			try { d = JSON.parse( d ) } catch( e ) {}
			
			RefreshWorkgroups();
		}
		m.execute( 'usersetupapply', { id: ( ge( 'pWorkgroupSetup' ).value ? ge( 'pWorkgroupSetup' ).value : '0' ), members: ( ge( 'pMembers' ).value ? ge( 'pMembers' ).value : '0' ), group: id } );
	}
}

function deleteSetup()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		RefreshSetup();
		
		if( ge( 'SetupGui' ) ) ge( 'SetupGui' ).innerHTML = '';
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
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var wg = '<option value="0">none</option>';
		
		try
		{
			if( e == 'ok' && d )
			{
				d = JSON.parse( d );
				
				if( d )
				{
					for( var i in d )
					{
						if( d[i].ID )
						{
							wg += '<option value="' + d[i].ID + '">' + d[i].Name + '</option>';
						}
					}
				}
			}
		}
		catch( e ){  }
		
		var f = new File( 'Progdir:Templates/workgroup.html' );
		f.replacements = {
			'id': '',
			'name': '',
			'parent': wg,
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
	m.execute( 'workgroups' );
}

function EditWorkgroup( id )
{


	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var ele;

			Application.workgroupUserListChanged = false;
			try{
				ele = JSON.parse( d );
			} catch(e) {
				console.log(e,d);
				Notify({'title':'ERROR in Users app','text':'Could not load workgroup data! Did not find workgroup details here ' + d});
				return;
			}
			
			//now load all workgroups anew for the damn dropdown for parent???
			var ff = new Library( 'system.library' );
			ff.onExecuted = function( ee, dd )
			{
				var wg = '<option value="0">none</option>';
				
				try
				{
					if( ee == 'ok' && dd )
					{
						if(typeof dd != 'object') dd = JSON.parse( dd );
					}
				}
				catch( error ){ 
					Notify({'title':'ERROR in Users app','text':'Could not load workgroup data!'});
					return;
				}		

				if( dd.groups )
				{
					dd = dd.groups;
					for( var i in dd )
					{
						if( dd[i].ID )
						{
							if( dd[i].ID == ele.groupid || dd[i].parentid == ele.groupid )
							{
								continue;
							}

							wg += '<option value="' + dd[i].ID + '"' + ( ele.parentid && dd[i].ID == ele.parentid ? ' Selected="Selected"' : '' ) + '>' + dd[i].name + '</option>';
						}
					}
				}
				else
				{
					Notify({'title':'ERROR in Users app','text':'Could not load workgroup data!'});
					return;

				}

				var t = new File( 'Progdir:Templates/workgroup.html' );
				t.replacements = {
					'id': ele.groupid,
					'name': ele.name,
					'parent': wg,
					'members': ele.users,
					'setup': '',
					'viewId': ge( 'viewId' ).value,
					'parentViewId': ge( 'viewId' ).value,
					'delCss': ''
				};
				t.i18n();
				t.onLoad = function( data )
				{
					ge( 'WorkgroupGui' ).innerHTML = data;
				
					if( ge( 'SetupGroupContainer' ) && ge( 'pWorkgroupSetup' ) && !ge( 'SetupGroupContainer' ).value )
					{
						ge( 'SetupGroupContainer' ).style.display = 'none';
					}
				
					refreshMembers( ele.groupid );
				}
				t.load();
				
				
				
			}
			ff.execute('group',{'command':'list'});
					
			
		}
	}
	f.execute( 'group', {'command':'listdetails','id':id} );
}

// Save a workgroup
function saveWorkgroup( callback, tmp )
{

	var args = {
		id: ge( 'pWorkgroupID' ).value > 0 ? ge( 'pWorkgroupID' ).value : '0',
		parentid: ( ge( 'pWorkgroupParent' ) ? ge( 'pWorkgroupParent' ).value : '0' ),
		groupname: ge( 'pWorkgroupName' ).value,
	};

	if( Application.workgroupUserListChanged ) args.users = ge( 'pMembers' ).value;
	Application.workgroupUserListChanged = false;
		
	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			//ge( 'pWorkgroupID' ).value = d;
			Notify({'title':'Users','text':'Workgroup changes saved.'});

		}
		else
		{
			console.log('Error during workgroup update',e,d);
		}
	
		if( callback ) callback();
		
		if( args.id > 0 && tmp )
		{
			ApplyGroupSetup( args.id );
		}
		else
		{
			RefreshWorkgroups();
		}
		
	}
	

	//console.log('sending this for saving',args);
	if( args.id > 0  )
		args.command ='update';
	else
		args.command ='create';
		
	f.execute( 'group', args );



}

function RefreshWorkgroups()
{

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'WorkgroupList' ).innerHTML = '';
			return;
		}
		var rows;
		try{
			rows = JSON.parse( d );
			rows = rows.groups;
		} catch(e) { Notify({'title':'ERROR in Users app','text':'Could not load workgroups!'}); return; }
		var ml = '';
		var sw = 1;
		
		for( var a in rows )
		{
			ml += '<div workgroupId="' + rows[a].ID + '" class="sw' + sw + ' HRow BorderBottom Padding" onclick="EditWorkgroup(' + rows[a].ID + ')" onmouseover="SwitchRow(this, \'over\')" onmouseout="SwitchRow(this, \'out\')"><div class="IconMedium fa-group FloatLeft"></div><div class="FloatLeft LineHeight2x MarginLeft">' + rows[a].name + '</div></div>';
			sw = sw == 1 ? 2 : 1;
		}
		ge( 'WorkgroupList' ).innerHTML = ml;
	}
	f.execute('group',{'command':'list'});

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

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var re = JSON.parse( d );
			var exist = re.users;
			ge( 'pMembersListed' ).innerHTML = '';
			var out  = [];
			for( var a = 0; a < exist.length; a++ )
			{
				var o = document.createElement( 'option' );
				o.value = exist[a].id;
				o.innerHTML = exist[a].fullname; // we need some form of name to display here :)
				ge( 'pMembersListed' ).appendChild( o );
				out.push( exist[a].id );
			}
			ge( 'pMembers' ).value = out.join( ',' );
		}
	}
	f.execute( 'group', {'command':'listdetails','id':ge( 'pWorkgroupID' ).value} );

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

	Application.workgroupUserListChanged = true;
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

function RefreshSessions( id )
{
	return false;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		var list;
		try
		{
			list = JSON.parse( d );
		} catch(e) { /*Notify({'title':'ERROR in Users app','text':'Could not load usersessions!'});*/ return; }
		var sl = '';
		var sw = 2;
		for( var a = 0; a < list.length; a++ )
		{
			var us = list[a];
			
			var str = '';
			
			sw = sw == 1 ? 2 : 1;
			
			str += '<div class="UserSession HRow Padding">';
			str += '<div class="HContent35 FloatLeft Ellipsis Padding">' + us.FullName + '</div>';
			str += '<div class="HContent45 FloatLeft Ellipsis Padding"><input type="text" class="FullWidth" value="' + us.SessionID + '"/></div>';
			str += '<div class="HContent20 FloatLeft Ellipsis"><div class="HContent5 FloatLeft">&nbsp;</div><div class="HContent95 FloatLeft"><button type="button" class="Button IconSmall fa-refresh" onclick="RenewSession(' + us.ID + ')"> ' + i18n( 'i18n_regenerate' ) + '</button></div></div>';
			str += '</div>';
			
			if( !ge( 'UserSessionID_' + us.ID ) )
			{
				sl += '<div id="UserSessionID_' + us.ID + '" class="sw' + sw + '">' + str + '</div>';
			}
			else
			{
				ge( 'UserSessionID_' + us.ID ).innerHTML = str;
			}
		}
		ge( 'Sessions' ).innerHTML = ge( 'Sessions' ).innerHTML + sl;
	}
	m.execute( 'usersessions', { limit: limit, userid: id } );
}

function RenewSession( id )
{
	return false;
	
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

function TogglePasswordField( inputid )
{
	var finput = ge( inputid );
	if( finput )
	{
		if( finput.getAttribute('type') == 'text' )
			finput.setAttribute('type','password')
		else
			finput.setAttribute('type','text')
	}
}
