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

Application.run = function( msg, iface )
{
	Application.mode = false;
	
	RefreshSources();
}

function CloseWindow()
{
	Application.sendMessage( { command: 'closesources' } );
}

function DeleteSource( index )
{
	var o = [];
	for( var a = 0; a < Application.sources.length; a++ )
	{
		if( a != index )
		{
			o.push( Application.sources[a] );
		}
	}
	Application.sources = o;
	SyncSources();
}

function SaveSource()
{
	var src = {
		Name: ge( 'InpName' ).value,
		Description: ge( 'InpDescription' ).value,
		Server: ge( 'InpServer' ).value,
		Type: ge( 'InpType' ).value,
		Username: ge( 'InpUsername' ).value,
		Password: ge( 'InpPassword' ).value,
		ApiSession: ge( 'ApiSession' ).value
	}
	// First one!
	if( !Application.sources || ( Application.sources && !Application.sources.length ) )
	{
		Application.sources = [ src ];
	}
	// Ah a new one!
	else if( Application.mode == 'new' )
	{
		Application.sources.push( src );
	}
	// Update existing
	else
	{
		for( var a in Application.sources )
		{
			if( Application.sources[a].Name == src.Name )
			{
				for( var b in src )
				{
					Application.sources[a][b] = src[b];
				}
			}
		}
	}
	SyncSources();
}

function SyncSources()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			RefreshSources();
			Application.mode = 'edit';
		}
	}
	m.execute( 'setsetting', {
		setting: 'calendarsources',
		data: Application.sources
	} );
}

function CloseSource()
{
	ge( 'GUI' ).innerHTML = '';
	Application.mode = false;
}

function Source(id)
{
	var callback = function(data)
	{
		var s = new File( 'Progdir:Templates/sources_gui.html' );
		s.replacements = {
			'save'               : i18n( 'i18n_save' ),
			'close'              : i18n( 'i18n_close' ),
			'desc'               : i18n( 'i18n_desc' ),
			'cancel'             : i18n( 'i18n_cancel' ),
			'name'               : data.Name ? data.Name : '',
			'description'        : data.Name ? data.Description : '',
			'server'             : data.Name ? data.Server : '',
			'type'               : data.Name ? data.Type : '',
			'username'           : data.Name ? data.Username : '',
			'password'           : data.Name ? '********' : '',
			'session'            : data.ApiSession ? data.ApiSession : ''
		};
		s.onLoad = function( data )
		{
			ge( 'GUI' ).innerHTML = data;
		}
		s.load();
	}
	// Load with or without data
	if( id )
	{
		// Get an existing one!
		var sources = Application.sources;
		for( var a = 0; a < sources.length; a++ )
		{
			if( sources[a].Name == id )
			{
				callback( sources[a] );
			}
		}
		Application.mode = 'edit';
	}
	else
	{
		Application.mode = 'new';
		callback({});
	}
}

// Refreshes all sources!
function RefreshSources()
{
	// Get an existing one!
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var sources = false;
			
			try
			{
				sources = JSON.parse( d );
			}
			catch( e )
			{
				sources = false;
			}
			
			if( sources )
			{
				var str = '';
				sw = 2;
			
				// Refreshed
				Application.sources = sources.calendarsources;
			
				// Loop
				for( var a = 0; a < Application.sources.length; a++ )
				{
					var s = Application.sources[a];
					sw = sw == 1 ? 2 : 1;
					str += '<div onclick="Source(\'' + s.Name + '\')" class="Padding sw' + sw + '" style="cursor: hand; cursor: pointer"><div class="IconSmall FloatRight fa-close" onclick="DeleteSource(' + a.toString() + '); return cancelBubble( event )">&nbsp;</div><strong>' + s.Name + '</strong></div>';
				}
				Ge( 'Sources' ).innerHTML = str;
			}
			else
			{
				Ge( 'Sources' ).innerHTML = '';
			}
		}
	}
	m.execute( 'getsetting', {
		setting: 'calendarsources'
	} );
}

