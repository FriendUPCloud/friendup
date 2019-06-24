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
							evts += '<div class="Event"><span class="Title">' + this.events[key][z].Name + '</span></div>';
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
		
		ge( 'MainView' ).innerHTML = ml;
		
		ge( 'MonthName' ).innerHTML = monthNames[ month ] + ' ' + year;
		
		this.refresh();
	},
	renderWeek: function()
	{
		//console.log( 'Rendering!' );
		
		// Get a date object for current month....
		var dob = new Date();
		
		// Render it...
		var ml = '';
		
		// Date setup
		var month = this.date.getMonth();
		var year = this.date.getFullYear();
		var currentDay = this.date.getDay();
		this.dateArray = [ year, month, currentDay ];
		
		var day = this.date.getDate();
		
		var time = this.date.getTime();
		var findDay = new Date( time );
		
		// Find start of week (where monday is 1)
		while( findDay != 1 )
		{
			time -= 86400000;
			findDay = new Date( time ).getDay();
			day--;
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
		
		for( var w = -1; w < 1; w++ )
		{
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
					
					/*var timedEvents = '';
					if( dliteral.length && typeof( this.events[key] ) != 'undefined' )
					{
						var eventCount = this.events[ key ].length;
						timedEvents += '<div class="Events Count' + eventCount + '">';
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
							timedEvents += '<div class="Event"><span class="Title">' + this.events[key][z].Name + '</span></div>';
							duplicates.push( this.events[key][z].Name );
						}
						timedEvents += '</div>';
					}*/
					
					// Generate events by time
					/*var evts = '';
					for( var t = 0; t < 24; t += 0.5 )
					{
						var events = this.events[ key ];
						for( var b = 0; b < events.length; b++ )
						{
							if( events[ b ].DateStart
						}
						
						evts += '<div class="TimeSlot">&nbsp;</div>';
					}*/
					ml += '<div class="Day Column" ondblclick="AddEvent(' + day + ')">' + evts + '</div>';
				}
				else
				{
					ml += '<div class="Day Column Label"><div class="LabelText">' + dayName + '</div></div>';
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
		
		ge( 'MainView' ).innerHTML = ml;
		
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

