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

Application.run = function()
{
	refreshImages();
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		// Dropping an image
		case 'drop':
			if( msg.data && msg.data.length )
			{
				var m = new Module( 'friendreference' );
				m.onExecuted = function( e, d )
				{
					Alert( 'Image(s) added', 'Image(s) added to image databank.' );
					refreshImages();
				}
				m.execute( 'registerimage', { files: msg.data } );
			}
			break;
		case 'parentview':
			Application.parentview = msg.parentview;
			break;
	}
}

function refreshImages()
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		var str = '<h1>Please choose an image:</h1><hr/>';
		if( e == 'ok' )
		{
			var list = JSON.parse( d );
			for( var a = 0; a < list.length; a++ )
			{
				str += '<div class="ImageBlock">\
					<a href="javascript:void(0)" onclick="addImageToText(' + list[a].ID + ')">' + list[a].Name + '</a>\
					<div class="Thumbnail" style="background-image:url(/system.library/module/?module=friendreference&command=getimagethumb&args={%22imageid%22:%22' + list[a].ID + '%22}&authid=' + Application.authId + ')"></div>\
					<button type="button" class="Button IconSmall fa-remove" onclick="deleteImage(' + list[a].ID + ')">&nbsp;' + i18n( 'i18n_delete_image' ) + '</button>\
				</div>';
			}
		}
		ge( 'Content' ).innerHTML = str;
	}
	m.execute( 'getimages' );
}

function addImageToText( id )
{
	var o = {
		command: 'pasteimage',
		destinationViewId: Application.parentview,
		imageid: id
	};
	Application.sendMessage( o );
    var o = {
        command: 'relaunchaddimage',
        destinationViewId: Application.parentview,
    };
}

function deleteImage( id )
{
	Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_are_you_sure_delimg' ), function()
	{
		var m = new Module( 'friendreference' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				refreshImages();
			}
		}
		m.execute( 'deleteimage', { imageid: id } );
	} );
}

