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

var filter = [];

function addToList( ele )
{
	for( var a = 0; a < filter.length; a++ )
	{
		if( filter[a] == ele ) return;
	}
	filter.push( ele );
}

function remFromList( ele )
{
	var nl = [];
	for( var a = 0; a < filter.length; a++ )
	{
		if( filter[a] != ele ) nl.push( filter[a] );
	}
	filter = nl;
}

function catchSearch( e, val )
{
	var kc = e.which ? e.which : e.keyCode;
	if( kc == 13 )
	{
		Application.search = val;
	}
	Application.sendMessage( { command: 'refreshIssues', filter: filter, search: Application.search } );
}

Application.run = function( msg )
{
	this.issueWin = false;
	this.userInfo = false;
	
	function recess( deact )
	{
		if( deact == 1 ) this.activated = true;
		else deact = false;
		
		var f = '';
		switch( this.id )
		{
			case 'btnnew': f = '0'; break;
			case 'btnver': f = '1'; break;
			case 'btnfix': f = '2'; break;
		}
			
		if( this.activated )
		{
			this.activated = false;
			this.classList.remove( 'Recessed' );
			remFromList( f );
		}
		else
		{
			this.activated = true;
			this.classList.add( 'Recessed' );
			addToList( f );
		}
		if( !deact )
		{
			var btns = [ 'btnnew', 'btnver', 'btnfix' ];
			for( var a = 0; a < btns.length; a++ )
			{
				if( this.id != btns[a] )
				{
					ge(btns[a]).recess( 1 );
				}
			}
			Application.sendMessage( { command: 'refreshIssues', filter: filter.length ? ( '(\'' + filter.join( '\', \'' ) + '\')' ) : '', search: Application.search } );
		}
	}
	
	// Assign functionality
	ge( 'btnnew' ).onclick = recess;
	ge( 'btnnew' ).recess  = recess;
	ge( 'btnver' ).onclick = recess;
	ge( 'btnver' ).recess  = recess;
	ge( 'btnfix' ).onclick = recess;
	ge( 'btnfix' ).recess  = recess;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'userinfo':
			this.userInfo = msg.userinfo;
			if( !this.issuesListed && this.doTheUpdate )
			{
				this.issuesListed = true;
				this.doTheUpdate();
			}
			break;
		case 'closeIssue':
			if( this.issueWin )
			{
				this.issueWin.close();
				this.issueWin = false;
			}
			break;
		case 'closeView':
			if( this.viewWin )
			{
				this.viewWin.close();
				this.viewWin = false;
			}
			break;
		case 'getcomments':
			this.issueWin.sendMessage( msg );
			break;
		case 'updateissues':
			this.doTheUpdate = function()
			{
				ge( 'Issues' ).innerHTML = '';
				if( msg.issues.length )
				{
					var issues = JSON.parse( msg.issues );
					for( var a = 0; a < issues.length; a++ )
					{
						var div = document.createElement( 'div' ); div.className = 'Issue';
						var who = document.createElement( 'div' ); who.className = 'Who';
						var wha = document.createElement( 'div' ); wha.className = 'What';
						var btn = document.createElement( 'div' ); btn.className = 'Btns';
						var sub = document.createElement( 'div' ); sub.className = 'Subj';
			
						var iss = issues[a];
			
						var status = '';
						var vclass = '';
						switch( iss.Status )
						{
							case '1':
								status = '[Verified] ';
								vclass = 'verified ColorStGreenLight BackgroundStGreenLight';
								break;
							case '2':
								status = '[Fixed] ';
								vclass = 'fixed ColorStBlueLight BackgroundStBlueLight';
								break;
							default:
								vclass = 'ColorStGrayLight BackgroundStGrayLight';
						}
				
						div.className += ' ' + vclass;
				
			
						sub.innerHTML = '<strong>' + ( status + iss.Subject ) + '</strong>, ' + iss.DateModified;
						wha.innerHTML = '<p>' + iss.ShortDesc + '</p>';
						who.innerHTML = 'submitted by <strong>' + iss.Username + '</strong>';
						btn.innerHTML = '';
						if( iss.Category ) who.innerHTML += ' in <strong>' + iss.Category + '</strong>';
					
						if( Application.userId == iss.UserID || Application.userInfo.Level == 'Admin' )
						{
							btn.innerHTML += '<button class="Button IconSmall fa-pencil"\
										 onclick="editIssue(' + iss.ID + ')">Edit</button>';
						}
						btn.innerHTML += '<button class="Button IconSmall fa-eye"\
										 onclick="viewIssue(' + iss.ID + ')">View</button>';
						div.appendChild( sub );
						div.appendChild( who );
						div.appendChild( wha );
						div.appendChild( btn );
						ge( 'Issues' ).appendChild( div );
					}
				}
			}
			if( this.userInfo )
				this.doTheUpdate();
			break;
	}
}

function viewIssue( id )
{
	if( Application.viewWin ) return;
	
	var v = new View( {
		title: 'Viewing issue',
		width: 500,
		height: 400
	} );
	
	v.onClose = function()
	{
		Application.viewWin = false;
	}
	
	Application.viewWin = v;
	
	var f = new File( 'Progdir:Templates/view.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			if( id )
			{
				v.sendMessage( { command: 'loadissue', ID: id } );
			}
		} );
	}
	f.load();	
}

function issueWin( id )
{
	
	if( Application.issueWin ) return;
	
	var v = new View( {
		title: id ? 'Edit issue' : 'Register issue',
		width: 500,
		height: 400
	} );
	
	v.onClose = function()
	{
		Application.issueWin = false;
	}
	
	Application.issueWin = v;
	
	var f = new File( 'Progdir:Templates/issue.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'userinfo', userinfo: Application.userInfo } );
			if( id )
			{
				v.sendMessage( { command: 'loadissue', ID: id } );
			}
		} );
	}
	f.load();	
}

function editIssue( id )
{
	issueWin( id );
}

