/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	doRefresh();
	this.activeApplication = false;
}

/* Helper functions --------------------------------------------------------- */

/**
 * @brief Gets all applications registered / activated for the user
 * @param callback callback function run with result
 */
function getApplications( callback )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			return callback( JSON.parse( d ) );
		}
		callback( false );
	}
	m.execute( 'listuserapplications' );
}

// Do a full refresh
function doRefresh()
{
	// Add applications
	getApplications( function( apps )
	{
		Application.apps = apps;
		
		ge( 'apps' ).innerHTML = '';
		var f = document.createElement( 'form' );
		f.className = 'List';
		ge( 'apps' ).appendChild( f );
		var swi = 2;
		var exists = [];
		for( var a = 0; a < apps.length; a++ )
		{
			var found = false;
			for( var b = 0; b < exists.length; b++ )
			{
				if( exists[b] == apps[a].Name )
				{
					found = true;
					break;
				}
			}
			if( found ) continue;
			exists.push( apps[a].Name );
			
			swi = swi == 1 ? 2 : 1;
			var n = document.createElement( 'div' );
			n.className = 'Padding sw' + swi;
			var i = document.createElement( 'input' );
			i.type = 'radio';
			i.name = 'application';
			i.id = 'input_' + apps[a].Name.split( /[\s]/ ).join( '_' );
			i.application = apps[a];
			i.onclick = function()
			{
				SelectApplication( this.application );
			}
			var s = document.createElement( 'label' );
			s.setAttribute( 'for', i.id );
			s.className = 'MousePointer';
			s.innerHTML = apps[a].Name;
			
			// Add to apps list
			n.appendChild( i );
			n.appendChild( s );
			f.appendChild( n );
		}
		delete exists;
		
		// Add mimetypes
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				// Add form to mimetypes
				ge( 'mimetypes' ).innerHTML = '';
				var mimes = JSON.parse( d );
				var fo = document.createElement( 'form' );
				fo.className = 'List';
				ge( 'mimetypes' ).appendChild( fo );
				
				var outMimes = [];
				for( var a = 0; a < mimes.length; a++ )
				{
					// Link to applications
					for( var z = 0; z < Application.apps.length; z++ )
					{
						if( Application.apps[z].Name == mimes[a].executable )
						{
							Application.apps[z].mimes = mimes[a].types;
							break;
						}
					}
					// Add to out! We need unique mimes!
					for( var z = 0; z < mimes[a].types.length; z++ )
					{
						var found = false;
						for( var u = 0; u < outMimes.length; u++ )
						{
							if( outMimes[u] == mimes[a].types[z] )
								found = true;
						}
						if( !found )
							outMimes.push( mimes[a].types[z] );
					}
				}
				
				var sw = 2;
				for( var a = 0; a < outMimes.length; a++ )
				{
					sw = sw == 1 ? 2 : 1;
					var mime = outMimes[a];
				
					var d = document.createElement( 'div' );
					d.className = 'Padding Mimetype sw' + sw;
					
					var i = document.createElement( 'input' );
					i.type = 'checkbox';
					i.name = 'mimetype';
					i.id = 'input_' + mime.split( /[\s]/ ).join( '_' );
					i.mime = mime;
					
					var s = document.createElement( 'label' );
					s.setAttribute( 'for', i.id );
					s.className = 'MousePointer';
					s.innerHTML = mime;
			
					// Add to apps list
					d.appendChild( i );
					d.appendChild( s );
					fo.appendChild( d );
				}
			}
			else
			{
				ge( 'mimetypes' ).innerHTML = '<h2>No mimetypes defined.</h2><p>Please add your first mimetypes to the database.</p>';			
			}
			
			// Activate application mimetypes in selection list
			SelectApplication( apps[0] );
		}
		m.execute( 'getmimetypes' );
	} );
}

function AddMimetype()
{
	if( ge( 'NewMimetype' ) )
	{
		return ge( 'NewMimetype' ).getElementsByTagName( 'input' )[0].focus();
	}
	var inpd = document.createElement( 'div' );
	inpd.className = 'Padding';
	inpd.id = 'NewMimetype';
	var inp = document.createElement( 'input' );
	inp.type = 'text';
	inp.className = 'InputHeight FullWidth';
	inpd.appendChild( inp );
	inp.onkeydown = function( e )
	{
		var wh = e.which ? e.which : e.keyCode;
		if( wh == 13 )
		{
			SaveMimetype();
		}
		else if( wh == 27 )
		{
			inpd.parentNode.removeChild( inpd );
		}
	}
	ge( 'mimetypes' ).appendChild( inpd );
	inp.focus();
}

function SaveMimetype()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		ge( 'NewMimetype' ).parentNode.removeChild( ge( 'NewMimetype' ) );
		doRefresh();
		Notify( { title: i18n( 'i18n_mimetype_updated' ), text: i18n( 'i18n_correctly_set_mimetype' ) + ', ' + ge( 'NewMimetype' ).getElementsByTagName( 'input' )[0].value } );
	}
	m.execute( 'setmimetypes', { types: ge( 'NewMimetype' ).getElementsByTagName( 'input' )[0].value } );
}

function SelectApplication( app )
{
	var eles = ge( 'apps' ).getElementsByTagName( 'input' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].application == app )
		{
			Application.activeApplication = app;
			eles[a].parentNode.classList.add( 'BackgroundNegative' );
			if( eles[a].parentNode.classList.contains( 'sw1' ) )
				eles[a].parentNode.oldsw = 'sw1';
			else eles[a].parentNode.oldsw = 'sw2';
			eles[a].parentNode.classList.remove( eles[a].parentNode.oldsw );
			eles[a].parentNode.classList.add( 'Negative' );
			var mimes = ge( 'mimetypes' ).getElementsByTagName( 'input' );
			for( var c = 0; c < mimes.length; c++ )
			{
				var found = false;
				if( app.mimes )
				{
					for( var b = 0; b < app.mimes.length; b++ )
					{
						if( mimes[c].mime == app.mimes[b] )
						{
							found = true;
						}
					}
				}
				if( found )
				{
					if( mimes[c].parentNode.classList.contains( 'sw2' ) )
						mimes[c].sw = 'sw2';
					else mimes[c].sw = 'sw1';
					mimes[c].parentNode.classList.remove( mimes[c].sw );
					mimes[c].parentNode.classList.add( 'BackgroundNegative' );
					mimes[c].parentNode.classList.add( 'Negative' );
					mimes[c].checked = 'checked';
				}
				else
				{
					mimes[c].checked = '';
					mimes[c].parentNode.classList.add( mimes[c].sw );
				}
			}
		}
		else
		{
			eles[a].parentNode.classList.remove( 'BackgroundNegative' );
			eles[a].parentNode.classList.remove( 'Negative' );
			eles[a].parentNode.classList.add( eles[a].parentNode.oldsw );
		}
	}
}

// Adds a new mimetype
function doAdd()
{
	var v = new View( {
		title: i18n( 'i18n_new_mimetype' ),
		width: 200,
		height: 150
	} );
}

// Link types to application
function doLink()
{
	if( !Application.activeApplication ) return;
	var app = Application.activeApplication;
	if( !app.mimes )
		app.mimes = [];
	var mimes = ge( 'mimetypes' ).getElementsByTagName( 'input' );
	for( var c = 0; c < mimes.length; c++ )
	{
		var found = false;
		if( app.mimes )
		{
			for( var b = 0; b < app.mimes.length; b++ )
			{
				if( mimes[c].mime == app.mimes[b] )
				{
					found = true;
				}
			}
			if( !found && mimes[c].checked )
				app.mimes.push( mimes[c].mime );
		}
	}
	
	var m = new Module( 'system' );
	m.onExecuted = function()
	{
		// Remove types from apps that have these elsewhere
		var apps = Application.apps;
		var mimes = [];
		for( var a = 0; a < apps.length; a++ )
		{
			if( apps[a].Name == app.Name ) continue;
			
			var res = []; // <- resulting mimes cleaned
			var changed = false;
			if( apps[a].mimes )
			{
				for( var b = 0; b < apps[a].mimes.length; b++ )
				{
					var found = false;
					for( var c = 0; c < app.mimes.length; c++ )
					{
						if( app.mimes[c] == apps[a].mimes[b] )
						{
							found = true;
							mimes.push( app.mimes[c] );
							break;
						}
					}
					if( found ) changed = true;
					if( !found ) res.push( apps[a].mimes[b] );
				}
				apps[a].mimes = res;
			}
		}
		
		Application.sendMessage( {
			type: 'system',
			command: 'reloadmimetypes'
		} );
		Notify( { title: i18n( 'i18n_mimetype_updated' ), text: i18n( 'i18n_correctly_set_mimetype' ) + '. ' + mimes.join( ', ' ) } );
	}
	m.execute( 'setmimetypes', { types: app.mimes.join( ',' ), executable: app.Name } );
}

function saveMimes( app, callback )
{
	var nm = new Module( 'system' )
	nm.onExecuted = function()
	{
		Application.sendMessage( {
			type: 'system',
			command: 'reloadmimetypes'
		} );
		if( callback ) callback();
	}
	nm.execute( 'setmimetypes', { types: implode( ',', app.mimes ), executable: app.Name } );
}

