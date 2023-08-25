
var colordia = null;
function showColorPicker( elementid, value )
{
	if( colordia )
	{
		colordia.activate();
	}
	else
	{
		var el = ge( elementid );
		colordia = new ColorPicker( function( hexCode )
		{
			el.value = hexcode;
			colordia = null;
			console.log( 'success' );
		}, function()
		{
			console.log( 'cancelled' );
			colordia = null;
		} );
	}
}

