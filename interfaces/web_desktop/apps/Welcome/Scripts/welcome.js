Application.run = function( msg )
{
	var t = document.getElementsByClassName( 'TheTab' );
	this.tabs = t;
	for( var a = 0; a < t.length; a++ )
	{
		t[a].tabs = t;
		t[a].onclick = function()
		{
			for( var c = 0; c < this.tabs.length; c++ )
			{
				if( this.tabs[c] != this )
				{
					this.tabs[c].classList.remove( 'Active' );
					document.body.classList.remove( 'Tab' + (c+1) );
				}
				else
				{
					document.body.classList.add( 'Tab' + (c+1) );
				}
			}
			this.classList.add( 'Active' );
		}
		t[a].ontouchstart = t[a].onclick;
	}
	
	document.body.classList.add( 'Tab1' );
	
	/*var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var r = null;
			var vids = [];
			while( r = d.match( /\"\/watch\?v\=([^"]*?)\"/i ) )
			{
				d = d.split( r[0] ).join( '' );
				vids.push( r[1] );
				if( vids.length > 1 ) break;
			}
			var str = '';
			for( var a = 0; a < 2; a++ )
			{
				str += '<iframe class="Youtube" allowfullscreen="allowfullscreen" mozallowfullscreen="mozallowfullscreen" gesture="media" src="https://www.youtube.com/embed/' + vids[a] + '"></iframe>';
			}
			ge( 'LastUploads' ).innerHTML = str;
		}
	}
	m.execute( 'proxyget', { url: 'https://www.youtube.com/channel/UCi_8eeLQt9DKJC0xZQsiIDg/videos?shelf_id=1&view=0&sort=dd' } );*/
	
};

function launch( app )
{
	/* correct and nice, but doesnt work and we want a fix today...
		Application.sendMessage( {
		type: 'system',
		command: 'executeapplication',
		executable: app
	} );*/
	parent.ExecuteApplication( app );
};

function nevershow()
{
	var s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.quit();
		}
	}
	s.execute( 'removefromstartupsequence', { item: 'launch Welcome' } );
};

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	console.log( this.tabs );
	if( msg.command == 'set_welcome' )
	{
		this.tabs[0].tabs[0].onclick();
	}
	else if( msg.command == 'set_business' )
	{
		this.tabs[0].tabs[1].onclick();
	}
	else if( msg.command == 'set_entertainment' )
	{
		this.tabs[0].tabs[2].onclick();
	}
	else if( msg.command == 'set_ten' )
	{
		this.tabs[0].tabs[3].onclick();
	}
}

