Application.run = function( msg )
{
	initVertTabs();
}

var tabs = null;

function initVertTabs()
{
	tabs = new VertTabContainer( ge( 'SettingsTabs' ) );
	
	var names = [ 
		{
			name: 'Dock',
			label: 'Dock settings',
			pageDiv: ge( 'PageOne' )
		},
		{
			name: 'Theme',
			label: 'Theme',
			pageDiv: ge( 'PageTwo' )
		},
		{
			name: 'Looknfeel',
			label: 'Look and feel',
			pageDiv: ge( 'PageThree' )
		}
	];
	for( var a = 0; a < names.length; a++ )
	{
		tabs.addTab( names[ a ] );
	}
}

