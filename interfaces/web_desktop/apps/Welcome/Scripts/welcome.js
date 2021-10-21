/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

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
	
	let st = new Module( 'system' );
	st.onExecuted = function( te, td )
	{
		if( te == 'ok' )
		{
			ge( 'Dontsee' ).classList.add( 'Showing' );
		}
	}
	st.execute( 'appmodule', { appName: 'Welcome', command: 'checkstartup' } );
	
};

function launchApp( app )
{
	let s = new Shell();
	s.onReady = function()
	{
		s.execute( 'launch ' + app, function()
		{
			s.close();
			delete s;
		} );
	}
};

function nevershow()
{		
	let s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.quit();
		}
	}
	s.execute( 'removefromstartupsequence', { item: 'launch Welcome' } );
};



