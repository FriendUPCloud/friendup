/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

// Handling navigation
var historyLog = []; // Our history log
var index = 0; // Where we are now in history

Application.run = function( msg )
{
	document.getElementsByTagName( 'input' )[0].focus();
	document.getElementsByTagName( 'input' )[0].select();

	ge( 'BrowserBox' ).src = getImageUrl( 'Progdir:Templates/about.html' );
	this.registerUrl( ge( 'BrowserBox' ).src );

	this.hostName = false;
	this.appName = false;
	this.doorName = false;
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setproxy':
			setProxy( msg.proxy );
			setFriendSession( msg.friendsession );
			break;
		case 'loadfile':
			setUrl( msg.filename );
			break;
		case 'forward':
			forward();
			break;
		case 'backward':
			back();
			break;
		case 'drop':
			if( msg.data )
			{
				// TODO: Support dropping many files
				/*var items = [];
				for( var a in msg.data )
				{
					items.push( {
						Path: msg.data[a].Path,
						Filename: msg.data[a].Filename
					} );
				}*/
				setUrl( msg.data[0].Path );
			}
			break;
		case 'listCommunities':
			displayCommunities( msg.url, msg.communities, msg.users );
			break;
		case 'fnetConnected':
			Application.hostName = msg.hostName;
			Application.appName = msg.appName;
			Application.doorName = msg.doorName;
			Application.community = msg.community;
			displayFNetPage( msg.doorName, msg.hostName, msg.appName, msg.community, msg.path );
			break;
		case 'fnetDisconnected':
			Application.hostName = false;
			Application.appName = false;
			Application.doorName = false;
			break;
		case 'redirectLink':
			var path = msg.link;
			if ( msg.link.indexOf( ':' ) >= 0 )
				path = msg.link.split( ':' )[ 1 ];
			displayFNetPage( Application.doorName, Application.hostName, Application.appName, Application.community, path );
			break;
	}
}

function back()
{
	var pindex = index;
	if( --index < 0 ) 
		index = 0;
	// We actually moved
	if( index != pindex )
	{
		console.log( 'Index is now: ' + index + ' (was ' + pindex + ' )' );
		setUrl( index, 1 );
	}
}

function forward()
{
	var pindex = index; 
	if( ++index >= historyLog.length )
		index = historyLog.length - 1;
	// We actually moved
	if( pindex != index )
	{
		console.log( 'Going back: ' + historyLog[ index ] );
		setUrl( index, 1 );
	}
}

function reload()
{
	Application.sendMessage( { command: 'reload' } );
}

function setProxy( puri )
{
	this.proxy = puri;
	if( puri.substr(-1) != '/' ) this.proxy += '/';
}

function setFriendSession( sessionid )
{
	this.friendsession = sessionid;
}

function replaceFriendUrls( data, url )
{
	var baseUrl = '';
	if( url.indexOf( '/' ) > 0 )
	{
		baseUrl = url.split( '/' );
		baseUrl.pop();
		baseUrl = baseUrl.join( '/' ) + '/';
	}
	else baseUrl = url.split( ':' )[0] + ':';
	baseUrl = baseUrl.split( ':/' ).join( ':' );

	var r;
	// Replace relative sources
	while( r = data.match( /src\=['"]([^:"']*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( baseUrl + r[1] );
	}
	// Replace sources
	while( r = data.match( /src\=['"]([a-z][^:]*?\:[^/][^'"]*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( getImageUrl( r[1] ) );
	}
	// Replace relative sources
	while( r = data.match( /href\=['"]([^:"']*?)['"]/i ) )
	{
		data = data.split( r[1] ).join( baseUrl + r[1] );
	}
	// Replace hrefs
	while( r = data.match( /href\=['"]([a-z][^:]*?\:[^/][^'"]*?)['"]/i ) )
	{
		if( r[1].indexOf( '.html' ) )
		{
			data = data.split( r[1] ).join( '#" onclick="parent.setUrl(\'' + r[1] + '\'); return parent.cancelBubble( event );' );
		}
		else
		{
			data = data.split( r[1] ).join( getImageUrl( r[1] ) );
		}
	}
	return data;
}

function setUrl( uri, move )
{
	if( !move ) move = false;
	var wantedIndex = null;
	if( !isNaN( uri ) && ( uri === 0 || uri > 0 ) )
	{
		if( uri < historyLog.length )
		{
			wantedIndex = uri;
			uri = historyLog[ wantedIndex ];
			index = wantedIndex;
		}
	}
	
	if( uri == 'about:blank' || uri == 'about:home' )
	{
		ge( 'BrowserBox' ).src = getImageUrl( 'Progdir:Templates/about.html' );
		return;
	}

	//uri = uri.split( 'http://' ).join( '' ).split( 'https://' ).join( '' );
	var urldata = '';
	var skiploading = false;

	if( uri.indexOf( ':' ) > 0 && uri.indexOf( ':/' ) < 0 )
	{
		skiploading = true;
		if( uri.toLowerCase().substr( 0, 7 ) == 'system:' )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e != 'ok' )
				{
					data = '<h1>No documentation on subject</h1><p>Could not find documentation on subject: ' + uri + '</p>';
				}
				var fr = document.createElement( 'iframe' );
				fr.className = 'Browser';
				fr.id = 'BrowserBox';
				fr.onLoad = ge( 'BrowserBox' ).onload;
				ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
				var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;

				data = replaceFriendUrls( data, uri );

				doc.body.parentNode.innerHTML = data;
				doc.body.onmousedown = function()
				{
					Application.sendMessage( { command: 'activate_now' } );
				}
			}
			m.execute( 'finddocumentation', { path: uri } );
		}
		else
		{
			// Look for drives with the same name
			var split = uri.split( ':' );
			var hostName = split[ 0 ];
			Friend.DOS.getDriveInfo( hostName, function( response, message, extra )
			{
				// Drive found! File on the current machine!
				if ( response )
				{
					// File on current machine
					var f = new File( uri );
					f.onLoad = function( data )
					{
						var fr = document.createElement( 'iframe' );
						fr.className = 'Browser';
						fr.id = 'BrowserBox';
						fr.onLoad = ge( 'BrowserBox' ).onload;
						ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
						var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;

						data = replaceFriendUrls( data, uri );

						doc.body.parentNode.innerHTML = data;
						doc.body.onmousedown = function()
						{
							Application.sendMessage( { command: 'activate_now' } );
						}
					}
					f.load();
				}
				else
				{
					// Drive not found, try to connect via Friend Network
					Application.sendMessage( { command: 'fnet_connect', url: uri } );
				}
			} );
			for( var a = 0; a < Workspace.icons.length; a++ )
			{
				if( Workspace.icons[a].Volume == hostName )
				{
					return;
				}
			}

			return;
		}
	}
	else if( uri.substr( 0, 7 ) != 'http://' && uri.substr( 0, 8 ) != 'https://' )
	{
		if( uri.substr( 0, 9 ) != 'friend://' )
			uri = 'friend://' + uri;
		urldata = uri.split( 'friend://' )[1];
		var si = urldata.indexOf( '/' );
		if( si < 0 ) si = 0;
		if( si > 0 )
			urldata = urldata.substr( si, urldata.length - si );
		else urldata = '';
	}
	// Normal url
	else
	{
		skiploading = true;
		ge( 'BrowserBox' ).src = uri;
	}
	
	ge( 'uri' ).value = uri;

	// Cap historyLog
	if( !move )
	{
		if( wantedIndex != null && wantedIndex < historyLog.length )
		{
			var newHistoryLog = [];
			for( var a = 0; a < wantedIndex; a++ )
			{
				newHistoryLog.push( historyLog[a] );
			}
			historyLog = newHistoryLog;
			index = wantedIndex;
		}
		else
		{
			// Add to history
			historyLog.push( uri );
			index = historyLog.length - 1;
		}
	}
	
	// do normal loading
	if( !skiploading )
	{
		if ( uri.substring( 0, 9 ) == 'friend://' )
		{
			Application.sendMessage( { command: 'fnet_connect', url: uri.substring( 9 ) } );
		}
	}
	else
	{
		Application.sendMessage( { command: 'seturl', url: uri, logic: true } );
	}
}
function getFileName( path )
{
	if ( path.charAt( path.length - 1 ) == '/' )
		path = path.substring( 0, path.length - 1 );
	var slash = path.lastIndexOf( '/' );
	if ( slash >= 0 )
		return path.substring( slash + 1 );
	var doubleDot = path.indexOf( ':' );
	if ( doubleDot >= 0 )
		return path.substring( doubleDot + 1 );
	return path;
};

function displayFNetPage( doorName, hostName, appName, community, path )
{
	var self = this;

	// Check the content of the directory
	var filename;
	var parentPath = path;
	if ( path != '' )
	{
		if ( path.substring( path.length - 1 ) != '/' )
		{
			var pos = path.lastIndexOf( '/' );
			if ( pos >= 0 )
			{
				filename = path.substring( pos + 1 );
				parentPath = path.substring( 0, pos );
			}
			else
			{
				filename = path;
				parentPath = '';
			}
		}
	}
	Friend.DOS.getDirectory( doorName + ':' + parentPath, {}, function( response, message )	
	{
		var OK = false;
		if ( !response )
			return;

		if ( !filename )
		{
			// No filename, look for index.jsx
			for ( var l = 0; l < message.list.length; l++ )
			{
				var icon = message.list[ l ];
				if ( icon.Filename == 'index.jsx' )
				{
					OK = 'jsx';
					filename = icon.Filename;
					break;
				}
			}
			if ( !OK )
			{
				// Look for index.html
				for ( var l = 0; l < message.list.length; l++ )
				{
					var icon = message.list[ l ];
					if ( icon.Filename == 'index.html' )
					{
						OK = 'html';
						filename = icon.Filename;
						break;
					}
				}
			}
		}
		else
		{
			// Check that the file is present
			for ( var l = 0; l < message.list.length; l++ )
			{
				var icon = message.list[ l ];
				if ( icon.Filename == filename )
				{			
					// HTML or jsx?		
					var ext;
					var dot = filename.lastIndexOf( '.' );
					if ( dot >= 0 )
						ext = filename.substring( dot + 1 );
					if ( ext == 'html' )	
						OK = 'html';
					else if ( ext == 'jsx' )
						OK = 'jsx';
					filename = icon.Filename;
					break;
				}
			}
		}

		// Load an HTML page
		if ( OK == 'html' )
		{
			// Set the title
			var uri = 'friend://' + hostName + '@' + community + '/' + parentPath + filename;
			ge( 'uri' ).value = uri;
			Application.sendMessage( { command: 'setcontent', url: uri } );

			// Add to history
			historyLog.push( uri );
			index = historyLog.length - 1;
				
			var f = new File( doorName + ':' + parentPath + filename );
			f.onLoad = function( html )
			{
				var iFrame = ge( 'BrowserBox' );
				var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;
				
				var linkReplacement = 'javascript:redirectLinks';
				var linkFunction = 'function redirectLinks( link ){ parent.postMessage( { command: "redirectLink", link: link }, "*" ) };';
				
				FriendNetworkShare.relocateHTML( html, doorName, linkReplacement, linkFunction, function( message )
				{
					if ( message.response )
					{
						doc.body.parentNode.innerHTML = message.html;
						RunScripts( message.html, ge( 'BrowserBox' ).contentWindow );
					}
					else
					{
						// Display error page
					}
				} );
				doc.body.onmousedown = function()
				{
					Application.sendMessage( { command: 'activate_now' } );
				}
			}
			f.load();
		}
		else if ( OK == 'jsx' )
		{
			// Get the iframe
			var frm = document.getElementsByTagName( 'iframe' );
			if( !frm || !frm.length )
			{
				return;
			}
			frm = frm[0];

			// Get the user information
			FriendNetwork.getUserInformation( function( message )
			{
				// Open an empty Workspace in the iframe
				frm.src = '/webclient/app.html?authid=' + Application.authId;
				frm.onload = function()
				{
					var msg =
					{
						type: 'friendNetworkRun',
						method: 'start',
						doorName: doorName,
						doorURL: appName + '@' + hostName,
						path: doorName + ':' + parentPath + filename,
						userInformation: message.information,
						authId: Application.authId
					};
					frm.contentWindow.postMessage( JSON.stringify( msg ), '*' );
				};
			} );
		}
	} );

}

Application.registerUrl = function( uri )
{
	Application.sendMessage( { command: 'seturl', url: uri } );
}

function displayCommunities( url, communities, users )
{
	// Only one user? change the format of the display
	var userName;
	var community, user;

	// Load the community default image
	var self = this;
	if ( !this.communityImage )
	{
		var image = new Image();
		image.onload = function()
		{
			var canvas = document.createElement( 'canvas' );
			canvas.width = 32;
			canvas.height = 32;
			var context = canvas.getContext( '2d' );
			context.drawImage( this, 0, 0, 32, 32 );				
			self.communityImage = canvas.toDataURL();				
			setHTML();
		};
		image.src = '/webclient/gfx/fnetCommunity.png';
	}
	else
	{
		setHTML();
	}
	function setHTML()
	{
		var tab = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
		var html = '';
		if ( users.length > 1 )
		{
			// List the communities
			html +=    	   	   '<div class="ContentFull">\
									<div class="HRow">\
										<div class="FloatLeft"><h2>Communities:</h2></div>\
									</div>';
			for ( l = 0; l < communities.length; l++ )
			{
				community = communities[ l ];
				html +=            '<div class="HRow">\
										<div class="FloatLeft">\
											<img style="width: 32px; height: 32px; vertical-align: middle" src="' + communityImage + '">\
										</div>\
										<div class="FloatLeft">\
											<h3>' + community.name + '</h3>\
										</div>\
									</div>';
			}
			html +=	   			   '<div class="HRow">\
										<div class="FloatLeft">' + tab + '</div>\
									</div>';

			// List the users
			html +=	   			   '<div class="HRow">\
										<div class="FloatLeft"><h2>Users:</h2></div>\
									</div>';
			for ( u = 0; u < users.length; u++ )
			{
				user = users[ u ];
				html +=		       '<div class="HRow">\
										<div class="FloatLeft">\
											<img style="width: 32px; height: 32px; vertical-align: middle" src="' + user.image + '">\
										</div>\
										<div class="FloatLeft">\
											<h3>' + user.name + ' (' + user.fullName + ')</h3>\
										</div>\
									</div>';
				if ( user.sharing.length )
				{
					html +=		   '<div class="HRow">\
										<div class="FloatLeft">' + tab + '</div>\
										<div class="FloatLeft">Sharing:</div>\
									</div>';
					for ( var s = 0; s < user.sharing.length; s++ )
					{
						var sharing = user.sharing[ s ];
						html +=	   '<div class="HRow">\
										<div class="FloatLeft">' + tab + '</div>\
										<div class="FloatLeft">' + tab + '</div>\
										<div class="FloatLeft">\
											<img style="width: 32px; height: 32px; vertical-align: middle" src="' + sharing.image + '">\
										</div>\
										<div class="FloatLeft">\
											' + sharing.name + ' (' + sharing.type + ')\
										</div>\
									</div>';
					}
				}
				if ( user.communities.length )
				{
					html +=			   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">Member of:</div>\
										</div>';
					for ( var c = 0; c < user.communities.length; c++ )
					{
						html +=		   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">\
												- ' + user.communities[ c ] + '\
											</div>\
										</div>';
					}
				}
				html +=				   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
										</div>';
			}
			html += 	       '</div>';
		}
		else
		{
			// List the users (only one!)
			for ( u = 0; u < users.length; u++ )
			{
				user = users[ u ];
				html +=		       '<div class="ContentFull">\
										<div class="HRow">\
											<div class="FloatLeft">\
												<img style="width: 32px; height: 32px; vertical-align: middle" src="' + user.image + '">\
											</div>\
											<div class="FloatLeft">\
												<h3>' + user.name + ' (' + user.fullName + ')</h3>\
											</div>\
										</div>';
				if ( user.sharing.length )
				{
					html +=			   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">Sharing:</div>\
										</div>';
					for ( var s = 0; s < user.sharing.length; s++ )
					{
						var sharing = user.sharing[ s ];
						html +=		   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">\
												<img style="width: 32px; height: 32px; vertical-align: middle" src="' + sharing.image + '">\
											</div>\
											<div class="FloatLeft">\
												' + sharing.name + ' (' + sharing.type + ')\
											</div>\
										</div>';
					}
				}
				if ( user.communities.length )
				{
					html +=			   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">Member of:</div>\
										</div>';
					for ( var c = 0; c < user.communities.length; c++ )
					{
						html +=		   '<div class="HRow">\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">' + tab + '</div>\
											<div class="FloatLeft">\
												- ' + user.communities[ c ] + '\
											</div>\
										</div>';
					}
				}
				html += 	       '</div>';
			}
		}
		
		// Changes the iFrame
		var fr = document.createElement( 'iframe' );
		fr.className = 'Browser';
		fr.id = 'BrowserBox';
		fr.src = '/webclient/sandboxed.html';
		ge( 'BrowserBox' ).parentNode.replaceChild( fr, ge( 'BrowserBox' ) );
		var doc = ge( 'BrowserBox' ).contentDocument || ge( 'BrowserBox' ).contentWindow.document;		
		fr.addEventListener( 'load', function()
		{
			fr.contentWindow.postMessage( JSON.stringify( { command: 'setbodycontent', data: html } ), '*' );
		} );
	}
}
