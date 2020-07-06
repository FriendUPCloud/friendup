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
	
		this.dom.style.width = '350px';
		this.dom.style.height = '200px';
	
		let cnt = document.createElement( 'div' );
		cnt.className = 'Content';
		this.dom.appendChild( cnt );
	
		if( self.flags.x )
		{
			if( self.flags.x == 'right' )
			{
				this.dom.style.left = document.body.offsetWidth - 390 + 'px';
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
	if( this.dom )
	{
		this.dom.classList.remove( 'Showing' );
		setTimeout( function()
		{
			self.dom.parentNode.removeChild( self.dom );
			var m = new Module( 'tutorials' );
			m.execute( 'increment' );
		}, 750 );
	}
}

function CloseTutorial()
{
	for( let a = 0; a < workspace_tutorials.length; a++ )
	{
		workspace_tutorials[ a ].close();
	}
	workspace_tutorials = [];
}

function SkipTutorials()
{
	let m = new Module( 'tutorials' );
	m.onExecuted = function( e, d )
	{
		CloseTutorial();
	}
	m.execute( 'stop' );
}

let tutWind = null;
function ShowAllTutorials()
{
	if( tutWind ) tutWind.focus();
	tutWind = new View( {
		title: 'Available tutorials',
		width: 800,
		height: 600
	} );
	let f = new File( 'System:templates/tutorials.html' );
	f.onLoad = function( data )
	{
		tLoad( data );
		function tLoad( da )
		{
			tutWind._window.classList.remove( 'Big' );
			let m = new Module( 'tutorials' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					let ht = null;
					try
					{
						ht = JSON.parse( d );
						let dt = da.split( '{tutorials}' ).join( atob( ht.data ) );
						tutWind.setContent( dt, function()
						{
							tutWind._window.classList.remove( 'Phase' );
							let tuts = tutWind._window.getElementsByClassName( 'Tutorial' );
							
							function doBack()
							{
								setTimeout( function()
								{										
									// Load tutorials
									tLoad( da );
									return;
								}, 150 );
								tutWind._window.classList.add( 'Phase' );
							}
							
							for( let c = 0; c < tuts.length; c++ )
							{
								tuts[c].onclick = function()
								{
									if( this.classList.contains( 'Big' ) )
									{
										return;								
									}
									for( let d = 0; d < tuts.length; d++ )
									{
										if( tuts[ d ] == this )
										{
											( function( num, se, list )
											{
												se.classList.add( 'Big', 'Loading' );
												let t = new Module( 'tutorials' );
												t.onExecuted = function( te, td )
												{
													if( te == 'ok' )
													{
														let dd = null;
														try
														{
															dd = JSON.parse( td );
															DisplayTutorial( atob( dd.data ), se, doBack );
															return;
														}
														catch( e )
														{
														}
													}
													se.classList.remove( 'Big', 'Loading' );
													list.classList.remove( 'Big' );
												}
												t.execute( 'gettutorial', { number: num + 2 } ); // + 2 (num starts 0, should be 1, skip tutorial 1 means use + 2)
											} )( c, this, tutWind._window );
										}
										else
										{
											tuts[ d ].classList.remove( 'Big' );
										}
									}
									tutWind._window.classList.add( 'Big' );
								}
							}
						} );
					}
					catch( e )
					{
						tutWind.close();
						console.log( '[tutorials] Could not read tutorial overview.' );
					}
				}
				else
				{
					tutWind.close();
					console.log( '[tutorials] Found no tutorial overview.' );
				}
			}
			m.execute( 'gettutorials' );
		}
	}
	f.load();
	CloseTutorial();
	tutWind.onClose = function()
	{
		tutWind = null;
	}
}

function DisplayTutorial( str, ele, backF )
{
	ele.innerHTML = str.split( '{session}' ).join( Workspace.sessionId );
	ele.classList.remove( 'Loading' );
	
	let bottom = ge( 'Available_tutorials' ).getElementsByClassName( 'BottomBar Padding' );
	if( !bottom.length ) return;
	let back = bottom[0].getElementsByClassName( 'Back' );
	if( back.length ) return;
	back = document.createElement( 'button' );
	back.className = 'Button Back fa-caret-left IconSmall FloatLeft';
	back.innerHTML = i18n( 'i18n_back' );
	back.onclick = backF;
	bottom[0].appendChild( back );
}


