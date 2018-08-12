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
	refreshToc();
}

var currentTopic = 0;

function refreshToc()
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' ) return;
		drawToc( JSON.parse( d ), 0 );
		selectItem( currentTopic );
	}
	m.execute( 'gettoc' );
}

function drawToc( items, parent, ele )
{
	if( parent == 0 )
	{
		ge( 'Index' ).innerHTML = '<h2>' + i18n( 'i18n_toc' ) + '</h2>';
		ele = ge( 'Index' );
	}
	
	var ul = document.createElement( 'ul' );
	
	for( var a = 0; a < items.length; a++ )
	{
		if( items[a].TopicID == parent )
		{
			if( currentTopic == 0 ) currentTopic = items[a].ID;
			var l = document.createElement( 'li' );
			l.innerHTML = '<a href="javascript:void(0)" onclick="selectItem(' + items[a].ID + ')">' + items[a].Subject + '</a>';
			ul.appendChild( l );
			drawToc( items, items[a].ID, l );
		}
	}
	
	ele.appendChild( ul );
}

function selectItem( itm )
{
	currentTopic = itm;
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			ge( 'Content' ).innerHTML = generateDocument( JSON.parse( d ) ) + '<div id="Comments"></div>' + commentField( itm );
			getComments();
		}
	}
	m.execute( 'readtopic', { topicid: itm } );
}

function commentField()
{
	var str = '\
		<hr/>\
		<div class="CommentForm">\
			<p class="Layout"><strong>' + i18n( 'i18n_please_leave_a_comment' ) + ':</strong></p>\
			<textarea class="FullWidth" id="CommentText" style="height:150px; width: 100%"></textarea><br/>\
			<p class="Layout">\
				<button type="button" class="Button IconSmall fa-comment" onclick="addComment()">\
					Add comment\
				</button>\
			</p>\
		</div>\
	';
	return str;
}

function getComments()
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return;
		}
		var j = JSON.parse( d );
		if( !j.length ) return;
		var str = ['<hr/><h2>' + i18n( 'i18n_comments' ) + ':</h2>'];
		for( var a = 0; a < j.length; a++ )
		{
			var edit = '';
			/*if( j[a].Editable == '1' )
			{
				edit = '&nbsp;-&nbsp;<span onclick="removeComment(' + j[a].ID + ')" style="cursor: pointer; position: relative; top: -1px" class="IconSmall fa-remove">&nbsp;</div>';
			}*/
			var dts = j[a].Date.split( ' ' );
			var d = dts[0].split( '-' ).join( '/' );
			d += ' at ' + dts[1];
			str.push(
				'<p class="Padding Layout"><strong>' + j[a].Username + 
				' ' + i18n( 'i18n_commented' ) + ', ' + d + '</strong>' + edit + '<br/>' + 
				j[a].Description + '</p>' 
			);
		}
		ge( 'Comments' ).innerHTML = str.join( '<hr/>' );
	}
	m.execute( 'getcomments', { topicid: currentTopic } );
}

function addComment()
{
	if( ge( 'CommentText' ) )
	{
		var m = new Module( 'friendreference' );
		m.onExecuted = function( e, d )
		{
			selectItem( currentTopic );
			ge( 'Content' ).scrollTop = ge( 'Content' ).offsetHeight;
		}
		m.execute( 'comment', {
			topicid: currentTopic,
			comment: ge( 'CommentText' ).value
		} );
	}
}

function generateDocument( i )
{
	var str = '';
	// Update images with current authid
	var keys = [ 'ShortDesc', 'Description', 'Examples' ];
	for( var a = 0; a < keys.length; a++ )
	{
		var k = keys[a]; if( !i[k] ) continue;
		if( i[k].match( /authid\=[a-z0-9]+/i ) )
		{
			i[k] = i[k].split( /authid\=[a-z0-9]+/i ).join( 'authid=' + Application.authId );
		}
		// Fix urls
		if( i[k].match( /htt[^:]*?\:\/\/.*?\/system.library/i ) )
		{
			i[k] = i[k].split( /htt[^:]*?\:\/\/.*?\/system.library/i ).join( '/system.library' );
		}
	}
	
	str += '<h1>' + i.Subject + '</h1>';
	str += '<p>' + i.ShortDesc + '</p>';
	str += '<p>' + i.Description + '</p>';
	if( i.Examples )
	{
		str += '<blockquote><pre>' + i.Examples + '</pre></blockquote>';
	}
	return str;
}

