document.title="AMOS for Friend(x)!"

Application.run = function( msg )
{
}
function loadAscii()
{
	// Open a load file dialog and return selected files
	var description = {
		triggerFunction: function( items )
		{
			console.log( "These files and directories were selected:", items );
		},
		path: "Mountlist:",
		type: "load",
		title: "Please choose an AMOS ascii source",
		filename: "",
		mainView: false
	}
	// Open the file dialog view window
	var d = new Filedialog( description );
}