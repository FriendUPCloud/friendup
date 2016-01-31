/*******************************************************************************
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
*******************************************************************************/

Application.run = function( msg, iface )
{
	doRefresh();
}

/* Helper functions --------------------------------------------------------- */

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

function doAdd( ele )
{
	if( ele )
	{
		var eles = ele.parentNode.getElementsByTagName( '*' );
		var inp, option;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].nodeName == 'INPUT' )
				inp = eles[a].value;
			else if( eles[a].nodeName == 'SELECT' )
				option = eles[a].value;
		}
		if( !inp.length || !option.length )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					// Do anything special?
				}
				doRefresh();
			}
			m.execute( 'deletemimetypes', { executable: option } );
			return;
		}
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				// Do anything special?
			}
			doRefresh();
		}
		m.execute( 'setmimetypes', { types: inp, executable: option } );
	}
	else
	{
		doRefresh( function()
		{
			var eles = ge( 'apps' ).getElementsByTagName( 'p' );
			if( !eles.length ) ge( 'apps' ).innerHTML = '';
			else if( eles[0].className != 'Layout Mimetype' )
			{
				ge( 'apps' ).innerHTML = '';
			}
			else
			{
				focusOnInput( eles );
			}
			var d = document.createElement( 'p' );
			d.className = 'Layout Mimetype';
			d.innerHTML = '<input value="" placeholder=".jpg, .png"/>\
				<em>opens with:</em>\
				<select><option value="">nothing</option></select>\
				<button type="button" onclick="doAdd(this)" class="Button IconSmall fa-check"></button>';
			ge( 'apps' ).appendChild( d );
		
			getApplications( function( list )
			{
				var s = document.getElementsByTagName( 'select' );
				if( !s.length ) return false;
				var opts = '';
				for( var a in list )
				{
					if( list[a].Title ) list[a].Name = list[a].Title;
					opts += '<option value="' + list[a].Name + '">' + list[a].Name + '</option>';
				}
				s[0].innerHTML = opts;
			} );
	
			focusOnInput( [ d ] );
		} );
	}
}

function focusOnInput( eles )
{
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].getElementsByTagName( 'input' ).length )
		{
			eles[a].getElementsByTagName( 'input' )[0].focus();
			return;
		}
	}
}

function doRefresh( callback )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			ge( 'apps' ).innerHTML = '';
			var mimes = JSON.parse( d );
			for( var a = 0; a < mimes.length; a++ )
			{
				var d = document.createElement( 'p' );
				d.className = 'Layout Mimetype';
				d.innerHTML = '<label>' + mimes[a].types.join( ', ' ) + '</label><em>' + mimes[a].executable + '</em>';
				d.executable = mimes[a].executable;
				d.types = mimes[a].types;
				d.onclick = function()
				{
					modifyMimetype( this );
				}
				ge( 'apps' ).appendChild( d );
			}
		}
		else
		{
			ge( 'apps' ).innerHTML = '<h2>No mimetypes defined.</h2><p>Please add your first mimetypes to the database.</p>';			
		}
		if( callback ) callback();
	}
	m.execute( 'getmimetypes' );
	
	// Notify system
	Application.sendMessage( {
		type: 'system',
		command: 'reloadmimetypes'
	} );
}

function modifyMimetype( d )
{
	var ex = d.executable;
	var ty = d.types;
	
	doRefresh( function()
	{
		var eles = document.getElementsByTagName( 'p' );
		d = -1;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].executable && eles[a].executable == ex )
			{
				d = eles[a];
				break;
			}
		}
		if( d == -1 ) return;
		
		d.types = ty;
		d.executable = ex;
		
		d.innerHTML = '<input value="' + d.types.join( ', ' ) + '" placeholder=".jpg, .png"/>\
			<em>opens with:</em>\
			<select><option value="">nothing</option></select>\
			<button type="button" onclick="doAdd(this)" class="Button IconSmall fa-check"></button>';
	
		getApplications( function( list )
		{
			var s = d.getElementsByTagName( 'select' );
			if( !s.length ) return false;
			var opts = '';
			for( var a in list )
			{
				if( list[a].Title ) list[a].Name = list[a].Title;
				opts += '<option value="' + list[a].Name + '"' + ( list[a].Name == d.executable ? ' selected="selected"' : '' ) + '>' + list[a].Name + '</option>';
			}
			s[0].innerHTML = opts;
			focusOnInput( [ d ] );
		} );		
	} );

}

function doCancel()
{
}


