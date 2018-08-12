
Application.run = function( msg )
{
	var v = new View( {
		title: 'FUI Test',
		width: 600,
		height: 700,
		frameworks: {
			fui: {
				data: 'Progdir:FUI/main.json',
				javascript: 'Progdir:Scripts/main.js'
			}
		}
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
};

