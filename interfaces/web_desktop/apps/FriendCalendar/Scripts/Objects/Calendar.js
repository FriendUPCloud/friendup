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

var Calendar = {
	events: [],
	date: ( new Date() ),
	weekScrollTop: 0,
	listMode: 'month',
	exStyles: null, // extra styles
	// TODO: Add refreshing of actual calendar dates! Add busy loader
};

Calendar.render = function()
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
};

Calendar.renderMonth = function()
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
	let dob = new Date();
	
	// Render it...
	let ml = '';
	
	// Date setup
	let month = this.date.getMonth();
	let year = this.date.getFullYear();
	let currentDay = this.date.getDay();
	let currentDate = ( new Date() ).getDate();
	this.dateArray = [ year, month, this.date.getDate() ];
	
	let day = 1;
	
	let monthNames = [
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
	
	let up = true;
	let calStart = false;
	
	let w = -1;
	
	for( ; w < 6 && up; w++ )
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
		
		let dl = [ 1, 2, 3, 4, 5, 6, 0 ];
		let dn = [ i18n('i18n_mon'), i18n('i18n_tue'), i18n('i18n_wed'), i18n('i18n_thu'), i18n('i18n_fri'), i18n('i18n_sat'), i18n('i18n_sun') ];
		
		for ( let a = 0; a < dl.length; a++ )
		{
			let d = dl[a];
			let dayName = dn[a];
			let key = year + '-' + (month+1) + '-' + day;
			
			if( w >= 0 )
			{
				let dobj = new Date( year, month, day );
				let dliteral = '';
			
				if( dobj.getDate() < day )
					up = false;
				
				let thisDay = day;
				
				if( up && dobj.getDay() == d )
				{
					dliteral = day + '.';
					day++;
				}
				
				let evts = '';
				if( dliteral.length && typeof( this.events[key] ) != 'undefined' )
				{
					evts += '<div class="Events">';
					let duplicates = [];
					for( let z = 0; z < this.events[key].length; z++ )
					{
						// TODO: Duplicate check should not be needed!
						found = false;
						for( let p = 0; p < duplicates.length; p++ )
						{
							if( duplicates[p] == this.events[key][z].Name )
							{
								found = true;
								break;
							}
						}
						if( found ) continue;
						
						let paletteSlot = this.events[key][z].Your ? 0 : 1;
						userList[ this.events[key][z].Owner ] = this.events[key][z].Owner;
						
						let st = 'background-color: ' + eventPaletteBackground[ paletteSlot ] + ';';
						
						evts += '<div class="Event" style="' + st + '"><span class="Title">' + this.events[key][z].Name + '</span></div>';
						duplicates.push( this.events[key][z].Name );
					}
					evts += '</div>';
				}
				let cla = '';
				if( thisDay == currentDate && month == dob.getMonth() )
				    cla = ' Today';
				ml += '<div class="Day' + cla + '" onclick="AddEvent(' + year + ',' + ( month + 1 ) + ',' + thisDay + ')">' + evts + '<div class="Number">' + dliteral + '</div></div>';
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
	let eventDiv = document.createElement( 'div' );
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
	this.refreshRoster( 'month' );
};

Calendar.renderWeek = function()
{
	ge( 'MainView' ).classList.add( 'Week' );
	ge( 'MainView' ).classList.remove( 'Month', 'Day' );
	
	ge( 'monthoverview' ).classList.remove( 'Active' );
	ge( 'weekoverview' ).classList.add( 'Active' );
	
	//console.log( 'Rendering!' );
	let self = this;
	
	// Get a date object for current month....
	let dob = new Date();
	
	// Render it...
	let ml = lt = '';
	
	// Date setup
	let month = this.date.getMonth();
	let year = this.date.getFullYear();
	let currentDay = this.date.getDay();
	this.dateArray = [ year, month, this.date.getDate() ];
	
	let todayY = ( new Date() ).getFullYear();
	let todayM = ( new Date() ).getMonth();
	let todayD = ( new Date() ).getDate();
	
	let startDay = this.date.getDate();
	
	let time = this.date.getTime();
	let findDay = new Date( time );
	
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
	
	let week = ( new Date( year, month, startDay ) ).getWeek() + 1;
	
	let monthNames = [
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
	
	let up = true;
	let calStart = false;
	let queuedEventRects = [];
	let allDayEvents = [];
	let allWeekEvents = [];
	
	for( let w = -1; w < 1; w++ )
	{
		let day = startDay;
		let ctime = time;
		
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
		
		
		let dl = [ -1, 1, 2, 3, 4, 5, 6, 0 ];
		let dn = [ 0, i18n('i18n_mon'), i18n('i18n_tue'), i18n('i18n_wed'), i18n('i18n_thu'), i18n('i18n_fri'), i18n('i18n_sat'), i18n('i18n_sun') ];
		
		for( let a = 0; a < dl.length; a++ )
		{	
			if( dl[a] == -1 )
			{
				if( w == -1 )
				{
					lt += '<div class="Day Column Label"><div class="LabelText">' + i18n( 'i18n_time' ) + '</div></div>';
				}
				else
				{
					let evtl = '';
					for( let t = 0; t < 24; t += 0.5 )
					{
						let hour = StrPad( Math.floor( t ), 2, '0' );
						let minute = StrPad( ( t - Math.floor( t ) ) * 60, 2, '0' );
						let n = ' Time' + ( t * 100 );
						evtl += '<div class="TimeSlot' + n + '">' + hour + ':' + minute + '</div>';
					}
					ml += '<div class="Day Column Negative TextCenter">' + evtl + '</div>';
				}
				continue;
			}
			
			let dobj   = new Date( ctime );
			let cday   = dobj.getDate();
			let cmonth = dobj.getMonth() + 1;
			let cyear  = dobj.getFullYear();
			
			let d = dl[a];
			let dayName = dn[a];
			let key = cyear + '-' + ( cmonth ) + '-' + cday;
			let keyPadded = cyear + '-' + StrPad( cmonth, 2, '0' ) + '-' + StrPad( cday, 2, '0' );
			
			let dliteral = '';
		
			if( dobj.getDate() < cday )
				up = false;

			if( up && dobj.getDay() == d )
			{
				dliteral = day + '.';
			}

			if( w >= 0 )
			{
				// Generate events by time
				let evts = '';
				for( let t = 0; t < 24; t += 0.5 )
				{
					evts += '<div class="TimeSlot">&nbsp;</div>';
				}
				
				// Event rects
				let timez = '';
				let events = [];
				for( let z in this.events[ key ] )
					events.push( this.events[ key ][ z ] );
				
				// Find range events
				for( let z in this.events )
				{
					for( let bb = 0; bb < this.events[ z ].length; bb++ )
					{
						if( this.events[ z ][ bb ].MetaData )
						{
							try
							{
								let md = JSON.parse( this.events[ z ][ bb ].MetaData );
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
					for( let b = 0; b < events.length; b++ )
					{	
						let ypos = events[ b ].DateStart.split( ' ' )[ 1 ];
						ypos = ypos.split( ':' );
						
						ypos = parseInt( ypos[0] ) + ( ypos[ 1 ] / 60 );
						
						// parted on 24 hours * 100%
						ypos = ypos / 24 * 100;
						
						let day = ( new Date( events[ b ].DateStart ) ).getDay();
						
						let height = events[ b ].DateEnd.split( ' ' )[ 1 ];
						height = height.split( ':' );
						height = parseInt( height[ 0 ] ) + ( height[ 1 ] / 60 );
						
						height = height / 24 * 100;
						height = height - ypos;
						
						// Check metadata
						let md = false;
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
								let timeFrom = events[ b ].DateStart;
								let timeTo = md.DateTo + ' ' + timeFrom.split( ' ' )[1];
								
								// Get intelligeble timestamps for the span
								let t = ( new Date( timeFrom ) ).getTime();
								let e = ( new Date( timeTo ) ).getTime();
								
								// Check for time 
								let st = new Date( time );
								st = ( new Date( st.getFullYear() + '-' + ( st.getMonth() + 1 ) + '-' + st.getDate() + ' ' + timeFrom.split( ' ' )[1] ) ).getTime();
								
								// Add the days
								for( let c = 1; c <= 7; c++ )
								{
									// Got it!
									// TODO: Could be that start date doesn't need to check day before..
									
									if( st >= t && st <= e )
									{
										let d = ( new Date( st ) ).getDate();
										
										let found = false;
										for( let f in allDayEvents[ c ] )
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
				
				let p = cyear + '-' + StrPad( cmonth, 2, '0' ) + '-' + StrPad( cday, 2, '0' );
				ml += '<div class="Day Column" date="' + p + '" id="Day' + cday + '">' + 
					timez + evts + '</div>';
				
				ctime += 86400000;
			}
			else
			{
				let cl = '';
				
				let y = new Date( ctime ).getFullYear();
				let m = new Date( ctime ).getMonth();
				let d = new Date( ctime ).getDate();
				
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
	
	let eventDiv = document.createElement( 'div' );
	eventDiv.className = 'WeekContainer';
	
	// Long events ---------------------------------------------------------
	ge( 'LongEvents' ).innerHTML = '';
	
	let eventCount = len = maxDayslotLength = 0;
	if( allDayEvents )
		for( let a in allDayEvents ) len++;
	
	if( len > 0 )
	{
		for( let b = 1; b <= 7; b++ )
		{
			let daySlot = document.createElement( 'div' );
			daySlot.className = 'LongEvent Day';
			daySlot.style.width = 100 / 7 + '%';
			daySlot.style.left = 100 / 7 * ( b - 1 ) + '%';
			ge( 'LongEvents' ).appendChild( daySlot );
			
			let ade = allDayEvents[ b ];
			if( !ade ) continue;
			
			for( let a = 0; a < ade.length; a++ )
			{
				let ev = ade[ a ];
				let l = document.createElement( 'div' );
			
				l.className = 'MousePointer PaddingSmall';
				
				try
				{
					let md = JSON.parse( allDayEvents[ b ][ a ].MetaData );
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
		for( let a = 0; a < allWeekEvents.length; a++ )
		{
			let ev = allWeekEvents[ a ];
			let l = document.createElement( 'div' );
			
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
		let leHeight = calendarRowHeight * eventCount;
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
		let t = e.target ? e.target : e.srcElement;
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
		
		let scrollT = ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop;
		
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
		let cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
		let scrollT = cd.scrollTop;
		let d = eventDiv.data;
		let ymotion = ( e.clientY + scrollT ) - d.y;
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
			let top = GetElementTop( d.dayElement );
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
		let top = GetElementTop( eventDiv.data.dayElement );
		let from = eventDiv.data.y - top;
		let to = ( eventDiv.data.y + eventDiv.data.h ) - top;
		let whole = eventDiv.data.dayElement.offsetHeight;
		to = to / whole * 24;
		from = from / whole * 24;
		to = Math.floor( to * 2 ) / 2;
		from = Math.floor( from * 2 ) / 2;
		
		let date = eventDiv.data.day.join( '-' );
		
		// Clear event data
		let da = eventDiv.data.dayElement;
		eventDiv.data = null;
		
		// Open new event window
		eventMode = new View( {
			title: i18n( 'i18n_add_new_event' ),
			width: 500,
			height: 550
		} );
		
		from = ( from + '' ).split('.');
		to = ( to + '' ).split('.');
		
		if( from.length > 1 )
			from = StrPad( from[0], 2, '0' ) + ':' + (parseInt(from[1])/10*60);
		else from = StrPad( from[0], 2, '0' ) + ':00';
		if( to.length > 1 )
			to = StrPad( to[0], 2, '0' ) + ':' + (parseInt(to[1])/10*60);
		else to = StrPad( to[0], 2, '0' ) + ':00';
		to += ':00.000';
		from += ':00.000';
		
		// Set replacements based on calculations and language
		let f = new File( 'Progdir:Templates/event.html' );
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
			let ele = da.querySelector( '.New' );
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
	let cd = ge( 'MainView' ).querySelector( '.CalendarDates' ).appendChild( nowDiv );
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
		let tt = ge( 'MainView' ).querySelector( '.Time800' );
		ge( 'MainView' ).querySelector( '.CalendarDates' ).scrollTop = tt.offsetTop;
		firstDraw = false;
	}
	
	// Add queued events
	for( let a = 0; a < queuedEventRects.length; a++ )
	{
		let eventRect = new EventRect( queuedEventRects[ a ] );
	}
	
	ge( 'MonthName' ).innerHTML = i18n( 'i18n_week' ) + ' ' + week + ', ' + year;
	
	this.refresh();
	this.repositionEvents();
	this.refreshRoster( 'week' );
};


Calendar.renderDay = function()
{
	ge( 'MainView' ).innerHTML = '';
};

Calendar.refreshRoster = function( mode )
{
	if( !mode ) mode = 'week';
	
	let dateFrom = dateTo = '';
	let eles = Calendar.events;
	
	let heading = i18n( 'i18n_weekly_events' );
	if( mode == 'month' )
	    heading = i18n( 'i18n_monthly_events' );
	
	let hstr = '<p class="Heading BorderBottom PaddingBottom MarginBottom"><strong>' + heading + '</strong></p>';
	let pstr = '';
	let nstr = '';
	
	let now = ( new Date() ).getTime();
	let currdate = null;
	let daySecs = 86400000;
	
	if( mode == 'week' )
	{
		let time = this.date.getTime();
		time = Math.floor( time / daySecs ) * daySecs;
		let time2 = Math.floor( this.date.getTime() / daySecs ) * daySecs;
		let findDay = new Date( time );
		let startDay = this.date.getDay();
		let endDay = 0;
	
		// Find start of week (where monday is 1)
		// And find date span for the week
		while( findDay != 1 )
		{
			time -= daySecs;
			let t1 = new Date( time );
			findDay = t1.getDay();
			startDay--;
			dateFrom = t1.getFullYear() + '-' + StrPad( t1.getMonth() + 1, 2, '0' ) + '-' + StrPad( t1.getDate(), 2, '0' ) + ' 00:00:00';
		}
		while( endDay < 7 )
		{
			time2 += daySecs;
			let t2 = new Date( time2 );
			findDay = t2.getDay();
			endDay++;
			dateTo = t2.getFullYear() + '-' + StrPad( t2.getMonth() + 1, 2, '0' ) + '-' + StrPad( t2.getDate(), 2, '0' ) + ' 23:59:59';
		}
	
		
		// Set StopIteration
		dateFrom = ( new Date( dateFrom ) ).getTime();
		dateTo = ( new Date( dateTo ) ).getTime();
	}
	else if( mode == 'month' )
	{
	    // Set span
	    dateFrom = new Date( this.date.getFullYear() + '-' + 
	               StrPad( this.date.getMonth() + 1, 2, '0' ) + '-' +
	               '01 00:00:00' ).getTime();
	    let lastDay = 28;
	    let thisMonth = this.date.getMonth() + 1;
	    let yearHere = this.date.getFullYear();
	    
	    while( true )
	    {
	        let n = new Date( yearHere + '-' + StrPad( thisMonth, 2, '0' ) + '-' + lastDay + ' 00:00:00' );
	        let m = n.getMonth() + 1;
	        if( m != thisMonth )
	            break;
	        else lastDay++;
	    }
	    
	    dateTo = ( new Date( yearHere + '-' + StrPad( thisMonth, 2, '0' ) + '-' + lastDay + ' 00:00:00' ) ).getTime();
	}
	else if( mode == 'day' )
	{
	    // TODO: Implement when ready
	}
	

    // Go through the elements and render roster	
	for( let a in eles )
	{
		let eventList = eles[ a ];
		if( !eventList || !eventList.length ) continue;
		for( let b = 0; b < eventList.length; b++ )
		{
			let event = eventList[ b ];
			if( !event ) continue;
			
			let md = false;
			try
			{
				md = JSON.parse( event.MetaData );
			}
			catch( e ){ md = false; }
			
			// Fix corrupt date
			let t = event.DateStart.split( ' ' );
			if( t[1].length <= 3 )
			{
				t[1] = '00:00:00';
			}
			event.DateStart = t.join( ' ' );
			
			let eventTime = new Date( event.DateStart ).getTime();
			let eventStop = false; 
			
			if( md && md.DateTo )
			{
				// Fix corrupt date
				t = md.DateTo.split( ' ' );
				if( t[1].length <= 3 )
				{
					t[1] = '00:00:00';
				}
				md.DateTo = t.join( ' ' );
				// Make time
				eventStop = new Date( md.DateTo ).getTime();
			}
			// No date to? Just add the same
			else
			{
				eventStop = eventTime;
			}
			
			// Are we within time span?
			let within = eventTime >= dateFrom && eventTime <= dateTo;
			let within2 = eventStop ? 
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
			    let paletteSlot = event.Your ? 0 : 1;
				let st = 'background-color: ' + eventPaletteBackground[ paletteSlot ] + ';';
				
				let timestamp = ( new Date( event.DateEnd ) ).getTime();
			
				let cl = '';
				if( now > timestamp )
					cl = ' Expired';
				let dst = event.DateStart.split( ' ' )[0];
				if( currdate != dst )
				{
					currdate = dst;
					let s = '<p class="Date' + cl + '"><strong>' + currdate + '</strong></p>';
					if( cl ) pstr += s;
					else nstr += s;
				}
			
				let time = event.DateStart.split( ' ' )[1];
				time = time.split( ':' );
				time = time[0] + ':' + time[1];
				let s = '<p class="RosterEvent' + cl + '" style="' + st + '">' + time + ': ' + event.Name + '</p>';
				if( cl ) pstr += s;
				else nstr += s;
			}
		}
	}
	let ph = '<p class="Heading BorderBottom PaddingBottom MarginBottom"><strong>' + i18n( 'i18n_expired_events' ) + '</strong></p>';
	if( !pstr ) ph = '';
	
	// Update roster
	ge( 'Roster' ).innerHTML = hstr + nstr + ph + pstr;
};

// Just neatly reposition stuff
Calendar.repositionEvents = function()
{
	let cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
	let eles = cd.getElementsByClassName( 'EventRect' );
	for( let a = 0; a < eles.length; a++ )
	{
		// Reset intersection info in this pass
		eles[a].intersecting = null;
		eles[a].classList.remove( 'Intersecting' );
		for( let c = 1; c <= 10; c++ )
		{
			eles[a].classList.remove( 'Width' + c );
		}
		// Animate reposition
		eles[a].classList.add( 'Animated' );
		( function( element ) {
			setTimeout( function()
			{
				let t = element.offsetTop;
				let h = element.offsetHeight;
				
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
					let wh = cd.querySelector( '.CalendarRow' );
					let from = t;
					let to = t + h;
					let whole = wh.offsetHeight;
					to   = to / whole * 24;
					from = from / whole * 24;
					to   = Math.floor( to * 100 );
					from = Math.floor( from * 100 );
					from = StrPad( from + '', 4, '0' );
					to   = StrPad( to + '',   4, '0' );
					let toHr = to.substr( 0, 2 );
					let toMn = to.substr( 2, 2 ); toMn = Math.round( parseInt( toMn ) / 100 ) * 30;
					toMn = StrPad( toMn + '', 2, '0' );
					let frHr = from.substr( 0, 2 );
					let frMn = from.substr( 2, 2 ); frMn = Math.round( parseInt( frMn ) / 100 ) * 30;
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
							let m = new Module( 'system' );
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
	let cr = ge( 'MainView' ).querySelector( '.CalendarDates' );
	let days = cr.getElementsByClassName( 'Day' );
	for( let a = 0; a < days.length; a++ )
	{
		let evs = days[ a ].getElementsByClassName( 'EventRect' );
		for( let b = 0; b < evs.length; b++ )
		{
			if( evs[ b ].intersecting )
			{
				continue;
			}
			let out = this.getIntersectingEvents( a, evs[ b ] );
			if( out )
			{
				evs[ b ].classList.add( 'Intersecting', 'Width' + ( out.length + 1 ) );
				for( let c = 0; c < out.length; c++ )
				{
					out[ c ].classList.add( 'Intersecting', 'Width' + ( out.length + 1 ) );
				}
			}
		}
	}
};

// Get events that are graphically intersecting by day, top, height
Calendar.getIntersectingEvents = function( day, ele )
{
	let cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
	let days = cd.getElementsByClassName( 'Day' );
	let eles = days[ day ].getElementsByClassName( 'EventRect' );
	let out = [];
	let t = ele.offsetTop;
	let b = t + ele.offsetHeight;
	for( let a = 0; a < eles.length; a++ )
	{
		let elt = eles[ a ].offsetTop;
		let elb = eles[ a ].offsetTop + eles[ a ].offsetHeight;
		
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
};

Calendar.populate = function( data )
{
	
};

Calendar.refresh = function()
{
	let cd = ge( 'MainView' ).querySelector( '.CalendarDates' );
	let ch = ge( 'MainView' ).querySelector( '.CalendarHeaderRow' );
	if( cd && ch )
	{
		let scWi = cd.offsetWidth - cd.clientWidth;
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
		let h = ge( 'MainView' ).offsetHeight - ( ge( 'MainView' ).querySelector( '.CalendarDates' ).offsetTop );
		if( !this.exStyles )
		{
			this.exStyles = document.createElement( 'style' );
			document.body.appendChild( this.exStyles );
		}
		this.exStyles.innerHTML = 'html .Day { height: ' + ( ( h / this.dayRows ) - 1 ) + 'px; }';
	}
	updateUsers();
};

