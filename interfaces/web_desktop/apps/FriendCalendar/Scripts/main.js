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
	weekScrollTop: 0,
	listMode: 'month',
	exStyles: null, // extra styles
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
		
		this.dayRows = w;
		this.refresh();
	},
	renderWeek: function()
	{
		ge( 'monthoverview' ).classList.remove( 'Active' );
		ge( 'weekoverview' ).classList.add( 'Active' );
		
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
		
		for( var w = -1; w < 1; w++ )
		{
			var day = startDay;
			var ctime = time;
			
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
					var events = this.events[ key ];
					if( typeof( events ) != 'undefined' )
					{
						for( var b = 0; b < events.length; b++ )
						{
							var ypos = events[ b ].DateStart.split( ' ' )[1];
							ypos = ypos.split( ':' );
							
							ypos = parseInt( ypos[0] ) + ( ypos[1] / 60 );
							
							ypos = ypos / 24 * 100;
							
							
							var height = events[ b ].DateEnd.split( ' ' )[1];
							height = height.split( ':' );
							height = parseInt( height[0] ) + ( height[1] / 60 );
							
							height = height / 24 * 100;
							height = height - ypos;
							
							queuedEventRects.push( {
								day: cday,
								ypos: ypos,
								height: height,
								event: events[ b ]
							} );
						}
					}
					
					var p = cyear + '-' + StrPad( cmonth, 2, '0' ) + '-' + StrPad( cday, 2, '0' );
					ml += '<div class="Day Column" date="' + p + '" id="Day' + 
						cday + '" ondblclick="AddEvent(' + cyear + ',' + cmonth + ',' + cday + ')">' + 
						timez + evts + '</div>';
					
					ctime += 86400000;
				}
				else
				{
					ml += '<div class="Day Column Label"><div class="LabelText">' + StrPad( cday, 2, '0' ) + '/' + StrPad( cmonth, 2, '0' ) + '</div></div>';
					ctime += 86400000;
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
				allday: from == 0 && to == 24 ? ' checked="checked"' : '',
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
		
		for( var a = 0; a < queuedEventRects.length; a++ )
		{
			var eventRect = new EventRect( queuedEventRects[ a ] );
		}
		
		ge( 'MonthName' ).innerHTML = i18n( 'i18n_week' ) + ' ' + week + ', ' + year;
		
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
	}
};

// An event rect! --------------------------------------------------------------
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
	this.div.className = 'EventRect MousePointer';
	this.div.style.top = this.definition.ypos + '%';
	this.div.style.height = this.definition.height + '%';
	this.div.style.color = eventPaletteForeground[ 0 ];
	this.div.style.backgroundColor = eventPaletteBackground[ 0 ];
	this.div.innerHTML = this.definition.event.Name;
	this.div.onmousedown = function( e )
	{
		return cancelBubble( e );
	}
	ge( 'Day' + this.definition.day ).appendChild( this.div );
	
	this.div.onclick = function( e )
	{
		EditEvent( self.definition.event.ID );
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
	
	var f = new File( 'Progdir:Templates/event.html' );
	f.replacements = {
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
		var f = new File( 'Progdir:Templates/event.html' );
		f.replacements = {
			title: evd.Title,
			leadin: evd.Description,
			timefrom: evd.TimeFrom,
			timeto: evd.TimeTo,
			date: evd.Date,
			allday: evd.TimeFrom.substr(0,2) == '00' && evd.TimeTo.substr(0,2) == '24' ? ' checked="checked"' : '',
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
		Calendar.date = new Date( y, m, 1 );
	}
	// Week
	else
	{
		var d = new Date( y, m, d );
		var t = d.getTime();
		
		// Find start of week (where monday is 1)
		var findDay = d.getDay();
		console.log( 'p This is the day: ' + findDay );
		if( ( new Date( t ).getDay() ) != 1 )
		{
			while( findDay != 1 )
			{
				t -= 86400000;
				findDay = new Date( t ).getDay();
			}
		}
		t -= 604800000; // (a week)
		console.log( 'now p This is the day: ' + findDay );
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
		console.log( 'This is the day: ' + findDay );
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
		console.log( 'now This is the day: ' + findDay + ' ' + Calendar.date.getDate() + '/' + ( Calendar.date.getMonth() + 1 ) );
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
						Date: ed.date
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
	if( nowDiv )
	{
		var d = new Date();
		var cd = ge( 'MainView' ).querySelector( '.CalendarDates' ).querySelector( '.Day' );
		var tint = d.getHours() + ( d.getMinutes() / 60 );
		nowDiv.style.top = Math.floor( tint / 24 * cd.offsetHeight ) + 'px';
	}
}
setTimeout( drawNow, 10000 );

// Sharing ---------------------------------------------------------------------

function doShare()
{
	var v = new View( {
		title: i18n( 'i18n_share_your_calendar' ),
		width: 500,
		height: 500
	} );
	var f = new File( 'Progdir:Templates/share.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		if( v && v.setContent )
			v.setContent( data );
	}
	f.load();
}

