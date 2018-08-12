
// Confirm our form!
function ConfirmSignupForm()
{
	var fPane = ge( 'AboutFriend' );
	if( !fPane ) return;
	
	var eles = fPane.getElementsByTagName( 'input' );
	
	var elements = {
		email: null,
		name: null,
		password: null,
		check1: null,
		check2: null,
		check3: null
	};
	
	var byname = {};
	
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].type == 'checkbox' )
			elements[eles[a].name] = eles[a].checked ? true : false;
		else elements[eles[a].name] = eles[a].value;
		byname[eles[a].name] = eles[a];
	}
	
	for( var a in elements )
	{
		if( !elements[a] )
		{	
			Alert( 'Form not correctly filled out', 'You forgot to fill in the form correctly. Please review your form and try again.', 'Understood', function()
			{ byname[a].focus(); } );
			return;
		}
	}
	
	if( elements.email.indexOf( '@' ) <= 0 || elements.email.indexOf( '.' ) <= 0 )
	{
		Alert( 'Illegal e-mail address', 'The e-mail address you entered is written incorrectly. Please try again.', 'Understood', function()
		{
			byname[ 'email' ].focus();
		} );
		return;
	}
	
	if( elements.password.length < 6 )
	{
		Alert( 'Too few characters in password', 'Be mindful of security. Choose a password that has at least 6 characters. We suggest that you use both upper and lowercase letters, as well as numerals and other characters.', false, function(){ byname[ 'password' ].focus(); } );
		return;
	}
	
	var ca = new Module( 'go' );
	ca.onExecuted = function( res, dat )
	{
		if( res == 'ok' )
		{
			var d = null;
			try
			{
				d = JSON.parse( dat );
			}
			catch( e )
			{
				d = null;
			}
			if( !d )
			{
				Alert( 'Could not init captcha', 'Please close this window and try again, or contact support@friendup.cloud.' );
				return;
			}
			
			ge( 'AboutFriend' ).className = 'Confirm';
				
			function capcall( cres )
			{
				if( cres )
				{
					var n = new Module( 'go' );
					n.onExecuted = function( rd, dd )
					{
						if( rd == 'ok' )
						{
							var verification = false;
							try
							{
								verification = JSON.parse( dd );
							}
							catch( e )
							{
								Alert( 'Could not verify captcha.', 'Please try again.' );
								grecaptcha.render( 'confirm_captcha', {
									'sitekey' : d.captcha,
									'callback' : capcall 
								} );
								return;
							}
							
							if( verification.result == cres )
							{
								// Send welcome e-mail
								var m = new Module( 'go' );
								m.onExecuted = function( er, da )
								{
									if( er != 'ok' )
									{
										Alert( 'Something went wrong', 'Could not parse server response. Please contact our team at support@friendup.cloud' );
										return;
									}
									else
									{
										var f = new File( '/webclient/templates/about_go_confirmcode.html' );
										f.onLoad = function( data )
										{
											var c = ge( 'ConfirmContent' ).getElementsByTagName( 'input' )[0];
											ge( 'ConfirmContent' ).innerHTML = data;
										}
										f.load();
									}
								}
								elements.password = '{S6}' + Sha256.hash( 'HASHED' + Sha256.hash( elements.password ) );
								m.execute( 'signupemailconfirmation', elements );
							}
							else
							{
								Alert( 'The verification failed.', 'Please try again.' );
								grecaptcha.render( 'confirm_captcha', {
									'sitekey' : d.captcha,
									'callback' : capcall 
								} );
							}
						}
						else
						{
							Alert( 'Could not verify captcha', 'Please try again.' );
							grecaptcha.render( 'confirm_captcha', {
								'sitekey' : d.captcha,
								'callback' : capcall 
							} );
						}
					}
					n.execute( 'captchaverify', { response: cres } );
				}
				// Error..
				else
				{
					Alert( 'Could not init captcha', 'Please close this window and try to sign up again.' );
					grecaptcha.render( 'confirm_captcha', {
						'sitekey' : d.captcha,
						'callback' : capcall 
					} );
				}
			}
			
			var f = new File( '/webclient/templates/about_go_captcha.html' );
			f.onLoad = function( data )
			{
				ge( 'ConfirmContent' ).innerHTML = data;
				grecaptcha.render( 'confirm_captcha', {
					'sitekey' : d.captcha,
					'callback' : capcall 
				} );
			}
			f.load();
		}
		else
		{
			Alert( 'Could not load captcha', 'Please contact support@friendup.cloud.' );
			return;
		}
	}
	ca.execute( 'captcha' );
}

function ConfirmSignupCode()
{
	var c = ge( 'ConfirmContent' ).getElementsByTagName( 'input' )[0];
	if( !c.value )
	{
		Alert( 'Please enter your code', 'You need to fill in your confirmation code in the input field.', 'Filling it in', function()
		{ c.focus(); } );
		return;
	}
	var m = new Module( 'go' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' && d != 'fail' )
		{
			var f = new File( '/webclient/templates/about_go_completed.html' );
			f.onLoad = function( data )
			{
				ge( 'ConfirmContent' ).innerHTML = data;
			}
			f.load();
		}
		else
		{
			Alert( 'Confirmation failed', 'The code you entered does not match your personal confirmation code.', 'Try again' );
		}
	}
	m.execute( 'confirmcode', { code: c.value } );
}

function AboutFriendTerms()
{
	var v = new View( {
		title: 'Our Terms',
		width: 500,
		height: 700,
		id: 'terms'
	} );
	var f = new File( '/webclient/templates/eula_short.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function AboutFriendPolicy()
{
	var v = new View( {
		title: 'Our Privacy Policy',
		width: 500,
		height: 400,
		id: 'terms'
	} );
	var f = new File( '/webclient/templates/policy.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function AboutFriendCookie()
{
	var v = new View( {
		title: 'Our Cookie Policy',
		width: 500,
		height: 300,
		id: 'terms'
	} );
	var f = new File( '/webclient/templates/policy_cookies.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}
