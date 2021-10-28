/*
	Application that will run Google Docs and Spreadcheats right inside the users Workspace!
*/
Application.run = function( conf )
{
	
	if( conf.args )
	{
			
		this.tmp = conf.args.split(':');
		
		//Application.initWindow();
		
		var f = new File( conf.args );
		f.onLoad = function( data )
		{
			this.tmp = false;
			
			//<!--separate-->
			if( data.indexOf('###') > 0 )
			{
				tmp = data.split( '###' );
				data = tmp[1];
			}
			
			this.tmp = false;
			
			try{
				this.tmp = JSON.parse( data )
			}
			catch(e)
			{
				console.log('data was not json',data);
				return;
			}
			
			var self = this;
			
			if( self.tmp.file_url )
			{
				self.tmp.file_url = ( self.tmp.file_url.split( 'path=' ).join( 'sessionid=' + Application.sessionId + '&path=' ) );
			}
			
			console.log( self.tmp );
			
			var CLIENT_ID    = self.tmp.client_id;
			var REDIRECT_URI = self.tmp.redirect_uri;
			var GOOGLE_ID    = ( self.tmp.user && self.tmp.user.emailAddress ? self.tmp.user.emailAddress : null );
			var STATE_VAR    = ( self.tmp.state_var ? self.tmp.state_var : null );
			
			var SCOPES = [ 'profile', 'email' ];

			// Google's OAuth 2.0 endpoint for requesting an access token
			var oauth2 = 'https://accounts.google.com/o/oauth2/v2/auth';

			var vars = '';

			// Parameters to pass to OAuth 2.0 endpoint.
			vars += '?redirect_uri=' + REDIRECT_URI;
			vars += '&client_id=' + CLIENT_ID;
			vars += '&scope=' + SCOPES.join( ' ' );
			vars += '&response_type=token';
			
			if( STATE_VAR )
			{
				vars += '&state=' + STATE_VAR;
			};
			
			if( GOOGLE_ID )
			{
				vars += '&login_hint=' + GOOGLE_ID;
			}
			
			var w = new View( { title: 'Google file', width: 355, height: 110 } );
			w.setFlag( 'allowPopups', true );
			//w.setContent('<div style="padding-left:20px;padding-right:20px;padding-bottom:15px;"><p>This is a Google native file, and can only be edited in Google\'s online suite.</p><p><a target="_blank" href="' + oauth2 + vars + '" onclick="CloseView()" class="Button">Open with Google</a> <a href="javascript:void(0)" onclick="' + Application.initJS( Application, self.tmp, false, w ) + '" class="Button">View as pdf</a></p></div>');
			w.setContent('<div style="padding-left:20px;padding-right:20px;padding-bottom:15px;"><p>This is a Google native file, and can only be edited in Google\'s online suite.</p><p><a target="_blank" href="' + oauth2 + vars + '" onclick="CloseView()" class="Button">Open with Google</a> <a href="javascript:void(0)" onclick="' + Application.initJSCode( self.tmp, w ) + '" class="Button">View as pdf</a></p></div>');
			w.onClose = function()
			{
				Application.quit();
			}
			
			return;
			
		}
		f.call('execute');
		
	}
	else
	{
		Notify({'title':'Error','description':'No file to open given!'});
		Application.quit();
	}

}

// TODO: Add sendMessage functionality ...

Application.initWindow = function()
{
	var w = new View( { title: 'Google file', width: 355, height: 110 } );
	w.setFlag( 'allowPopups', true );
	w.setContent('<div style="padding-left:20px;padding-right:20px;padding-bottom:15px;"><p>This is a Google native file, and can only be edited in Google\'s online suite.</p><p><a target="_blank" href="javascript:void(0)" onclick="CloseView()" class="Button">Open with Google</a> <a href="javascript:void(0)" onclick="console.log(\'jalla\')" class="Button">View as pdf</a></p></div>');
	w.onClose = function()
	{
		Application.quit();
	}
}

Application.displayPdf = function( title, url )
{
	
	var w = new View( { title: title, width: 1000, height: 850 } );
	w.setContent( '<iframe style=\'width:100%;height:100%;margin:0;border-radius:0;\' src=\'' + url + '\'></iframe>' );
	w.onClose = function(  )
	{
		//Application.quit();
	}
	
}

Application.initJSCode = function( tmp, w )
{
	var str = "";
	//str += " var w = "+w+"; ";
	//str += " CloseView( w ); ";
	str += " var Application = { displayPdf: "+Application.displayPdf+" }; ";	
	str += " return Application.displayPdf( '"+tmp.title+"', '"+tmp.file_url+"' ); ";
	
	return str;
}

Application.displayEditor = function( title, url, popup, viewId )
{
		
		console.log( viewId );
		
		if( viewId )
		{
			//CloseView( viewId );
		}
		
		var ww = new View({
			width:1000,
			height:850,
			title: title
		});
	
		//v.limitless = true;
		
		ww.onClose = function()
		{
			//Application.quit();
		};
		ww.setRichContentUrl( url );
		
		//var ifr = document.createElement( 'iframe' );
		//ifr.src = url;
	
		//ifr.setAttribute( 'sandbox', 'allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation' );
	
		//document.body.appendChild( ifr );
	
		//console.log( ifr );
			
}

Application.initEditor = function( title, url, popup, viewId )
{
	if( url && title )
	{
		displayEditor( title, url, popup, viewId );
		return true;
	}
	
	Notify({'title':'Error','description':'Could not open file!'});
	Application.quit();
	return false;
}

Application.decodeIDToken = function( params )
{
	if ( params && params[ 'id_token' ] )
	{
		var parts = params[ 'id_token' ].split( '.' );
		
		if( parts.length == 3 )
		{
			var data = { 'base64': parts };
			
			for( var a in parts )
			{
				if( a <= 1 && parts[a] )
				{
					try
					{
						var decoded = atob( parts[a] );
						
						if( decoded )
						{
							var obj = JSON.parse( decoded );
							
							if( obj )
							{
								data[ a == 0 ? 'header' : 'payload' ] = obj;
							}
						}
					}
					catch {  }
				}
				else if( a == 2 )
				{
					data[ 'signature' ] = parts[a];
				}
			}
			
			params[ 'id_token_content' ] = data;
			
		}
		
	}
	
	return params;
}

Application.initJS = function( application, tmp, edit, w )
{
	var str = "";
	
	// TODO: Fix the problem viewing pdf inside iframe from friendcore, until then using popup window for now ...
	
	str += " var Application = { initEditor: "+Application.initEditor+", displayEditor: "+Application.displayEditor+", quit: "+Application.quit+" }; ";
	
	var viewId = ( w ? ( "'" + w.getViewId() + "'" ) : false );
	
	if( edit )
	{
		str += " return Application.initEditor( '"+tmp.title+"', '"+tmp.url+"', true, "+viewId+" ); ";
	}
	else
	{
		str += " return Application.displayEditor( '"+tmp.title+"', '"+tmp.file_url+"', false, "+viewId+" ); ";
	}
	
	return str;
}

Application.authWindow = function( tmp )
{
	
	var CLIENT_ID    = tmp.client_id;
	var REDIRECT_URI = tmp.redirect_uri;
	var GOOGLE_ID    = ( tmp.google_id ? tmp.google_id : null );
	
	var SCOPES = [ 'profile', 'email' ];
	
	var winw = Math.min( 600, screen.availWidth );
	var winh = Math.min( 750, screen.availHeight );
	
	var lpos = Math.floor( ( screen.availWidth - winw ) / 2  );
	var tpos = Math.floor( ( screen.availHeight - winh ) / 2  );
	
	// Google's OAuth 2.0 endpoint for requesting an access token
	var oauth2 = 'https://accounts.google.com/o/oauth2/v2/auth';
	
	var vars = '';
	
	// Parameters to pass to OAuth 2.0 endpoint.
	vars += '?redirect_uri=' + REDIRECT_URI;
	vars += '&client_id=' + CLIENT_ID;
	vars += '&nonce=' + Application.getRandomString( 20 );
	vars += '&scope=' + SCOPES.join( ' ' );
	vars += '&response_type=token id_token';
	
	if( GOOGLE_ID )
	{
		vars += '&login_hint=' + GOOGLE_ID;
	}
	
	//console.log( 'args: ' + vars );
	
	var loginwindow = window.open( oauth2 + vars, 'oauth', 'resizable=1,width=' + winw + ',height=' + winh + ',top=' + tpos + ',left=' + lpos );
	
	window.addEventListener( 'message', function( msg ) 
	{
		
		if( msg && msg.data.url )
		{
			var params = {}; var args = false;
			
			//console.log( 'oauth msg: ', msg.data.url );
			
			if( msg.data.url.split( '#' )[1] )
			{
			    args = msg.data.url.split( '#' )[1].split( '&' );
			}
			else if( msg.data.url.split( '?' )[1] )
			{
			    args = msg.data.url.split( '?' )[1].split( '&' );
			}
			
		    if( args && args.length > 0 )
		    {
		        for( var key in args )
		        {
		            if( args[key] && args[key].split( '=' )[1] )
		            {
		                params[ args[key].split( '=' )[0] ] = args[key].split( '=' )[1];
		            }
		        }
		    }
			
			if( loginwindow ) loginwindow.close();
			
			if( params.access_token )
			{
				return Application.initEditor( tmp.title, tmp.url, true );
			}
			
			return false;
			
		}
		
	} );
	
}

Application.getRandomString = function( length ) 
{
	var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var result = '';
	for ( var i = 0; i < length; i++ ) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	}
	return result;
}

Application.getAccountInfo = function( access_token, callback )
{
	if( access_token )
	{
		
		var xhr = new XMLHttpRequest();
		xhr.open( 'GET', 'https://www.googleapis.com/drive/v3/about?fields=user&access_token=' + access_token );
		xhr.onreadystatechange = function ( e ) 
		{
			if ( xhr.readyState === 4 && xhr.status === 200 ) 
			{
				console.log( xhr.response );
				
				var data = xhr.response;
				
				try
				{
					data = JSON.parse( data );
				}
				catch( e )
				{
					
				}
				
				if( callback && typeof( callback ) == 'function' ) return callback( true, data );
			} 
			else if ( xhr.readyState === 4 && xhr.status === 401 ) 
			{
				// Token invalid, so prompt for user permission.
				if( callback && typeof( callback ) == 'function' ) return callback( false, xhr.response );
			}
		};
		xhr.send( null );
		
	}
	
	if( callback && typeof( callback ) == 'function' ) return callback( false );
}

function test ( client_id, redirect_uri )
{
	
	//GET https://YOUR_DOMAIN/authorize
    //?response_type=id_token token&
    //client_id=...&
    //redirect_uri=...&
    //state=...&
    //scope=openid...&
    //nonce=...&
    //audience=...&
    //response_mode=...&
    //prompt=none
    
    
    var CLIENT_ID    = client_id;
	var REDIRECT_URI = redirect_uri;
	
	var SCOPES = [ 'openid', 'account', 'email' ];
	
	var winw  = Math.min( 600, screen.availWidth );
	var winh = Math.min( 750, screen.availHeight );
	
	var lpos = Math.floor( ( screen.availWidth - winw ) / 2  );
	var tpos  = Math.floor( ( screen.availHeight - winh ) / 2  );
	
	// Google's OAuth 2.0 endpoint for requesting an access token
	var oauth2 = 'https://accounts.google.com/o/oauth2/v2/auth';
	
	var vars = '';
	
	// Parameters to pass to OAuth 2.0 endpoint.
	vars += '?redirect_uri=' + REDIRECT_URI;
	vars += '&client_id=' + CLIENT_ID;
	vars += '&nonce=' + Application.getRandomString( 20 );
	vars += '&scope=' + SCOPES.join( ' ' );
	vars += '&response_type=id_token token';
	vars += '&prompt=none';
	
	var w = new View( { title: 'Oauth Iframe', width: 500, height: 340 } );
	w.setFlag( 'allowPopups', true );
	w.setContent( '<iframe src="' + oauth2 + vars + '"></iframe>' );
	
	//loginwindow = window.open( oauth2 + vars, 'authwindow', 'resizable=1,width=' + winw + ',height=' + winh + ',top=' + tpos + ',left=' + lpos );
	
	//window.addEventListener( 'message', function( msg ) 
	//{
		
	//	if( msg && msg.data.url )
	//	{
	//		console.log( msg.data.url );	
	//	}

	//} );
    
}

function test_2( user_id_token )
{
	
	request = new XMLHttpRequest();
	request.open( 'POST', 'https://www.googleapis.com/oauth2/v3/tokeninfo' );
	request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	request.onload = function() 
	{
		console.log( request.responseText );
	};
	request.send( 'id_token=' + user_id_token );
	
}

function test_3( refresh_token, client_id, client_secret )
{
	
	request = new XMLHttpRequest();
	request.open( 'POST', 'https://www.googleapis.com/oauth2/v3/token' );
	request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	request.onload = function() 
	{
		console.log( 'test_3 ' + request.responseText );
	};
	request.send( 'grant_type=refresh_token&refresh_token=' + refresh_token + '&client_id=' + client_id + '&client_secret=' + client_secret );
	
}

function test_4( code, client_id, client_secret, redirect_uri )
{
	
	//code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7&
	//client_id=your_client_id&
	//client_secret=your_client_secret&
	//redirect_uri=https%3A//oauth2.example.com/code&
	//grant_type=authorization_code
	
	request = new XMLHttpRequest();
	request.open( 'POST', 'https://oauth2.googleapis.com/token' );
	request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	request.onload = function() 
	{
		console.log( 'test_4 ' + request.responseText );
	};
	request.send( 'grant_type=authorization_code&code=' + code + '&client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirect_uri );
	
}

