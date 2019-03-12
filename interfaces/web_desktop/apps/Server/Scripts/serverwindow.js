/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
Application.settings = false;

Application.run = function( msg, iface )
{
	this.popWindows = {};
	reloadSettings();
	reloadSoftware();
	reloadServices();
	reloadApplicationPermissions();
	reloadGlobals();
}


// Server globals
function reloadGlobals()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var replacements = {
			logoImage: '',
			backgroundImage: '',
			eulaLong: '',
			eulaShort: '',
			rand: 'ra' + ( Math.random() * 999 ) + ( new Date() ).getTime()
		};
		if( e == 'ok' )
		{
			try
			{
				d = JSON.parse( d );
				for( var a in d )
				{
					replacements[ a ] = d[ a ];
				}
			}
			catch( e )
			{
				console.log( 'Failed to load json.' );
			}
		}
		
		var f = new File( 'Progdir:Templates/globals.html' );
		f.replacements = replacements;
		f.i18n();
		f.onLoad = function( data )
		{
			ge( 'ServerGlobals' ).innerHTML = data;
			ge( 'eula_short_check' ).checked = d.useEulaShort === '1' ? 'checked' : '';
			ge( 'eula_long_check' ).checked = d.useEulaLong === '1' ? 'checked' : '';
			ge( 'logo_image_check' ).checked = d.useLogoImage === '1' ? 'checked' : '';
			ge( 'background_image_check' ).checked = d.useBackgroundImage === '1' ? 'checked' : '';
			ge( 'about_template' ).value = d.aboutTemplate ? d.aboutTemplate : '';
			ge( 'extra_about_template_check' ).checked = d.useAboutTemplate === '1' ? 'checked' : '';
			ge( 'extra_login_css' ).value = d.extraLoginCSS ? d.extraLoginCSS : '';
			ge( 'extra_login_css_check' ).checked = d.useExtraLoginCSS === '1' ? 'checked' : '';
		}
		f.load();
	}
	m.execute( 'getserverglobals', { test: 'test' } );
}

function changeGlobalsLogoImage()
{
	var flags = {
		type: 'load',
		title: i18n( 'i18n_select_a_logo_image' ),
		path: 'Mountlist:',
		suffix: [ 'jpg', 'jpeg', 'png', 'gif' ],
		multiple: false,
		triggerFunction: function( items )
		{
			if( items.length )
			{
				ge( 'theLogoImage' ).src = getWebUrl( items[ 0 ].Path );
				ge( 'theLogoImage' ).setAttribute( 'friendUrl', items[ 0 ].Path );
			}
		}
	};
	( new Filedialog( flags ) );
}

function changeGlobalsLoginCSS()
{
	var flags = {
		type: 'load',
		title: i18n( 'i18n_select_a_css_file' ),
		path: 'Mountlist:',
		suffix: [ 'css' ],
		multiple: false,
		triggerFunction: function( items )
		{
			if( items.length )
			{
				ge( 'extra_login_css' ).value = items[ 0 ].Path;
			}
		}
	};
	( new Filedialog( flags ) );
}

function changeAboutTemplate()
{
	var flags = {
		type: 'load',
		title: i18n( 'i18n_change_about_template' ),
		path: 'Mountlist:',
		suffix: [ 'html', 'htm' ],
		multiple: false,
		triggerFunction: function( items )
		{
			if( items.length )
			{
				ge( 'about_template' ).value = items[ 0 ].Path;
			}
		}
	};
	( new Filedialog( flags ) );
}

function changeGlobalsBackgroundImage()
{
	var flags = {
		type: 'load',
		title: i18n( 'i18n_select_a_background_image' ),
		path: 'Mountlist:',
		suffix: [ 'jpg', 'jpeg' ],
		multiple: false,
		triggerFunction: function( items )
		{
			if( items.length )
			{
				ge( 'theBackgroundImage' ).src = getWebUrl( items[ 0 ].Path );
				ge( 'theBackgroundImage' ).setAttribute( 'friendUrl', items[ 0 ].Path );
			}
		}
	};
	( new Filedialog( flags ) );
}

// Save the server globals
function saveGlobals()
{
	var eulaShortText   = ge( 'eula_short_text' ).value;
	var eulaLongText    = ge( 'eula_long_text' ).value;
	var logoImage       = false;
	var backgroundImage = false;
	var extraLoginCSS   = ge( 'extra_login_css' ).value;
	var aboutTemplate   = ge( 'about_template' ).value;
	var useEulaShort    = useEulaLong = useLogoImage = useBackgroundImage = useExtraLoginCSS = useAboutTemplate = false;
	useEulaShort        = ge( 'eula_short_check' ).checked ? '1' : '0';
	useEulaLong         = ge( 'eula_long_check' ).checked ? '1' : '0';
	useLogoImage        = ge( 'logo_image_check' ).checked ? '1' : '0';
	useBackgroundImage  = ge( 'background_image_check' ).checked ? '1' : '0';
	useExtraLoginCSS    = ge( 'extra_login_css_check' ).checked ? '1' : '0';
	useAboutTemplate    = ge( 'extra_about_template_check' ).checked ? '1' : '0';
	
	// Convert image
	var png = ge( 'theLogoImage' ).getAttribute( 'friendUrl' );
	var jpg = ge( 'theBackgroundImage' ).getAttribute( 'friendUrl' );
	
	function doSave()
	{
		var mdata = { 
			eulaShortText:      eulaShortText, 
			eulaLongText:       eulaLongText, 
			logoImage:          png,
			backgroundImage:    jpg,
			extraLoginCSS:      extraLoginCSS,
			aboutTemplate:      aboutTemplate,
			useEulaShort:       useEulaShort,
			useEulaLong:        useEulaLong,
			useLogoImage:       useLogoImage,
			useBackgroundImage: useBackgroundImage,
			useExtraLoginCSS:   useExtraLoginCSS,
			useAboutTemplate:   useAboutTemplate
		};
		
		var m = new Module( 'system' );
		m.forceHTTP = true;
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Notify( { title: i18n( 'i18n_server_globals_saved' ), text: i18n( 'i18n_please_refresh_to_see_results' ) } );
			}
			var sl = new Library( 'system.library' );
			sl.onExecuted = function( e, d )
			{
				console.log( 'Library call: ', e, d );
			}
			sl.execute( 'clearcache' );
		}
		m.execute( 'setserverglobals', mdata );
	}
	
	doSave();
}

function reloadServices()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) 
		{
			ge( 'Services' ).innerHTML = '<h2>' + i18n( 'i18n_service_report' ) + '</h2><p>' + i18n( 'i18n_no_services_to_manage' ) + '</p>';
			return;
		}
		try
		{
			var list = JSON.parse( d );
			var str = '<h2>' + i18n( 'i18n_service_report' ) + '</h2>';
			str += `
				<div class="Padding HRow BorderBottom">
					<div class="FloatLeft HContent30">
						<strong>Name:</strong>
					</div>
					<div class="FloatLeft HContent45">
						<strong>Configurable:</strong>
					</div>
					<div class="FloatLeft HContent25">
						<strong>Info:</strong>
					</div>
				</div>
			`;
			str += '<div class="List">';
			var sw = 2;
			for( var a = 0; a < list.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				var functionality = false;
				if( list[a].Functionality )
				{
					functionality = '';
					if( list[a].Functionality.status )
					{
						if( list[a].Functionality.status == 'running' )
						{
							functionality += '<button type="button">' + i18n( 'i18n_stop' ) + '</button>';
						}
						else
						{
							functionality += '<button type="button">' + i18n( 'i18n_start' ) + '</button>';
						}
					}
					if( list[a].Functionality.update )
					{
						functionality += '<button type="button">' + i18n( 'i18n_update' ) + '</button>';
					}
				}
				var info = list[a].Info ? list[a].Info.version : '-';
				var configurable = functionality ? functionality : i18n( 'i18n_no' );
				str += `<div class="Padding sw${sw} HRow">
					<div class="FloatLeft HContent30">
						${list[a].Name}
					</div>
					<div class="FloatLeft HContent45">
						${configurable}
					</div>
					<div class="FloatLeft HContent25">
						${info}
					</div>
				</div>
				`;
			}
			str += '</div>';
			ge( 'Services' ).innerHTML = str;
		}
		catch( e )
		{
			ge( 'Services' ).innerHTML = '<h2>' + i18n( 'i18n_service_report' ) + '</h2><p>' + i18n( 'i18n_no_services_to_manage' ) + '</p>';
		}
	}
	m.execute( 'getservices' );
}

function reloadSettings()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if(d == 'nosettingsfound')
			{
				ge( 'SystemSettings' ).innerHTML = '<p><strong>No system configuration settings found.</strong></p>';
			}
			else
			{
				Application.settings = JSON.parse( d ); 
				redrawSettings();				
			}

		}
		else
		{
			ge( 'SystemSettings' ).innerHTML = '<p><strong>Error while loading settings.</strong></p>';
		}
	}
	ge( 'SystemSettings' ).innerHTML = '...loading...';
	m.execute( 'listsystemsettings' );
}

function redrawSettings()
{
	var str = '';
	var settings = Application.settings;
	
	var sw = 1;
	for( var a = 0; a < settings.length; a++ )
	{
		//stringify does not remove line break... but parse react on them :(
		
		var setting = ''; var pout = '';
		if( settings[a].Data )
		{
			setting = JSON.parse( ('' + settings[a].Data).replace(/\r/g,'\\r').replace(/\n/g,'\\n') );
			/*for( var c = 0; c < setting.length; c++ )
			{
				pout += setting[c][0] + ( ( setting[c][1] && setting[c][1].length ) ? ( '(' + setting[c][1] + ')' ) : '' ) + ( ( c < setting.length - 1 ) ? ', ' : '' );
			}*/
		}
		var btn1 = '<button type="button" class="FullWidth Button IconSmall fa-pencil" onclick="ServerSettingEdit( \'' + settings[a].ID + '\' )">&nbsp;' + i18n( 'i18n_edit' ) + '</button>';
		var btn2 = '<button type="button" class="FullWidth Button IconSmall fa-remove" onclick="ServerSettingDelete( \'' + settings[a].ID + '\' )">&nbsp;' + i18n( 'i18n_delete' ) + '</button>';
		sw = sw == 2 ? 1 : 2;
		str += '<div class="GuiContainer"><div class="HRow BackgroundDefault sw' + sw + '">';
		str += '<div class="HContent65 FloatLeft Padding LineHeight2x"><strong>' + settings[a].Type + '/' + settings[a].Key + '</strong></div>';
		//str += '<div class="HContent45 FloatLeft Padding LineHeight2x" title="' + pout + '"><em>' + pout + '</em></div>';
		str += '<div class="HContent15 FloatLeft Padding">' + btn1 + '</div>';
		str += '<div class="HContent15 FloatLeft Padding">' + btn2 + '</div>';
		str += '</div></div>';
	}
	ge( 'SystemSettings' ).innerHTML = str;
}

// Validate a package
function validate( pckg )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		reloadSoftware( 'validation', { pckg: pckg, validation: e } );
	}
	m.execute( 'evaluatepackage', { pckg: pckg } );
}

function downloadPackage( fn )
{
	var v = window.open( '/system.library/module/?module=system&command=repositorysoftware&packageget=' + fn + '&authid=' + Application.authId, '', '' );
}

// Reload software with permissions
function reloadApplicationPermissions()
{
	var w = new Module( 'system' );
	w.onExecuted = function( we, wd )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var workgroups = [];
			try
			{
				workgroups = JSON.parse( wd );
			}
			catch( e )
			{
				workgroups = [];
			}
			
			if( e != 'ok' )
			{
				ge( 'SoftwarePermissions' ).innerHTML = '<p>No applications available.</p>';
				return;
			}
			try
			{
				var j = JSON.parse( d );
				var dv = document.createElement( 'div' );
				dv.className = 'List';
				var sw = 2;
				for( var a = 0; a < j.length; a++ )
				{
					var sels = '<div class="HContent40 FloatLeft"><select id="app_' + j[a].Name + '">';
					sels += '<option value="">' + i18n( 'i18n_no_workgroup' ) + '</option>';
					for( var x = 0; x < workgroups.length; x++ )
					{
						sels += '<option value="' + workgroups[x].ID + '">' + workgroups[x].Name + '</option>';
					}
					sels += '</select></div>';
			
					sw = sw == 2 ? 1 : 2;
					var o = document.createElement( 'div' );
					o.className = 'PaddingSmall sw' + sw;
					o.innerHTML = '<div class="HRow"><div class="HContent30 FloatLeft">' + j[a].Name + '</div>' + sels + '</div>';
					dv.appendChild( o );
				}
				ge( 'SoftwarePermissions' ).appendChild( dv );
			}
			catch( e )
			{
				ge( 'SoftwarePermissions' ).innerHTML = '<p>Error loading applications list.</p>';
			}
		}
		m.execute( 'software', { mode: 'global_permissions' } );
	}
	w.execute( 'workgroups' );
}

// Reload all software
function reloadSoftware( method, data )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'Software' ).innerHTML = '<p>' + i18n( 'i18n_no_software_to_verify' ) + '</p>';
			return;
		}
		else
		{
			var js = JSON.parse( d );
			var str = '<div class="ZebraList">';
			var sw = 'sw2';
			for( var a = 0; a < js.length; a++ )
			{
				var validated = false;
				var cl = '';
				if( method && method == 'validation' && data && data.pckg == js[a].Filename )
				{
					cl = data.validation == 'ok' ? ' style="color: green"' : ' style="color: red"';
					validated = data.validation == 'ok' ? true : false;
				}
				else if( js[a].Signature && js[a].Signature == js[a].Validated )
				{
					cl = ' style="color: green"';
					validated = true;
				}
				sw = sw == 'sw2' ? 'sw1' : 'sw2';
				
				var vf = i18n( 'i18n_' + ( validated ? 'revalidate' : 'validate' ) );
				
				str += '<div class="HRow ' + sw + '"><div class="HContent20 InputHeight FloatLeft">' + js[a].Filename + '</div><div class="HContent50 InputHeight FloatLeft Ellipsis SelectableText"' + cl + '" title="' + js[a].Signature + '">' + js[a].Signature + '</div><div class="HContent20 FloatLeft"><button onclick="validate(\'' + js[a].Filename + '\')" type="button" class="Button IconSmall fa-refresh"> ' + vf + '</button></div><div class="HContent10 FloatLeft"><button onclick="downloadPackage(\'' + js[a].Filename + '\')" type="button" class="FullWidth Button IconSmall fa-download"></button></div></div>';
			}
			ge( 'Software' ).innerHTML = str;
		}
	}
	m.execute( 'repositorysoftware', { filter: 'unverified' } );
}

Application.receiveMessage = function( msg )
{
	// Remove app window
	if( msg.command == 'cancelsettingswindow' )
	{
		this.closeSettingsWindow( msg.settingsid, false );
	}
	else if( msg.command == 'updatesettings' )
	{
		reloadSettings();
	}
	else if( msg.command == 'saveserversetting' )
	{
		m = new Module(	'system' );
		// What happens when we've executed?
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				Application.closeSettingsWindow( d );
				reloadSettings();
			}
		}
		m.execute( 'saveserversetting', { settingsid:msg.settingsid, settings:msg.settings } );	
	}
}

Application.closeSettingsWindow = function( sid, clean )
{
	if( this.popWindows && this.popWindows[ sid ] )
	{
		if( !clean )
		{
			this.popWindows[ sid ].close();
		}
		else
		{
			var out = {};
			for( var a in this.popWindows )
			{
				if( a == sid ) continue;
				out[ a ] = this.popWindows[ a ];
			}
			this.popWindows = out;
		}
	}
}

function ServerSettingDelete( sid )
{
	Confirm( i18n( 'i18n_delete_title' ), i18n( 'i18n_delete_desc' ), function( data )
	{
		var m = new Module( 'system' );
		m.onExecuted = function()
		{
			Application.sendMessage( { command: 'updatesettings' } );
		}
		m.execute( 'deleteserversetting', { sid: sid } );
	} );
}

function ServerSettingEdit( sid )
{
	if( typeof( Application.popWindows[ sid ] ) != 'undefined' )
	{
		Application.popWindows[ sid ].focus();
		return;
	}

	var v = new View( {
		title: i18n( 'i18n_settings' ),
		width: 400,
		height: 200,
		'min-width': 400
	} );
	
	Application.popWindows[ sid ] = v;
	
	v.onClose = function()
	{
		Application.closeSettingsWindow( sid, true );
	}
	
	var perms = '', setts = '', settsname = '';
	for( var a = 0; a < Application.settings.length; a++ )
	{
		if( Application.settings[a].ID == sid )
		{
			setts = Application.settings[a].Data;
			settsname = Application.settings[a].Type + '/' + Application.settings[a].Key;
			break;
		}
	}
	
	var f = new File( 'Progdir:Templates/setsettings.html' );
	f.replacements = { settingsname: settsname, settingsid : sid };
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
		v.sendMessage( { command: 'settings', settings: setts } );
	}
	f.load();	
}

function closeWin()
{
	Application.sendMessage( { command: 'quit' } );
}

function addItem()
{
	var v = new View( {
		title: i18n( 'i18n_add_new_value_set' ),
		width: 320,
		height: 115
	} );
	var f = new File( 'Progdir:Templates/server_item.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

