Application.run = function( msg )
{
	let v = new View( {
		title: 'Convos',
		assets: [ 'Progdir:Scripts/vue.global.js', 'Progdir:Scripts/convos.js', 'Progdir:Markup/main.html' ],
		width: 600,
		height: 900,
	} );
}
