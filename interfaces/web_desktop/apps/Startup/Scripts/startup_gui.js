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
	LoadStartupSequence();
	this.views = [];
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'saveitem':
			
			var o = [];
			for( var a in this.views )
			{
				if( this.views[a].getViewId() == msg.guiview )
					this.views[a].close();
				else o.push( this.views[a] );
			}
			this.views = o;
			
			var s = new Module( 'system' );
			s.onExecuted = function( e, d )
			{
				if( !e || e != 'ok' )
					d = false;
					
				var list = [];
				
				if( d )
				{
					try
					{
						list = JSON.parse( d );
						list = list.startupsequence;
					}
					catch( e ) 
					{ 
						console.log( { e:e, d:d } ); 
					}
				}
				if( !Array.isArray(list) ) list = [];

				if( msg.itemId === false ) list.push( msg.itemcommand );
				else
				{
					for( var a = 0; a < list.length; a++ )
					{
						if( a == msg.itemId ) list[a] = msg.itemcommand;
					}
				}
				
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					// 'All done!'
					LoadStartupSequence();
				}
				m.execute( 'setsetting', { setting: 'startupsequence', data: JSON.stringify( list ) } );
			}
			s.execute( 'getsetting', { setting: 'startupsequence' } );
			
			break;
		case 'setparentviewid':
			this.viewId = msg.viewid;
			break;
	}
}

function AddItem()
{
	var v = new View( {
		title: i18n( 'i18n_add_item' ),
		width: 400,
		height: 100
	} );
	Application.views.push( v );
	var f = new File( 'Progdir:Templates/item.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			var o = { command: 'item', data: { command: '' }, viewid: Application.viewId, guiview: v.getViewId() };
			
			v.sendMessage( o );
		} );
	}
	f.load();
}

function EditItem( i )
{
	if( Application.startupsequence[i] )
	{
		var v = new View( {
			title: i18n( 'i18n_edit_item' ),
			width: 400,
			height: 100
		} );
		Application.views.push( v );
		var f = new File( 'Progdir:Templates/item.html' );
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data, function()
			{
				var o = { command: 'item', data: { command: Application.startupsequence[i] }, itemId: i, viewid: Application.viewId, guiview: v.getViewId() };
				v.sendMessage( o );
			} );
		}
		f.load();
	}
}

// Remove an item on the list
function RemoveItem( i )
{
	var o = [];
	for( var a = 0; a < Application.startupsequence.length; a++ )
	{
		if( a != i )
		{
			o.push( Application.startupsequence[a] );
		}
	}
	Application.startupsequence = o;
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		LoadStartupSequence();
	}
	m.execute( 'setsetting', { setting: 'startupsequence', data: JSON.stringify( o ) } );
}

function LoadStartupSequence()
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var str = '<p>' + i18n( 'i18n_no_items_in_list' ) + '</p>';
		if( !e || e != 'ok' ) 
		{
			ge( 'Cont' ).innerHTML = str;
			return;
		}
		var sequence = false;
		
		try
		{
			sequence = JSON.parse( d );
		}
		catch( e )
		{
			console.log( { e:e, d:d } );
		}
		
		sequence = sequence ? sequence.startupsequence : [];
		if( sequence == '[]' ) sequence = [];
		if( sequence.length )
		{
			str = '<table class="List">';
			var sw = 2;
			for( var a = 0; a < sequence.length; a++ )
			{
				sw = sw == 1 ? 2 : 1;
				str += '<tr class="sw' + sw + '">';
				str += '<td class="MousePointer IconSmall fa-edit" onclick="EditItem(' + a + ')">&nbsp;' + sequence[a] + '</td>';
				str += '<td width="24px" onclick="RemoveItem(' + a + ')" class="MousePointer IconSmall fa-remove">&nbsp;&nbsp;&nbsp;</td>';
				str += '</tr>';
			}
			str += '</table>';
		}
		ge( 'Cont' ).innerHTML = str;
		Application.startupsequence = sequence;
	}
	m.execute( 'getsetting', { setting: 'startupsequence' } );
}


