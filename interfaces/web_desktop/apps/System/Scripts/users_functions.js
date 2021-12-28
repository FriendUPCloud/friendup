
// To Be Deprecated functions ------------------------------------------------------------------------------------------

function mitraApps( callback, id )
{
	if( callback )
	{
		var m = new Module( 'mitra' );
		m.onExecuted = function( e, d )
		{
			if( ShowLog ) console.log( 'mitraApps( callback, id ) ', { e:e, d:d } );
			
			if( callback ) return callback( { e:e, d:d } );
		}
		m.execute( 'listusers' );
	}
}

function doListUsers( userList, clearFilter )
{
	var o = ge( 'UserList' );
	
	if( !ge( 'ListUsersInner' ) )
	{
		if( o ) o.innerHTML = '';
	}
	
	if( !ge( 'ListUsersInner' ) )
	{
		// Add the main heading
		( function( ol ) {
			var tr = document.createElement( 'div' );
			//tr.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingRight';
			tr.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight';
			
			var extr = '';
			if( clearFilter )
			{
				extr = '<button style="position: absolute; right: 0;" class="ButtonSmall IconButton IconSmall fa-remove"/>&nbsp;</button>';
			}
			
			tr.innerHTML = '\
				<div class="HContent20 FloatLeft">\
					<h3><strong>' + i18n( 'i18n_users' ) + ' </strong><span id="AdminUsersCount">' + (userList&&userList['Count']?'('+userList['Count']+')':'(0)')+'</span></h3>\
				</div>\
				<div class="HContent70 FloatLeft Relative">\
					' + extr + '\
					<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_find_users' ) + '"/>\
				</div>\
				<div class="HContent10 FloatLeft TextRight InActive">\
					<button id="AdminUsersBtn" class="IconButton IconSmall Negative fa-bars"></button>\
					<div class="submenu_wrapper"><ul id="AdminUsersSubMenu" class="Positive"></ul></div>\
				</div>\
			';
				
			var inp = tr.getElementsByTagName( 'input' )[0];
			inp.onkeyup = function( e )
			{
				filterUsers( this.value, true );
			}
		
			if( clearFilter )
			{
				inp.value = clearFilter;
			}
		
			var bt = tr.getElementsByTagName( 'button' )[0];
			if( bt )
			{
				bt.onclick = function()
				{
					filterUsers( false );
				}
			}
				
			ol.appendChild( tr );
		} )( o );
	}

	// Types of listed fields
	var types = {
		Edit: '10',
		FullName: '30',
		Name: '25',
		Status: '15',
		LoginTime: 20
	};

	// List by level
	var levels = [ 'Admin', 'User', 'Guest', 'API' ];
	
	var status = [ 'Active', 'Disabled', 'Locked' ];
	
	var login = [ 'Never' ];
	
	// List headers
	var header = document.createElement( 'div' );
	header.className = 'List';
	var headRow = document.createElement( 'div' );
	headRow.className = 'HRow BackgroundNegative Negative PaddingTop PaddingBottom';
	for( var z in types )
	{
		var borders = '';
		var d = document.createElement( 'div' );
		if( a < userList.length - a )
			borders += ' BorderBottom';
		var d = document.createElement( 'div' );
		d.className = 'PaddingSmallLeft PaddingSmallRight HContent' + types[ z ] + ' FloatLeft Ellipsis' + borders;
		if( z == 'Edit' ) z = '&nbsp;';
		d.innerHTML = '<strong' + ( z != '&nbsp;' ? ' onclick="sortUsers(\''+z+'\')"' : '' ) + '>' + ( z != '&nbsp;' ? i18n( 'i18n_header_' + z ) : '&nbsp;' ) + '</strong>';
		headRow.appendChild( d );
	}
	
	var btn = ge( 'AdminUsersBtn' );
	if( btn )
	{
		btn.onclick = function( e )
		{
			SubMenu( this );
		}
	}
	
	var sm = ge( 'AdminUsersSubMenu' );
	if( sm && !sm.innerHTML )
	{
		
		var li = document.createElement( 'li' );
		li.innerHTML = i18n( 'i18n_new_user' );
		li.onclick = function( e )
		{
			
			NewUser( this );
			
		}
		sm.appendChild( li );
		
		var li = document.createElement( 'li' );
		li.className = 'show';
		li.innerHTML = i18n( 'i18n_show_disabled_users' );
		li.onclick = function( e )
		{
			if( this.className.indexOf( 'show' ) >= 0 )
			{
				hideStatus( 'Disabled', true );
				this.innerHTML = i18n( 'i18n_hide_disabled_users' );
				this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
			}
			else
			{
				hideStatus( 'Disabled', false );
				this.innerHTML = i18n( 'i18n_show_disabled_users' );
				this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
			}
			
			SubMenu( this.parentNode.parentNode );
		}
		sm.appendChild( li );
		
		var li = document.createElement( 'li' );
		li.className = 'hide';
		li.innerHTML = i18n( 'i18n_hide_locked_users' );
		li.onclick = function( e )
		{
			if( this.className.indexOf( 'hide' ) >= 0 )
			{
				hideStatus( 'Locked', false );
				this.innerHTML = i18n( 'i18n_show_locked_users' );
				this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'show';
			}
			else
			{
				hideStatus( 'Locked', true );
				this.innerHTML = i18n( 'i18n_hide_locked_users' );
				this.className = this.className.split( 'hide' ).join( '' ).split( 'show' ).join( '' ) + 'hide';
			}
			
			SubMenu( this.parentNode.parentNode );
		}
		sm.appendChild( li );
		
	}
	
	if( !ge( 'ListUsersInner' ) )
	{
		// Add header columns
		header.appendChild( headRow );
	}
	
	if( !ge( 'ListUsersInner' ) )
	{
		o.appendChild( header );
	}

	function setROnclick( r, uid )
	{
		r.onclick = function()
		{
			if( ge( 'ListUsersInner' ) )
			{
				var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
		
				if( list.length > 0 )
				{
					for( var a = 0; a < list.length; a++ )
					{
						if( list[a] && list[a].className && list[a].className.indexOf( ' Selected' ) >= 0 )
						{
							list[a].className = ( list[a].className.split( ' Selected' ).join( '' ) );
						}
					}
				}
			}
			
			this.className = ( this.className.split( ' Selected' ).join( '' ) + ' Selected' );
			
			Sections.accounts_users( 'edit', uid );
		}
	}
	
	var sortby  = ( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).getAttribute( 'sortby'  ) ? ge( 'ListUsersInner' ).getAttribute( 'sortby'  ) : 'FullName' );
	var orderby = ( ge( 'ListUsersInner' ) && ge( 'ListUsersInner' ).getAttribute( 'orderby' ) ? ge( 'ListUsersInner' ).getAttribute( 'orderby' ) : 'ASC'      );
	
	var output = [];
	
	var wrapper = document.createElement( 'div' );
	wrapper.id = 'ListUsersWrapper';
	
	if( ge( 'ListUsersInner' ) )
	{
		var list = ge( 'ListUsersInner' );
	}
	else
	{
		var list = document.createElement( 'div' );
		list.className = 'List';
		list.id = 'ListUsersInner';
	}
	
	if( !ge( 'ListUsersInner' ) )
	{
		wrapper.appendChild( list );
	}
	
	if( !ge( 'ListUsersInner' ) )
	{
		o.appendChild( wrapper );
	}
	
	if( userList['Count'] )
	{ 
		Application.totalUserCount = userList['Count'];
		
		if( !UsersSettings( 'total' ) )
		{
			UsersSettings( 'total', Application.totalUserCount );
		}
	}
	
	var avatars = [];
	
	var sw = 2; var tot = 0;
	for( var b = 0; b < levels.length; b++ )
	{
		for( var a in userList )
		{
			if( !userList[ a ] ) continue;
			
			// Skip irrelevant level
			if( userList[ a ].Level != levels[ b ] ) continue;
			
			tot++;
			
			if( !ge( 'UserListID_'+userList[a].ID ) )
			{
				
				
				sw = sw == 2 ? 1 : 2;
				var r = document.createElement( 'div' );
				setROnclick( r, userList[a].ID );
				r.className = 'HRow ' + status[ ( userList[ a ][ 'Status' ] ? userList[ a ][ 'Status' ] : 0 ) ];
				r.id = ( 'UserListID_'+userList[a].ID );
				
				var timestamp = ( userList[ a ][ 'LoginTime' ] ? userList[ a ][ 'LoginTime' ] : 0 );
				
				userList[ a ][ 'Name' ]     = ( userList[ a ][ 'Name' ]     ? userList[ a ][ 'Name' ]     : 'n/a' );
				userList[ a ][ 'FullName' ] = ( userList[ a ][ 'FullName' ] ? userList[ a ][ 'FullName' ] : 'n/a' );
				userList[ a ][ 'Level' ]    = ( userList[ a ][ 'Level' ]    ? userList[ a ][ 'Level' ]    : 'n/a' );
				
				userList[ a ][ 'Status' ] = status[ ( userList[a][ 'Status' ] ? userList[a][ 'Status' ] : 0 ) ];
				
				userList[ a ][ 'LoginTime' ] = ( userList[a][ 'LoginTime' ] != 0 && userList[a][ 'LoginTime' ] != null ? CustomDateTime( userList[a][ 'LoginTime' ] ) : login[ 0 ] );
				
				
				
				avatars.push( { 
					id        : userList[ a ].ID,
					fullname  : userList[ a ].FullName,
					name      : userList[ a ].Name,
					status    : userList[ a ].Status,
					logintime : userList[ a ].LoginTime,
					timestamp : timestamp,
					image     : ( userList[ a ].Image ? userList[ a ].Image : null ) 
				} );
				
				
				
				userList[ a ][ 'Edit' ] = '<span '             + 
				'id="UserAvatar_' + userList[ a ].ID + '" '    + 
				'fullname="' + userList[ a ].FullName + '" '   + 
				'name="' + userList[ a ].Name + '" '           + 
				'status="' + userList[ a ].Status + '" '       + 
				'logintime="' + userList[ a ].LoginTime + '" ' + 
				'timestamp="' + timestamp + '" '               +
				'class="IconSmall fa-user-circle-o avatar" '   + 
				'style="position: relative;" '                 +
				'><div style=""></div></span>';
				
				
				
				for( var z in types )
				{
					var borders = '';
					var d = document.createElement( 'div' );
					if( z != 'Edit' )
					{
						d.className = '';
					}
					else d.className = 'TextCenter';
					if( a < userList.length - a )
					{
						borders += ' BorderBottom';
					}
					d.className += ' HContent' + types[ z ] + ' FloatLeft PaddingSmall Ellipsis ' + z.toLowerCase() + borders;
					d.innerHTML = userList[a][ z ];
					r.appendChild( d );
				}
				
				
				
				if( userList[ a ][ sortby ] )
				{
					var obj = { 
						sortby  : userList[ a ][ sortby ].toLowerCase(), 
						object  : userList[ a ],
						content : r
					};
					
					output.push( obj );
				}
				
				UsersSettings( 'uids', userList[ a ].ID );
				
			}
			else
			{
				// Add to the field that is allready there ... But we also gotto consider sorting the list by default or defined sorting ...
				
				
			}
			
		}
	}
	
	if( ge( 'AdminUsersCount' ) )
	{
		ge( 'AdminUsersCount' ).innerHTML = ( userList && userList['Count'] ? '(' + userList['Count'] + ')' : ( ge( 'AdminUsersCount' ).innerHTML ? ge( 'AdminUsersCount' ).innerHTML : '(0)' ) );
	}
	
	if( output.length > 0 )
	{
		// Sort ASC default
		
		output.sort( ( a, b ) => ( a.sortby > b.sortby ) ? 1 : -1 );
		
		// Sort DESC
		
		if( orderby == 'DESC' ) 
		{ 
			output.reverse();  
		} 
		
		var i = 0; var users = [];
		
		for( var key in output )
		{
			if( output[key] && output[key].content && output[key].object )
			{
				i++;
				
				users.push( output[key].object.ID );
				
				// Add row
				list.appendChild( output[key].content );
				
			}
		}
		
		var total = 0;
		
		if( list.innerHTML )
		{
			var spans = list.getElementsByTagName( 'span' );
			
			if( spans )
			{
				total = spans.length;
				
				if( total > UsersSettings( 'listed' ) )
				{
					UsersSettings( 'listed', total );
				}
			}
		}
		
		// Temporary get lastlogin time separate to speed up the sql query ...
		
		getLastLoginlist( function ( res, dat )
		{
			if( res == 'ok' && dat )
			{
				for ( var i in dat )
				{
					if( dat[i] && dat[i]['UserID'] )
					{
						if( ge( 'UserListID_' + dat[i]['UserID'] ) )
						{
							var elems = ge( 'UserListID_' + dat[i]['UserID'] ).getElementsByTagName( '*' );
							
							if( elems.length > 0 )
							{
								for ( var div in elems )
								{
									if( elems[div] && elems[div].className )
									{
										var timestamp = ( dat[i]['LoginTime'] );
										var logintime = ( dat[i]['LoginTime'] != 0 && dat[i]['LoginTime'] != null ? CustomDateTime( dat[i]['LoginTime'] ) : login[ 0 ] );
										
										if( elems[div].className.indexOf( 'avatar' ) >= 0 )
										{
											elems[div].setAttribute( 'timestamp', timestamp );
											elems[div].setAttribute( 'logintime', logintime );
										}
										if( elems[div].className.indexOf( 'logintime' ) >= 0 )
										{
											elems[div].innerHTML = logintime;
										}
									}
								}
							}
							
							
						}
					}
				}
			}
			
		}, ( users ? users.join(',') : false ) );
		
		// Temporary until we got a better way ...
		
		if( avatars )
		{
			// TODO: finish this ...
			if( UsersSettings( 'avatars' ) )
			{
				getAvatars( avatars );
			}
		}
		
		if( ShowLog ) console.log( 'new users added to list: ' + i + '/' + tot + ' total ['+total+']' );
		
		if( Application.totalUserCount > tot )
		{
			var divh = ge( 'ListUsersInner' ).getElementsByTagName( 'div' )[0].clientHeight;
			
			if( divh > 0 && UsersSettings( 'divh' ) != divh )
			{
				UsersSettings( 'divh', divh );
				
			}
		}
		
		hideStatus( 'Disabled', false );
		
		sortUsers( UsersSettings( 'sortby' ), UsersSettings( 'orderby' ) );
	}
	
	Friend.responsive.pageActive = ge( 'UserList' );
	Friend.responsive.reinit();
	
	if( ge( 'ListUsersInner' ) )
	{
		ge( 'ListUsersInner' ).className = ( 'List ' + sortby + ' ' + orderby );
		ge( 'ListUsersInner' ).setAttribute( 'sortby', sortby );
		ge( 'ListUsersInner' ).setAttribute( 'orderby', orderby );
	}
	
	
	
}

function filterUsers( filter, server )
{
	if( !filter )
	{
		UsersSettings( 'searchquery', filter );
	}
	
	if( ge( 'ListUsersInner' ) )
	{
		var list = ge( 'ListUsersInner' ).getElementsByTagName( 'div' );
	
		if( list.length > 0 )
		{
			for( var a = 0; a < list.length; a++ )
			{
				if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
				
				var span = list[a].getElementsByTagName( 'span' )[0];
				
				if( span )
				{
					var param = [
						( " " + span.getAttribute( 'fullname' ).toLowerCase() + " " ), 
						( " " + span.getAttribute( 'name' ).toLowerCase() + " " )
					];
					
					if( !filter || filter == ''  
					//|| span.getAttribute( 'fullname' ).toLowerCase().substr( 0, filter.length ) == filter.toLowerCase()
					//|| span.getAttribute( 'name' ).toLowerCase().substr( 0, filter.length ) == filter.toLowerCase()
					|| span.getAttribute( 'fullname' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
					|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
					//|| param[0].indexOf( " " + filter.toLowerCase() + " " ) >= 0 
					//|| param[1].indexOf( " " + filter.toLowerCase() + " " ) >= 0 
					)
					{
						list[a].style.display = '';
						
						var div = list[a].getElementsByTagName( 'div' );
						
						if( div.length )
						{
							for( var i in div )
							{
								if( div[i] && div[i].className && ( div[i].className.indexOf( 'fullname' ) >= 0 || div[i].className.indexOf( 'name' ) >= 0 ) )
								{
									// TODO: Make text searched for ...
								}
							}
						}
					}
					else
					{
						list[a].style.display = 'none';
					}
				}
			}
			
			hideStatus( 'Disabled', false );
		}
	}
	
	// TODO: Fix server search query when building the search list more advanced with listout limit ...
	
	if( filter.length < UsersSettings( 'minlength' ).length || filter.length < UsersSettings( 'searchquery' ).length || filter == UsersSettings( 'searchquery' ) || !server ) return;
	
	UsersSettings( 'reset', true );
	
	UsersSettings( 'searchquery', filter );
	
	//console.log( filter.length );
	
	
	
	RequestQueue.Set( function( callback, key )
	{
		//console.log( filter + ' < ' + UsersSettings( 'searchquery' ) );
		
		if( filter.length < UsersSettings( 'searchquery' ).length )
		{
			if( callback ) callback( key );
			
			return;
		}
		
		getUserlist( function( res, userList, key )
		{
			
			if( callback ) callback( key );
			
			doListUsers( userList );
			
		}, key );
		
	} );
}

function CheckUserlistSize( firstrun )
{
	
	if( UsersSettings( 'experiment' ) )
	{
		return false;
	}
	
	var scrollbox = ge( 'UserList' );
	var container = ge( 'ListUsersInner' );
	var wrapper   = ge( 'ListUsersWrapper' );
	
	if( scrollbox )
	{
		var m = 85;
		
		// Check scrollarea ...
		
		if( ( scrollbox.scrollHeight - scrollbox.clientHeight ) > 0 )
		{
			
			var pos = Math.round( scrollbox.scrollTop / ( scrollbox.scrollHeight - scrollbox.clientHeight ) * 100 );
			
			// If scrolled area is more then 50% prosentage
			
			if( pos && pos >= 50 )
			{
				if( UsersSettings( 'experiment' ) )
				{
					//console.log( pos );
				}
				
				if( UsersSettings( 'total' ) > 0 && ( UsersSettings( 'listed' ) == UsersSettings( 'total' ) ) )
				{
					//wrapper.style.minHeight = 'auto';
				}
				else if( container.clientHeight >= wrapper.clientHeight )
				{
					if( UsersSettings( 'experiment' ) )
					{
						console.log( '[1] wrapper.style.minHeight = ' + ( container.clientHeight + scrollbox.clientHeight ) + 'px' );
						wrapper.style.minHeight = ( container.clientHeight + scrollbox.clientHeight ) + 'px';
					}
					
					//UsersSettings( 'limit', true );
						
					//Sections.accounts_users();
				}
				
				// TODO: Handle scroll and getting new data better ...
				
				if( !UsersSettings( 'total' ) || ( UsersSettings( 'listed' ) != UsersSettings( 'total' ) ) )
				{
					
					// Only run the request when server is ready, one job at a time ... 
					
					RequestQueue.Set( function( callback, key )
					{
					
						UsersSettings( 'limit', true );
						
						if( ShowLog ) console.log( '[2] GETTING SERVER DATA ... ' + UsersSettings( 'limit' ) + ' (' + UsersSettings( 'intervals' ) + ')' ); 
					
						getUserlist( function( res, data, key )
						{
							
							if( callback )
							{
								callback( key );
							}
							
							// If there is data populate if not, do nothing ...
							
							if( res == 'ok' && data )
							{
								Sections.accounts_users( 'init', data );
							}
						
						}, key );
			
					}, false, true );
					
					return;
				}
				
			}
		}
		
		
		
		if( container && ( container.clientHeight + m ) > scrollbox.clientHeight )
		{
			if( container.clientHeight >= wrapper.clientHeight )
			{
				if( UsersSettings( 'experiment' ) )
				{
					//console.log( '[2] wrapper.style.minHeight = ' + ( container.clientHeight + scrollbox.clientHeight ) + 'px' );
					//wrapper.style.minHeight = ( container.clientHeight + scrollbox.clientHeight ) + 'px';
				}
			}
		}
		else if( container && ( container.clientHeight + m ) < scrollbox.clientHeight )
		{
			if( wrapper.clientHeight > container.clientHeight )
			{
				//wrapper.style.minHeight = 'auto';
			}
		}
		
		
		
		var divh = UsersSettings( 'divh' );
		
		if( divh && ( !UsersSettings( 'total' ) || ( UsersSettings( 'listed' ) != UsersSettings( 'total' ) ) ) )
		{
			
			if( UsersSettings( 'experiment' ) )
			{
				console.log( "UsersSettings( 'total' ) " + UsersSettings( 'total' ) );
			}
			
			if( UsersSettings( 'experiment' ) )
			{
				// ...
				
				if( container && ( container.clientHeight + m ) > scrollbox.clientHeight )
				{
					// If UsersSettings( 'total' ) is bigger then visible area add extra block ...
					if( container.clientHeight >= wrapper.clientHeight )
					{
						console.log( '[0] wrapper.style.minHeight = ' + ( container.clientHeight + scrollbox.clientHeight ) + 'px' );
						wrapper.style.minHeight = ( container.clientHeight + scrollbox.clientHeight ) + 'px';
					}
				}
			}
			
			
			
			var minusers = Math.floor( ( scrollbox.clientHeight - m ) / divh );
			
			if( UsersSettings( 'maxlimit' ) < ( minusers * 1.5 ) )
			{
				
				// Set double max limit so that it fills beyond the minimum
				UsersSettings( 'maxlimit', ( minusers * 2 ) );
				
				// TODO: Move some of this into a queue so it doesn't set the limit faster then the server can get new data ...
				
				if( !firstrun )
				{
					//RequestQueue.Set( function() {
						
						if( ShowLog ) console.log( '[1] GETTING SERVER DATA ... ' + UsersSettings( 'limit' ) + ' (' + UsersSettings( 'intervals' ) + ')' ); 
						
						Sections.accounts_users(); 
						
						//Init();
						
					//} );
				}
				
				return
			}
		}
		
		
		
		/*// If firstrun run the loop ...
		
		if( firstrun )
		{
			Init();
			
			return;
		}*/
	}
}

function Init()
{
	
	if( !UsersSettings( 'total' ) || ( UsersSettings( 'listed' ) != UsersSettings( 'total' ) ) )
	{
		
		// Only run the request when server is ready, one job at a time ... 
		
		RequestQueue.Set( function( callback, key )
		{
		
			UsersSettings( 'limit', true );
			
			if( 1==1 || ShowLog ) console.log( '[3] GETTING SERVER DATA ... ' + UsersSettings( 'limit' ) + ' (' + UsersSettings( 'intervals' ) + ')' ); 
			
			getUserlist( function( res, data, key )
			{
				
				if( callback )
				{
					callback( key );
				}
				
				// If there is data populate if not, do nothing ...
				
				if( res == 'ok' && data )
				{
					// Don't loop it ...
					
					return;
					
					Sections.accounts_users( 'init', data );
					
					// Just loop it ...
					
					//console.log( 'looping ... ' );
					
					Init();
				}
			
			}, key );
			
		}, false, true );
		
	}
	
}

// Save a user
function saveUser( uid, cb, newuser )
{	
	var args = { authid: Application.authId };
	
	var mapping = {
		usFullname : 'fullname',
		usEmail    : 'email',
		usUsername : 'username',
		usPassword : 'password',
		usSetup    : 'setup'
	};
	
	// TODO: Make sure that if you don't have GLOBAL or Level Admin, you cannot set a User or yourself to Level Admin ..
	
	if( Application.checkAppPermission( [ 
		'PERM_USER_READ_GLOBAL', 
		'PERM_USER_GLOBAL' 
	] ) )
	{
		mapping[ 'usLevel' ] = 'level';
	}
	
	for( var a in mapping )
	{
		var k = mapping[ a ];
		
		// Skip nonchanged passwords
		if( a == 'usPassword' )
		{
			if( ( !ge( a ).value || ge( a ).value == '********' ) )
			{
				continue;
			}
			else
			{
				if( ge( a ).value != ge( 'usPasswordConfirm' ).value )
				{
					ge( 'PassError' ).innerHTML = i18n( '<span>New password confirmation does not match new password.</span>' );
					ge( a ).focus();
					return false;
				}
				else
				{
					ge( 'PassError' ).innerHTML = '';
				}
			}
		}
		
		args[ k ] = Trim( ge( a ).value );
		
		// Special case, hashed password
		if( a == 'usPassword' )
		{
			args[ k ] = '{S6}' + Sha256.hash( 'HASHED' + Sha256.hash( args[ k ] ) );
		}
		
		
	}
	
	// If there's no uid, it means that this is a new user - add it.
	if( !uid )
	{
		if( ShowLog ) console.log( args );
		
		addUser( function( res, dat )
		{
			if( ShowLog ) console.log( 'addUser( function( res, dat ) ', { res: res, dat: dat } );
			
			if( res )
			{
				// The user was added, now save the rest of the information
				if( dat && dat > 0 )
				{
					saveUser( dat, cb, true );
				}
			}
			else
			{
				// Seems we failed to create user
				if( dat && dat.code == 19 && dat.response )
				{
					Notify( { title: i18n( 'i18n_user_create_fail' ), text: i18n( 'i18n_' + dat.response ) } );
					
					if( ge( 'usUsername' ) )
					{
						ge( 'usUsername' ).focus();
					}
				}
			}
			
		}, args[ 'username' ] );
		
		// No going beyond this point
		return;
	}
	else
	{
		args.id = uid;
	}
	
	// Specific for Pawel's code ... He just wants to forward json ...
	
	args.args = JSON.stringify( {
		'type'    : 'write', 
		'context' : 'application', 
		'authid'  : Application.authId, 
		'data'    : { 
			'permission' : [ 
				'PERM_USER_CREATE_GLOBAL', 
				'PERM_USER_CREATE_IN_WORKGROUP',
				'PERM_USER_UPDATE_GLOBAL', 
				'PERM_USER_UPDATE_IN_WORKGROUP', 
				'PERM_USER_GLOBAL', 
				'PERM_USER_WORKGROUP' 
			]
		}, 
		'object'   : 'user', 
		'objectid' : uid 
	} );
	
	/*args.args = JSON.stringify( {
		'type'    : 'write', 
		'context' : 'application', 
		'authid'  : Application.authId, 
		'data'    : { 
			'permission' : [ 
				'PERM_USER_GLOBAL', 
				'PERM_USER_WORKGROUP' 
			]
		}
	} );*/
	
	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		
		try
		{
			d = JSON.parse( d );
		}
		catch( e ) {  }
		
		//console.log( { e:e, d:d, args: args } );
		
		if( !uid ) return;
		
		if( e == 'ok' )
		{
			
			// Save language setting
			
			function updateLanguages( ignore, callback )
			{
				if( !ignore )
				{
					/*Confirm( i18n( 'i18n_update_language_warning' ), i18n( 'i18n_update_language_desc' ), function( resp )
					{
						if( resp.data )
						{*/
							// Find right language for speech
							var langs = speechSynthesis.getVoices();
						
							var voice = false;
							for( var v = 0; v < langs.length; v++ )
							{
								//console.log( langs[v].lang.substr( 0, 2 ) );
								if( langs[v].lang.substr( 0, 2 ) == ge( 'usLanguage' ).value )
								{
									voice = {
										spokenLanguage: langs[v].lang,
										spokenAlternate: langs[v].lang // TODO: Pick an alternative voice - call it spokenVoice
									};
								}
							}
						
							var mt = new Module( 'system' );
							mt.onExecuted = function( ee, dd )
							{	
								var mo = new Module( 'system' );
								mo.onExecuted = function()
								{
									if( callback ) return callback( true );
								}
								mo.execute( 'setsetting', { userid: uid, setting: 'locale', data: ge( 'usLanguage' ).value, authid: Application.authId } );
							}
							mt.execute( 'setsetting', { userid: uid, setting: 'language', data: voice, authid: Application.authId } );
						/*}
						else
						{
							if( callback ) return callback( true );
						}
					
					} );*/
				}
				else
				{
					if( callback ) return callback( false );
				}
			}
			
			// Save avatar image
			
			function saveAvatar( callback )
			{
				var canvas = ge( 'AdminAvatar' );
				if( canvas )
				{
					var base64 = 0;
					
					try
					{
						base64 = canvas.toDataURL();
					}
					catch( e ) {  }
					
					if( base64 && base64.length > 3000 )
					{
						var ma = new Module( 'system' );
						ma.forceHTTP = true;
						ma.onExecuted = function( e, d )
						{
							if( e != 'ok' )
							{
								if( ShowLog ) console.log( 'Avatar saving failed.' );
						
								if( callback ) callback( false );
							}
					
							if( callback ) callback( true );
						};
						ma.execute( 'setsetting', { userid: uid, setting: 'avatar', data: base64, authid: Application.authId } );
					}
					else
					{
						if( callback ) callback( false );
					}
				}
			}
			
			function applySetup( init, callback )
			{
				if( init )
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						//console.log( 'applySetup() ', { e:e, d:d, args: { id: ( ge( 'usSetup' ).value ? ge( 'usSetup' ).value : '0' ), userid: uid, authid: Application.authId } } );
					
						if( callback ) return callback( true );
					
					}
					m.execute( 'usersetupapply', { id: ( ge( 'usSetup' ).value ? ge( 'usSetup' ).value : '0' ), userid: uid, authid: Application.authId } );
				}
				else
				{
					if( callback ) return callback( false );
				}
			}
			
			
				
			// 1: First Wallpaper update ...
				
			saveAvatar( function (  )
			{
				
				// 2: Second Template update ...
				
				var init = false; var ignore = false;
				
				if( newuser || ( ge( 'usSetup' ) && ge( 'usSetup' ).value != ge( 'usSetup' ).current ) )
				{
					init = true; ignore = true;
					
					//console.log( 'applySetup( '+init+' ) ' + ( (newuser?'true':'false')+' || '+' ( '+ge( 'usSetup' ).value+' != '+ge( 'usSetup' ).current+' )' ) );
				}
				
				applySetup( init, function (  ) 
				{ 
					
					// 3: Third language update ...
					
					if( ge( 'usLanguage' ) && ge( 'usLanguage' ).value != ge( 'usLanguage' ).current )
					{
						ignore = false;
						
						//console.log( 'updateLanguages( '+ignore+' ) || ( '+ge( 'usLanguage' ).value+' != '+ge( 'usLanguage' ).current+' )' );
					}
					
					updateLanguages( ignore, function(  )
					{
						
						if( newuser )
						{
							Notify( { title: i18n( 'i18n_user_create' ), text: i18n( 'i18n_user_create_succ' ) } );
						}
						else
						{
							Notify( { title: i18n( 'i18n_user_updated' ), text: i18n( 'i18n_user_updated_succ' ) } );
						}
					
						if( cb )
						{
							return cb( uid );
						}
						else
						{
							Sections.accounts_users( 'edit', uid );
						}
						
					} );
					
				} );
				
			} );
			
		}
		else if( d && d.code == 19 && d.response )
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_' + d.response ) } );
			
			if( ge( 'usUsername' ) )
			{
				ge( 'usUsername' ).focus();
			}
		}
		else
		{
			Notify( { title: i18n( 'i18n_user_update_fail' ), text: i18n( 'i18n_user_update_failed' ) } );
		}
	}
	f.execute( 'user/update', args );
}

function removeUser( id, callback )
{
	if( id )
	{
		
		var args = { id: id };
		
		args.args = JSON.stringify( {
			'type'    : 'delete', 
			'context' : 'application', 
			'authid'  : Application.authId, 
			'data'    : { 
				'permission' : [ 
					'PERM_USER_DELETE_GLOBAL', 
					'PERM_USER_DELETE_IN_WORKGROUP', 
					'PERM_USER_GLOBAL', 
					'PERM_USER_WORKGROUP' 
				]
			}, 
			'object'   : 'user', 
			'objectid' : id 
		} );
		
		var f = new Library( 'system.library' );
		
		f.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d, args:args } );
			
			if( e == 'ok' )
			{
			    Notify( { title: i18n( 'i18n_user_delete' ), text: i18n( 'i18n_user_delete_succ' ) } );
			    
			    // Refresh users list ...
			    
			    // TODO: Find a way to remove the user in question from the list ...
			    
			    if( ge( 'UserListID_' + id ) )
			    {
			    	ge( 'UserListID_' + id ).parentNode.removeChild( ge( 'UserListID_' + id ) );
			    }
			    
			    if( ge( 'AdminUsersCount' ) )
				{
					if( ge( 'AdminUsersCount' ).innerHTML )
					{
						var count = ge( 'AdminUsersCount' ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
						
						if( count && count > 0 )
						{
							var result = ( count - 1 );
							
							if( result >= 0 )
							{
								ge( 'AdminUsersCount' ).innerHTML = '(' + result + ')';
							}
						}
					}
					
				}
			    
			    if( callback )
			    {
			    	callback( true );
			    }
			    else
			    { 
			   		cancelUser(  );
			    }
			}
			else
			{
				Notify( { title: i18n( 'i18n_user_delete_fail' ), text: i18n( 'i18n_user_delete_failed' ) } );
			}
			
		}

		f.execute( 'user/delete', args );
		
	}
}

// Add new user
function addUser( callback, username )
{
	var args = {
		authid: Application.authId
	};
	
	if( !username )
	{
		return Alert( i18n( 'i18n_you_forgot_username' ), i18n( 'i18n_you_forgot_username_desc' ) );
	}
	
	args[ 'username' ] = username;
	// Temporary password
	args[ 'password' ] = ( Math.random() % 999 ) + '_' + ( Math.random() % 999 ) + '_' + ( Math.random() % 999 );
	args[ 'level' ] = ge( 'usLevel' ).value;
	
	if( ge( 'usWorkgroups' ) )
	{
		//	
		if( ge( 'usWorkgroups' ).value )
		{
			args.workgroups = ge( 'usWorkgroups' ).value;
		}
		else if( !Application.checkAppPermission( [ 
			'PERM_USER_READ_GLOBAL', 
			'PERM_USER_GLOBAL' 
		] ) )
		{
			Notify( { title: i18n( 'i18n_user_workgroup_missing' ), text: i18n( 'i18n_Adding a User to a Workgroup is required.' ) } );
			
			return;
		}
		
	}
	
	if( ShowLog ) console.log( 'addUser( callback, username ) ', args );
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		
		try
		{
			d = JSON.parse( d );
		}
		catch( e ) {  }
		
		if( ShowLog ) console.log( 'addUser() ', { e:e, d:d, args: args } );
		
		if( e == 'ok' && d )
		{
			
			if( d && d > 0 )
			{
				
				// TODO: Look at this because it makes problems for a template setup ...
				
				firstLogin( d, function( ok )
				{ 
				
					if( ok )
					{
					
						if( callback )
						{
							callback( true, d );
						}
						else
						{
							saveUser( d, false, true );
						}
					
					}
				
				} );
			}
			
			return;
		}
		else
		{
			if( callback ) callback( false, d );
		}
	}
	m.execute( 'useradd', args );
}

function firstLogin( userid, callback )
{
	if( userid > 0 )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( 'firstLogin( '+userid+', callback ) ', { e:e, d:d, args: { userid: userid, authid: Application.authId } } );
			
			if( e == 'ok' )
			{
				if( d && d.indexOf( '<!--separate-->' ) >= 0 )
				{
					var data = d.split( '<!--separate-->' );
					
					if( data[1] )
					{
						try
						{
							data[1] = JSON.parse( data[1] );
							
							//console.log( data );
						}
						catch( e ) {  }
					}
				}
				
				if( callback ) return callback( true );	
			}
			
			if( callback ) return callback( false );
		}
		m.execute( 'firstlogin', { userid: userid, force: true, exclude: [ 'mountlist', 'dock', 'mount' ], authid: Application.authId } );
	}
}

function setAvatar( userid, content, callback )
{
	// TODO: Implement support for imageid hash to be sent to the server for cach check
	
	if( userid )
	{
		var u = new Module( 'system' );
		u.onExecuted = function( e, d )
		{
			var out = null;
			try
			{
				out = JSON.parse( d );
			}
			catch( e ) {  }
			
			if( callback )
			{
				callback( ( out ? true : false ), userid, content, ( out && out.avatar ? out.avatar : false ) );
			}
		}
		u.execute( 'getsetting', { setting: 'avatar', userid: userid, authid: Application.authId } );
	}
}

function getAvatars( avatars )
{
	
	if( avatars )
	{
		for( var k in avatars )
		{
			if( avatars[k].id )
			{
				if( ge( 'UserAvatar_' + avatars[k].id ) )
				{
					var span = ge( 'UserAvatar_' + avatars[k].id );
					
					var src = '/system.library/module/?module=system&command=getavatar&userid=' + avatars[k].id + ( avatars[k].image ? '&image=' + avatars[k].image : '' ) + '&width=30&height=30&authid=' + Application.authId;
					
					if( span )
					{
						
						var img = new Image();
						img.onload = function() 
						{
							
							var bg = 'background-image: url(\'' + src + '\');background-position: center center;background-size: contain;background-repeat: no-repeat;position: absolute;top: 0;left: 0;width: 100%;height: 100%;';
							
							var str = '<span '                                           + 
							'id="UserAvatar_' + avatars[k].id + '" '                     + 
							'fullname="' + avatars[k].fullname + '" '                    + 
							'name="' + avatars[k].name + '" '                            + 
							'status="' + avatars[k].status + '" '                        + 
							'logintime="' + avatars[k].logintime + '" '                  + 
							'timestamp="' + avatars[k].timestamp + '" '                  +
							'class="IconSmall fa-user-circle-o avatar" '                 + 
							'style="position: relative;" '                               +
							'><div style="' + bg + '"></div></span>';
							
							span.parentNode.innerHTML = str;
							
							img = '';
							
							if( avatars && k )
							{
								var next = [];
								
								for( var i in avatars )
								{
									if( i != k && avatars[i] && avatars[i].id )
									{
										next.push( avatars[i] );
									}
								}
				
								// Loop it ...
				
								if( next )
								{
									getAvatars( next );
								}
							}
							
						};
						img.src = src;
					}
					
				}
				
			}
			
			return true;
		}
	}
	
	return false;
}

Sections.userrole_edit = function( userid, _this )
{
	
	var pnt = _this.parentNode;
	
	var edit = pnt.innerHTML;
	
	var buttons = [  
		{ 'name' : 'Cancel', 'icon' : '', 'func' : function()
			{ 
				pnt.innerHTML = edit 
			} 
		}
	];
	
	pnt.innerHTML = '';
	
	for( var i in buttons )
	{
		var b = document.createElement( 'button' );
		b.className = 'IconSmall FloatRight';
		b.innerHTML = buttons[i].name;
		b.onclick = buttons[i].func;
		
		pnt.appendChild( b );
	}
	
}

