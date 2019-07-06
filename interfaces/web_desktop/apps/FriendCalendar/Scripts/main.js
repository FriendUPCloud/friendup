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

var eventPaletteBackground = [
	'#a01507'
];
var eventPaletteLighter = [
	'#e74c3c'
];
var eventPaletteForeground = [
	'#ffffff'
];

// Global events ---------------------------------------------------------------
var moveListener = null;
var upListener = null;
var eventMode = null; // We're not in an event mode | we are in an event mode

window.addEventListener( 'mouseup', function( e )
{
	if( upListener ) upListener( e );
} );
window.addEventListener( 'mousemove', function( e )
{
	if( moveListener ) moveListener( e );
} );
// End global events -----------------------------------------------------------

var calendarRowHeight = 30; // <- will be overwritten below w actual height

// Get the users
{
	var you = document.createElement( 'div' );
	you.className = 'User';
	you.innerHTML = i18n( 'i18n_user_you' );
	
	var youBall = document.createElement( 'div' );
	youBall.className = 'Ball';
	youBall.style.backgroundColor = eventPaletteBackground[0];
	youBall.style.borderColor = eventPaletteLighter[0];
	you.appendChild( youBall );
	
	ge( 'UsersGroups' ).appendChild( you );
}

var Calendar = {
	events: [],
	listMode: 'month',
	render: function()
	{
		if( this.listMode == 'week' )
		{
			return this.renderWeek();
		}
		else if( this.listMode == 'day' )
		{
			return this.renderDay();
		}
		// Catch all
		else
		{
			return this.renderMonth();
		}
	},
	renderMonth: function()
	{
		// Get a date object for current month....
		var dob = new Date();
		
		// Render it...
		var ml = '';
		
		// Date setup
		var month = this.date.getMonth();
		var year = this.date.getFullYear();
		var currentDay = this.date.getDay();
		this.dateArray = [ year, month, currentDay ];
		
		var day = 1;
		
		var monthNames = [
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
		
		var up = true;
		var calStart = false;
		
		for( var w = -1; w < 6 && up; w++ )
		{
			// We're up
			if( month != ( new Date( year, month, day ).getMonth() ) )
				break;
			
			// Start header
			if( w == -1 )
				ml += '<div class="CalendarHeaderRow">';
			else if( !calStart && w == 0 )
			{
				ml += '<div class="CalendarDates">';
				calStart = true;
			}
			
			ml += '<div class="CalendarRow HRow">';
			
			var dl = [ 1, 2, 3, 4, 5, 6, 0 ];
			var dn = [ i18n('i18n_mon'), i18n('i18n_tue'), i18n('i18n_wed'), i18n('i18n_thu'), i18n('i18n_fri'), i18n('i18n_sat'), i18n('i18n_sun') ];
			
			for ( var a = 0; a < dl.length; a++ )
			{
				var d = dl[a];
				var dayName = dn[a];
				var key = year + '-' + (month+1) + '-' + day;
				
				if( w >= 0 )
				{
					var dobj = new Date( year, month, day );
					var dliteral = '';
				
					if( dobj.getDate() < day )
						up = false;
					
					if( up && dobj.getDay() == d )
					{
						dliteral = day + '.';
						day++;
					}
					
					var evts = '';
					if( dliteral.length && typeof( this.events[key] ) != 'undefined' )
					{
						evts += '<div class="Events">';
						var duplicates = [];
						for( var z = 0; z < this.events[key].length; z++ )
						{
							// TODO: Duplicate check should not be needed!
							found = false;
							for( var p = 0; p < duplicates.length; p++ )
							{
								if( duplicates[p] == this.events[key][z].Name )
								{
									//console.log( 'Found duplicate "' + duplicates[p] + '"..' );
									found = true;
									break;
								}
							}
							if( found ) continue;
							
							var st = 'background-color: ' + eventPaletteLighter[ 0 ] + ';';
							
							evts += '<div class="Event" style="' + st + '"><span class="Title">' + this.events[key][z].Name + '</span></div>';
							duplicates.push( this.events[key][z].Name );
						}
						evts += '</div>';
					}
					ml += '<div class="Day" ondblclick="AddEvent(' + day + ')">' + evts + '<div class="Number">' + dliteral + '</div></div>';
				}
				else
				{
					ml += '<div class="Day Label"><div class="LabelText">' + dayName + '</div></div>';
				}
			}
			ml += '</div>';
			
			// End header
			if( w == -1 )
				ml += '</div>';
		}
		
		// End calendar dates
		if( calStart )
			ml += '</div>';
		
		// Add events and add element
		var eventDiv = document.createElement( 'div' );
		eventDiv.className = 'MonthContainer';
		eventDiv.addEventListener( 'mousedown', function( e )
		{
		} );
		eventDiv.innerHTML = ml;
		ge( 'MainView' ).innerHTML = '';
		ge( 'MainView' ).appendChild( eventDiv );
		
		ge( 'MonthName' ).innerHTML = monthNames[ month ] + ' ' + year;
		
		this.refresh();
	},
	renderWeek: function()
	{
		//console.log( 'Rendering!' );
		var self = this;
		
		// Get a date object for current month....
		var dob = new Date();
		
		// Render it...
		var ml = '';
		
		// Date setup
		var month = this.date.getMonth();
		var year = this.date.getFullYear();
		var currentDay = this.date.getDay();
		this.dateArray = [ year, month, currentDay ];
		
		var startDay = this.date.getDate();
		
		var time = this.date.getTime();
		var findDay = new Date( time );
		
		// Find start of week (where monday is 1)
		while( findDay != 1 )
		{
			time -= 86400000;
			findDay = new Date( time ).getDay();
			startDay--;
		}
		
		var monthNames = [
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
		
		var up = true;
		var calStart = false;
		var queuedEventRects = [];
		
		for( var w = -1; w < 1; w++ )
		{
			var day = startDay;
			
			// Start header
			if( w == -1 )
				ml += '<div class="CalendarHeaderRow Week">';
			else if( !calStart && w == 0 )
			{
				ml += '<div class="CalendarDates Week">';
				calStart = true;
			}
			
			ml += '<div class="CalendarRow HRow">';
			
			var dl = [ -1, 1, 2, 3, 4, 5, 6, 0 ];
			var dn = [ 0, i18n('i18n_mon'), i18n('i18n_tue'), i18n('i18n_wed'), i18n('i18n_thu'), i18n('i18n_fri'), i18n('i18n_sat'), i18n('i18n_sun') ];
			
			for( var a = 0; a < dl.length; a++ )
			{
				if( dl[a] == -1 )
				{
					if( w == -1 )
					{
						ml += '<div class="Day Column Label"><div class="LabelText">' + i18n( 'i18n_time' ) + '</div></div>';
					}
					else
					{
						var evtl = '';
						for( var t = 0; t < 24; t += 0.5 )
						{
							var hour = StrPad( Math.floor( t ), 2, '0' );
							var minute = StrPad( ( t - Math.floor( t ) ) * 60, 2, '0' );
							evtl += '<div class="TimeSlot">' + hour + ':' + minute + '</div>';
						}
						ml += '<div class="Day Column Negative TextCenter" ondblclick="AddEvent(' + day + ')">' + evtl + '</div>';
					}
					continue;
				}
				var d = dl[a];
				var dayName = dn[a];
				var key = year + '-' + (month+1) + '-' + day;
				var keyPadded = year + '-' + StrPad( month + 1, 2, '0' ) + '-' + StrPad( day, 2, '0' );
				
				var dobj = new Date( year, month, day );
				var dliteral = '';
			
				if( dobj.getDate() < day )
					up = false;
				
				if( up && dobj.getDay() == d )
				{
					dliteral = day + '.';
					day++;
				}

				if( w >= 0 )
				{
					
					// Generate events by time
					var evts = '';
					for( var t = 0; t < 24; t += 0.5 )
					{
						evts += '<div class="TimeSlot">&nbsp;</div>';
					}
					
					// Event rects
					var timez = '';
					var events = this.events[ key ];
					if( typeof( events ) != 'undefined' )
					{
						for( var b = 0; b < events.length; b++ )
						{
							var ypos = events[ b ].DateStart.split( ' ' )[1];
							ypos = ypos.split( ':' );
							ypos = parseInt( ypos[0] ) + ( ypos[1] / calendarRowHeight );
							
							ypos = ypos / 24 * 100;
							
							var height = events[ b ].DateEnd.split( ' ' )[1];
							height = height.split( ':' );
							height = parseInt( height[0] ) + ( height[1] / calendarRowHeight );
							
							height = height / 24 * 100;
							height = height - ypos;
							
							queuedEventRects.push( {
								day: day,
								ypos: ypos,
								height: height,
								event: events[ b ]
							} );
						}
					}
					
					ml += '<div class="Day Column" id="Day' + day + '" ondblclick="AddEvent(' + day + ')">' + timez + evts + '</div>';
				}
				else
				{
					ml += '<div class="Day Column Label"><div class="LabelText">' + dayName + ' ' + day + '/' + ( month + 1 ) + '</div></div>';
				}
			}
			ml += '</div>';
			
			// End header
			if( w == -1 )
				ml += '</div>';
		}
		
		// End calendar dates
		if( calStart )
			ml += '</div>';
		
		var eventDiv = document.createElement( 'div' );
		eventDiv.className = 'WeekContainer';
		// Add events and add element ------------------------------------------
		eventDiv.addEventListener( 'mousedown', function( e )
		{
			if( eventMode ) return;
			// Find day element
			var t = e.target ? e.target : e.srcElement;
			while( t != document.body )
			{
				if( t.classList && t.classList.contains( 'Day' ) )
					break;
				t = t.parentNode;
			}
			// Error!
			if( t == document.body )
				return;
			
			// Correct, displayed height
			calendarRowHeight = t.querySelector( '.TimeSlot' ).offsetHeight;
			
			var scrollT = ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop;
			
			eventDiv.data = {
				mousedown: true,
				mode: 0,
				x: e.clientX,
				y: e.clientY + scrollT,
				dayElement: t
			};
		} );
		moveListener = function( e )
		{
			if( eventMode ) return;
			if( !eventDiv || !eventDiv.data || !eventDiv.data.mousedown )
				return;
			var scrollT = ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop;
			var d = eventDiv.data;
			var ymotion = ( e.clientY + scrollT ) - d.y;
			ymotion = Math.floor( ymotion / calendarRowHeight ) * calendarRowHeight;
			eventDiv.data.h = ymotion;
			
			// First clicking
			if( d.mode == 0 && ymotion > 10 )
			{
				// Error!
				if( !d.dayElement ) return;
								
				// Make a new event rect
				d.mode = 1;
				if( d.div )
				{
					d.div.parentNode.removeChild( d.div );
					d.div = null;
				}
				d.div = document.createElement( 'div' );
				d.div.className = 'EventRect New';
				
				// Add the element
				d.dayElement.appendChild( d.div );
				var top = GetElementTop( d.dayElement );
				d.div.style.top = Math.floor( ( d.y - top ) / calendarRowHeight ) * calendarRowHeight + 'px';
			}
			// Resizing mode
			else if( d.mode == 1 )
			{
				if( ymotion > 10 )
				{
					d.div.style.height = ymotion + 'px';
				}
				else
				{
					d.div.style.height = '';
				}
			}
		};
		upListener = function( e )
		{
			// Add only one event at a time
			if( eventMode ) return;
			
			// Convert rect coords to time
			var top = GetElementTop( eventDiv.data.dayElement );
			var from = eventDiv.data.y - top;
			var to = ( eventDiv.data.y + eventDiv.data.h ) - top;
			var whole = eventDiv.data.dayElement.offsetHeight;
			to = to / whole * 24;
			from = from / whole * 24;
			to = Math.floor( to * 2 ) / 2;
			from = Math.floor( from * 2 ) / 2;
			
			// Clear event data
			var da = eventDiv.data.dayElement;
			eventDiv.data = null;
			
			// Open new event window
			eventMode = new View( {
				title: i18n( 'i18n_add_new_event' ),
				width: 500,
				height: 700
			} );
			
			var from = from + '';
			var to = to + '';
			from = from.split('.');
			to = to.split('.');
			if( from.length > 1 )
				from = StrPad( from[0], 2, '0' ) + ':' + (parseInt(from[1])/10*60);
			else from = StrPad( from[0], 2, '0' ) + ':00';
			if( to.length > 1 )
				to = StrPad( to[0], 2, '0' ) + ':' + (parseInt(to[1])/10*60);
			else to = StrPad( to[0], 2, '0' ) + ':00';
			to += ':00.000';
			from += ':00.000';
			
			var date = self.date.getFullYear() + '-' + StrPad( self.date.getMonth() + 1, 2, '0' ) + '-' + StrPad( self.date.getDate(), 2, '0' );
			
			// Set replacements based on calculations and language
			var f = new File( 'Progdir:Templates/event.html' );
			f.replacements = {
				timefrom: from,
				timeto: to,
				date: date,
				allday: from == 0 && to == 24 ? 'checked' : ''
			};
			f.i18n();
			f.onLoad = function( data )
			{
				if( eventMode )
				{
					eventMode.setContent( data );
				}
			}
			f.load();
			eventMode.onClose = function()
			{
				da.parentNode.removeChild( da );
				eventMode = null;
			}
		}
		// Done events ---------------------------------------------------------
		eventDiv.innerHTML = ml;
		ge( 'MainView' ).innerHTML = '';
		ge( 'MainView' ).appendChild( eventDiv );
		
		for( var a = 0; a < queuedEventRects.length; a++ )
		{
			var eventRect = new EventRect( queuedEventRects[ a ] );
		}
		
		ge( 'MonthName' ).innerHTML = monthNames[ month ] + ' ' + year;
		
		this.refresh();
	},
	renderDay: function()
	{
		ge( 'MainView' ).innerHTML = '';
	},
	populate: function( data )
	{
		
	},
	refresh: function()
	{
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
		var ch = ge( 'MainView' ).querySelector( '.CalendarHeaderRow' );
		if( cd && ch )
		{
			var scWi = cd.offsetWidth - cd.clientWidth;
			if( scWi > 0 )
			{
				ch.style.width = cd.clientWidth + 'px';
			}
		}
	}
};

var EventRect = function( definition )
{
	this.definition = definition;
	this.init();
};
EventRect.prototype.init = function()
{
	if( this.div ) return;
	this.div = document.createElement( 'div' );
	this.div.className = 'EventRect MoustPointer';
	this.div.style.top = this.definition.ypos + '%';
	this.div.style.height = this.definition.height + '%';
	this.div.style.color = eventPaletteForeground[ 0 ];
	this.div.style.backgroundColor = eventPaletteBackground[ 0 ];
	this.div.innerHTML = this.definition.event.Name;
	ge( 'Day' + this.definition.day ).appendChild( this.div );
	
	this.div.onclick = function( e )
	{
	}
}

function AddEvent( day )
{
	var v = new View( {
		title: 'Add event',
		width: 500,
		height: 500
	} );
	
	var f = new File( 'Progdir:Templates/event.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}


// Previous month
function GoPrevious( e )
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( --m < 0 ){ m = 11; y--; }
	
	Calendar.date = new Date( y, m, 1 );
	Calendar.render();
}

// Next month
function GoNext()
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( ++m > 11 ){ m = 0; y++; }
	
	Calendar.date = new Date( y, m, 1 );
	Calendar.render();
}


Application.run = function( msg, iface )
{
	Calendar.date = new Date();
	Calendar.render();
}

window.addEventListener( 'resize', function()
{
	Calendar.refresh();
} );

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'setcalendarmode':
			Calendar.listMode = msg.mode;
			Calendar.render();
			break;
		case 'updateEvents':
			Calendar.events = [];
			var tspan = 60 * 60 * 24 * 1000;
			for( var a = 0; a < msg.events.length; a++ )
			{
				var ev = msg.events[a];
				
				var d = ev.DateStart.split( ' ' )[0];
				d = d.split( '-' );
				var from = new Date( d[0], d[1], d[2] );
				var fromTime = from.getTime();
				
				var t = ev.DateEnd.split( ' ' )[0];
				t = t.split( '-' );
				var to = new Date( t[0], t[1], t[2] );
				var toTime = to.getTime();
				
				// Make sure we have toTime
				if( toTime < fromTime )
					toTime = fromTime;
				
				// Fill this date in
				for( var b = fromTime; b <= toTime; b += tspan )
				{
					var k = new Date( b );
					k = k.getFullYear() + '-' + k.getMonth() + '-' + k.getDate();
					if( typeof( Calendar.events[k] ) == 'undefined' )
						Calendar.events[k] = [];
					Calendar.events[k].push( ev );
				}
			}
			Calendar.render();
			break;
	}
}

