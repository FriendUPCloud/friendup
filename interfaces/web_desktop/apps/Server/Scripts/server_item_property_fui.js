var server_property = [
	{
		type: 'Group',
		width: '100%',
		height: '100%',
		name: 'MainGroup',
		surface: 'ServerItemProperty',
		show: true
	}
];

var rootObject = null;

fui.onready = function()
{
	// Set the current screen structure to 'ServerItemProperty'
	this.currentScreen = ge( 'ServerItemProperty' );
	
	rootObject = fui.build( server_property );
}

fui.init();

// Helper functions ------------------------------------------------------------
