/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Instantiate tablet dashboard
TabletDashboard = function()
{
	let self = this;
	
	// Create dom element
	this.dom = document.createElement( 'div' );
	this.dom.className = 'TabletDashboard SmoothScrolling ScrollArea';
	setTimeout( function()
	{
		self.dom.classList.add( 'Showing' );
	}, 5 );
	
	// Create favorites container
	let f = document.createElement( 'div' );
	f.className = 'Label';
	f.innerHTML = i18n( 'i18n_dashboard_favorites' ) + ':';
	this.dom.appendChild( f );
	
	// Create favorites container
	let g = document.createElement( 'div' );
	g.className = 'Favorites DivContainer';
	this.dom.appendChild( g );
	this.favcontainer = g;
	
	// Create tasks container
	let w = document.createElement( 'div' );
	w.className = 'Label';
	w.innerHTML = i18n( 'i18n_dashboard_tasks' ) + ':';
	this.dom.appendChild( w );
	
	this.tasks = document.createElement( 'div' );
	this.tasks.className = 'Tasks DivContainer';
	this.dom.appendChild( this.tasks );
	
	document.querySelector( '.Screen' ).appendChild( this.dom );
	
	// Dashboard elements are empty
	this.elements = [];
	this.favorites = [];
}

// Clean up tablet dashboard
TabletDashboard.prototype.destroy = function()
{
	let self = this;
	
	// Remove workspace pivot
	let sc = document.querySelector( '.Screen' );
	if( sc.wmenu )
	{
		sc.wmenu.parentNode.removeChild( sc.wmenu );
		sc.wmenu = null;
	}
	
	if( Workspace.dashboard )
	{
		Workspace.dashboard = null;
	}
	if( this.dom )
	{
		this.dom.parentNode.removeChild( this.dom );
		this.dom = null;
	}
	delete self;
}

// Refresh the tablet dashboard
TabletDashboard.prototype.refresh = function()
{
	let self = this;
	
	// Workspace pivot
	let sc = document.querySelector( '.Screen' );
	if( sc )
	{
		if( !sc.wmenu )
		{
			let d = document.createElement( 'div' );
			d.className = 'WorkspacePivot';
			sc.querySelector( '.TitleBar' ).appendChild( d );
			d.onclick = function()
			{
				_DeactivateWindows();
				self.refresh();
			}
			sc.wmenu = d;
		}
	}
	
	this.fetchDockElements();
	
	for( let a = 0; a < this.favorites.length; a++ )
	{
		let d = this.favorites[a].dom;
		let f = this.favorites[a];
		if( !d )
		{
			if( !f.exe ) continue;
			d = document.createElement( 'div' );
			d.className = 'Application';
			d.innerHTML = '<div class="Icon"></div><div class="Label">' + f.name + '</div>';
			if( f.exe )
			{
				( function( executable )
				{
					d.onclick = function()
					{
						// Files..
						if( executable == 'undefined' )
						{
							OpenWindowByFileinfo( 
								{ Title: 'Home', Path: 'Home:', Type: 'Directory', MetaType: 'Directory' },
								false, false, 0
							);
						}
						else
						{
							ExecuteApplication( executable );
						}
					}
				} )( f.exe );
			}
			f.dom = d;
			self.favcontainer.appendChild( d );
			d.querySelector( '.Icon' ).style.backgroundImage = f.icon;
		}
	}
	
	this.fetchWindowElements();
	
	for( let a = 0; a < this.elements.length; a++ )
	{
		let d = this.elements[a].dom;
		if( !d )
		{
			d = document.createElement( 'div' );
			d.className = 'ViewWindow';
			d.original = this.elements[a].original.windowObject;
			d.innerHTML = '<div class="Icon"></div><div class="Label">' + this.elements[a].label + '</div><div class="Close"></div>';
			d.onclick = function( e )
			{
				_ActivateWindow( this.original.content.parentNode );
			}
			this.elements[a].dom = d;
			
			self.tasks.appendChild( d );
			
			d.querySelector( '.Icon' ).style.backgroundImage = this.elements[a].icon;
			
			d.getElementsByClassName( 'Close' )[0].onclick = function( e )
			{
				e.stopPropagation();
				d.original.onClose = function()
				{
					Workspace.dashboard.refresh();
				}
				d.original.close();
			}
		}
		
		if( d.original.content.parentNode.classList.contains( 'Active' ) )
		{
			d.classList.remove( 'Inactive' );
		}
		else
		{
			d.classList.add( 'Inactive' );
		}
	}
}

// Fetch dock elements (favorite apps)
TabletDashboard.prototype.fetchDockElements = function()
{
	let self = this;
	if( window.Workspace && Workspace.mainDock )
	{
		// TODO: Also when it changes
		if( !this.favorites.length )
		{
			let n = Workspace.mainDock.dom.childNodes;
			for( let a = 0; a < n.length; a++ )
			{
				if( n[a].classList && n[a].classList.contains( 'Launcher' ) && !n[a].classList.contains( 'Startmenu' ) )
				{
					( function( ele )
					{
						self.favorites.push( {
							name: ele.getAttribute( 'data-displayname' ),
							icon: ele.style.backgroundImage,
							exe: ele.getAttribute( 'data-exename' )
						} );
					} )( n[ a ] );
				}
			}
		}
	}
}

// Fetch current window elements
TabletDashboard.prototype.fetchWindowElements = function()
{
	let self = this;
	
	for( let a in movableWindows )
	{
		if( !movableWindows[ a ].windowObject ) continue;
		let found = false;
		for( let b in this.elements )
		{
			if( movableWindows[ a ] == this.elements[ b ].original )
			{
				found = true;
				break;
			}
		}
		if( !found )
		{
			let wel = {
				type: 'view',
				original: movableWindows[ a ],
				label: movableWindows[ a ].windowObject.getFlag( 'title' )
			};
			if( movableWindows[ a ].applicationId )
			{
				let appid = movableWindows[ a ].applicationId;
				for( let o = 0; o < Workspace.applications.length; o++ )
				{
					if( Workspace.applications[o].applicationId == appid )
					{
						wel.icon = 'url(' + Workspace.applications[o].icon + ')';
					}
				}
			}
			if( !wel.icon )
			{
				wel.icon = movableWindows[a].viewIcon.style.backgroundImage;
			}
			this.elements.push( wel );
		}
	}
	
	// Clean up elements that no longer exists
	let out = [];
	for( let a in this.elements )
	{
		if( this.elements[a].type != 'view' ) continue;
		let found = false;
		for( let b in movableWindows )
		{
			if( this.elements[a].original == movableWindows[ b ] )
			{
				found = true;
				break;
			}
		}
		if( found )
		{
			out.push( this.elements[ a ] );
		}
		else
		{
			this.elements[a].dom.classList.add( 'Closing' );
			let di = this.elements[a].dom;
			setTimeout( function()
			{
				di.parentNode.removeChild( di );
			}, 150 );
		}
	}
	this.elements = out;
}

