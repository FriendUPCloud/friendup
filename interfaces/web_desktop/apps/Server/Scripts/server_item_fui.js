var rootObject = null;

fui.onready = function( robj )
{	
	rootObject = robj;
}

// Helper functions ------------------------------------------------------------

function saveSettingItem()
{
	var eleKey = rootObject.get( 'InputKey' );
	var eleValue = rootObject.get( 'InputValue' );
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			
		}
	}
	m.execute( 'setsetting', { setting: eleKey.dom.value, data: eleValue.dom.value } );
}

function addProperty()
{
	var v = new View( {
		title: 'Setting property',
		width: 300,
		height: 300
	} );
	var f = new File( 'Progdir:Templates/server_item_property_fui.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

