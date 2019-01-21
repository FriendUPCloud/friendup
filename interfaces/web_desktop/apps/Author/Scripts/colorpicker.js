
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
		}, null );
	}
}

