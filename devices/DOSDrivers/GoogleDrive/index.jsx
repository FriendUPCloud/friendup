/*
	Application that will run Google Docs and Spreadcheats right inside the users Workspace!
*/
Application.run = function( conf )
{
	
	if( conf.args )
	{
			
		var tmp = conf.args.split(':');
		
		var f = new File( conf.args );
		f.onLoad = function( data )
		{
			console.log( data );
			
			var tmp = false;
			
			//<!--separate-->
			if( data.indexOf('###') > 0 )
			{
				tmp = data.split( '###' );
				data = tmp[1];
			}
			
			tmp = false;
			
			try{
				tmp = JSON.parse( data )
			}
			catch(e)
			{
				console.log('data was not json',data);
			}
			
			var callback = function( e, d )
			{
			
				//console.log( { e:e, d:d } );
				
				if( e == 'ok' && d && d.decrypted )
				{
					
					try
					{
						tmp.decrypted = JSON.parse( d.decrypted );
						
						if( tmp.decrypted && tmp.decrypted.id_token )
						{
							var decoded = Application.decodeIDToken( tmp.decrypted );
							
							if( decoded )
							{
								tmp.decrypted = decoded;
							}
						}
					}
					catch( e ) {  }
					
					console.log( 'tmp ', tmp );
					
					if( tmp.client_id && tmp.redirect_uri )
					{
						//test ( tmp.client_id, tmp.redirect_uri );
					}
					
					if( tmp.decrypted.access_token )
					{
						Application.getAccountInfo( tmp.decrypted.access_token, function( e, d )
						{
							
							console.log( { e:e, d:d } );
							
							if( e )
							{
								
								if( tmp && tmp.url && tmp.title )
								{
									Application.displayEditor( tmp.title, tmp.url );
									return;
								}
			
								Notify({'title':'Error','description':'Could not open file!'});
								Application.quit();
								
							}
							else
							{
								
								Application.oauth2Window( tmp.client_id, tmp.redirect_uri, function ( data )
								{
									
									console.log( data );
									
									if( tmp && tmp.url && tmp.title )
									{
										Application.displayEditor( tmp.title, tmp.url );
										return;
									}
			
									Notify({'title':'Error','description':'Could not open file!'});
									Application.quit();
									
								} );
								
							}
							
						} );
					}
					
				}
				else
				{
					console.log( { e:e, d:d } );
				}
				
			};
			
			if( tmp && tmp.encrypted )
			{
				Application.encryption.decrypt( tmp.encrypted, callback );
			}
			else
			{
				callback( 'ok', ( tmp && tmp.decrypted ? tmp.decrypted : false ) );
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

Application.displayEditor = function(title,url)
{
		var v = new View({
			width:640,
			height:480,
			title: title
		});
		
		v.onClose = function()
		{
			Application.quit();
		};
		v.setRichContentUrl( url );
				
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

Application.oauth2Window = function( client_id, redirect_uri, callback )
{
	var CLIENT_ID    = client_id;
	var REDIRECT_URI = redirect_uri;
	
	var SCOPES = [ 'profile', 'email' ];
	
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
	vars += '&response_type=token';
	
	loginwindow = window.open( oauth2 + vars, 'authwindow', 'resizable=1,width=' + winw + ',height=' + winh + ',top=' + tpos + ',left=' + lpos );
	
	window.addEventListener( 'message', function( msg ) 
	{
		
		if( msg && msg.data.url )
		{
			var params = {}; var args = false;
			
			if( Application.showLog || 1==1 ) console.log( 'oauth msg: ', msg.data.url );
			
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
			
			if( callback && typeof( callback ) == 'function' ) return callback( params );
					
			return params;
			
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
				
				if( callback && typeof( callback ) == 'function' ) return callback( true, xhr.response );
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
	vars += '&nonce=' + getRandomString( 20 );
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

