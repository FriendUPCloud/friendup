TabletDashboard = function()
{
	let self = this;
	
	// Create dom element
	this.dom = document.createElement( 'div' );
	this.dom.className = 'TabletDashboard';
	setTimeout( function()
	{
		self.dom.classList.add( 'Showing' );
	}, 5 );
	
	// Create tasks container
	let w = document.createElement( 'div' );
	w.className = 'TasksLabel';
	w.innerHTML = 'Tasks:';
	this.dom.appendChild( w );
	this.tasks = document.createElement( 'div' );
	this.tasks.className = 'Tasks';
	this.dom.appendChild( this.tasks );
	
	document.querySelector( '.Screen' ).appendChild( this.dom );
	
	// Dashboard elements are empty
	this.elements = [];
}
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
			this.elements.push( {
				type: 'view',
				original: movableWindows[ a ],
				label: movableWindows[ a ].windowObject.getFlag( 'title' )
			} );
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
