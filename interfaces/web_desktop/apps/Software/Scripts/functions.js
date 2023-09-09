function uninstall( nm, index, e )
{
	Confirm( i18n( 'i18n_are_you_sure_uninstall' ), i18n( 'i18n_are_you_sure_uninstall_ds' ), function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'system' );
			m.onExecuted = function()
			{
				refreshSoftware();
			}
			m.execute( 'uninstallapplication', { application: nm } );
		}
	} );
	return cancelBubble( e );
}

function install( nm, index, e )
{
	Confirm( i18n( 'i18n_are_you_sure_install' ), i18n( 'i18n_are_you_sure_install_ds' ), function( d )
	{
		if( d.data == true )
		{
			var m = new Module( 'system' );
			m.onExecuted = function()
			{
				refreshSoftware();
			}
			m.execute( 'installapplication', { application: nm } );
		}
	} );
	return cancelBubble( e );
}

// Execute that app!
function execute( nam, e )
{
	Application.sendMessage( { type: 'system', command: 'executeapplication', executable: nam } );
	return cancelBubble( e );
}

function fixMarkdown( str )
{
	if( str )
	{
		var r = '';
		while( r = str.match( /\#\#\#(.*?)\n/i ) )
		{
			str = str.split( r[0] ).join( '<p><strong>' + r[1] + '</strong></p>' );
		}
		while( r = str.match( /\#\#(.*?)\n/i ) )
		{
			str = str.split( r[0] ).join( '<h3>' + r[1] + '</h3>' );
		}
		while( r = str.match( /\#(.*?)\n/i ) )
		{
			str = str.split( r[0] ).join( '<h2>' + r[1] + '</h2>' );
		}
		while( r = str.match( /\*(.*?)\n/i ) )
		{
			str = str.split( r[0] ).join( '<li>' + r[1] + '</li>' );
		}
		while( r = str.match( /\[(.*?)\]\((.*?)\)/i ) )
		{
			str = str.split( r[0] ).join( '<a href="' + r[2] + '" target="_blank">' + r[1] + '</a>' );
		}
		return str.split( "\n" ).join( '<br>' );
	}
	return '';
}

// Detailed view
var detailSoftware = false;
function details( nam )
{	
	var det = new Module( 'system' );
	det.onExecuted = function( e, d )
	{
		// Find software entry
		var soft = false;
		for( var a = 0; a < globalSoftwareList.length; a++ )
		{
			if( globalSoftwareList[a].Name == nam )
			{
				soft = globalSoftwareList[a];
				break;
			}
		}

		detailSoftware = soft;

		if( soft.Installed )
		{
			var i18n_uninstall = i18n( 'i18n_uninstall' );
			var i18n_launch = i18n( 'i18n_launch' );
			var app = soft.Name;
			ge( 'ExtraButtons' ).innerHTML = `
			<button type="button" class="Red Button IconSmall fa-times" onclick="uninstall('${app}',${a}); overview()">
				${i18n_uninstall}
			</button>
			<button class="Green Button IconSmall fa-play-circle" onclick="execute('${app}')">
				${i18n_launch}
			</button>`;
		}
		else
		{	
			var i18n_install = i18n( 'i18n_install' );
			var app = soft.Name;
			ge( 'ExtraButtons' ).innerHTML = `
			<button type="button" class="Button IconSmall fa-arrow-circle-o-down" onclick="install('${app}',${a}); overview()">
				${i18n_install}
			</button>`;
		}
		
		// Grab screenshot
		var args = {
			application: nam,
			mode: 'screenshot'
		};
		var screenshot = '/system.library/module/?module=system&command=applicationdetails&authid=' + Application.authId + '&args=' + encodeURIComponent( JSON.stringify( args ) );

		if( soft )
		{
			ge( 'ProductTitle' ).innerHTML = nam;
			
			var fullData = JSON.parse( d );
			
			ge( 'DtlShortDescription' ).innerHTML = '<p>' + soft.Description.split( "\n" ).join( "</p><p>" ) + '</p>';
			//ge( 'DtlScreenshot' ).innerHTML = '<img style="height: auto" src="' +screenshot + '" alt="Screenshot"/>';
			ge( 'DtlReadme' ).innerHTML = fullData.readme ? fixMarkdown( fullData.readme ) : '';
			ge( 'DtlResources' ).innerHTML = fullData.resources ? fixMarkdown( fullData.resources ) : '';
			
			document.body.classList.add( 'Details' );
		
			/*var meta = metadata[ soft.Name ];
			if( meta && meta.visible )
			{
				ge( 'DetailsVisible' ).classList.remove( 'fa-toggle-off' );
				ge( 'DetailsVisible' ).classList.add( 'fa-toggle-on' );
				ge( 'DetailsVisible' ).innerHTML = '&nbsp;Visible';
				ge( 'DetailsVisible' ).visible = true;
			}
			else
			{
				ge( 'DetailsVisible' ).classList.remove( 'fa-toggle-on' );
				ge( 'DetailsVisible' ).classList.add( 'fa-toggle-off' );
				ge( 'DetailsVisible' ).innerHTML = '&nbsp;Visible';
				ge( 'DetailsVisible' ).visible = false;
			}
		
			if( meta && meta.featured )
			{
				ge( 'DetailsFeatured' ).classList.remove( 'fa-toggle-off' );
				ge( 'DetailsFeatured' ).classList.add( 'fa-toggle-on' );
				ge( 'DetailsFeatured' ).innerHTML = '&nbsp;Featured';
				ge( 'DetailsFeatured' ).featured = true;
			}
			else
			{
				ge( 'DetailsFeatured' ).classList.remove( 'fa-toggle-on' );
				ge( 'DetailsFeatured' ).classList.add( 'fa-toggle-off' );
				ge( 'DetailsFeatured' ).innerHTML = '&nbsp;Featured';
				ge( 'DetailsFeatured' ).featured = false;
			}*/
		}
	}
	det.execute( 'applicationdetails', { application: nam, mode: 'data' } );
}

function toggleVisible( ele )
{
	var key = 'Visible';
	var val = false;
	if( ele.visible == true )
	{
		val = 0;
	}
	else
	{
		val = 1;
	}
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if( val == 1 )
			{
				ge( 'DetailsVisible' ).innerHTML = '&nbsp;Visible';
				ge( 'DetailsVisible' ).visible = true;
			}
			else
			{
				ge( 'DetailsVisible' ).innerHTML = '&nbsp;Invisible';
				ge( 'DetailsVisible' ).visible = true;
			}
			refreshSoftware();
		}
	}
	m.execute( 'setmetadata', { key: 'application_' + detailSoftware.Name, valueString: key, valueNumber: val } );
}

function toggleFeatured( ele )
{
	var key = 'Featured';
	var val = false;
	if( ele.featured == true )
	{
		val = 0;
	}
	else
	{
		val = 1;
	}
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			if( val == 1 )
			{
				ge( 'DetailsFeatured' ).innerHTML = '&nbsp;Featured';
				ge( 'DetailsFeatured' ).featured = true;
			}
			else
			{
				ge( 'DetailsFeatured' ).innerHTML = '&nbsp;Not featured';
				ge( 'DetailsFeatured' ).featured = true;
			}
			refreshSoftware();
		}
	}
	m.execute( 'setmetadata', { key: 'application_' + detailSoftware.Name, valueString: key, valueNumber: val } );
}

// Escape details!
function overview()
{
	document.body.classList.remove( 'Details' );
}

function clearSearch()
{
	ge( 'Searcher' ).value = '';
	refreshSoftware( false, false, ge( 'Searcher' ).value );
	ge( 'SearchBox' ).classList.add( 'fa-search' );
	ge( 'SearchBox' ).classList.remove( 'fa-remove' );
}

// Do the search
function searcher( e )
{
	if( !e ) e = { which: 13 };
	var k = e.which ? e.which : e.keyCode;
	if( k == 13 )
	{
		var val = ge( 'Searcher' ).value.split( ' ' ).join( '' );
		if( val.length > 0 )
		{
			refreshSoftware( false, false, ge( 'Searcher' ).value );
			ge( 'SearchBox' ).classList.remove( 'fa-search' );
			ge( 'SearchBox' ).classList.add( 'fa-remove' );
		}
		else
		{
			refreshSoftware();
			ge( 'SearchBox' ).classList.add( 'fa-search' );
			ge( 'SearchBox' ).classList.remove( 'fa-remove' );
		}
	}
}

