
Application.run = function( msg, iface )
{
}

// Set up our tabs!
var vtabs = new VertTabContainer( ge( 'VTabs' ) );
var tabs = [
	{
		name:  'Language',
		label: 'Language settings',
		pageDiv: ge( 'VPage1' )
	},
	{
		name:  'Features',
		label: 'Feature settings',
		pageDiv: ge( 'VPage2' )
	}
];
for( var a = 0; a < tabs.length; a++ )
{
	vtabs.addTab( tabs[a] );
}

function doCancel()
{
	Application.sendMessage( {
		command: 'closeprefs'
	} );
}

