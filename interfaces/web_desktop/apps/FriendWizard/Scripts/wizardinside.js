var step = 0;

var content = {};


Application.run = function()
{
	initStep( 0 );
}

function initStep( s )
{
	if( step < 0 ) step = 0;
	step = s;
	
	switch( step )
	{
		case 0:
			content.header = i18n( 'i18n_step_1' );
			content.description = i18n( 'i18n_step_1_desc' ).split( ' | ' ).join( '</p><p>' );
			content.image = 'Progdir:Gfx/step_1.jpg';
			content.sound = 'Progdir:Data/step_1.mp3';
			ge( 'FooterLeft' ).innerHTML = '';
			var btn = document.createElement( 'button' );
			btn.className = 'FullWidth Neutral IconSmall fa-check';
			btn.innerHTML = ' ' + i18n( 'i18n_optimal_defaults' );
			btn.onclick = function()
			{
				initStep( 0 );
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e != 'ok' )
						return;
					Application.sendMessage( {
						type: 'system',
						command: 'refreshtheme',
						theme: 'friendup12'
					} );
					Application.quit();
				}
				m.execute( 'themesettings', { setup: 'defaults' } );
			}
			ge( 'FooterLeft' ).appendChild( btn );
			// Go to next step
			var bt2 = ge( 'FooterRight' ).getElementsByTagName( 'button' )[0];
			bt2.className = 'FullWidth Neutral IconSmall fa-arrow-right';
			bt2.innerHTML = ' ' + i18n( 'i18n_continue' );
			bt2.onclick = function()
			{
				initStep( step + 1 );
			}
			break;
		case 1:
			var icons = {
				'Looknfeel': 'Look and feel',
				'Wallpaper': 'Wallpaper',
				'Dock': 'Launcher',
				'Account': 'Your account',
				'FriendMarketplace': 'The marketplace'
			};
			
			var iconshtml = '';
			for( var a in icons )
			{
				var img = '/webclient/apps/' + a + '/icon.png';
				var la = icons[a];
				iconshtml += `
				<div class="IconLauncher MousePointer" onclick="launch('${a}')">
					<div class="IconImage" style="background-image: url(${img})"></div>
					<div class="IconLabel">${la}</div>
				</div>
				`;
			}
		
			content.header = i18n( 'i18n_step_2' );
			content.description = i18n( 'i18n_step_2_desc' ).split( ' | ' ).join( '</p><p>' );
			content.image = `${iconshtml}`;
			content.sound = 'Progdir:Data/step_2.mp3';
			ge( 'FooterLeft' ).innerHTML = '';
			var btn = document.createElement( 'button' );
			btn.className = 'FullWidth Neutral IconSmall fa-arrow-left';
			btn.innerHTML = ' ' + i18n( 'i18n_back' );
			btn.onclick = function()
			{
				initStep( 0 );
			}
			ge( 'FooterLeft' ).appendChild( btn );
			
			ge( 'FooterRight' ).innerHTML = '';
			
			btn = document.createElement( 'button' );
			btn.className = 'FullWidth Neutral IconSmall fa-check';
			btn.innerHTML = ' ' + i18n( 'i18n_finish' );
			btn.onclick = function()
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e != 'ok' )
						return;
					Application.quit();
				}
				m.execute( 'themesettings', { setup: 'custom' } );
			}
			ge( 'FooterRight' ).appendChild( btn );
			break;
		default:
			return false;
	}
	
	var odesc = '';
	var mode = 0;
	for( var a = 0; a < content.description.length; a++ )
	{
		if( content.description.charAt( a ) == '*' )
		{
			if( mode == 0 )
			{
				odesc += '<li>';
				mode = 1;
				continue;
			}
		}
		if( content.description.charAt( a ) == '<' && mode == 1 )
		{
			odesc += '</li>';
			mode = 0;
		}
		odesc += content.description.charAt( a );
	}
	content.description = odesc;
	
	ge( 'HeadingLeft' ).innerHTML = content.header;
	ge( 'Col1' ).innerHTML = '<p>' + content.description + '</p>';
	if( content.image.indexOf( '<' ) < 0 )
	{
		ge( 'Col2' ).innerHTML = '<div class="BGImage" style="background-image: url(\'' + getImageUrl( content.image ) + '\')"></div>';
	}
	else
	{
		ge( 'Col2' ).innerHTML = content.image;
	}
	// TODO: Play sound!
	
	// Quit when clicking the exit button
	var btn = ge( 'HeadingRight' ).getElementsByTagName( 'button' );
	if( btn ) btn[0].onclick = function()
	{
		Application.quit();
	}
}

function launch( app )
{
	Application.sendMessage( { type: 'system', command: 'executeapplication', executable: app } );
}

