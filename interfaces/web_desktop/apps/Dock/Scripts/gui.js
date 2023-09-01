/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

document.title = 'Dock gui.';

var currentDock = 0;

Application.run = function( msg, iface )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		var data = JSON.parse( d );
		var opts = '<option value="">' + i18n( 'i18n_select_application' ) + '</option>';
		for( var a = 0; a < data.length; a++ )
		{
			opts += '<option value="' + data[a].Name + '">' + data[a].Name + '</option>';
		}
		ge( 'ApplicationSelection' ).innerHTML = opts;
	}
	m.execute( 'listuserapplications' );
}

function FindIcon()
{
	new Filedialog( {
		multiSelect: false,
		triggerFunction: function( arr )
		{
			if( arr )
			{
				ge( 'Icon' ).value = arr[0].Path;
			}
		},
		path: false,
		rememberPath: true,
		type: 'load',
		suffix: [ 'jpg', 'jpeg', 'png', 'gif' ]	
	} );
}

function setItemType( type )
{
	if( type == 'bookmark' )
 	{
 		ge( 'ApplicationLabel' ).innerHTML = i18n( 'i18n_bookmark_src' );
 		ge( 'ApplicationSelection' ).style.display = 'none';
 		if( ge( 'Application' ).value == 'undefined' )
 			ge( 'Application' ).value = 'https://yourapp.com/';
 		ge( 'Application' ).style.display = 'block';
 		
 	}
 	else
 	{
 		ge( 'ApplicationLabel' ).innerHTML = i18n( 'i18n_application' );
 		ge( 'Application' ).style.display = '';
		ge( 'ApplicationSelection' ).style.display = '';
 	}
}

function SaveDockItem()
{
	let ms = { 
		command: 'saveitem', 
		application: ge('Application').value, 
		displayname: ge('DisplayName' ).value, 
		shortdescription: ge('ShortDescription').value, 
		icon: ge( 'Icon' ).value, 
		workspace: ge( 'Workspace' ).value, 
		opensilent: ge( 'OpenSilent' ).value, 
		docktype: ge( 'TypeSelection' ).value 
	};
	Application.sendMessage( ms );
}

Application.receiveMessage = function( msg )
{
	//console.log( 'We are receiving:', msg );
	if( !msg.command )
		return;

	//console.log( 'We passed on command..' );

	switch( msg.command )
	{
		case 'updateitem':
			
			ge( 'Application' ).value = msg.item.Application;
			ge( 'DisplayName' ).value = typeof( msg.item.DisplayName ) != 'undefined' ? msg.item.DisplayName : '';
			ge( 'ShortDescription' ).value = msg.item.ShortDescription;
			ge( 'Icon' ).value = typeof( msg.item.Icon ) != 'undefined' ? msg.item.Icon : '';
			ge( 'Workspace' ).value = typeof( msg.item.Workspace ) != 'undefined' ? msg.item.Workspace : '';
			ge( 'Settings' ).classList.remove( 'Disabled' );
			ge( 'OpenSilent' ).value = typeof( msg.item.OpenSilent ) != 'undefined' ? msg.item.OpenSilent : 0;
			ge( 'OpenSilentCheck' ).checked = ge( 'OpenSilent' ).value == 1 ? 'checked' : '';
			let optsi = ge( 'TypeSelection' ).getElementsByTagName( 'option' );
			for( let a = 0; a < optsi.length; a++ )
			{
				if( optsi[ a ].value == msg.item.Type )
					optsi[ a ].selected = 'selected';
				else optsi[ a ].selected = '';
			}
		 	if( msg.item.Type == 'bookmark' )
		 	{
		 		ge( 'ApplicationLabel' ).innerHTML = i18n( 'i18n_bookmark_src' );
		 		ge( 'Application' ).style.display = '';
		 		ge( 'ApplicationSelection' ).style.display = 'none';
		 	}
		 	else
		 	{
		 		ge( 'ApplicationLabel' ).innerHTML = i18n( 'i18n_application' );
		 		ge( 'Application' ).style.display = '';
		 		ge( 'ApplicationSelection' ).style.display = '';
		 	}
		 	
		 	document.body.classList.add( 'DockEdit' );
		 	
		 	let opts = ge( 'ApplicationSelection' ).getElementsByTagName( 'option' );
		 	for( let a = 0; a < opts.length; a++ )
		 	{
		 		if( a == 0 ) opts[a].selected = 'selected';
		 		else opts[a].selected = '';
		 	}
		 	if( ge( 'Application' ).value.length <= 0 )
		 	{ 
		 		document.body.classList.remove( 'SelectedApp' ); 
		 		ge( 'Application' ).value = this.value; 
		 	} 
		 	else 
		 	{
		 		document.body.classList.add( 'SelectedApp' );
		 	}
		 	
		 	if( msg.scroll == 'scrolldown' )
		 	{
		 		ge( 'Applications' ).scroll( 0, ge( 'Applications' ).offsetHeight );
		 	}
			break;
		case 'refreshapps':
			ge( 'Applications' ).innerHTML = msg.data;
			if( msg.current )
			{
				var cr = ge( 'dockEdit' + msg.current );
				if( cr.offsetTop + cr.offsetHeight - ge( 'Applications' ).offsetHeight > ge( 'Applications' ).scrollTop )
					ge( 'Applications' ).scrollTop = cr.offsetTop + cr.offsetHeight - ge( 'Applications' ).offsetHeight; 
			}
			break;
		case 'close':
			document.body.classList.remove( 'DockEdit' );
			deactivateSelectedDockItems();
			break;
		case 'setdocks':
			if( msg.docks == false )
			{
				ge( 'Docks' ).innerHTML = '<option value="0">' + i18n( 'i18n_standard_dock' ) + '</option>'; 
				var html = '<option value="left_top">' + i18n('i18n_left_top') + '</option>';
				html += '<option value="left_center">' + i18n('i18n_left_center') + '</option>';
				html += '<option value="left_bottom">' + i18n('i18n_left_bottom') + '</option>';
				html += '<option value="right_top">' + i18n('i18n_right_top') + '</option>';
				html += '<option value="right_center" selected="selected">' + i18n('i18n_right_center') + '</option>';
				html += '<option value="right_bottom">' + i18n('i18n_right_bottom') + '</option>';
				html += '<option value="top_left">' + i18n('i18n_top_left') + '</option>';
				html += '<option value="top_center">' + i18n('i18n_top_center') + '</option>';
				html += '<option value="top_right">' + i18n('i18n_top_right') + '</option>';
				html += '<option value="bottom_left">' + i18n('i18n_bottom_left') + '</option>';
				html += '<option value="bottom_center">' + i18n('i18n_bottom_center') + '</option>';
				html += '<option value="bottom_right">' + i18n('i18n_bottom_right') + '</option>';
				ge( 'DockLayout' ).innerHTML = html;
				/*html = '<option value="aligned" selected="selected">' + i18n('i18n_aligned') + '</option>';
				html += '<option value="fixed">' + i18n('i18n_fixed') + '</option>';
				ge( 'DockPlacement' ).innerHTML = html;*/
				// Just set this to an irrelevant one
				ge( 'DockY' ).value = 0;
				ge( 'DockX' ).value = 0;
				html = '<option value="80">' + i18n('i18n_extra_large') + '</option>';
				html += '<option value="59" selected="selected">' + i18n('i18n_large') + '</option>';
				html += '<option value="32">' + i18n('i18n_medium') + '</option>';
				html += '<option value="16">' + i18n('i18n_small') + '</option>';
				ge( 'DockSize' ).innerHTML = html;
			}
			LoadDock();
			break;
	}
}

function getSelectValue( sel )
{
	var opts = sel.getElementsByTagName( 'option' );
	for( var a = 0; a < opts.length; a++ )
	{
		if( opts[a].selected )
			return opts[a].value;
	}
	return false;
}

function setSelectValue( sel, val )
{
	var opts = sel.getElementsByTagName( 'option' );
	for( var a = 0; a < opts.length; a++ )
	{
		if( opts[a].value == val )
		{
			opts[a].selected = 'selected';
			return true;
		}
	}
	return false;
}

function deactivateSelectedDockItems()
{
	var eles = ge( 'Applications' ).getElementsByClassName( 'Box' );
	var sw = 2;
	for( var a = 0; a < eles.length; a++ )
	{
		sw = sw == 1 ? 2 : 1;
		eles[a].className = 'Box sw' + sw;
		if( a > 0 )
			eles[a].classList.add( 'MarginTop' );
	}
}

function LoadDock( callback )
{
	var m = new Module( 'dock' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var dd = false;
			try
			{
				dd = JSON.parse( d );
			}
			catch( e )
			{ 
				console.log('no dock settings saved'); 
			}
			
			if( dd )
			{
				//setSelectValue( ge( 'DockPlacement' ), dd.options.position );
				setSelectValue( ge( 'DockLayout' )   , dd.options.layout   );
				setSelectValue( ge( 'DockSize' )     , dd.options.size     );
				ge( 'DockY' ).value = dd.options.dockx;
				ge( 'DockX' ).value = dd.options.docky;
				ge( 'OpenSilent' ).value = dd.options.opensilent;
				ge( 'OpenSilentCheck' ).checked = dd.options.opensilent === '1' ? 'checked' : '';
				ge( 'Workspace' ).value = dd.options.workspace >= 1 ? dd.options.workspace : 1;
			}
		}
	}
	m.execute( 'getdock', { dockid: currentDock } );
}

function SaveCurrentDock()
{	
	let options = {};
	//options.position  = getSelectValue( ge( 'DockPlacement' ) );
	options.position   = 'aligned';
	options.layout     = getSelectValue( ge( 'DockLayout' ) );
	options.size       = parseInt( getSelectValue( ge( 'DockSize' ) ) );
	options.dockx      = ge( 'DockY' ).value;
	options.docky      = ge( 'DockX' ).value;
	options.workspace  = ge( 'Workspace' ).value;
	options.opensilent = ge( 'OpenSilentCheck' ).checked ? '1' : '0';
	Application.sendMessage( { 
		command: 'savecurrentdock', 
		dockid: currentDock, 
		options: options
	} );
}


