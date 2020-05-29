/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

TutorialWidget = function( flags )
{
	this.flags = flags;
	this.readTutorials();
};

TutorialWidget.prototype.init = function( data )
{
	let self = this;
	
	if( !this.dom )
	{
		this.dom = document.createElement( 'div' );
		this.dom.className = 'TutorialWidget';
	
		if( window.Workspace )
		{
			this.screen = window.Workspace.screen;
		}
	
		this.dom.innerHTML = atob( data.data );

		this.screen.div.appendChild( this.dom );
		
		setTimeout( function()
		{
			self.dom.classList.add( 'Showing' );
		}, 5 );
	}
};

TutorialWidget.prototype.refresh = function()
{
	
};

TutorialWidget.prototype.readTutorials = function()
{
	let self = this;
	let m = new Module( 'tutorials' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			try
			{
				self.init( JSON.parse( d ) );
			}
			catch( e )
			{
			}
		}
	}
	m.execute( 'get' );
};

