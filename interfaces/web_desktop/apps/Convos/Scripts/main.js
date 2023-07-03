Application.run = function( msg ){
	let v = new View( {
		title: 'Convos',
		assets: [
			getImageUrl( 'Progdir:Scripts/chatoverview.fui.js' ),
			getImageUrl( 'Progdir:Scripts/convos.js' ), 
			getImageUrl( 'Progdir:Markup/main.html' ) 
		],
		width: 600,
		height: 900,
	} );
};

