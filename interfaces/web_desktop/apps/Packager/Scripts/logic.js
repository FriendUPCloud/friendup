
Application.run = function( msg, iface )
{
	refreshPackages();
}

function refreshPackages()
{
	var j = new cAjax();
	j.open( 'get', '/repository/index.json', true, false );
	j.onload = function()
	{
		Application.packages = JSON.parse( this.responseText() );
		redrawPackages();
	}
	j.send();
}

function redrawPackages()
{
	if( !Application.packages )
	{
		ge( 'Packagelist' ).innerHTML = '';
	}
	// Get categories
	var m = '';
	for( var a in Application.packages )
	{
		m += '<h2 class="BorderBottom">' + a + '</h2>';
		var cat = Application.packages[a];
		for( var b in cat )
		{
			var pk = cat[b];
			m += '<p class="BorderBottom BackgroundList ColorList">' + pk.Name + '</p>';
		}
	}
	ge( 'Packagelist' ).innerHTML = m;
}
