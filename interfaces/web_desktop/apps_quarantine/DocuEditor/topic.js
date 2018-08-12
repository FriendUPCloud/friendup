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

document.title = 'A topic';

Application.run = function( msg )
{
	// ..
	
	this.textArea = false;
	
}

function saveTopic()
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
	
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.sendMessage( { command: 'closeTopic' } );
		}
	}
	m.execute( 'savetopic', { object: o } );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'pasteimage':
			if( this.imageView )
			{
				this.imageView.close();
			}
			if( this.textArea )
			{
				this.textArea.innerHTML += '<img src="/system.library/module/?module=friendreference&command=getimage&args={%22imageid%22:%22' + msg.imageid + '%22}&authid=' + Application.authId + '"/>';
			}
			addImage();			// FL>HT So that the Add Image window stays on screen
			break;
		case 'addimage':
			addImage();
			break;
		// Dropping an image
		case 'drop':
			if( msg.data && msg.data.length )
			{
				var m = new Module( 'friendreference' );
				m.onExecuted = function( e, d )
				{
					// var m = new Module( 'friendreference' );
					// m.onExecuted = function( e, d )
					// {
					// 	if( e == 'ok' )
					// 	{
					// 		var list = JSON.parse( d );
					// 		for( var a = 0; a < list.length; a++ )
					// 		{
					// 			if (list[a].Name == Application.tempFileName)
					// 			{
					// 				var o =
					// 				{
					// 					command: 'pasteimage',
					// 					imageid: list[a].ID
					// 				};
					// 				Application.sendMessage( o );
					// 			}
					// 		}
					// 	}
					// }
					// m.execute( 'getimages' );
				}
				m.execute( 'registerimage', { files: msg.data } );
			}
			break;
		// Registers an image for use with the documentation
		case 'registerimage':
			var o = {
				triggerFunction: function( items )
				{
					var m = new Module( 'friendreference' );
					m.onExecuted = function( e, d )
					{
						console.log( 'Selected: ', items );
					}
					m.execute( 'registerimage', { files: items } );
				},
				path: 'Mountlist:',
				type: 'load',
				filename: '',
				title: i18n( 'i18n_register_image' ),
				mainView: Application.viewId,
				targetView: Application.viewId
			}
			var d = new Filedialog( o );
			break;
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
					if( this.topic && this.topic.Status == a )
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
			if( msg.topicid != ge( 'pID' ).value ) return;
			var m = new Module( 'friendreference' );
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
			m.execute( 'getcomments', { topicid: msg.topicid } );
			break;
		case 'init':
			TextareaToWYSIWYG( ge( 'pShortDesc' ) );
			TextareaToWYSIWYG( ge( 'pDescription' ) );
			TextareaToWYSIWYG( ge( 'pExamples' ) );
			break;
		case 'loadtopic':
			ge( 'Cover' ).style.position = 'absolute';
			ge( 'Cover' ).style.zIndex = 999;
			ge( 'Cover' ).style.width = '100%';
			ge( 'Cover' ).style.height = '100%';
			ge( 'Cover' ).style.backgroundColor = 'white';
			ge( 'Cover' ).style.opacity = 0.6;
			var m = new Module( 'friendreference' )
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{	
					var i = JSON.parse( d );
					Application.topic = i;
					ge( 'AddComment' ).id = 'DoAdd'; // Just change id
					ge( 'pID' ).value = i.ID;
					
					// Update images with current authid
					var keys = [ 'pShortDesc', 'pDescription', 'pExamples' ];
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
					
					ge( 'pTopicID' ).value = i.TopicID;
					ge( 'pSubject' ).value = i.Subject;
					ge( 'pShortDesc' ).value = i.ShortDesc;
					ge( 'pDescription' ).value = i.Description;
					ge( 'pExamples' ).value = i.Examples;
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
					
					TextareaToWYSIWYG( ge( 'pShortDesc' ) );
					TextareaToWYSIWYG( ge( 'pDescription' ) );
					TextareaToWYSIWYG( ge( 'pExamples' ) );
					
					ge( 'pShortDesc' ).richTextArea.onfocus = function()
					{
						Application.textArea = this;
					}
					ge( 'pDescription' ).richTextArea.onfocus = function()
					{
						Application.textArea = this;
					}
					ge( 'pExamples' ).richTextArea.onfocus = function()
					{
						Application.textArea = this;
					}
					
					Application.receiveMessage( { command: 'getcomments', topicid: ge( 'pID' ).value } );
				}
				else
				{
					Application.sendMessage( { command: 'closeTopic' } );
				}
			}
			m.execute( 'loadtopic', { topicid: msg.ID } );
			break;
	}
}

function deleteTopic( id )
{
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		Application.sendMessage( { command: 'closeTopic' } );
	}
	m.execute( 'deletetopic', { topicid: id } );
}

/* Add a comment to an topic */
function addComment()
{
	var v = new View( {
		title: 'Add comment',
		width: 320,
		height: 320
	} );
	
	// Open the template
	var f = new File( 'Progdir:Templates/comment.html' );
	f.i18n();
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
	var m = new Module( 'friendreference' );
	m.onExecuted = function( e, d )
	{
		Application.receiveMessage( { command: 'getcomments', topicid: ge( 'pID' ).value } );
		Application.sendMessage( { command: 'refreshTopics' } );
	}
	m.execute( 'removecomment', { commentid: id } );
}

// Select an image from the list
function addImage()
{
	if( Application.imageView ) return;
	
	var v = new View( {
		title: i18n( 'i18n_add_image' ),
		width: 600,
		height: 500
	} );
	
	Application.imageView = v;
	
	v.onClose = function()
	{
		Application.imageView = false;
	}
	
	var f = new File( 'Progdir:Templates/add_image.html' );
	f.onLoad = function( data )
	{
		v.setContent( data, function()
		{
			v.sendMessage( { command: 'parentview', parentview: Application.viewId } );
		} );
	}
	f.load();
}

