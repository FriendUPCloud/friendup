/*
	Application that will run Google Docs and Spreadcheats right inside the users Workspace!
*/
Application.run = function( conf )
{
	
	if( conf.args )
	{
			
		this.tmp = conf.args.split(':');
		
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
			}
			
			var self = this;
			
			if( self.tmp.file_url )
			{
				self.tmp.file_url = ( self.tmp.file_url.split( 'path=' ).join( 'sessionid=' + Application.sessionId + '&path=' ) );
			}
			
			Application.authWindow( self.tmp );
			
			console.log( 'init auth popup ...' );
			
			return;
			
			var callback = function( e, d )
			{
				
				if( e == 'ok' && d && d.decrypted )
				{
					
					try
					{
						self.tmp.decrypted = JSON.parse( d.decrypted );
						
						if( self.tmp.decrypted && self.tmp.decrypted.id_token )
						{
							var decoded = Application.decodeIDToken( self.tmp.decrypted );
							
							if( decoded )
							{
								self.tmp.decrypted = decoded;
							}
						}
					}
					catch( e ) {  }
					
					console.log( 'tmp ', self.tmp );
					
					if( self.tmp.decrypted.access_token )
					{
												
						Application.getAccountInfo( self.tmp.decrypted.access_token, function( e, d )
						{
							
							if( e && d && d.user && d.user.emailAddress )
							{
								self.tmp.google_id = d.user.emailAddress;
							}
							
							//Application.authWindow( self.tmp );
							
							//function closeThisWindow()
							//{
								
							//	setTimeout( function(){ Application.quit(); }, 1000 );
								
							//}
							
							// TODO: Load in template with javascript instead for file ...
							
							// TODO: THIS CRAP NEEDS TO BE DONE SIMPLER, LOAD JS FILES PROPERLY TO A TEMPLATE AND OR EVAL ....
							
							//var w = new View( { title: 'Google Editor', width: 350, height: 100 } );
							//w.setFlag('allowPopups', true);
							//w.setContent('<div style="padding:25px;"><p><a href="javascript:void(0)" onclick="' + Application.oauth2Window( self.tmp, Application, w, closeThisWindow ) + '" class="Button fa-google IconSmall"> &nbsp; open in google editor</a> or <a href="javascript:void(0)" onclick="' + Application.initJS( Application, self.tmp ) + '" class="Button fa-google IconSmall"> &nbsp; view as pdf</a></p></div>');
							
							//w.onClose = function()
							//{
							//	Application.quit();
							//}
							
						} );
					}
					
				}
				else
				{
					console.log( { e:e, d:d } );
				}
				
			};
			
			if( self.tmp && self.tmp.encrypted )
			{
				Application.encryption.decrypt( self.tmp.encrypted, callback );
			}
			else
			{
				callback( 'ok', ( self.tmp && self.tmp.decrypted ? self.tmp : false ) );
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

Application.displayEditor = function(title,url,popup)
{
		// TODO: Set iframe options ...		
		
		if( !popup )
		{
			var v = new View({
				width:1000,
				height:850,
				title: title
			});
		
			//v.limitless = true;
		
			v.onClose = function()
			{
				Application.quit();
			};
			v.setRichContentUrl( url );
		
			//var ifr = document.createElement( 'iframe' );
			//ifr.src = url;
		
			//ifr.setAttribute( 'sandbox', 'allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation' );
		
			//document.body.appendChild( ifr );
		
			//console.log( ifr );
		}
		else
		{
			// NOTE: Can't use iframes Google refuses access for it ... will have to use popup window to show editor ...
		
			var winw = Math.min( 1000, screen.availWidth );
			var winh = Math.min( 850, screen.availHeight );
		
			var lpos = Math.floor( ( screen.availWidth - winw ) / 2  );
			var tpos = Math.floor( ( screen.availHeight - winh ) / 2  );
			
			window.open( url, title, 'resizable=1,width=' + winw + ',height=' + winh + ',top=' + tpos + ',left=' + lpos );
			
		}
}

Application.initEditor = function( title, url, popup )
{
	if( url && title )
	{
		Application.displayEditor( title, url, popup );
		return true;
	}

	Notify({'title':'Error','description':'Could not open file!'});
	Application.quit();
	return false;
}

Application.receiveMessage = function( msg )
{
	//console.log( 'got a message',msg );
	if( !msg.cmd ) return;
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

Application.initJS = function( application, tmp, edit )
{
	var str = "";
	
	// TODO: Fix the problem viewing pdf inside iframe from friendcore, until then using popup window for now ...
	
	//console.log( tmp );
	
	str += " var Application = { initEditor: "+Application.initEditor+", displayEditor: "+Application.displayEditor+", quit: "+Application.quit+" }; ";
	
	if( edit )
	{
		str += " return Application.initEditor( '"+tmp.title+"', '"+tmp.url+"', true ); ";
	}
	else
	{
		str += " return Application.displayEditor( '"+tmp.title+"', '"+tmp.file_url+"', true ); ";
	}
	
	return str;
}

Application.oauth2Window = function( tmp, Application, w, closeThisWindow )
{
	var ret = "";
	
	//console.log( w );
	
	ret+= " var Application = { displayEditor: "+Application.displayEditor+", initEditor: "+Application.initEditor+", quit: "+Application.quit+" }; ";
	
	ret+= " var w = { close: "+w.close+" }; ";
	
	ret+= " var closeThisWindow = "+closeThisWindow+"; ";
	
	ret+= " var CLIENT_ID    = '"+tmp.client_id+"'; ";
	ret+= " var REDIRECT_URI = '"+tmp.redirect_uri+"'; ";
	ret+= " var GOOGLE_ID    = '"+(tmp.google_id?tmp.google_id:null)+"'; "
	
	ret+= " var SCOPES = [ 'profile', 'email' ]; ";
	
	ret+= " var winw = Math.min( 600, screen.availWidth ); ";
	ret+= " var winh = Math.min( 750, screen.availHeight ); ";
	
	ret+= " var lpos = Math.floor( ( screen.availWidth - winw ) / 2  ); ";
	ret+= " var tpos = Math.floor( ( screen.availHeight - winh ) / 2  ); ";
	
	// Google's OAuth 2.0 endpoint for requesting an access token
	ret+= " var oauth2 = 'https://accounts.google.com/o/oauth2/v2/auth'; ";
	
	ret+= " var vars = ''; ";
	
	// Parameters to pass to OAuth 2.0 endpoint.
	ret+= " vars += '?redirect_uri=' + REDIRECT_URI; ";
	ret+= " vars += '&client_id=' + CLIENT_ID; ";
	ret+= " vars += '&nonce=' + '"+Application.getRandomString( 20 )+"'; ";
	ret+= " vars += '&scope=' + SCOPES.join( ' ' ); ";
	ret+= " vars += '&response_type=token id_token'; ";
	
	ret+= " if( GOOGLE_ID ) ";
	ret+= " { ";
	ret+= " 	vars += '&login_hint=' + GOOGLE_ID; ";
	ret+= " } ";
	
	//ret+= " console.log( 'args: ' + vars ); ";
	
	ret+= " var loginwindow = window.open( oauth2 + vars, 'google', 'resizable=1,width=' + winw + ',height=' + winh + ',top=' + tpos + ',left=' + lpos ); ";
	
	ret+= " window.addEventListener( 'message', function( msg )  ";
	ret+= " { ";
		
	ret+= " 	if( msg && msg.data.url ) ";
	ret+= " 	{ ";
	ret+= " 		var params = {}; var args = false; ";
			
	//ret+= " 		console.log( 'oauth msg: ', msg.data.url ); ";
			
	ret+= " 		if( msg.data.url.split( '#' )[1] ) ";
	ret+= " 		{ ";
	ret+= " 		    args = msg.data.url.split( '#' )[1].split( '&' ); ";
	ret+= " 		} ";
	ret+= " 		else if( msg.data.url.split( '?' )[1] ) ";
	ret+= " 		{ ";
	ret+= " 		    args = msg.data.url.split( '?' )[1].split( '&' ); ";
	ret+= " 		} ";
			
	ret+= " 	    if( args && args.length > 0 ) ";
	ret+= " 	    { ";
	ret+= " 	        for( var key in args ) ";
	ret+= " 	        { ";
	ret+= " 	            if( args[key] && args[key].split( '=' )[1] ) ";
	ret+= " 	            { ";
	ret+= " 	                params[ args[key].split( '=' )[0] ] = args[key].split( '=' )[1]; ";
	ret+= " 	            } ";
	ret+= " 	        } ";
	ret+= " 	    } ";
			
	ret+= " 		if( loginwindow ) loginwindow.close(); ";
	
	ret+= "			console.log( '"+w.getViewId()+"' ); ";
	//ret+= " 		closeThisWindow(); ";
	
	ret+= " 		if( params.access_token ) ";
	ret+= " 		{ ";
	ret+= " 			return Application.initEditor( '"+tmp.title+"', '"+tmp.url+"', true ); ";
	ret+= " 		} ";
			
	ret+= " 		return false; ";
			
	ret+= " 	} ";
		
	ret+= " } ); ";
	
	return ret;
	
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
				
				var w = new View( { title: 'Google Editor', width: 350, height: 100 } );
				w.setFlag('allowPopups', true);
				w.setContent('<div style="padding:25px;"><p><a href="javascript:void(0)" onclick="' + Application.initJS( Application, tmp, true ) + '" class="Button fa-google IconSmall"> &nbsp; open in google editor</a> or <a href="javascript:void(0)" onclick="' + Application.initJS( Application, tmp ) + '" class="Button fa-google IconSmall"> &nbsp; view as pdf</a></p></div>');
				
				w.onClose = function()
				{
					Application.quit();
				}
				
				//return Application.initEditor( tmp.title, tmp.url, true );
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

