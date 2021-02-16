/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

// Standard global events
var eventRectMouseDown = null;
window.addEventListener( 'mouseup', function(){ 
	eventRectMouseDown = null;
	Calendar.repositionEvents();
} );
window.addEventListener( 'mousemove', function( e ){
	
	// Where do we click?
	var cx = e.clientX;
	var cy = e.clientY;
	
	if( eventRectMouseDown )
	{
		// Get some data (scrollable element of clicked event node)
		var pnode = ge( 'MainView' ).querySelector( '.CalendarDates' );
		
		// Scroll info
		var st = pnode.scrollTop;
		var sl = pnode.scrollLeft;
		
		// Where do we click in absolute coordinates
		var cy = ( e.clientY + st ) - GetElementTop( pnode );
		var cx = ( e.clientX + sl ) - GetElementLeft( pnode );
		
		var ele = eventRectMouseDown.element;
		var l   = eventRectMouseDown.l;
		var t   = eventRectMouseDown.t;
		var w   = eventRectMouseDown.w;
		var h   = eventRectMouseDown.h;
		var x   = eventRectMouseDown.x;
		var y   = eventRectMouseDown.y;
		
		var offy = y - cy;
		
		if( eventRectMouseDown.clickPosition == 'bottom' )
		{
			ele.style.height = h - offy + 'px';
		}
		else
		{
			ele.style.top = t - offy + 'px';
			ele.style.height = h + offy + 'px';
		}
	}
} );

var EventRect = function( definition )
{
	this.definition = definition;
	this.init();
};
EventRect.prototype.init = function()
{
	if( this.div ) return;
	var self = this;
	this.div = document.createElement( 'div' );
	this.div.event = self;
	this.div.className = 'EventRect MousePointer';
	this.div.style.top = this.definition.ypos + '%';
	this.div.style.height = this.definition.height + '%';
	
	var paletteSlot = this.definition.event.Your ? 0 : 1;
	userList[ this.definition.event.Owner ] = this.definition.event.Owner;
	
	this.div.style.color = eventPaletteForeground[ paletteSlot ];
	this.div.style.backgroundColor = eventPaletteBackground[ paletteSlot ];
	this.div.innerHTML = this.definition.event.Name;
	
	// Pressing the left mouse button down
	this.div.onmousedown = function( e )
	{
		if( e.button != 0 ) return;
		
		// Get some data (scrollable element of clicked event node)
		var pnode = ge( 'MainView' ).querySelector( '.CalendarDates' );
		
		// Scroll info
		var st = pnode.scrollTop;
		var sl = pnode.scrollLeft;
		
		
		// Where do we click in absolute coordinates
		var cy = ( e.clientY + st ) - GetElementTop( pnode );
		var cx = ( e.clientX + sl ) - GetElementLeft( pnode );
		
		// Assume nothing was clicked
		var cp = null;
		
		// Coordinate 
		if( cy < this.offsetTop + 10 )
		{
			cp = 'top';
		}
		else if( cy > this.offsetTop + this.offsetHeight - 10 )
		{
			cp = 'bottom';
		}
		
		// Register click
		if( cp != null )
		{
			this.moved = true;
			eventRectMouseDown = {
				clickPosition: cp,
				element: this,
				t: this.offsetTop,
				l: this.offsetLeft,
				w: this.offsetWidth,
				h: this.offsetHeight,
				x: cx,
				y: cy
			};
		}
		else
		{
			eventRectMouseDown = null;
		}
		return cancelBubble( e );
	}
	ge( 'Day' + this.definition.day ).appendChild( this.div );
	
	this.div.ondblclick = function( e )
	{
		EditEvent( self.definition.event.ID );
		return cancelBubble( e );
	}
}

