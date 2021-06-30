let tabsConf = {};

Application.run = function( msg )
{
	let t = document.getElementsByClassName( 'WelTab' );
	let p = document.getElementsByClassName( 'WelPage' );
	for( let a = 0; a < t.length; a++ )
	{
		if( !tabsConf.activeTab )
		{
			tabsConf.activeTab = t[ a ];
			t[ a ].classList.add( 'Active' );
			p[ a ].classList.add( 'Active' );
		}
		t[a].onclick = function()
		{
			for( let c = 0; c < t.length; c++ )
			{
				if( t[c] != this )
				{
					t[c].classList.remove( 'Active' );
					p[c].classList.remove( 'Active' );
				}
				else
				{
					t[c].classList.add( 'Active' );
					p[c].classList.add( 'Active' );
				}
			}
		}
		t[a].ontouchstart = t[a].onclick;
	}
};

function launch( app )
{
	
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



