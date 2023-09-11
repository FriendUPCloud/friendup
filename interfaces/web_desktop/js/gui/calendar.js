/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Sets up the calendar
Calendar = function( pelement )
{
	this.pelement = pelement;
	this.buttons = []; // Extra nav buttons
	this.monthName = document.createElement( 'div' );
	this.monthName.className = 'Calendar MonthName';
	this.pelement.appendChild( this.monthName );
	this.calendar = document.createElement( 'div' );
	this.calendar.className = 'Calendar';
	this.pelement.appendChild( this.calendar );
	this.date = new Date();
	this.events = [];
	
	this.monthNames = [
		i18n( 'month_january' ),
		i18n( 'month_february' ),
		i18n( 'month_march' ),
		i18n( 'month_april' ),
		i18n( 'month_may' ),
		i18n( 'month_june' ),
		i18n( 'month_july' ),
		i18n( 'month_august' ),
		i18n( 'month_september' ),
		i18n( 'month_october' ),
		i18n( 'month_november' ),
		i18n( 'month_december' )
	];
};

Calendar.prototype.close = function()
{
	this.pelement.parentNode.removeChild( this.pelement );
}

// Sets the date
Calendar.prototype.setDate = function( date )
{
	this.date = date;
};

// Renders with refresh
Calendar.prototype.render = function( skipOnRender )
{
	if( !skipOnRender && this.onRender )
	{
		return this.onRender();
	}
	
	var self = this;
	
	// Render it...
	var ml = '';
	
	// Date setup
	var now = ( new Date() );
	var nowMonth = now.getMonth() + 1;
	var nowYear = now.getFullYear();
	var month = this.date.getMonth();
	var year = this.date.getFullYear();
	var currentDay = this.date.getDate();
	this.dateArray = [ year, month, currentDay ];
	
	var day = 1;
	
	var monthNames = this.monthNames;
	
	var up = true;
	
	var eventsToday = [];
	
	
	for( var w = -1; w < 6 && up; w++ )
	{
		ml += '<div class="HRow">';
		
		var dl = [ 1, 2, 3, 4, 5, 6, 0 ];
		var dn = [ 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun' ];
		
		for ( var a = 0; a < dl.length; a++ )
		{
			var d = dl[a];
			var dayName = dn[a];
			var key = year + '-' + StrPad( (month+1), 2, '0' ) + '-' + StrPad( day, 2, '0' );
			if( w >= 0 )
			{
				var dobj = new Date( year, month, day );
				var dobjMonth = dobj.getMonth() + 1;
				var dobjFullYear = dobj.getFullYear();
				var dliteral = '';
			
				if( dobj.getDate() < day )
					up = false;
				
				if( up && dobj.getDay() == d )
				{
					dliteral = day + '.';
					day++;
				}
				
				var dobjDate = dobj.getDate();
				
				var evts = '';
				if( dliteral.length && typeof( this.events[key] ) != 'undefined' )
				{
					// List out todays events
					if( dliteral == currentDay && dobjMonth == nowMonth && dobjFullYear == nowYear )
					{
						//console.log( 'One goes out' );
						// var out = JSON.parse( d ); huh?
						for( var aa = 0; aa < this.events[key].length; aa++ )
						{
							var out = this.events[key][aa];
							var ev = new CalendarEvent( out );
							eventsToday.push( ev );
						}
					}
				
					evts += '<div class="Events"><div class="Event"><div class="CalPopup">';
					var duplicates = [];
					var eventCnt = 0;
					for( var z = 0; z < this.events[key].length; z++ )
					{
						// TODO: Duplicate check should not be needed!
						found = false;
						for( var p = 0; p < duplicates.length; p++ )
						{
							if( duplicates[p] == this.events[key][z].Title )
							{
								found = true;
								break;
							}
						}
						if( found ) continue;
						if( eventCnt++ > 0 ) evts += '<hr class="Divider"/>';
						evts += '<span class="Title">' + this.events[key][z].Title + '</span>';
						duplicates.push( this.events[key][z].Title );
					}
					evts += '</div></div></div>';
				}
				
				var classes = [ 'Day' ];
				if( dliteral != '' && currentDay == dobjDate && dobjMonth == nowMonth && dobjFullYear == nowYear )
					classes.push( 'Current' );
				
				if( this.onSelectDay && parseInt( dliteral ) > 0 ) classes.push( 'MousePointer' );
				ml += '<div class="' + classes.join( ' ' ) + '">' + evts + '<div class="Number">' + dliteral + '</div></div>';
			}
			else
			{
				ml += '<div class="Day Label"><div class="LabelText">' + i18n( 'i18n_day_' + dayName ) + '</div></div>';
			}
		}
		ml += '</div>';
	}
	if( eventsToday.length )
	{
		var eventsTodayContainer = '<div id="calendarEventsToday" class="Padding"><p><strong>' + i18n( 'i18n_calendar_events' ) + ':</strong></p></div>';
		ml += eventsTodayContainer;
		this.calendar.innerHTML = ml;
		var container = document.getElementById( 'calendarEventsToday' );
		eventsToday.forEach( function( item ) {
			container.appendChild( item );
		});
	} 
	else
	{
		this.calendar.innerHTML = ml;
	}
	
	// Set events
	var eles = this.calendar.getElementsByTagName( 'div' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].className == 'Number' )
		{
			if( parseInt( eles[a].innerHTML ) > 0 )
			{
				if( this.onSelectDay )
				{
					var t = this;
					var tu = eles[a];
					eles[a].parentNode.intg = parseInt( eles[a].innerHTML );
					eles[a].parentNode.onclick = function()
					{
						t.onSelectDay( year + '-' + ( month + 1 ) + '-' + this.intg );
					}
				}
			}
		}
	}
	this.drawMonthname();
	
};
Calendar.prototype.addButton = function( btn )
{
	this.buttons.push( btn );
}
Calendar.prototype.createButton = function( icon )
{
	var s = document.createElement( 'span' );
	s.className = 'IconSmall MousePointer';
	if( icon ) s.classList.add( icon );
	return s;
}
Calendar.prototype.drawMonthname = function()
{
	var self = this;
	
	var nav = '<span class="IconSmall fa-arrow-left MousePointer"></span>\
	<span class="IconSmall fa-calendar-o MousePointer"></span>\
	<span class="IconSmall fa-arrow-right MousePointer"></span>';
	
	var year = this.date.getFullYear();
	var month = this.date.getMonth() + 1;

	var mn = this.monthNames[ month-1 ];
	mn = mn.substr( 0, 1 ).toUpperCase() + mn.substr( 1, mn.length - 1 );
	this.monthName.innerHTML = ( isMobile ? 'Friend Workspace' : ( mn + ' ' + year ) ) + '<div class="Navigation">' + nav + '</div>';
	
	// Add extra buttons
	if( this.buttons )
	{
		var nav = false;
		var eles = this.monthName.getElementsByTagName( 'div' );
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className == 'Navigation' )
			{
				nav = eles[a];
				break;
			}
		}
		if( nav )
		{
			for( var a = 0; a < this.buttons.length; a++ )
			{
				var btn = this.buttons[a];
				if( btn )
					nav.appendChild( btn );
			}
		}
	}
	
	var spans = this.monthName.getElementsByTagName( 'span' );
	spans[0].onclick = function( e )
	{
		var d = new Date();
		
		var m = self.date.getMonth();
		var y = self.date.getFullYear();
		m--;
		if( m < 0 ){ m = 11; y--; }
		d.setMonth( m );
		d.setFullYear( y );
		
		self.setDate( d );
		self.render();
		self.drawMonthname();
		
		return cancelBubble( e );
	}
	// Now
	spans[1].onclick = function( e )
	{
		var d = new Date();
		self.setDate( d );
		self.render();
		self.drawMonthname();
	}
	spans[2].onclick = function()
	{
		var d = new Date();
		
		var m = self.date.getMonth();
		var y = self.date.getFullYear();
		m++;
		if( m > 11 ){ m = 0; y++; }
		d.setMonth( m );
		d.setFullYear( y );
		
		self.setDate( d );
		self.render();
		self.drawMonthname();
	}
};

CalendarEvent = function( data )
{
	var self = this;
	//console.log( 'CalendarEvent', data );
	data.Type = 'CalendarEvent';
	self.data = data;
	return self.init();
}

// Public

CalendarEvent.prototype.close = function()
{
	var self = this;
	self.element.parentNode.removeChild( self.element );
}

CalendarEvent.prototype.init = function()
{
	var self = this;

	var title = self.data.Title;
	
	self.element = document.createElement( 'div' );
	self.element.className = "CalendarDetailEvent";
	// remove
	if( self.data.ID.indexOf( '_' ) < 0 )
	{
		var remove = document.createElement( 'div' );
		remove.className = 'IconSmall FloatRight MousePointer fa-remove';
		remove.onclick = function(){ 
			console.log( 'Whot?' );
			Workspace.removeCalendarEvent( self.data.ID ); 
		}
		self.element.appendChild( remove );
		
		var edit = document.createElement( 'div' );
		edit.className = 'IconSmall FloatRight MousePointer fa-edit MarginRight';
		edit.onclick = function(){
			Workspace.editCalendarEvent( self.data.ID );
		}
		self.element.appendChild( edit );
	}
	else
	{
		var off = self.data.ID.indexOf( '_' );
		title += ' (' + self.data.ID.substr( off + 1, self.data.ID.length - off - 1 ) + ')';
	}
	// Title
	setP( title );
	// Description
	setP( self.data.Description );
	// From
	setP( self.data.TimeFrom, 'i18n_from' );
	// To
	setP( self.data.TimeTo, 'i18n_to' );
	
	self.bind();
	self.element.fileInfo = self.data;
	self.element.fileInfo.getDropInfo = function() { return self.data; };
	return self.element;
	
	function setP( str, emStr )
	{
		var p = document.createElement( 'p' );
		if( emStr )
		{
			var em = document.createElement( 'em' );
			em.innerHTML = i18n( emStr ) + ':';
			p.appendChild( em );
		}
		p.innerHTML = p.innerHTML + str;
		self.element.appendChild( p );
	}
}

CalendarEvent.prototype.bind = function()
{
	var self = this;
	self.element.onmousedown = function()
	{
		window.mouseDown = self.element;
		self.pickupTimer = window.setTimeout( doPickup, 100 );
		function doPickup()
		{
			self.pickupTimer = null;
			self.hasPickup = true;
			mousePointer.pickup( self.element );
		}
	}
	
	self.element.onmouseup = function()
	{
		if( self.pickupTimer )
			window.clearTimeout( self.pickupTimer );
		
		if( self.hasPickup )
		{
			window.targetMovable = false;
			self.hasPickup = false;
		}
	}
}

