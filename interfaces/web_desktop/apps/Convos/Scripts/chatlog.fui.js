/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIChatlog extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
        
        this.messageList = {};
        this.messageListOrder = [];
        this.lastId = 0;
    }
    attachDomElement()
    {
        super.attachDomElement();
        
        let self = this;
        
        this.domElement.className = 'FUIChatlog';
        
        let data = '\
        <div class="Topic"></div>\
        <div class="Messages"><div class="Incoming"></div><div class="Queue"></div></div>\
        <div class="Input"></div>\
        ';
        
        this.domElement.innerHTML = data;
        
        this.domTopic = this.domElement.querySelector( '.Topic' );
        this.domMessages = this.domElement.querySelector( '.Messages' );
        this.domInput = this.domElement.querySelector( '.Input' );
        
        if( this.options.name )
            this.domTopic.innerHTML = this.options.name;
        
        this.initDomInput();
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    initDomInput()
    {
    	let self = this;
    	
    	this.domInput.innerHTML = '\
    		<div class="Upload"></div><div class="Emote"></div><textarea rows="1"></textarea><div class="Send"></div>\
    	';
    	let t = this.domInput.getElementsByTagName( 'textarea' );
    	this.domTextarea = t[0];
    	this.domInput.querySelector( '.Send' ).onclick = function()
    	{
    	    let val = self.domTextarea.value;
			self.domTextarea.value = '';	
			self.queueMessage( val );
    	}
    	this.domTextarea.addEventListener( 'keydown', function( e )
    	{
    		if( e.which == 13 )
    		{
    			let val = this.value;
    			this.value = '';
    			cancelBubble( e );
    			
    			self.queueMessage( val );
    		}
    	} );
    }
    // Adds messages to a list locked by sorted timestamps
    addMessages( messageList )
    {
        let self = this;
        
        function parseDate( instr )
        {
            let now = new Date();
            let test = now.getFullYear() + '-' + StrPad( now.getMonth() + 1, 2, '0' )+ '-' + StrPad( now.getDate(), 2, '0' );
            let time = new Date( instr );
            let diff = ( now.getTime() / 1000 ) - ( time.getTime() / 1000 );
            if( diff < 60 )
            {
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
            if( test == instr.substr( 0, test.length ) )
                return instr.substr( test.length, instr.length - test.length );
            return instr.split( ' ' )[1];
        }
        
        for( let a = messageList.length - 1; a >= 0; a-- )
        {
            let m = messageList[a];
            
            if( !m.ID ) continue; // Skip unregistered ones
            
            // Find highest message ID
            if( parseInt( m.ID ) > self.lastId )
                self.lastId = parseInt( m.ID );
            
            let d = document.createElement( 'div' );
            d.className = 'Message';
            d.classList.add( 'Showing' );
            d.setAttribute( 'owner', m.Name );
            
            let replacements = {
                message: self.replaceEmojis( m.Message ),
                i18n_date: i18n( 'i18n_date' ),
                i18n_fullname: i18n( 'i18n_fullname' ),
                date: parseDate( m.Date ),
                signature: '',
                fullname: m.Own ? i18n( 'i18n_you' ) : m.Name
            };
            d.innerHTML = FUI.getFragment( 'chat-message-head', replacements );
            let timestamp = Math.floor( ( new Date( m.Date ) ).getTime() / 1000 );
            if( m.Own ) d.classList.add( 'Own' );
            
            // Get slot
            let slot = timestamp;
            let slotId = slot + '-' + m.ID;
            d.setAttribute( 'slotId', slotId ); // If we will use this new element, give slotid
            
            // Update a message in a time slot
            if( this.messageList[ slot ] && this.messageList[ slot ].parentNode )
            {
                //console.log( 'Add message to existing slot: ' + slot, m.Message );
                let found = false;
                for( let b = 0; b < this.messageList[ slot ].childNodes.length; b++ )
                {
                    if( this.messageList[ slot ].childNodes[ b ].getAttribute( 'slotId' ) == slotId )
                    {
                        found = this.messageList[ slot ].childNodes[ b ];
                        break;
                    }
                }
                // Replace existing node
                if( found )
                {
                    this.messageList[ slot ].replaceChild( d, found );
                }
                // Add a new node to this group slot
                else
                {
                    this.messageList[ slot ].appendChild( d );
                }
            }
            // Insert a message in a timestamp slot
            else
            {
                let grp = document.createElement( 'div' );
                grp.className = 'Slot';
                grp.appendChild( d );
                this.messageList[ slot ] = grp;
                
                this.messageListOrder.push( slot );
                this.messageListOrder.sort();

                // First message
                if( this.messageListOrder.length == 1 )
                {
                    // Create group
                    this.domMessages.querySelector( '.Incoming' ).appendChild( grp );
                }
                else
                {
                    for( let b = 0; b < this.messageListOrder.length; b++ )
                    {
                        let last = b == this.messageListOrder.length - 1;
                        let slotHere = this.messageListOrder[ b ];
                        // We found our slot
                        if( slotHere == slot )
                        {
                            // Add since we're the last in the list
                            if( last || b == 0 )
                            {
                                 this.domMessages.querySelector( '.Incoming' ).appendChild( grp );
                            }
                            // Insert before previous
                            else
                            {
                                this.domMessages.querySelector( '.Incoming' ).insertBefore( this.messageList[ this.messageListOrder[ b + 1 ] ], grp );
                            }
                        }
                    }
                }
            }
        }
        this.toBottom();
        this.refreshDom();
    }
    toBottom( way )
    {
        let self = this;
        if( way == 'smooth' )
        {
            this.domMessages.scrollTop = this.domMessages.lastChild.offsetHeight + this.domMessages.lastChild.offsetTop;
            return;
        }
        this.domMessages.style.scrollBehavior = 'inherit';
        this.domMessages.scrollTop = this.domMessages.lastChild.offsetHeight + this.domMessages.lastChild.offsetTop;
        setTimeout( function(){ self.domMessages.style.scrollBehavior = 'smooth'; }, 5 );
    }
    queueMessage( string )
    {
        let self = this;
        
        // When in a lock, just wait
        if( self.lock )
        {
            return setTimeout( function(){ self.queueMessage( string ); }, 250 );
        }
        
    	let dom = document.createElement( 'div' );
    	dom.className = 'Message Own';
    	dom.innerHTML = '<p>' + string + '</p>';
    	dom.setAttribute( 'timestamp', ( new Date() ).getTime() );
    	this.domMessages.querySelector( '.Queue' ).appendChild( dom );
    	
    	// Add queue to Convos
    	if( window.Convos )
    	{
    	    Convos.outgoing.push( {
    	        timestamp: parseInt( parseFloat( dom.getAttribute( 'timestamp' ) ) / 1000 ),
    	        message: string,
    	        type: this.options.type ? this.options.type : '',
    	        targetId: this.options.cid
    	    } );
    	    Application.holdConnection( { 
    	        method: 'messages', 
    	        roomType: this.options.type ? this.options.type : '', 
    	        cid: this.options.cid ? this.options.cid : '',
    	        lastId: this.lastId
	        } );
    	}
    	
    	setTimeout( function()
    	{
    		dom.classList.add( 'Showing' );
		}, 2 );
		
		this.toBottom( 'smooth' );
    }
    refreshMessages()
    {
        let msg = { 
            method: 'messages', 
            roomType: this.options.type ? this.options.type : '', 
            cid: this.options.cid ? this.options.cid : '',
            lastId: this.lastId
        };
        Application.holdConnection( msg );
    }
    clearQueue()
    {
        let self = this;
        self.lock = true;
        let queue = this.domMessages.querySelector( '.Queue' );
        let messages = queue.getElementsByClassName( 'Message' );
        for( let a = 0; a < messages.length; a++ )
        {
            ( function( mess )
            {
                if( mess.parentNode )
                    mess.parentNode.removeChild( mess );
            } )( messages[ a ] );
        }
        setTimeout( function()
        {
            self.lock = false;
        }, 250 );
    }
    grabAttributes( domElement )
    {
        super.grabAttributes( domElement );
        
        let uniqueId = domElement.getAttribute( 'uniqueid' );
        if( uniqueId ) this.options.uniqueid = uniqueId;
        
        let type = domElement.getAttribute( 'type' );
        if( type ) this.options.type = type;
        
        let cid = domElement.getAttribute( 'cid' );
        if( cid ) this.options.cid = cid;
        
        let context = domElement.getAttribute( 'context' );
        if( context ) this.options.context = context;
        
        let name = domElement.getAttribute( 'name' );
        if( name ) this.options.name = name;
    }
    refreshDom( evaluated = false )
    {
        super.refreshDom();
        let self = this;
        
        // Let's do some message owner management for styling
        let messages = this.domElement.getElementsByClassName( 'Message' );
        let lastOwner = false;
        for( let a = 0; a < messages.length; a++ )
        {
            let owner = messages[ a ].getAttribute( 'owner' );
            if( owner == lastOwner )
            {
                messages[ a ].classList.add( 'ConceilOwner' );
                if( a + 1 < messages.length && messages[ a + 1 ].getAttribute( 'owner' ) != owner )
                {
                    messages[ a ].classList.add( 'LastForOwner' );
                }
            }
            else if( a + 1 < messages.length && messages[ a + 1 ].getAttribute( 'owner' ) == owner )
            {
                messages[ a ].classList.add( 'FirstForOwner' );
            }
            if( a + 1 >= messages.length && messages[ a ].classList.contains( 'ConceilOwner' ) )
            {
                messages[ a ].classList.add( 'LastForOwner' );
            }
            lastOwner = owner;
        }
        
        this.domElement.classList.add( 'Initialized' );
       
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
    	return '<fui-chatlist' + props + '></fui-chatlist>';
    }
    // Just display an error message
    errorMessage( string )
    {
        this.domElement.innerHTML = '<h2 class="Error">' + string + '</h2>';
    }
    replaceEmojis( string )
    {
        while( 1 )
        {
            let res = string.match( /\:(.*?)\:/i );
            if( res && res[0] )
            {
                string = string.split( res[0] ).join( this.emoji( res[1] ) );
            }
            else break;
        }
        
        let smilies = [ ':-)', ':)', ':-D', ':D', 'X)', 'B)', 'B-)', 'X-)', ':|', ':-|', ':-o', ':o', ':O', ':O', ':(', ':-(',  ';)', ';-)' ];
        let emotes  = [ '🙂',  '🙂', '😀', '😀', '😆', '😎', '😎', '😆', '😐', '😐', '😮', '😮', '😮', '😮', '😒', '😒', '😏', '😏' ];
        
        for( let a = 0; a < smilies.length; a++ )
        {
            string = string.split( smilies[a] ).join( '<span class="Emoji">' + emotes[a] + '</span>' );
        }
        
        return string;
    }
    emoji( type )
    {
        let s = '';
        switch( type )
        {
            case 'bug': s = '🪲'; break;
            case 'sun': s = '☀️'; break;
            case 'heart': s = '❤️'; break;
            case 'kiss': s = '💋'; break;
            case 'y': s = '👍'; break;
            case 'beers': s = '🍻'; break;
            case 'beer': s = '🍺'; break;
            case 'wine': s = '🍷'; break;
            case 'sick': s = '😷'; break;
            case 'fire': s = '🔥'; break;
            default: break;
        }
        return '<span class="Emoji">' + s + '</span>';
    }
}
FUI.registerClass( 'chatlog', FUIChatlog );

