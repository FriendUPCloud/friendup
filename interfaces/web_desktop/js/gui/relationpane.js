/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
	Relationpane takes a dom object
	Requires you to set functions to load left panel and right panel data
	The format of the response should be arrays
	You need to set up functions for left / right panel entry transfers
	Remaps are for mapping, and this is the format
	{
		ID: "Source ID attribute",
		Label: "Source Label attribute
	}
*/

RelationPane = function( dom )
{
	var self = this;
	this.domObject = dom;
	
	this.area = document.createElement( 'div' );
	this.area.className = 'RelationPaneContainer HRow List';
	this.domObject.appendChild( this.area );
	
	this.larea = document.createElement( 'div' );
	this.larea.className = 'RelationPaneLeftContainer FloatLeft BorderRight';
	this.larea.style.width = '46%';
	this.area.appendChild( this.larea );
	
	this.transfer = document.createElement( 'div' );
	this.transfer.className = 'BackgroundHeavy RelationPanelTransfer PaddingSmall FloatLeft BorderRight BorderLeft';
	
	this.transfer.style.height = ( this.domObject.offsetHeight - 2 ) + 'px';
	
	this.transfer.style.width = '7.8%';
	this.area.appendChild( this.transfer );
	
	var transbuttons = document.createElement( 'div' );
	var m = [ 'fa-arrow-left', 'fa-arrow-right' ];
	for( var a in m )
	{
		var d = document.createElement( 'p' );
		d.className = 'Layout';
		var b = document.createElement( 'button' );
		b.className = 'FullWidth IconButton IconSmall ' + m[ a ];
		b.innerHTML = '&nbsp;';
		if( a == 0 )
		{
			b.onclick = function(){ self.rightPanelTransfer( self.getSelectedRight() ); }
		}
		else
		{
			b.onclick = function(){ self.leftPanelTransfer( self.getSelectedLeft() ); }
		}
		d.appendChild( b );
		transbuttons.appendChild( d );
	}
	transbuttons.style.marginTop = '65px';
	transbuttons.style.width = '100%';
	this.transfer.appendChild( transbuttons );
	
	this.rarea = document.createElement( 'div' );
	this.rarea.className = 'RelationPaneRightContainer FloatRight';
	this.rarea.style.width = '46%';
	this.area.appendChild( this.rarea );	
}

// Remap is to translate field values
RelationPane.prototype.setLeftPanelLoadFunction = function( cbk, remap )
{
	this.leftPanelLoadFunction = cbk;
}

// Remap is to translate field values
RelationPane.prototype.setRightPanelLoadFunction = function( cbk, remap )
{
	this.rightPanelLoadFunction = cbk;
}

RelationPane.prototype.setLeftTransfer = function( cbk )
{
	this.leftPanelTransfer = cbk;
}

RelationPane.prototype.setRightTransfer = function( cbk )
{
	this.rightPanelTransfer = cbk;
}

// Get the items that are selected on the left
RelationPane.prototype.getSelectedLeft = function()
{
	var out = [];
	for( var a = 0; a < this.larea.childNodes.length; a++ )
	{
		var l = this.larea.childNodes[ a ];
		if( l.classList.contains( 'Selected' ) )
		{
			out.push( l.data );
		}
	}
	return out;
}

// Get the items that are selected on the right
RelationPane.prototype.getSelectedRight = function()
{
	var out = [];
	for( var a = 0; a < this.rarea.childNodes.length; a++ )
	{
		var l = this.rarea.childNodes[ a ];
		if( l.classList.contains( 'Selected' ) )
		{
			out.push( l.data );
		}
	}
	return out;
}

RelationPane.prototype.render = function()
{
	var self = this;
	
	if( !this.leftPanelLoadFunction || !this.rightPanelLoadFunction )
	{
		console.log( 'Please set left and right panel load functions.' );
		return false;
	}
	this.leftPanelLoadFunction( function( ldata )
	{
		self.rightPanelLoadFunction( function( rdata )
		{
			if( !ldata && !rdata )
			{
				console.log( 'Could not load ldata or rdata.' );
				return;
			}
			doRender( ldata, rdata );
		} );
	} );
	
	function doRender( ldata, rdata )
	{
		self.larea.innerHTML = '';
		var sw = 2;
		if( ldata )
		{
			var fleft = [];
			for( var a = 0; a < ldata.length; a++ )
			{
				var has = false;
				for( var b = 0; b < rdata.length; b++ )
				{
					if( rdata[b].Name == ldata[a].Name )
					{
						has = true;
						break;
					}
				}
				if( !has )
				{
					fleft.push( ldata[a] );
				}
			}
			ldata = fleft;
			for( var a = 0; a < ldata.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall sw' + sw;
				d.innerHTML = ldata[ a ].Name;
				d.data = ldata[ a ];
				( function( ele ){
					ele.onclick = function()
					{
						for( var b = 0; b < self.larea.childNodes.length; b++ )
						{
							var l = self.larea.childNodes[ b ];
							if( l.tagName != 'DIV' ) continue;
							if( l == ele )
							{
								l.classList.add( 'Selected' );
							}
							else
							{
								l.classList.remove( 'Selected' );
							}
						}
					}
				} )( d );
				self.larea.appendChild( d );
			}
		}
		else
		{
			self.larea.innerHTML = '<div class="PaddingSmall sw1">Empty.</div>';
		}
		self.rarea.innerHTML = '';
		sw = 2;
		if( rdata )
		{
			for( var a = 0; a < rdata.length; a++ )
			{
				sw = sw == 2 ? 1 : 2;
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall sw' + sw;
				d.innerHTML = rdata[ a ].Name;
				d.data = rdata[ a ];
				( function( ele ){
					ele.onclick = function()
					{
						for( var b = 0; b < self.rarea.childNodes.length; b++ )
						{
							var l = self.rarea.childNodes[ b ];
							if( l.tagName != 'DIV' ) continue;
							if( l == ele )
							{
								l.classList.add( 'Selected' );
							}
							else
							{
								l.classList.remove( 'Selected' );
							}
						}
					}
				} )( d );
				self.rarea.appendChild( d );
			}
		}
		else
		{
			self.rarea.innerHTML = '<div class="PaddingSmall sw1">Empty.</div>';
		}
	}
}

