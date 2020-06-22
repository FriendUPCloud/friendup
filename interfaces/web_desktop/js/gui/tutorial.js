/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

let workspace_tutorials = [];

TutorialWidget = function( flags )
{
	this.flags = flags;
	this.readTutorials();
	workspace_tutorials.push( this );
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
	
		this.dom.style.width = '250px';
		this.dom.style.height = '200px';
	
		let cnt = document.createElement( 'div' );
		cnt.className = 'Content';
		this.dom.appendChild( cnt );
	
		if( self.flags.x )
		{
			if( self.flags.x == 'right' )
			{
				this.dom.style.left = document.body.offsetWidth - 290 + 'px';
			}
			if( self.flags.y == 'bottom' )
			{
				this.dom.style.top = document.body.offsetHeight - 240 + 'px';
			}
		}
	
		cnt.innerHTML = atob( data.data );
		this.screen.div.appendChild( this.dom );
		
		setTimeout( function()
		{
			self.dom.classList.add( 'Showing' );
			self.dom.style.height = cnt.scrollHeight + 10 + 'px';
			self.dom.style.top = document.body.offsetHeight - cnt.scrollHeight - 50 + 'px';
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
				console.log( 'Cannot parse: ', d );
			}
		}
	}
	m.execute( 'get' );
};

TutorialWidget.prototype.close = function()
{
	let self = this;
	this.dom.classList.remove( 'Showing' );
	setTimeout( function()
	{
		self.dom.parentNode.removeChild( self.dom );
		var m = new Module( 'tutorials' );
		m.execute( 'increment' );
	}, 750 );
}

function CloseTutorial()
{
	for( let a = 0; a < workspace_tutorials.length; a++ )
		workspace_tutorials[ a ].close();
	workspace_tutorials = [];
}

