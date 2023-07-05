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
        
        this.initDomInput();
        
        // Set stuff on this.domElement.innerHTML
        this.refreshDom();
    }
    initDomInput()
    {
    	let self = this;
    	
    	this.domInput.innerHTML = '\
    		<textarea rows="1"></textarea>\
    	';
    	let t = this.domInput.getElementsByTagName( 'textarea' );
    	this.domTextarea = t[0];
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
        
        for( let a = 0; a < messageList.length; a++ )
        {
            let m = messageList[a];
            
            let d = document.createElement( 'div' );
            d.className = 'Message';
            d.innerHTML = '<p>' + m.Message + '</p>';
            let timestamp = ( new Date( m.Date ) ).getTime();
            if( m.Own ) d.classList.add( 'Own' );
            
            // Get slot
            let slot = timestamp;
            let slotId = slot + m.ID;
            d.slotId = slotId; // If we will use this new element, give slotid
            
            // Update a message in a time slot
            if( this.messageList[ slot ] && this.messageList[ slot ].parentNode )
            {
                let found = false;
                for( let b = 0; b < this.messageList[ slot ].childNodes.length; b++ )
                {
                    if( this.messageList[ slot ].childNodes[ b ].slotId == slotId )
                    {
                        found = this.messageList[ slot ].childNodes[ b ];
                        break;
                    }
                }
                // Replace existing node
                if( found )
                {
                    found.parentNode.replaceChild( found, d );
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
                            if( last )
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
            ( function( r ){ setTimeout( function(){ r.classList.add( 'Showing' ); },  ); } )( d );   
        }
        this.toBottom();
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
    	        message: string
    	    } );
    	}
    	
    	setTimeout( function()
    	{
    		dom.classList.add( 'Showing' );
		}, 2 );
		
		this.toBottom( 'smooth' );
    }
    clearQueue()
    {
        let self = this;
        self.lock = true;
        let queue = this.domMessages.querySelector( '.Queue' );
        let messages = queue.getElementsByClassName( 'Message' );
        for( let a = 0; a < messages.length; a++ )
        {
            messages[ a ].classList.remove( 'Showing' );
        }
        setTimeout( function()
        {
            self.lock = false;
            self.domMessages.querySelector( '.Queue' ).innerHTML = '';
        }, 250 );
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
}
FUI.registerClass( 'chatlog', FUIChatlog );

