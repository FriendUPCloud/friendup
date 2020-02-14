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

/* Palette names:
	Turquoise
	Amethyst
	Emerald
	Peter River
	Sun Flower
	Carrot
	Alizarin
	Orange
	Wet Asphalt
*/
var eventPaletteBackground = [
	'#1abc9c', '#9b59b6', '#2ecc71', '#3498db', 
	'#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#34495e'
];

var eventPaletteLighter = [
	'#3cc8ac', '#bd84d3', '#51d55c', '#58ade3',
	'#f9d543', '#f49c4d', '#ff7364', '#fcb544', '#4a6075'
];
var eventPaletteForeground = [
	'#ffffff', '#ffffff', '#ffffff', '#ffffff',
	'#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'
];

Date.prototype.getWeek = function()
{
	var onejan = new Date( this.getFullYear(), 0, 1 );
	var today = new Date( this.getFullYear(), this.getMonth(), this.getDate() );
	var dayOfYear = ( ( today - onejan + 86400000 ) / 86400000 );
	return Math.ceil( dayOfYear / 7 );
};

// Global events ---------------------------------------------------------------
var moveListener = null;
var upListener = null;
var eventMode = null; // We're not in an event mode | we are in an event mode
var firstDraw = true;

window.addEventListener( 'mouseup', function( e )
{
	if( upListener ) upListener( e );
} );
window.addEventListener( 'mousemove', function( e )
{
	if( moveListener ) moveListener( e );
} );
// End global events -----------------------------------------------------------

var calendarRowHeight = 27; // <- will be overwritten below w actual height

// Get the users
var userList = {};
function updateUsers()
{
	ge( 'UsersGroups' ).innerHTML = '';
	
	var you = document.createElement( 'div' );
	you.className = 'User';
	you.innerHTML = i18n( 'i18n_user_you' );
	
	var youBall = document.createElement( 'div' );
	youBall.className = 'Ball';
	youBall.style.backgroundColor = eventPaletteBackground[0];
	youBall.style.borderColor = eventPaletteLighter[0];
	you.appendChild( youBall );
	
	ge( 'UsersGroups' ).appendChild( you );
	
	var inc = 1;
	
	for( var a in userList )
	{
		if( a == 'i18n_you' )
			continue;
		var y = document.createElement( 'div' );
		y.className = 'User';
		y.innerHTML = a;
	
		var yo = document.createElement( 'div' );
		yo.className = 'Ball';
		yo.style.backgroundColor = eventPaletteBackground[inc];
		yo.style.borderColor = eventPaletteLighter[inc++];
		y.appendChild( yo );
		
		ge( 'UsersGroups' ).appendChild( y );
	}
}
updateUsers();

var Calendar = {
	events: [],
	date: ( new Date() ),
	weekScrollTop: 0,
	listMode: 'month',
	exStyles: null, // extra styles
	// TODO: Add refreshing of actual calendar dates! Add busy loader
	render: function()
	{
		eventMode = null
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
		ge( 'MainView' ).classList.add( 'Month' );
		ge( 'MainView' ).classList.remove( 'Week', 'Day' );
		
		// Flush "long events"
		ge( 'LongEvents' ).innerHTML = '';
		ge( 'MainView' ).style.top = '';
		ge( 'LongEvents' ).style.height = '0';
		
		ge( 'monthoverview' ).classList.add( 'Active' );
		ge( 'weekoverview' ).classList.remove( 'Active' );
		
		// Get a date object for current month....
		var dob = new Date();
		
		// Render it...
		var ml = '';
		
		// Date setup
		var month = this.date.getMonth();
		var year = this.date.getFullYear();
		var currentDay = this.date.getDay();
		this.dateArray = [ year, month, this.date.getDate() ];
		
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
			{
				break;
			}
			
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
					
					var thisDay = day;
					
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
									found = true;
									break;
								}
							}
							if( found ) continue;
							
							var paletteSlot = this.events[key][z].Your ? 0 : 1;
							userList[ this.events[key][z].Owner ] = this.events[key][z].Owner;
							
							var st = 'background-color: ' + eventPaletteBackground[ paletteSlot ] + ';';
							
							evts += '<div class="Event" style="' + st + '"><span class="Title">' + this.events[key][z].Name + '</span></div>';
							duplicates.push( this.events[key][z].Name );
						}
						evts += '</div>';
					}
					ml += '<div class="Day" onclick="AddEvent(' + year + ',' + ( month + 1 ) + ',' + thisDay + ')">' + evts + '<div class="Number">' + dliteral + '</div></div>';
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
		
		this.dayRows = w;
		this.refresh();
		this.refreshRoster( 'week' );
	},
	renderWeek: function()
	{
		ge( 'MainView' ).classList.add( 'Week' );
		ge( 'MainView' ).classList.remove( 'Month', 'Day' );
		
		ge( 'monthoverview' ).classList.remove( 'Active' );
		ge( 'weekoverview' ).classList.add( 'Active' );
		
		//console.log( 'Rendering!' );
		var self = this;
		
		// Get a date object for current month....
		var dob = new Date();
		
		// Render it...
		var ml = lt = '';
		
		// Date setup
		var month = this.date.getMonth();
		var year = this.date.getFullYear();
		var currentDay = this.date.getDay();
		this.dateArray = [ year, month, this.date.getDate() ];
		
		var todayY = ( new Date() ).getFullYear();
		var todayM = ( new Date() ).getMonth();
		var todayD = ( new Date() ).getDate();
		
		var startDay = this.date.getDate();
		
		var time = this.date.getTime();
		var findDay = new Date( time );
		
		// Find start of week (where monday is 1)
		if( ( new Date( time ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				time -= 86400000;
				findDay = new Date( time ).getDay();
				startDay--;
			}
		}
		
		var week = ( new Date( year, month, startDay ) ).getWeek() + 1;
		
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
		var allDayEvents = [];
		var allWeekEvents = [];
		
		for( var w = -1; w < 1; w++ )
		{
			var day = startDay;
			var ctime = time;
			
			// Start header
			if( w == -1 )
			{
				lt += '<div class="CalendarHeaderRow Week">';
				lt += '<div class="CalendarRow HRow">';
			}
			else if( !calStart && w == 0 )
			{
				ml += '<div class="CalendarDates Week">';
				ml += '<div class="CalendarRow HRow">';
				calStart = true;
			}
			
			
			var dl = [ -1, 1, 2, 3, 4, 5, 6, 0 ];
			var dn = [ 0, i18n('i18n_mon'), i18n('i18n_tue'), i18n('i18n_wed'), i18n('i18n_thu'), i18n('i18n_fri'), i18n('i18n_sat'), i18n('i18n_sun') ];
			
			for( var a = 0; a < dl.length; a++ )
			{	
				if( dl[a] == -1 )
				{
					if( w == -1 )
					{
						lt += '<div class="Day Column Label"><div class="LabelText">' + i18n( 'i18n_time' ) + '</div></div>';
					}
					else
					{
						var evtl = '';
						for( var t = 0; t < 24; t += 0.5 )
						{
							var hour = StrPad( Math.floor( t ), 2, '0' );
							var minute = StrPad( ( t - Math.floor( t ) ) * 60, 2, '0' );
							var n = ' Time' + ( t * 100 );
							evtl += '<div class="TimeSlot' + n + '">' + hour + ':' + minute + '</div>';
						}
						ml += '<div class="Day Column Negative TextCenter">' + evtl + '</div>';
					}
					continue;
				}
				
				var dobj   = new Date( ctime );
				var cday   = dobj.getDate();
				var cmonth = dobj.getMonth() + 1;
				var cyear  = dobj.getFullYear();
				
				var d = dl[a];
				var dayName = dn[a];
				var key = cyear + '-' + ( cmonth ) + '-' + cday;
				var keyPadded = cyear + '-' + StrPad( cmonth, 2, '0' ) + '-' + StrPad( cday, 2, '0' );
				
				var dliteral = '';
			
				if( dobj.getDate() < cday )
					up = false;

				if( up && dobj.getDay() == d )
				{
					dliteral = day + '.';
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
					var events = [];
					for( var z in this.events[ key ] )
						events.push( this.events[ key ][ z ] );
					
					// Find range events
					for( var z in this.events )
					{
						for( var bb = 0; bb < this.events[ z ].length; bb++ )
						{
							if( this.events[ z ][ bb ].MetaData )
							{
								try
								{
									var md = JSON.parse( this.events[ z ][ bb ].MetaData );
									if( md.DateTo )
									{
										events.push( this.events[ z ][ bb ] );
									}
								}
								catch( e ){};
								
							}
						}
					}
					
					if( typeof( events ) != 'undefined' )
					{
						for( var b = 0; b < events.length; b++ )
						{	
							var ypos = events[ b ].DateStart.split( ' ' )[ 1 ];
							ypos = ypos.split( ':' );
							
							ypos = parseInt( ypos[0] ) + ( ypos[ 1 ] / 60 );
							
							// parted on 24 hours * 100%
							ypos = ypos / 24 * 100;
							
							var day = ( new Date( events[ b ].DateStart ) ).getDay();
							
							var height = events[ b ].DateEnd.split( ' ' )[ 1 ];
							height = height.split( ':' );
							height = parseInt( height[ 0 ] ) + ( height[ 1 ] / 60 );
							
							height = height / 24 * 100;
							height = height - ypos;
							
							// Check metadata
							var md = false;
							try
							{
								md = JSON.parse( events[ b ].MetaData );
							}
							catch( e )
							{
								md = false;
							}
							if( md )
							{
								// All day event
								if( md.AllDay )
								{
									if( !allDayEvents[ day ] )
										allDayEvents[ day ] = [];
									allDayEvents[ day ].push( events[ b ] );
									continue;
								}
								// All week event
								else if( md.AllWeek )
								{
									allWeekEvents.push( events[ b ] );
									continue;
								}
								// Add all day events for whole span
								else if( md.DateTo )
								{
									var timeFrom = events[ b ].DateStart;
									var timeTo = md.DateTo + ' ' + timeFrom.split( ' ' )[1];
									
									// Get intelligeble timestamps for the span
									var t = ( new Date( timeFrom ) ).getTime();
									var e = ( new Date( timeTo ) ).getTime();
									
									// Check for time 
									var st = new Date( time );
									st = ( new Date( st.getFullYear() + '-' + ( st.getMonth() + 1 ) + '-' + st.getDate() + ' ' + timeFrom.split( ' ' )[1] ) ).getTime();
									
									// Add the days
									for( var c = 1; c <= 7; c++ )
									{
										// Got it!
										// TODO: Could be that start date doesn't need to check day before..
										
										if( st >= t && st <= e )
										{
											var d = ( new Date( st ) ).getDate();
											
											var found = false;
											for( var f in allDayEvents[ c ] )
											{
												if( allDayEvents[ c ][ f ].ID == events[ b ].ID )
												{
													found = true;
													break;
												}
											}
											if( !found )
											{
												if( !allDayEvents[ c ] )
													allDayEvents[ c ] = [];
												allDayEvents[ c ].push( events[ b ] );
											}
										}
										st += 86400000;
									}
									continue;
								}
							}
							
							queuedEventRects.push( {
								day: cday,
								ypos: ypos,
								height: height,
								event: events[ b ]
							} );
						}
					}
					
					var p = cyear + '-' + StrPad( cmonth, 2, '0' ) + '-' + StrPad( cday, 2, '0' );
					ml += '<div class="Day Column" date="' + p + '" id="Day' + cday + '">' + 
						timez + evts + '</div>';
					
					ctime += 86400000;
				}
				else
				{
					var cl = '';
					
					var y = new Date( ctime ).getFullYear();
					var m = new Date( ctime ).getMonth();
					var d = new Date( ctime ).getDate();
					
					if( m == todayM && y == todayY && d == todayD )
						cl = ' Today';
					lt += '<div class="Day Column Label' + cl + '"><div class="LabelText">' + dayName + ' ' + StrPad( cday, 2, '0' ) + '/' + StrPad( cmonth, 2, '0' ) + '</div></div>';
					ctime += 86400000;
				}
			}
			
			// End header
			if( w == -1 )
			{
				lt += '</div>';
				lt += '</div>';
			}
			else
			{
				ml += '</div>';
			}
		}
		
		// End calendar dates
		if( calStart )
			ml += '</div>';
		
		var eventDiv = document.createElement( 'div' );
		eventDiv.className = 'WeekContainer';
		
		// Long events ---------------------------------------------------------
		ge( 'LongEvents' ).innerHTML = '';
		
		var eventCount = len = maxDayslotLength = 0;
		if( allDayEvents )
			for( var a in allDayEvents ) len++;
		
		if( len > 0 )
		{
			for( var b = 1; b <= 7; b++ )
			{
				var daySlot = document.createElement( 'div' );
				daySlot.className = 'LongEvent Day';
				daySlot.style.width = 100 / 7 + '%';
				daySlot.style.left = 100 / 7 * ( b - 1 ) + '%';
				ge( 'LongEvents' ).appendChild( daySlot );
				
				var ade = allDayEvents[ b ];
				if( !ade ) continue;
				
				for( var a = 0; a < ade.length; a++ )
				{
					var ev = ade[ a ];
					var l = document.createElement( 'div' );
				
					l.className = 'MousePointer PaddingSmall';
					
					try
					{
						var md = JSON.parse( allDayEvents[ b ][ a ].MetaData );
						if( md.DateTo )
						{
							l.classList.add( 'Spanned' );
						}
					}
					catch( e ){};
					
					l.innerHTML = ev.Name;
					l.style.height = calendarRowHeight + 'px';
					l.style.backgroundColor = eventPaletteBackground[ 0 ];
					l.style.color = eventPaletteForeground[ 0 ];
					( function( evt, ele ) {
						ele.ondblclick = function( e )
						{
							EditEvent( evt.ID );
						}
					} )( ev, l );
					
					daySlot.appendChild( l );
				}
				
				if( ade.length > maxDayslotLength )
					maxDayslotLength = ade.length;
			}
			eventCount += maxDayslotLength;
		}
		if( allWeekEvents.length )
		{
			for( var a = 0; a < allWeekEvents.length; a++ )
			{
				var ev = allWeekEvents[ a ];
				var l = document.createElement( 'div' );
				
				l.className = 'LongEvent MousePointer Week PaddingSmall';
				l.innerHTML = ev.Name;
				l.style.top = ( a + eventCount ) * calendarRowHeight + 'px';
				l.style.height = calendarRowHeight + 'px';
				l.style.backgroundColor = eventPaletteBackground[ 0 ];
				l.style.color = eventPaletteForeground[ 0 ];
				( function( evt, ele ) {
					ele.ondblclick = function( e )
					{
						EditEvent( evt.ID );
					}
				} )( ev, l );
				ge( 'LongEvents' ).appendChild( l );
			}
			eventCount += allWeekEvents.length;
		}
		if( eventCount > 0 )
		{
			var leHeight = calendarRowHeight * eventCount;
			ge( 'LongEvents' ).style.height = leHeight + 1 + 'px';
			ge( 'MainView' ).style.top = ge( 'TopPanel' ).offsetHeight + calendarRowHeight + leHeight + 1 + 'px';
		}
		else
		{
			ge( 'MainView' ).style.top = '';
			ge( 'LongEvents' ).style.height = '0';
		}
		
		ge( 'DayHeading' ).innerHTML = lt;
		
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
			
			if( !t.getAttribute( 'date' ) )
				return;
			
			// Correct, displayed height
			calendarRowHeight = t.querySelector( '.TimeSlot' ).offsetHeight;
			
			var scrollT = ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop;
			
			eventDiv.data = {
				mousedown: true,
				mode: 0,
				x: e.clientX,
				y: e.clientY + scrollT,
				dayElement: t,
				day: t.getAttribute( 'date' ).split( '/' )
			};
			return cancelBubble( e );
		} );
		moveListener = function( e )
		{
			if( eventMode ) return;
			if( !eventDiv || !eventDiv.data || !eventDiv.data.mousedown )
				return;
			var cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
			var scrollT = cd.scrollTop;
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
			if( !eventDiv.data ) return;
			
			// Convert rect coords to time
			var top = GetElementTop( eventDiv.data.dayElement );
			var from = eventDiv.data.y - top;
			var to = ( eventDiv.data.y + eventDiv.data.h ) - top;
			var whole = eventDiv.data.dayElement.offsetHeight;
			to = to / whole * 24;
			from = from / whole * 24;
			to = Math.floor( to * 2 ) / 2;
			from = Math.floor( from * 2 ) / 2;
			
			var date = eventDiv.data.day.join( '-' );
			
			// Clear event data
			var da = eventDiv.data.dayElement;
			eventDiv.data = null;
			
			// Open new event window
			eventMode = new View( {
				title: i18n( 'i18n_add_new_event' ),
				width: 500,
				height: 550
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
			
			// Set replacements based on calculations and language
			var f = new File( 'Progdir:Templates/event.html' );
			f.replacements = {
				title: '',
				leadin: '',
				timefrom: from,
				timeto: to,
				date: date,
				dateTo: date,
				timeslot: ' checked="checked"',
				allweek: '',
				allday: '',
				ID: 0,
				parentViewId: Application.viewId
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
				var ele = da.querySelector( '.New' );
				if( ele )
				{
					da.removeChild( ele );
				}
				eventMode = null;
			}
			
			return cancelBubble( e );
		}
		// Done events ---------------------------------------------------------
		
		eventDiv.innerHTML = ml;
		ge( 'MainView' ).innerHTML = '';
		ge( 'MainView' ).appendChild( eventDiv );
		
		// Add nowdiv
		nowDiv = document.createElement( 'div' );
		nowDiv.id = 'nowdiv';
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' ).appendChild( nowDiv );
		drawNow();
		
		ge( 'MainView' ).querySelector( '.CalendarDates' ).onscroll = function( e )
		{
			Calendar.weekScrollTop = this.scrollTop;
		}
		
		if( !firstDraw )
		{
			ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop = Calendar.weekScrollTop;
		}
		else
		{
			var tt = ge( 'MainView' ).querySelector( '.Time800' );
			ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop = tt.offsetTop;
			firstDraw = false;
		}
		
		// Add queued events
		for( var a = 0; a < queuedEventRects.length; a++ )
		{
			var eventRect = new EventRect( queuedEventRects[ a ] );
		}
		
		ge( 'MonthName' ).innerHTML = i18n( 'i18n_week' ) + ' ' + week + ', ' + year;
		
		this.refresh();
		this.repositionEvents();
		this.refreshRoster( 'week' );
	},
	renderDay: function()
	{
		ge( 'MainView' ).innerHTML = '';
	},
	refreshRoster: function( mode )
	{
		if( !mode ) mode = 'week';
		
		if( mode == 'week' )
		{
			var eles = Calendar.events;
			var hstr = '<p class="Heading BorderBottom PaddingBottom MarginBottom"><strong>' + i18n( 'i18n_weekly_events' ) + '</strong></p>';
			var pstr = '';
			var nstr = '';
			var now = ( new Date() ).getTime();
			var currdate = null;
			
			var time = this.date.getTime();
			var time2 = this.date.getTime();
			var findDay = new Date( time );
			var startDay = this.date.getDay();
			var endDay = this.date.getDay();
			var dateFrom = dateTo = '';
		
			// Find start of week (where monday is 1)
			// And find date span for the week
			if( ( new Date( time ).getDay() ) != 1 )
			{
				while( findDay != 1 )
				{
					time -= 86400000;
					var t1 = new Date( time );
					findDay = t1.getDay();
					startDay--;
					dateFrom = t1.getFullYear() + '-' + StrPad( t1.getMonth() + 1, 2, '0' ) + '-' + StrPad( t1.getDate(), 2, '0' ) + ' 00:00:00';
				}
				while( endDay < 7 )
				{
					time2 += 86400000;
					var t2 = new Date( time2 );
					findDay = t2.getDay();
					endDay++;
					dateTo = t2.getFullYear() + '-' + StrPad( t2.getMonth() + 1, 2, '0' ) + '-' + StrPad( t2.getDate(), 2, '0' ) + ' 23:59:59';
				}
			}
			
			// Time values for span
			dateFrom = ( new Date( dateFrom ) ).getTime();
			dateTo = ( new Date( dateTo ) ).getTime();
			
			for( var a in eles )
			{
				var eventList = eles[ a ];
				if( !eventList || !eventList.length ) continue;
				for( var b = 0; b < eventList.length; b++ )
				{
					var event = eventList[ b ];
					if( !event ) continue;
					
					var eventTime = new Date( event.DateStart ).getTime();
					var eventStop = false; 
					
					var md = false;
					try
					{
						md = JSON.parse( event.MetaData );
					}
					catch( e ){ md = false; }
					
					if( md && md.DateTo )
					{
						eventStop = new Date( md.DateTo ).getTime();
					}
					
					// Are we within time span?
					var within = eventTime >= dateFrom && eventTime <= dateTo;
					var within2 = eventStop ? 
						(
							( eventTime <= dateFrom && eventStop <= dateTo )
							||
							( eventTime >= dateFrom && eventStop <= dateTo )
							||
							( eventTime <= dateFrom && eventStop >= dateTo )
						) :
						false;
					// Done time span rules
					
					if( within || within2 )
					{
						var timestamp = ( new Date( event.DateEnd ) ).getTime();
					
						var cl = '';
						if( now > timestamp )
							cl = ' Expired';
						var dst = event.DateStart.split( ' ' )[0];
						if( currdate != dst )
						{
							currdate = dst;
							var s = '<p class="Date' + cl + '"><strong>' + currdate + '</strong></p>';
							if( cl ) pstr += s;
							else nstr += s;
						}
					
						var time = event.DateStart.split( ' ' )[1];
						time = time.split( ':' );
						time = time[0] + ':' + time[1];
						var s = '<p class="RosterEvent' + cl + '">' + time + ': ' + event.Name + '</p>';
						if( cl ) pstr += s;
						else nstr += s;
					}
				}
			}
			var ph = '<p class="Heading BorderBottom PaddingBottom MarginBottom"><strong>' + i18n( 'i18n_expired_events' ) + '</strong></p>';
			if( !pstr ) ph = '';
			
			// Update roster
			ge( 'Roster' ).innerHTML = hstr + nstr + ph + pstr;
		}
		else if( mode == 'month' )
		{
		}
		else if( mode == 'day' )
		{
		}
	},
	// Just neatly reposition stuff
	repositionEvents: function()
	{
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
		var eles = cd.getElementsByClassName( 'EventRect' );
		for( var a = 0; a < eles.length; a++ )
		{
			// Reset intersection info in this pass
			eles[a].intersecting = null;
			eles[a].classList.remove( 'Intersecting' );
			for( var c = 1; c <= 10; c++ )
			{
				eles[a].classList.remove( 'Width' + c );
			}
			// Animate reposition
			eles[a].classList.add( 'Animated' );
			( function( element ) {
				setTimeout( function()
				{
					var t = element.offsetTop;
					var h = element.offsetHeight;
					
					element.style.top = Math.round( t / calendarRowHeight ) * calendarRowHeight + 'px';
					element.style.height = Math.round( h / calendarRowHeight ) * calendarRowHeight + 'px';
					
					// Update rounded numbers
					t = element.offsetTop;
					h = element.offsetHeight;
					
					// Only save if moved
					if( element.moved )
					{
						element.moved = null;
					
						// Convert rect coords to time
						var wh = cd.querySelector( '.CalendarRow' );
						var from = t;
						var to = t + h;
						var whole = wh.offsetHeight;
						to   = to / whole * 24;
						from = from / whole * 24;
						to   = Math.floor( to * 100 );
						from = Math.floor( from * 100 );
						from = StrPad( from + '', 4, '0' );
						to   = StrPad( to + '',   4, '0' );
						var toHr = to.substr( 0, 2 );
						var toMn = to.substr( 2, 2 ); toMn = Math.round( parseInt( toMn ) / 100 ) * 30;
						toMn = StrPad( toMn + '', 2, '0' );
						var frHr = from.substr( 0, 2 );
						var frMn = from.substr( 2, 2 ); frMn = Math.round( parseInt( frMn ) / 100 ) * 30;
						frMn = StrPad( frMn + '', 2, '0' );
					
						// Finally the conversion to time
						from = frHr + ':' + frMn;
						to   = toHr + ':' + toMn;
					
						if( element.timeout )
							clearTimeout( element.timeout );
						element.timeout = setTimeout( function()
						{
							if( element.event )
							{
								var m = new Module( 'system' );
								m.execute( 
									'savecalendarevent', 
									{
										event: {
											TimeTo: to,
											TimeFrom: from
										},
										cid: element.event.definition.event.ID 
									}
								);
							}
							element.timeout = null;
						}, 250 );
					
						setTimeout( function()
						{
							element.classList.remove( 'Animated' );
						}, 250 );
					}
					else
					{
						element.classList.remove( 'Animated' );
					}
				}, 5 );
			} )( eles[ a ] );
		}
		// Find intersecting
		var cr = ge( 'MainView' ).querySelector( '.CalendarDates' );
		var days = cr.getElementsByClassName( 'Day' );
		for( var a = 0; a < days.length; a++ )
		{
			var evs = days[ a ].getElementsByClassName( 'EventRect' );
			for( var b = 0; b < evs.length; b++ )
			{
				if( evs[ b ].intersecting )
				{
					continue;
				}
				var out = this.getIntersectingEvents( a, evs[ b ] );
				if( out )
				{
					evs[ b ].classList.add( 'Intersecting', 'Width' + ( out.length + 1 ) );
					for( var c = 0; c < out.length; c++ )
					{
						out[ c ].classList.add( 'Intersecting', 'Width' + ( out.length + 1 ) );
					}
				}
			}
		}
	},
	// Get events that are graphically intersecting by day, top, height
	getIntersectingEvents: function( day, ele )
	{
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
		var days = cd.getElementsByClassName( 'Day' );
		var eles = days[ day ].getElementsByClassName( 'EventRect' );
		var out = [];
		var t = ele.offsetTop;
		var b = t + ele.offsetHeight;
		for( var a = 0; a < eles.length; a++ )
		{
			var elt = eles[ a ].offsetTop;
			var elb = eles[ a ].offsetTop + eles[ a ].offsetHeight;
			
			// Find intersecting rects
			if(
				( elt <= t && elb > t ) ||
				( elt < b && elb > b ) ||
				( elt >= t && elb <= b ) ||
				( elt < t && elb > b )
			)
			{
				if( eles[ a ] != ele )
				{
					eles[ a ].intersecting = ele;
					out.push( eles[ a ] );
				}
			}
		}
		// Return intersecting or false
		if( out.length > 0 ) return out;
		return false;
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
			else
			{
				ch.style.width = cd.clientWidth + 'px';
			}
		}
		if( this.listMode == 'month' )
		{
			var h = ge( 'MainView' ).offsetHeight - ( ge( 'MainView' ).querySelector( '.CalendarDates' ).offsetTop );
			if( !this.exStyles )
			{
				this.exStyles = document.createElement( 'style' );
				document.body.appendChild( this.exStyles );
			}
			this.exStyles.innerHTML = 'html .Day { height: ' + ( ( h / this.dayRows ) - 1 ) + 'px; }';
		}
		updateUsers();
	}
};

// An event rect! --------------------------------------------------------------

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
// End event rect --------------------------------------------------------------

function AddEvent( year, month, day )
{
	var v = new View( {
		title: 'Add event',
		width: 500,
		height: 500
	} );
	
	eventMode = v;
	
	var date = year + '-' + 
		StrPad( month, 2, '0' ) + '-' +
		StrPad( day, 2, '0' );

	var f = new File( 'Progdir:Templates/event.html' );
	f.replacements = {
		title: '',
		leadin: '',
		timefrom: '',
		timeto: '',
		date: date,
		dateTo: date,
		timeslot: ' checked="checked"',
		allweek: '',
		allday: '',
		ID: 0,
		parentViewId: Application.viewId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

function EditEvent( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		// TODO: Display some kind of error message
		if( e != 'ok' )
			return;
		
		var evd;
		try
		{
			evd = JSON.parse( d );
		}
		catch( e )
		{
			// TODO: Display some kind of error message
			return;
		}
		var v = new View( {
			title: i18n( 'i18n_edit_event' ),
			width: 500,
			height: 550
		} );
		
		try
		{
			var md = JSON.parse( evd.MetaData );
			evd.MetaData = md;
		}
		catch( e )
		{
		}
		
		var allDay = evd.MetaData.AllDay;
		var allWeek = evd.MetaData.AllWeek;
		
		evd.TimeFrom = evd.TimeFrom.split( ':' );
		evd.TimeTo = evd.TimeTo.split( ':' );
		if( evd.TimeFrom[ 0 ] == '24' ) evd.TimeFrom[ 0 ] = '00';
		if( evd.TimeTo[   0 ] == '24' ) evd.TimeTo[   0 ] = '00';
		evd.TimeFrom = evd.TimeFrom.join( ':' );
		evd.TimeTo = evd.TimeTo.join( ':' );
		
		var f = new File( 'Progdir:Templates/event.html' );
		f.replacements = {
			title: evd.Title,
			leadin: evd.Description,
			timefrom: evd.TimeFrom + ':00',
			timeto: evd.TimeTo + ':00',
			date: evd.Date,
			dateTo: evd.MetaData.DateTo,
			time: !allWeek && !allDay ? ' checked="checked"' : '',
			allday: allDay ? ' checked="checked"' : '',
			allweek: allWeek ? ' checked="checked"' : '',
			ID: id,
			parentViewId: Application.viewId
		};
		f.i18n();
		f.onLoad = function( data )
		{
			v.setContent( data );
		}
		f.load();
		eventMode = v;
	}
	m.execute( 'getcalendarevent', { cid: id } );
}


// Previous month
function GoPrevious( e )
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( Calendar.listMode == 'month' )
	{
		if( --m < 0 ){ m = 11; y--; }
		Calendar.date = new Date( y, m, d );
	}
	// Week
	else
	{
		var d = new Date( y, m, d );
		var t = d.getTime();
		
		// Find start of week (where monday is 1)
		var findDay = d.getDay();
		if( ( new Date( t ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				t -= 86400000;
				findDay = new Date( t ).getDay();
			}
		}
		t -= 604800000; // (a week)
		Calendar.date = new Date( t );
	}
	
	Calendar.render();
}

// Next month
function GoNext()
{
	var y = Calendar.dateArray[0];
	var m = Calendar.dateArray[1];
	var d = Calendar.dateArray[2];
	
	if( Calendar.listMode == 'month' )
	{
		if( ++m > 11 ){ m = 0; y++; }
		Calendar.date = new Date( y, m, 1 );
	}
	// Week
	else
	{
		var d = new Date( y, m, d );
		var t = d.getTime();
		
		// Find start of week (where monday is 1)
		var findDay = d.getDay();
		if( ( new Date( t ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				t -= 86400000;
				findDay = new Date( t ).getDay();
			}
		}
		t += 604800000; // (a week)
		Calendar.date = new Date( t );
	}
	
	Calendar.render();
}


Application.run = function( msg, iface )
{
	ge( 'monthoverview' ).onclick = function()
	{
		Calendar.listMode = 'month';
		Calendar.render();
	}
	ge( 'weekoverview' ).onclick = function()
	{
		Calendar.listMode = 'week';
		Calendar.render();
	}
	
	Calendar.date = new Date();
	Calendar.render();
}

window.addEventListener( 'resize', function()
{
	Calendar.refresh();
} );

Application.receiveMessage = function( msg )
{
	var self = this;
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'closesharing':	
			if( Application.sharing )
			{
				Application.sharing.close();
			}
			break;
		case 'refresh':
			if( eventMode )
				eventMode.close();
			self.sendMessage( {
				command: 'refresh_calendar'
			} );
			break;
		case 'saveevent':
			var ed = msg.eventData;
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				self.sendMessage( {
					command: 'refresh_calendar'
				} );
			}
			m.execute(
				ed.id > 0 ? 'savecalendarevent' : 'addcalendarevent',
				{
					event: {
						Title: ed.title,
						Description: ed.leadin,
						TimeTo: ed.timeTo,
						TimeFrom: ed.timeFrom,
						AllDay: ed.allDay,
						AllWeek: ed.allWeek,
						Date: ed.date,
						DateTo: ed.dateTo
					},
					cid: ed.id > 0 ? ed.id: 0
				}
			);
			if( eventMode )
			{
				eventMode.close();
			}
			break;
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


var nowDiv = null;
function drawNow()
{
	if( ge( 'nowdiv' ) )
	{
		nowDiv = ge( 'nowdiv' );
	}
	if( nowDiv )
	{
		var d = new Date();
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' ).querySelector( '.Day' );
		var tint = d.getHours() + ( d.getMinutes() / 60 );
		nowDiv.style.top = Math.floor( tint / 24 * cd.offsetHeight ) + 'px';
	}
}
setInterval( drawNow, 10000 );

// Sharing ---------------------------------------------------------------------

function doShare()
{
	if( Application.sharing )
	{
		Application.sharing.activate();
		return;
	}
	var v = new View( {
		title: i18n( 'i18n_share_your_calendar' ),
		width: 500,
		height: 500
	} );
	Application.sharing = v;
	var f = new File( 'Progdir:Templates/share.html' );
	f.replacements = {
		pid: Application.viewId
	};
	f.i18n();
	f.onLoad = function( data )
	{
		if( v && v.setContent )
			v.setContent( data );
	}
	f.load();
	v.onClose = function()
	{
		Application.sharing = null;
	}
}

