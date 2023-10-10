/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIChatoverview extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
        
        let self = this;
        self.searchMode = 'messages';
        self.groupsLoaded = false;
        
        window.addEventListener( 'resize', function()
        {
        	self.handleResize();
        	setTimeout( function()
        	{
        		self.handleResize();
        	}, 50 );
        } );
    }
    refreshChannelAvatar( chan )
	{
		let self = this;
		let std = {
			"method": "getroomavatar",
			"groupid": chan.id
		};
		cImageLoader( '/system.library/module/?module=system&command=convos&args=' + encodeURIComponent( JSON.stringify( std ) ) + '&authid=' + Application.authId, function( i )
		{
		    let c = document.createElement( 'canvas' );
			let ctx = c.getContext( '2d' );
			c.width = i.naturalWidth;
			c.height = i.naturalHeight;
			ctx.drawImage( i, 0, 0 );
			c.toBlob( function( blob )
			{
				let a = new FileReader();
				a.onload = function(e)
				{
					chan.style.backgroundImage = 'url(' + e.target.result + ')';
				}
				a.readAsDataURL( blob );
			}, 'image/jpeg', 100 );
		} );
	}
    handleResize()
    {
    	let self = this;
    	if( self.domChannels )
    	{
    		if( self.domChannels.scrollHeight > self.domChannels.offsetHeight )
    		{
    			self.domChannels.classList.add( 'Scroll' );
    		}
    		else
    		{
    			self.domChannels.classList.remove( 'Scroll' );
    		}
    		
    		for( let a = 0; a < self.domChannels.childNodes.length; a++ )
    		{
    			let cn = self.domChannels.childNodes[ a ];
    			if( cn.nodeName == 'DIV' && cn.classList.contains( 'Group' ) )
    			{
					if( cn.getAttribute( 'uniqueid' ) == 'chatroom' )
					{
						self.refreshChannelAvatar( cn );
					}
				}
    		}
    		
    	}

    	let ov = document.body.querySelector( '.OverviewUpdates' );
    	
		if( ov )
    	{
			if( window.innerWidth > 640 )
			{
				for( let a = 0; a < ov.childNodes.length; a++ )
				{
					let ele = ov.childNodes[ a ];
					if( ele.tagName != 'DIV' ) continue;
					ov.childNodes[ a ].style.height = '';
				}
			} 
			else
			{
				for( let a = 0; a < ov.childNodes.length; a++ )
				{
					let ele = ov.childNodes[ a ];
					if( ele.tagName != 'DIV' ) continue
					let eleHeight = ele.offsetHeight;
					if( eleHeight < ele.scrollHeight )
					{
						ov.childNodes[ a ].style.height = ele.scrollHeight + 'px';
					}
				}
			}
    	}
	}
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIChatoverview';
        
        let data = '\
        <div class="Channels"></div>\
        <div class="Chatlist"></div>\
        <div class="Events"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domChannels = this.domElement.querySelector( '.Channels' );
        this.domChatlist = this.domElement.querySelector( '.Chatlist' );
        this.domEvents   = this.domElement.querySelector( '.Events'   );
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
        this.getEvents();
    }
    getEvents()
    {
    	let self = this;
    	self.domEvents.innerHTML = '';
    	self.domEvents.classList.remove( 'HasEvents' );
    	let ev = new Module( 'system' );
		ev.onExecuted = function( me, md )
		{
			if( me == 'ok' )
			{
				let j = JSON.parse( md );
				
				let cnt = self.domEvents;
				let count = 0;
				
				for( let a = 0; a < j.length; a++ )
				{
					let existing = cnt.getElementsByClassName( 'UserEvent' );
					let found = false;
					for( let b = 0; b < existing.length; b++ )
					{
						if( existing[ b ].getAttribute( 'mid' ) == j[a].ID )
						{
							found = true;
							break;
						}
					}
					if( found ) continue;
					
					let mess = i18n( j[a].Message );
					mess = mess.split( '{username}' ).join( '<strong>' + j[a].User + '</strong>' );
					mess = mess.split( '{groupname}' ).join( '<strong>#' + ( j[a].Groupname ) + '</strong>' );
					
					let d = document.createElement( 'div' );
					d.className = 'UserEvent';
					
					let t = document.createElement( 'div' );
					t.className = 'Title';
					t.innerHTML = '<span>' + i18n( j[a].Title ) + '</span><div class="Buttons" iid="' + j[a].ID + '"><div class="Ball fa fa-check"></div><div class="Ball fa fa-times"></div></div>';
					
					let m = document.createElement( 'div' );
					m.className = 'Message';
					m.innerHTML = mess;
					
					d.appendChild( t );
					d.appendChild( m );
					
					( function( bt )
					{
						let b = bt.querySelector( '.fa-check' );
						let c = bt.querySelector( '.fa-times' );
						b.onclick = function()
						{
							let m = new Module( 'system' );
							m.onExecuted = function( ne, nd ){ self.renderOverview(); self.redrawChannels(); self.getEvents(); }
							m.execute( 'convos', { 
								method: 'accept-invite', 
								inviteId: this.parentNode.getAttribute( 'iid' ) 
							} );
						}
						c.onclick = function()
						{
							let m = new Module( 'system' );
							m.onExecuted = function( ne, nd ){ self.getEvents(); }
							m.execute( 'convos', { 
								method: 'reject-invite', 
								inviteId: this.parentNode.getAttribute( 'iid' ) 
							} );
						}
					} )( t );
					
					cnt.appendChild( d );
					
					count++;
				}
				
				if( count > 0 )
				{
					self.domEvents.classList.add( 'HasEvents' );
				}
				else
				{
					self.domEvents.classList.remove( 'HasEvents' );
				}
			}
			self.handleResize();
		}
		ev.execute( 'convos', { method: 'getevents' } );
    }
    updateActivityBubble()
    {
    	if( !window.unreadMessages ) return;
    	let self = this;
    	let rooms = unreadMessages.rooms;
    	let chans = self.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < chans.length; a++ )
    	{
    		if( chans[ a ].classList.contains( 'Group' ) && rooms[ chans[ a ].id ] )
    		{
    			if( !chans[ a ].bubble )
    			{
    				let b = document.createElement( 'div' );
    				b.className = 'Activity';
    				b.innerHTML = '<span>0</span>';
    				chans[ a ].bubble = b;
    				chans[ a ].appendChild( b );
    			}
    			if( rooms[ chans[ a ].id ].length > 0 )
    			{
    				chans[ a ].bubble.classList.add( 'Showing' );
    				chans[ a ].bubble.innerHTML = '<span>' + rooms[ chans[ a ].id ].length + '</span>';
    			}
    			else chans[ a ].bubble.classList.remove( 'Showing' );
    		}
    	}
    }
    initSearch()
    {
    	// Init content
    	let self = this;
    	self.cancelMode = false;
    	
    	let f = new File( 'Progdir:Markup/main_updates.html' );
        f.i18n();
        f.onLoad = function( data )
        {
        	self.domChatlist.innerHTML = data;
        	self.renderOverview();
        	FUI.initialize();
        	
        	let cats = self.domChatlist.querySelector( '.Categories' );
        	function clearCats( not )
        	{
        		for( let a = 0; a < cats.childNodes.length; a++ )
	        	{
	        		if( cats.childNodes[ a ] != not && cats.childNodes[ a ].classList )
	        			cats.childNodes[ a ].classList.remove( 'On' );
	        	}
        	}
        	for( let a = 0; a < cats.childNodes.length; a++ )
        	{
        		let cat = cats.childNodes[a];
        		if( cat.classList && cat.classList.contains( 'Category' ) )
        		{
        			cat.onclick = function()
        			{
        				clearCats( this );
        				this.classList.add( 'On' );
        				self.searchMode = this.getAttribute( 'mode' );
        				self.cancelMode = true;
        				setTimeout( function()
        				{
        					self.cancelSearch();
    					}, 50 );
        			}
        		}
        	}
        	
        	// Check channels
			let chans = self.domChannels.getElementsByClassName( 'Channel' );
			if( chans && chans.length && chans.length > 0 )
			{
				for( let a in chans )
				{
					if( chans[ a ].getAttribute )
					{
						if( chans[ a ].getAttribute( 'uniqueid' ) == 'home' )
						{
							chans[ a ].classList.add( 'Active' );
						}
						else
						{
							chans[ a ].classList.remove( 'Active' );
						}
					}
				}
			}
			
			// Search element
			let se = self.domChatlist.querySelector( '.SearchField' );
			let bt = self.domChatlist.querySelector( '.SearchButton' );
			if( !se ) return;
			bt.onclick = function()
			{
				self.executeSearch( se.value );
			}
			se.onkeydown = function( e )
			{
				if( e.which == 13 )
				{
					self.executeSearch( se.value );
				}
			}
        }
        f.load();
    }
    base64ToBytes( base64 )
    {
        const binString = atob( base64 );
        return Uint8Array.from( binString, ( m ) => m.codePointAt( 0 ) );
    }
    cancelSearch()
    {
    	let self = this;
		document.querySelector( '.SearchForm' ).classList.remove( 'Searching', 'Loading' );
		self.cancelMode = false;
		document.querySelector( '.SearchResults' ).innerHTML = '';
    }
    executeSearch( searchString )
    {
    	if( Trim( searchString ) == '' ) return;
    	let self = this;
    	document.querySelector( '.SearchForm' ).classList.add( 'Searching', 'Loading' );
    	let par = document.querySelector( '.SearchResults' );
    	par.userList = [];
    	par.innerHTML = '';
    	function fetchNextPage( page = 0, searchString, cbk )
    	{
			if( self.cancelMode ) 
			{
				self.cancelSearch();
				return;
			}
			
			if( self.searchMode == 'messages' )
			{
				let m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( self.cancelMode ) 
					{
						self.cancelSearch();
						return;
					}
					
					if( e == 'ok' )
					{
						let mess = JSON.parse( d );
						let lsearchString = searchString ? searchString.toLowerCase() : '';
						if( !lsearchString ) return;
						let str = lsearchString;
						if( str.indexOf( ',' ) > 0 )
						{
							str = lsearchString.split( ',' );
						}
						else
						{
							str = [ str ];
						}
						let out = [];
						for( let a = 0; a < mess.messages.length; a++ )
						{
							let text = mess.messages[a].Message;
							try
							{
								let dec = new TextDecoder().decode( self.base64ToBytes( text ) );
								text = dec;
							}
							catch( e ){};
							if( !text ) continue;
							text = text.split( /\<.*?\>/i ).join( '' );
							for( let c = 0; c < str.length; c++ )
							{
								if( text && text.toLowerCase().indexOf( Trim( str[ c ] ) ) >= 0 )
								{
									let m = mess.messages[ a ];
									m.Message = text;
									out.push( m );
								}
							}
						}
						if( out.length )
						{
							cbk( out );
						}
						fetchNextPage( page + 1, searchString, cbk );
						return;
					}
					let sf = document.querySelector( '.SearchForm' );
					if( sf ) sf.classList.remove( 'Searching', 'Loading' );
				}
				m.execute( 'convos', { method: 'messages', roomType: '*', searchString: searchString, page: page } );
			}
			else if( self.searchMode == 'groups' )
			{
				let m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( self.cancelMode ) 
					{
						self.cancelSearch();
						return;
					}
					
					if( e == 'ok' )
					{
						let mess = JSON.parse( d );
						cbk( mess );
						if( mess.length == 100 )
						{
							fetchNextPage( page + 1, searchString, cbk );
							return;
						}
					}
					let sf = document.querySelector( '.SearchForm' );
					if( sf ) sf.classList.remove( 'Searching', 'Loading' );
				}
				m.execute( 'convos', { method: 'public_groups', roomType: '*', searchString: searchString, page: page } );
			}
		}
		fetchNextPage( 0, searchString, function( data )
		{
			if( !data || !data.length ) return;
			for( let a = 0; a < data.length; a++ )
			{
				if( !par.userList ) par.userList = {};
				let us;
				if( !par.userList[ data[a].FlatUserID ] )
				{	
					us = document.createElement( 'div' );
					us.className = 'SearchedUser';
					us.setAttribute( 'uuid', data[a].UniqueUserID );
					par.userList[ data[a].FlatUserID ] = us;
					par.appendChild( us );
					
					let av = document.createElement( 'div' );
					av.className = 'Avatar';
					if( data[ a ].Count )
					{
						av.id = data[ a ].UniqueID;
						self.refreshChannelAvatar( av )
					}
					else
					{
						( function( fuid, avo ) {
							self.getAvatarFromUser( fuid, function( src )
							{
								avo.style.backgroundImage = 'url(' + src + ')';
								avo.classList.add( 'Loaded' );
							} );
						} )( data[ a ].FlatUserID, av );
					}
					us.appendChild( av );
					
				}
				else
				{
					us = par.userList[ data[a].FlatUserID ];
				}
				let dat = '';
				if( data[a].Date )
				{
					dat = self.parseDate( data[ a ].Date );
					dat = '<span class="Date">' + dat + '</span> ';
				}
				if( data[a].Count )
				{
					dat = '(' + data[a].Count + ' ' + ( data[a].Count == 1 ? i18n( 'i18n_user' ) : i18n( 'i18n_users' ) ) + ') ';
				}
				else
				{
					data[a].Count = 0;
				}
				
				let d = document.createElement( 'div' );
				d.record = data[a];
				d.className = 'SearchedMessage';
				d.innerHTML = '<p><em><strong>' + data[a].Name + '</strong>, ' + dat + '</em></p><p>' + ( data[a].Message ? data[a].Message : data[a].Description ) + '</p>';
				
				if( data[a].Type )
				{
					// Check if we already joined
					let found = false;
					let own = false;
					let chans = self.domChannels.getElementsByClassName( 'Channel' );
					for( let j = 0; j < chans.length; j++ )
					{
						let uid = chans[j].getAttribute( 'id' );
						if( uid == data[ a ].UniqueID )
						{
							if( chans[j].getAttribute( 'own' ) == true )
							{
								own = true;
							}
							found = true;
							break;
						}
					}
					if( own || found )
					{
						d.innerHTML += '<p><button type="button" class="Go Button"><span class="fa fa-arrow-circle-right"></span> <span>' + i18n( 'i18n_go_to_room' ) + '</span></button></p>';
					}
					else if( !found )
					{
						d.innerHTML += '<p><button type="button" class="Join Button"><span class="fa fa-plus"></span> <span>' + i18n( 'i18n_join_room' ) + '</span></button></p>';
					}
				}
				
				let btn = d.querySelector( '.Button' );
				if( btn )
				{
					if( btn.classList.contains( 'Go' ) )
					{
						btn.onclick = function()
						{
							Application.navigate( 'rooms/' + d.record.UniqueID );
						}
					}
					// Join the group
					else if( btn.classList.contains( 'Join' ) )
					{
						btn.onclick = function()
						{
							let m = new Module( 'system' );
							m.onExecuted = function( me, md )
							{
								if( me == 'ok' )
								{
									self.redrawChannels( function()
									{
										Application.navigate( 'rooms/' + d.record.UniqueID );
									} );
								}
								else
								{
									Alert( i18n( 'i18n_failed_to_join_room' ), i18n( 'i18n_failed_to_join_desc' ) );
								}
							}
							m.execute( 'convos', { method: 'join-room', cid: d.record.UniqueID } );
						}
					}
				}
				
				us.appendChild( d );
			}
		} );
    }
    parseDate( instr )
    {
        let now = new Date();
        let test = now.getFullYear() + '-' + StrPad( now.getMonth() + 1, 2, '0' ) + '-' + StrPad( now.getDate(), 2, '0' );
        let time = new Date( instr );
        let diff = ( now.getTime() / 1000 ) - ( time.getTime() / 1000 );
        if( diff < 60 )
        {
            if( diff < 1 )
            {
                return i18n( 'i18n_just_now' );
            }
            return Math.floor( diff ) + ' ' + i18n( 'i18n_seconds_ago' ) + '.';
        }
        else if( diff < 3600 )
        {
            return Math.floor( diff / 60 ) + ' ' + i18n( 'i18n_minutes_ago' ) + '.';
        }
        else if( diff < 86400 )
        {
            return Math.floor( diff / 60 / 24 ) + ' ' + i18n( 'i18n_hours_ago' ) + '.';
        }
        instr = time.getFullYear() + '-' + StrPad( time.getMonth() + 1, 2, '0' ) + '-' + StrPad( time.getDate(), 2, '0' );
        if( test == instr.substr( 0, test.length ) )
            return instr.substr( test.length, instr.length - test.length );
        return instr;
    }
    getAvatarFromUser( userid, cbk )
    {
        cImageLoader( '/system.library/module/?module=system&command=getavatar&userid=' + userid + '&width=128&height=128&authid=' + Application.authId, function( i )
        {
            cbk( i.src );
        } );
    }
    renderOverview()
    {
    	let self = this;
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        this.redrawChannels();
        this.handleResize();
    }
    setChat( mode, record = false )
    {
        if( mode == true )
        {
            this.domElement.classList.add( 'Chat' );
        }
        else
        {
            this.domElement.classList.remove( 'Chat' );
        }
        if( record && record.Type == 'User' )
        {
        	this.activateDirectMessage( record.ID, false );
        }
    }
    // Get markup for object
    getMarkup( data )
    {
    	// Return meta-markup for class instantiation later
    	let props = '';
    	let n = 0;
    	for( let a in this.options )
    	{
    	    if( n++ > 0 ) props += ' ';
    	    props += a + '="' + props[ a ] + '"';
    	}
    	return '<fui-chatoverview' + props + '></fui-chatoverview>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
    inactivate()
    {
        this.domChannels.classList.add( 'Inactivated' );
        this.domChatlist.classList.add( 'Inactivated' );
    }
    activate()
    {
        this.domChannels.classList.remove( 'Inactivated' );
        this.domChatlist.classList.remove( 'Inactivated' );
    }
    // Show a sliding menu
    showSlidingMenu( tpl )
    {
        this.inactivate();
        if( this.domElement.querySelector( '.SlidingMenu' ) )
        {
            this.destroySlidingMenu();
        }
        let d = document.createElement( 'div' );
        d.className = 'SlidingMenu';
        this.domElement.appendChild( d );
        let f = new File( 'Progdir:Markup/room.html' );
        f.i18n();
        f.onLoad = function( data )
        {
            d.innerHTML = data;
            FUI.initialize();
            d.classList.add( 'Showing' );
        }
        f.load();
    }
    // Remove and purge existing sliding menu(s)
    destroySlidingMenu()
    {
        let sm = this.domElement.querySelector( '.SlidingMenu' );
        if( !sm ) return;
        sm.parentNode.removeChild( sm );
    }
    // Redraw channels
    redrawChannels( cbk = false )
    {
    	let self = this;
    	
    	if( self.channels )
    	{
    		return;
    	}
    	
    	// Default
    	self.domChannels.innerHTML = '\
    	<div class="Channel DM" uniqueid="dm"></div>\
    	<div class="Channel Home" uniqueid="home"></div>\
    	<div class="Channel Jeanie" uniqueid="jeanie"></div>';
    	
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		let rooms = [];
    		if( me == 'ok' )
    		{
    			md = JSON.parse( md );
    			for( let a = 0; a < md.length; a++ )
    			{
    			    let found = false;
    			    let fnd = self.domChannels.getElementsByClassName( 'Group' );
    			    for( let b = 0; b < fnd.length; b++ )
    			    {
    			        if( fnd[ b ].getAttribute( 'id' ) == md[a].UniquyeID )
    			        {
    			            found = true;
    			            break;
    			        }
    			    }
    			    if( !found )
        				self.domChannels.innerHTML += '<div class="Channel Group" uniqueid="chatroom" name="' + md[a].Name + '" id="' + md[a].UniqueID + '" own="' + md[a].Own + '"></div>';
    			}
    			self.groupsLoaded = true;
    		}
    		else self.groupsLoaded = false;
    		
    		if( !self.domChannels.querySelector( '.Add' ) )
    		{
    		    self.domChannels.innerHTML += '<div class="Channel Add" uniqueid="add"></div>';
		    }
    	
			let chans = self.domChannels.getElementsByClassName( 'Channel' );
			for( let a = 0; a < chans.length / 2; a++ )
			{
				if( a >= chans.length / 2 ) break;
				( function( f, b ){
					setTimeout( function()
					{ 
						f.classList.add( 'Loaded' );
					}, ( b + 1 ) * 105 );
				} )( chans[ a ], a );
				( function( f, b, c ){
					setTimeout( function()
					{ 
						f.classList.add( 'Loaded' );
					}, ( c + 1 ) * 105 );
				} )( chans[ chans.length - a - 1 ], chans.length - a - 1, a );
			}
			for( let a = 0; a < chans.length; a++ )
			{
				let uniqueid = chans[ a ].getAttribute( 'uniqueid' );
				let groupId = chans[ a ].getAttribute( 'id' );
				let groupName = chans[ a ].getAttribute( 'name' );
				
				if( !chans[ a ].hoverElement )
				{
					let h = document.createElement( 'div' );
					h.className = 'HoverElement';
					chans[ a ].parentNode.parentNode.appendChild( h );
					chans[ a ].hoverElement = h;
					chans[ a ].onmouseover = function()
					{
						h.style.top = ( GetElementTop( this ) - 4 - document.querySelector( '.Channels' ).scrollTop ) + 'px';
						h.style.left = GetElementLeft( this ) + this.offsetWidth + 16 + 'px';
						h.classList.add( 'Showing' );
					}
					chans[ a ].onmouseout = function()
					{
						h.classList.remove( 'Showing' );
					}
					switch( uniqueid )
					{
						case 'home':
							h.innerHTML = i18n( 'i18n_news_and_events' );
							break;
						case 'jeanie':
							h.innerHTML = i18n( 'i18n_jeanie_ai_assistant' );
							break;
						case 'dm':
							h.innerHTML = i18n( 'i18n_direct_messages' );
							break;
						case 'chatroom':
							h.innerHTML = groupName;
							break;
						case 'add':
							h.innerHTML = i18n( 'i18n_add_a_new_chatroom' );
							break;
					}
				}
			
				( function( ele, prop, gid = false, gnam = false )
				{
					if( prop == 'home' )
					{
						ele.innerHTML = '<i class="fa fa-search"></i>';
						ele.onclick = function()
						{
							self.currentType = 'search';
							self.initSearch();
						}
					}
					else if( prop == 'jeanie' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/mascot-small-black.png' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this );
						}
					}
					else if( prop == 'dm' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/chat.svg' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this );
						}
					}
					else if( prop == 'chatroom' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/groups.png' ) + ')';
						ele.onclick = function()
						{
							self.setActiveChannel( prop, this, gid, gnam );
						}
					}
					else if( prop == 'add' )
					{
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/add.png' ) + ')';
						ele.onclick = function()
						{
							self.showSlidingMenu( 'room.html' );
						}
					}
					else
					{
						console.log( 'not yet.' );
					}
				} )( chans[ a ], uniqueid, groupId, groupName );
			}
			self.handleResize();
			if( !self.initialized )
			{
				self.initialized = true;
				self.domElement.querySelector( '.DM' ).click();
			}
			if( cbk ) cbk();
    	}
    	m.execute( 'convos', { 'method': 'getrooms' } );
    }
    pollChatroom( uniqueId, uid = false, force = false )
    {
    	// Just poll myself!
        if( uniqueId == Application.uniqueId )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
        if( uid )
        {
		    let tabs = this.domChannels.getElementsByClassName( 'Channel' );
		    for( let a = 0; a < tabs.length; a++ )
			{
				if( tabs[ a ].classList.contains( 'Group' ) )
				{
				    if( tabs[ a ].getAttribute( 'id' ) == uid )
				    {
						// It is already active
						if( tabs[ a ].classList.contains( 'Active' ) )
						{
						    let chat = FUI.getElementByUniqueId( 'messages' );
							chat.refreshMessages();
						    return;
						}
						// Activity in an inactive tab - add some info
						else
						{
							if( force )
							{
								tabs[ a ].click();
								setTimeout( function()
								{
									if( tabs[ a ].classList.contains( 'Active' ) )
									{
										let chat = FUI.getElementByUniqueId( 'messages' );
										chat.refreshMessages();
									}
								}, 350 );
							}
							// Play a sound when sending
							Sounds.newMessage.play();
						}
					}
				}
			}
			return;
		}
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + uniqueId + '"></fui-contacts>';
    	FUI.initialize();
    }
    activateDirectMessage( uniqueId, message )
    {
    	// Just poll myself!
        if( uniqueId == Application.uniqueId )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
        
        // Do not reinitialize
        let chatList = FUI.getElementByUniqueId( 'contacts' );
        if( chatList && chatList.options.user == uniqueId ) return;
        
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + uniqueId + '"></fui-contacts>';
    	FUI.initialize();
    	this.currentType = 'dm';
    }
    // Just activate DM
    activateDirectMessaging( record )
    {
    	let tabs = this.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < tabs.length; a++ )
    	{
    		if( !tabs[ a ].classList.contains( 'Active' ) )
    		{
				if( tabs[ a ].getAttribute( 'uniqueid' ) == 'dm' )
				{
					tabs[ a ].click();
					let f = FUI.getElementByUniqueId( 'contacts' );
					f.setActiveContact( record );
					f.setChatView( record );
				}
			}
    	}
    }
    // Go to PMs
    activatePMTab()
    {
        let ch = this.domChannels.getElementsByClassName( 'Channel' );
        for( let a = 0; a < ch.length; a++ )
        {
            if( ch[ a ].classList.contains( 'DM' ) )
            {
                this.currentType = '';
                ch[ a ].click();
                return;
            }
        }
    }
    // Just "click" a group tab
    activateGroupTab( recordId )
    {
	    let gg = this.domChannels.getElementsByClassName( 'Group' );
		for( let a = 0; a < gg.length; a++ )
		{
			if( gg[ a ].id == recordId )
			{
				this.currentType = '';
				gg[ a ].click();
			}
		}
	}
    // Set active channel
    setActiveChannel( label, tab, groupId = false, groupName = false )
    {
    	document.body.classList.add( 'ChannelActive' );
    	let tabs = this.domChannels.getElementsByClassName( 'Channel' );
    	for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ] == tab )
    		{
    			tabs[ a ].classList.add( 'Active' );
    		}
    		else
    		{
    			tabs[ a ].classList.remove( 'Active' );
    		}
    	}
		let chlist = this.domElement.querySelector( '.Chatlist' );
		if( label == 'jeanie' )
		{
			// No reinitializing
	    	if( this.currentType == 'jeanie' ) return;
			chlist.innerHTML = '<fui-topics parentelement="convos" uniqueid="topics" name="jeanie"></fui-topics>';
			this.currentType = 'jeanie';
	    }
	    else if( label == 'dm' )
	    {
	    	// No reinitializing
	    	if( this.currentType == 'dm' ) return;
	        chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts"></fui-contacts>';
	        this.currentType = 'dm';
	    }
	    // Initialize a contacts element, with 
	    else if( label == 'chatroom' )
	    {
	    	if( this.currentType == 'chatroom' && this.currentChatroom == groupId ) return;
	    	let own = tab.getAttribute( 'own' );
	    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" group="' + groupId + '" name="' + groupName + '" own="' + own + '"></fui-contacts>';
	    	this.currentType = 'chatroom'; this.currentChatroom = groupId;
	    }
	    else
	    {
	    	chlist.innerHTML = '<div class="Placeholder"><span>' + i18n( 'i18n_start_conversation' ) + '</span></div>';
	    }
		FUI.initialize();
		
		let messages = FUI.getElementByUniqueId( 'messages' );
		if( messages )
		{
		    // On init, set the correct topic on the channel
		    messages.setTopic( groupName ? groupName : label, label );
	    }
    }
    abortGroupCreation()
    {
    	let self = this;
    	self.destroySlidingMenu();
		self.activate();
    }
    createGroup()
    {
    	let self = this;
    	
    	let nam = ge( 'Name' ).value; let des = ge( 'Description' ).value;
    	
    	let n = new Module( 'system' );
    	n.onExecuted = function( ne, nd )
    	{
    		if( ne == 'ok' )
    		{
    			self.redrawChannels();
    		}
			self.destroySlidingMenu();
			self.activate();
    	}
    	n.execute( 'convos', { 
    		method: 'addroom', 
    		roomName: nam, 
    		roomDescription: des 
    	} );
    }
}
FUI.registerClass( 'chatoverview', FUIChatoverview );

