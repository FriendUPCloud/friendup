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

document.title = 'An issue';

Application.run = function( msg )
{
	// ..
}

function saveIssue()
{
	var o = {};
	
	var eles = document.getElementsByTagName( '*' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( !eles[a].nodeName ) continue;
		if( eles[a].nodeName.toLowerCase() == 'textarea' || eles[a].nodeName.toLowerCase() == 'input' )
		{
			if( eles[a].id )
			{
				var id = eles[a].id;
				id = id.substr( 1, id.length - 1 ); // Remove the p
				o[id] = eles[a].value;
			}
		}
		if( eles[a].nodeName.toLowerCase() == 'select' )
		{
			if( eles[a].id )
			{
				var opts = eles[a].getElementsByTagName( 'option' );
				var v = '';
				for( var b = 0; b < opts.length; b++ )
				{
					if( opts[b].selected )
						v = opts[b].value;
				}
				var id = eles[a].id;
				id = id.substr( 1, id.length - 1 ); // Remove the p
				o[id] = v;
			}
		}
	}
	
	var m = new Module( 'issues' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.sendMessage( { command: 'closeIssue' } );
		}
	}
	m.execute( 'saveissue', { object: o } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'userinfo':
			Application.userInfo = msg.userinfo;
			if( msg.userinfo.Level == 'Admin' )
			{
				if( !ge( 'FormBox' ) ) return;
				var o = '';
				var stypes = { 
					'0' : 'Pending',
					'1' : 'Verified',
					'2' : 'Fixed'
				};
				var s = '';
				for( var a in stypes )
				{
					s = '';
					if( this.issue && this.issue.Status == a )
					{
						s = ' selected="selected"';
					}
					o += '<option value="' + a + '"' + s + '>' + stypes[a] + '</option>';
				}
				var status = document.createElement( 'div' );
				status.innerHTML = '<p class="Layout"><strong>Status:</strong></p>';
				status.innerHTML += '<p class="Layout"><select id="pStatus">' + o + '</select></p>';
				ge( 'FormBox' ).appendChild( status );
			}
			break;
		case 'getcomments':
			if( msg.issueid != ge( 'pID' ).value ) return;
			var m = new Module( 'issues' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					ge( 'Comments' ).innerHTML = '';
					ge( 'CommentCount' ).innerHTML = '';
					return;
				}
				var j = JSON.parse( d );
				if( !j.length ) return;
				var str = [];
				for( var a = 0; a < j.length; a++ )
				{
					var edit = '';
					if( j[a].Editable == '1' )
					{
						edit = '&nbsp;-&nbsp;<span onclick="removeComment(' + j[a].ID + ')" style="cursor: pointer; position: relative; top: -1px" class="IconSmall fa-remove">&nbsp;</div>';
					}
					var dts = j[a].Date.split( ' ' );
					var d = dts[0].split( '-' ).join( '/' );
					d += ' at ' + dts[1];
					str.push(
						'<p class="Padding Layout"><strong>' + j[a].Username + 
						' commented, ' + d + '</strong>' + edit + '<br/>' + 
						j[a].Description + '</p>' 
					);
				}
				ge( 'Comments' ).innerHTML = str.join( '<hr/>' );
				ge( 'CommentCount' ).innerHTML = str.length > 0 ? ( ' (' + str.length + ( str.length == 1 ? ' comment)' : ' comments)' ) ) : '';
			}
			m.execute( 'getcomments', { issueid: msg.issueid } );
			break;
		case 'loadissue':
			ge( 'Cover' ).style.position = 'absolute';
			ge( 'Cover' ).style.zIndex = 999;
			ge( 'Cover' ).style.width = '100%';
			ge( 'Cover' ).style.height = '100%';
			ge( 'Cover' ).style.backgroundColor = 'white';
			ge( 'Cover' ).style.opacity = 0.6;
			var m = new Module( 'issues' )
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					
					var i = JSON.parse( d );
					Application.issue = i;
					loadCategories();
					ge( 'AddComment' ).id = 'DoAdd'; // Just change id
					ge( 'pID' ).value = i.ID;
					ge( 'pSubject' ).value = i.Subject;
					ge( 'pShortDesc' ).value = i.ShortDesc;
					ge( 'pDescription' ).value = i.Description;
					ge( 'pReproduce' ).value = i.Reproduce;
					ge( 'Cover' ).style.width = '0%';
					ge( 'Cover' ).style.height = '0%';
					ge( 'Delete' ).className = 'Button IconSmall fa-trash';
					if( ge( 'pStatus' ) )
					{
						var opts = ge( 'pStatus' ).getElementsByTagName( 'option' );
						for( var a = 0; a < opts.length; a++ )
						{
							if( opts[a].value == i.Status )
								opts[a].selected = 'selected';
							else opts[a].selected = '';
						}
					}
					// Load the cmoments
					Application.receiveMessage( { command: 'getcomments', issueid: ge( 'pID' ).value } );
				}
				else
				{
					Application.sendMessage( { command: 'closeIssue' } );
				}
			}
			m.execute( 'loadissue', { issueid: msg.ID } );
			break;
	}
}

function loadCategories()
{
	var m = new Module( 'issues' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var list = JSON.parse( d );
			var str = '<option value="0">Uncategorized</option>';
			for( var a = 0; a < list.length; a++ )
			{
				var ex = '';
				if( Application.issue.IssueID == list[a].ID )
				{
					ex = ' selected="selected"';
				}
				str += '<option value="' + list[a].ID + '"' + ex + '>' + list[a].Category + '</option>';
			}
			ge( 'Categories' ).innerHTML = '<select id="pCategoryID">' + str + '</select>';
			return;
		}
		ge( 'Categories' ).innerHTML = '<select id="pCategoryID"><option value="0">Uncategorized</option></select>';
	}
	m.execute( 'categories' );
}

function deleteIssue( id )
{
	Confirm( 'Are you sure?', 'Are you sure you want to delete this issue?', function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'issues' );
			m.onExecuted = function( e, d )
			{
				Application.sendMessage( { command: 'closeIssue' } );
			}
			m.execute( 'deleteissue', { issueid: id } );
		}
	} );
}

/* Add a comment to an issue */
function addComment()
{
	var v = new View( {
		title: 'Add comment',
		width: 320,
		height: 320
	} );
	
	// Open the template
	var f = new File( 'Progdir:Templates/comment.html' );
	f.onLoad = function( data )
	{
		// Set the comment layout on the view
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'init', id: ge( 'pID' ).value, subject: ge( 'pSubject' ).value } );
		} );
	}
	f.load();
}

function removeComment( id )
{
	Confirm( 'Are you sure?', 'Are you sure you want to delete this comment?', function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'issues' );
			m.onExecuted = function( e, d )
			{
				Application.receiveMessage( { command: 'getcomments', issueid: ge( 'pID' ).value } );
				Application.sendMessage( { command: 'refreshIssues' } );
			}
			m.execute( 'removecomment', { commentid: id } );
		}
	} );
}
