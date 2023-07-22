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
		console.log( 'Trying' );
		let i = new Image();
		i.src = '/system.library/module/?module=system&command=convos&args=' + encodeURIComponent( JSON.stringify( std ) ) + '&authid=' + Application.authId;
		i.onload = function()
		{
			let c = document.createElement( 'canvas' );
			let ctx = c.getContext( '2d' );
			c.width = this.naturalWidth;     // update canvas size to match image
			c.height = this.naturalHeight;
			ctx.drawImage( this, 0, 0 );       // draw in image
			c.toBlob( function( blob )
			{
				let a = new FileReader();
				a.onload = function(e)
				{
					console.log( 'OJ fkjd' );
					chan.style.backgroundImage = 'url(' + e.target.result + ')';
				}
				a.readAsDataURL( blob );
			}, 'image/jpeg', 100 );
		};
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
        ';
        
        this.domElement.innerHTML = data;
        
        this.domChannels = this.domElement.querySelector( '.Channels' );
        this.domChatlist = this.domElement.querySelector( '.Chatlist' );
        
        this.initHome();
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    initHome()
    {
    	// Init content
    	let self = this;
    	let f = new File( 'Progdir:Markup/main_updates.html' );
        f.i18n();
        f.onLoad = function( data )
        {
        	self.domChatlist.innerHTML = data;
        	self.renderOverview();
        	FUI.initialize();
        	
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
        }
        f.load();
    }
    renderOverview()
    {
    	let self = this;
    	let ev = new Module( 'system' );
    	ev.onExecuted = function( me, md )
    	{
    		if( me == 'ok' )
    		{
    			let j = JSON.parse( md );
    			
    			let cnt = self.domChatlist.querySelector( '.Online' ).querySelector( '.Content' );
    			cnt.innerHTML = '';
    			
    			for( let a = 0; a < j.length; a++ )
    			{
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
    						m.onExecuted = function( ne, nd ){ self.renderOverview(); self.redrawChannels(); }
    						m.execute( 'convos', { 
    							method: 'accept-invite', 
    							inviteId: this.parentNode.getAttribute( 'iid' ) 
							} );
    					}
    					c.onclick = function()
    					{
    						let m = new Module( 'system' );
    						m.onExecuted = function( ne, nd ){ self.renderOverview(); self.redrawChannels(); }
    						m.execute( 'convos', { 
    							method: 'reject-invite', 
    							inviteId: this.parentNode.getAttribute( 'iid' ) 
							} );
    					}
    				} )( t );
    				
    				cnt.appendChild( d );
    			}
    		}
    		else
    		{
    			self.domChatlist.querySelector( '.Online' ).querySelector( '.Content' ).innerHTML = '<p>' + i18n( 'i18n_no_new_events' ) + '</p>';
    		}
    		self.handleResize();
    		
    	}
    	ev.execute( 'convos', { method: 'getevents' } );
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
        	this.activateDirectMessage( record.Fullname, false );
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
    redrawChannels()
    {
    	let self = this;
    	
    	if( self.channels )
    	{
    		return;
    	}
    	
    	// Default
    	self.domChannels.innerHTML = '\
    	<div class="Channel Home" uniqueid="home"></div>\
    	<div class="Channel Jeanie" uniqueid="jeanie"></div>\
    	<div class="Channel DM" uniqueid="dm"></div>';
    	
    	let m = new Module( 'system' );
    	m.onExecuted = function( me, md )
    	{
    		let rooms = [];
    		if( me == 'ok' )
    		{
    			md = JSON.parse( md );
    			for( let a = 0; a < md.length; a++ )
    			{
    				self.domChannels.innerHTML += '<div class="Channel Group" uniqueid="chatroom" name="' + md[a].Name + '" id="' + md[a].UniqueID + '"></div>';
    			}
    		}
    		
    		self.domChannels.innerHTML += '<div class="Channel Add" uniqueid="add"></div>';
    	
			let chans = self.domChannels.getElementsByClassName( 'Channel' );
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
						h.style.top = ( GetElementTop( this ) + 6 - document.querySelector( '.Channels' ).scrollTop ) + 'px';
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
						ele.innerHTML = '<i class="fa fa-home"></i>';
						ele.onclick = function()
						{
							self.initHome();
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
						ele.style.backgroundImage = 'url(' + getImageUrl( 'Progdir:Assets/dm.png' ) + ')';
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
    	}
    	m.execute( 'convos', { 'method': 'getrooms' } );
    }
    pollChatroom( user, uid )
    {
    	// Just poll myself!
        if( user == Application.fullName )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
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
				    	console.log( 'Already active! Just refresh.' );
				        let chat = FUI.getElementByUniqueId( 'messages' );
				    	chat.refreshMessages();
				        return;
				    }
				    // Activity in an inactive tab - add some info
				    // TODO: Add a flash or bubble
				    else
				    {
				    	// There will be notifications
				    }
			    }
    		}
    	}
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + user + '"></fui-contacts>';
    	FUI.initialize();
    }
    activateDirectMessage( user, message )
    {
    	// Just poll myself!
        if( user == Application.fullName )
        {
        	let chat = FUI.getElementByUniqueId( 'messages' );
        	chat.refreshMessages();
        	return;
        }
        let tabs = this.domChannels.getElementsByClassName( 'Channel' );
        for( let a = 0; a < tabs.length; a++ )
    	{
    		if( tabs[ a ].classList.contains( 'DM' ) )
    		{
    		    // It is already active
    		    if( tabs[ a ].classList.contains( 'Active' ) )
    		    {
    		        let contacts = FUI.getElementByUniqueId( 'contacts' );
    		        contacts.poll( user, message );
    		        return;
    		    }
    			tabs[ a ].classList.add( 'Active' );
    		}
    		else
    		{
    			tabs[ a ].classList.remove( 'Active' );
    		}
    	}
    	let chlist = this.domElement.querySelector( '.Chatlist' );
    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" user="' + user + '"></fui-contacts>';
    	FUI.initialize();
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
			chlist.innerHTML = '<fui-topics parentelement="convos" uniqueid="topics" name="jeanie"></fui-topics>';
		    //chlist.innerHTML = '<fui-chatlog parentelement="convos" uniqueid="messages" name="' + label + '"></fui-chatlog>';
		    Application.holdConnection( { method: 'messages', roomType: 'jeanie' } );
	    }
	    else if( label == 'dm' )
	    {
	        chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts"></fui-contacts>';
	    }
	    // Initialize a contacts element, with 
	    else if( label == 'chatroom' )
	    {
	    	chlist.innerHTML = '<fui-contacts parentelement="convos" uniqueid="contacts" group="' + groupId + '" name="' + groupName + '"></fui-contacts>';
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

