/*
	Application that will run Google Docs and Spreadcheats right inside the users Workspace!
*/
Application.run = function( conf )
{
	if( conf.args )
	{
		var tmp = conf.args.split(':');
		
		var f = new File( conf.args );
		f.onLoad = function( data )
		{
			var tmp = false;
			
			//<!--separate-->
			if( data.indexOf('###') > 0 )
			{
				tmp = data.split( '###' );
				data = tmp[1];
			}
			
			tmp = false;
			
			try{
				tmp = JSON.parse( data )
			}
			catch(e)
			{
				console.log('data was not json',data);
			}
			
			console.log( 'tmp ', tmp );
			
			if( tmp && tmp.url && tmp.title )
			{
				Application.displayEditor( tmp.title, tmp.url );
				return;
			}
			
			Notify({'title':'Error','description':'Could not open file!'});
			Application.quit();
			return;
			
		}
		f.call('execute');
		
	}
	else
	{
		Notify({'title':'Error','description':'No file to open given!'});
		Application.quit();
	}

}

Application.displayEditor = function(title,url)
{
		var v = new View({
			width:640,
			height:480,
			title: title
		});
		
		v.onClose = function()
		{
			Application.quit();
		};
		v.setRichContentUrl( url );
				
}

Application.receiveMessage = function( msg )
{
	//console.log( 'got a message',msg );
	if( !msg.cmd ) return;
}
