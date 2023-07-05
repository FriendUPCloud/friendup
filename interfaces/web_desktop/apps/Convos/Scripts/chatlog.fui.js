class FUIChatlog extends FUIElement
{
    constructor( options )
    {
        super( options );
        // Do stuff
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
    addMessages( messageList )
    {
        for( let a = 0; a < messageList.length; a++ )
        {
            let m = messageList[a];
            let d = document.createElement( 'div' );
            d.className = 'Message';
            d.innerHTML = '<p>' + m.Message + '</p>';
            d.setAttribute( 'timestamp', new Date( m.Date ).getTime() );
            if( m.Own ) d.classList.add( 'Own' );
            this.domMessages.querySelector( '.Incoming' ).appendChild( d );
            ( function( r ){ setTimeout( function(){ r.classList.add( 'Showing' ); },  ); } )( d );
        }
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

